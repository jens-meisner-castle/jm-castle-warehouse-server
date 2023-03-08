import { Server } from "https";
import { WebSocket, WebSocketServer } from "ws";
import { CastleWarehouse } from "../index.js";
import { WebsocketClientAgent } from "./WebsocketClientAgent.mjs";

export class PubSubWebsocketServer {
  constructor(server: Server, getSystem: () => CastleWarehouse) {
    this.getSystem = getSystem;
    this.websocketServer = new WebSocketServer({ noServer: true });
    this.websocketServer.on("connection", (socket, request) => {
      const remoteAddress = request.socket.remoteAddress || "unknwon address";
      this.handleNewConnection(socket, remoteAddress);
    });

    server.on("upgrade", (request, socket, head) => {
      this.websocketServer.handleUpgrade(request, socket, head, (socket) => {
        this.websocketServer.emit("connection", socket, request);
      });
    });
  }

  private websocketServer: WebSocketServer;
  private getSystem: () => CastleWarehouse;
  private clientAgents: WebsocketClientAgent[] = [];

  private handleNewConnection = (
    websocket: WebSocket,
    remoteAddress: string
  ) => {
    const newAgent = new WebsocketClientAgent(
      websocket,
      this.getSystem(),
      remoteAddress
    );
    websocket.on("close", () => {
      newAgent.handleClose();
      this.removeAgent(newAgent);
    });
    this.clientAgents.push(newAgent);
  };

  private removeAgent = (agent: WebsocketClientAgent) => {
    this.clientAgents = this.clientAgents.filter((client) => client !== agent);
  };
}
