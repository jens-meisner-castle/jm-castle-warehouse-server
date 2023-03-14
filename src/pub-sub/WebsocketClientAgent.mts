import {
  isWsMessage,
  msg_pong,
  msg_publish,
  msg_welcome,
  WsMessage,
} from "jm-castle-types";
import { WebSocket } from "ws";
import { TableRowsChangeConsumer } from "../persistence/Types.mjs";
import { CastleWarehouse } from "../system/status/System.mjs";

let counter = 0;

export class WebsocketClientAgent {
  constructor(
    socket: WebSocket,
    system: CastleWarehouse,
    remoteAddress: string
  ) {
    counter++;
    this.id = `${counter}:${remoteAddress}`;
    this.system = system;
    this.socket = socket;

    socket.on("message", (data) => {
      const str = data.toString("utf-8");
      try {
        const msg = JSON.parse(str);
        if (isWsMessage(msg)) {
          this.consumeMessage(msg);
        }
      } catch (error) {
        console.error(
          `Receiving error when consuming message (${str}): ${error.toString()}`
        );
      }
    });
    this.sendMessage(msg_welcome());
  }

  private cleanup: (() => void)[] = [];
  private id: string;
  private system: CastleWarehouse;
  private socket: WebSocket;
  private tableRowsChangeConsumer: TableRowsChangeConsumer;

  public handleClose = () => {
    // after the socket was closed
    this.cleanup.forEach((fn) => fn());
  };

  private disconnectFromTableStats = () => {
    const consumer = this.tableRowsChangeConsumer;
    this.tableRowsChangeConsumer = undefined;
    this.system.removeTableRowsChangeConsumer(consumer);
  };

  private connectToTableRowsChanges = async () => {
    if (this.tableRowsChangeConsumer) {
      return;
    }
    this.cleanup.push(this.disconnectFromTableStats);
    this.tableRowsChangeConsumer = {
      onTableRowsChange: async (changes) => {
        this.sendMessage(msg_publish("/system/table-rows-change", { changes }));
      },
    };
    this.system.addTableRowsChangeConsumer(this.tableRowsChangeConsumer);
  };

  private consumeSubscribeMessage = async (msg: WsMessage) => {
    const { params } = msg;
    const topic = params?.topic;
    if (topic) {
      switch (topic) {
        case "/system/table-rows-change":
          await this.connectToTableRowsChanges();
          break;
      }
    }
  };

  private consumeMessage = (msg: WsMessage) => {
    const { method } = msg;
    switch (method) {
      case "welcome":
        break;
      case "ping":
        return this.sendMessage(msg_pong());
      case "pong":
        break;
      case "subscribe":
        return this.consumeSubscribeMessage(msg);
      default:
        console.error(
          `Unable to consume message (method: ${method}): ${JSON.stringify(
            msg
          )}`
        );
    }
  };

  private sendMessage = (msg: WsMessage) => {
    const buffer = Buffer.from(JSON.stringify(msg), "utf-8");
    this.socket.send(buffer);
  };
}
