import {WebSocket} from 'ws';

export default class SocketClient {
  socket?:WebSocket;
  config:SocketClientConfiguration;
  listeners:{[key: string]:SocketClientEventCallback[]} = {}
  connected:boolean = false;
  profile?:UserData;
  unsuccessfulConnectionAttempts:number = 0;

  constructor(config: SocketClientConfiguration | null) {
    let mergedConfig = {
      ...defaultOptions,
    }
    if (config) {
      mergedConfig = {
        ...mergedConfig,
        ...config
      }
    }
    this.config = mergedConfig;

    this._reconnect = this._reconnect.bind(this);
    this.bindEvents = this.bindEvents.bind(this);
    this.on = this.on.bind(this);
    this.trigger = this.trigger.bind(this);
    this.off = this.off.bind(this);
    this.connect = this.connect.bind(this);
    this.send = this.send.bind(this);

    this.bindEvents();

    if (this.config.connect) {
      this.connect();
    }
  }

  _reconnect() {
    if (this.config.reconnect) {
      setTimeout(this.connect, 1000 * ((this.config.reconnectDelay || 1) + (this.config.reconnectDelayMultiplier || 2) * this.unsuccessfulConnectionAttempts));
      ++this.unsuccessfulConnectionAttempts;
    }
  }

  bindEvents() {
    this.on('profile', (profile:UserData) => {
      this.unsuccessfulConnectionAttempts = 0;
      this.profile = profile
      if (this.config.stickySession) {
        try {
          window.localStorage.setItem(`pact_ws_${this.config.endpoint.toString()}`, this.profile.id);
        } catch(e) {

        }
      }
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
          cb(data, type, this.profile);
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

  send(message:SocketData|string, data?:any) {
    const finalMessage =  typeof message === 'string' ? {
      type: message,
      data
    } : message
    this.socket.send(JSON.stringify(finalMessage))
  }
  connect() {
    if (this.connected) {
      console.warn('Already connected; Aborting connect() call.')
      return
    }
    const url = new URL(this.config.endpoint);
    if (this.config.stickySession) {
      let sessionId:string|null = null;
      try {
        sessionId = window.localStorage.getItem(`pact_ws_${this.config.endpoint.toString()}`);
      } catch (e) {}
      if (sessionId) {
        url.searchParams.set('session', sessionId);
      }
    }
    this.socket = typeof window !== 'undefined' ? new window.WebSocket(this.config.endpoint) : new WebSocket(this.config.endpoint);
    this.socket.addEventListener('close', this._reconnect);
    this.socket.addEventListener('error', this._reconnect);
    this.socket.addEventListener('open', () => {
      this.connected = true;
      this.trigger('connect');
    });
    this.socket.addEventListener('message', (message:MessageEvent<any>) => {
      const data:SocketData = JSON.parse(message.data) as SocketData;
      this.trigger(data.type, data.data);
    })
  }
}

export const defaultOptions: SocketClientConfiguration = {
  endpoint: `wss://${(typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost'}/websocket?room=default`,
  stickySession: true,
  reconnect: true,
  connect: true,
  reconnectDelay: 1,
  reconnectDelayMultiplier: 2
}

export interface SocketClientConfiguration {
  endpoint:URL | string;
  stickySession?:boolean;
  reconnect?:boolean;
  connect?:boolean;
  reconnectDelay?:number;
  reconnectDelayMultiplier?:number;
}

export type SocketClientEventCallback = (data:any, type:string, profile?:UserData) => void;

export interface UserData {
  id: string;
  properties:{[key: string]: any};
  suffix: number;
  connectionDetails?: {[key: string]: any} | null;
  role: 'user' | 'admin'
}
export interface SocketData {
  type: string,
  data?: any
}