export const WsMethods = {
  welcome: "Erste Message nach connect",
  ping: "Heartbeat",
  pong: "Heartbeat response",
  subscribe: "Subscribe to data topic (pub-sub)",
  publish: "Publish data for a topic (pub-sub)",
};

export type WsMethod = keyof typeof WsMethods;

export interface WsMessage {
  method: WsMethod;
  params?: Record<string, unknown>;
}

export const isWsMessage = (
  msg: unknown & { method?: unknown }
): msg is WsMessage => {
  return typeof msg === "object" && typeof msg.method === "string";
};

export const msg_welcome = (): WsMessage => ({ method: "welcome" });

export const msg_ping = (): WsMessage => ({ method: "ping" });

export const msg_pong = (): WsMessage => ({ method: "pong" });

export const msg_subscribe = (topic: string): WsMessage => {
  const method = "subscribe";
  return { method, params: { topic } };
};

export const msg_publish = (topic: string, data: unknown): WsMessage => {
  const method = "publish";
  return { method, params: { topic, data } };
};
