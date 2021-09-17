export default class SocketClient {
  constructor(config: SocketClientConfiguration | null) {

  }
}

export const defaultOptions: SocketClientConfiguration = {
  endpoint: `wss://${(typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost'}?room=default`,
  stickySession: true,
  reconnect: true
}

export interface SocketClientConfiguration {
  endpoint?:SocketClientEndpoint | string;
  stickySession?:boolean;
  reconnect?:boolean
}

export interface SocketClientEndpoint {
  room: string;
  session?:string;
  url: URL | string;
}