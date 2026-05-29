declare module "cors";

declare module "ws" {
  export class WebSocketServer {
    clients: Set<any>;
    constructor(options: Record<string, unknown>);
    on(event: "connection", listener: (socket: { send: (data: string) => void }) => void): void;
  }

  export default class WebSocket {
    constructor(url: string);
    on(event: "open", listener: () => void): void;
    close(): void;
  }
}
