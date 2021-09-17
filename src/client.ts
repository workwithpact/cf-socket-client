export default class SocketClient {
  socket?:WebSocket;
  config:SocketClientConfiguration;
  listeners:{[key: string]:SocketClientEventCallback[]}
  connected:boolean = false;
  profile?:UserData;
  unsuccessfulConnectionAttempts:number = 0;

  constructor(config: SocketClientConfiguration | null) {
    this.config = config || defaultOptions;

    this.bindEvents();

    if (this.config.connect) {
      this.connect();
    }
  }

  _reconnect() {
    if (this.config.reconnect) {
      setTimeout(this.connect, 1000 * (this.config.reconnectDelay + this.config.reconnectDelayMiltiplier * this.unsuccessfulConnectionAttempts));
      ++this.unsuccessfulConnectionAttempts;
    }
  }

  bindEvents() {
    
    this.on('profile', (profile:UserData) => {
      this.unsuccessfulConnectionAttempts = 0;
      this.profile = profile
    })
    this.on('close', () => {
      this._reconnect()
    })
  }

  on(type: string, callback: SocketClientEventCallback) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(callback);
  }

  off(type: string, callback?: SocketClientEventCallback) {
    this.listeners[type] = (this.listeners[type] || []).filter((cb: SocketClientEventCallback) => callback && cb !== callback);
  }

  trigger(type: string, data?:any) {
    Object.keys(this.listeners).filter(k => type === k || k === '*').forEach(k => {
      this.listeners[k].forEach((cb:SocketClientEventCallback) => {
        try {
          cb(type, data);
        } catch(e) {
          console.error('Callback failed', {
            type,
            data,
            cb
          })
        }
      })
    })
  }

  connect() {
    if (this.connected) {
      return
    }
    this.socket = this.socket || new WebSocket(this.config.endpoint);
    this.socket.addEventListener('close', this._reconnect);
    this.socket.addEventListener('error', this._reconnect);
    this.socket.addEventListener('message', (data:MessageEvent<any>) => {

    })
  }
}

export const defaultOptions: SocketClientConfiguration = {
  endpoint: `wss://${(typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost'}?room=default`,
  stickySession: true,
  reconnect: true,
  connect: true,
  reconnectDelay: 1,
  reconnectDelayMiltiplier: 2
}

export interface SocketClientConfiguration {
  endpoint:URL | string;
  stickySession?:boolean;
  reconnect?:boolean;
  connect?:boolean;
  reconnectDelay:number;
  reconnectDelayMiltiplier:number;
}

export type SocketClientEventCallback = (data:any, type:string, profile?:UserData) => void;

export interface UserData {
  id: string;
  properties:{[key: string]: any};
  suffix: number;
  connectionDetails?: {[key: string]: any} | null;
  role: 'user' | 'admin'
}