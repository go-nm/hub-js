import { Room } from './room';

export interface SocketOpts {
  timeout: number;
}

export type WSEventHandler = (event: Event) => void;

export interface RoomType {
  [key: string]: Room;
}

export class Socket {
  ws: WebSocket;
  url: string;
  opts: SocketOpts = {
    timeout: 1000,
  };
  currentTimeout: number = 0;
  rooms: RoomType = {};
  openHandlers: WSEventHandler[] = [];
  closeHandlers: WSEventHandler[] = [];
  errorHandlers: WSEventHandler[] = [];

  static notConnectedError = new Error('Not connected to WebSocket');

  constructor(url: string, opts?: Partial<SocketOpts>) {
    this.url = url;
    this.opts = { ...this.opts, ...opts };
    this.currentTimeout = this.opts.timeout;

    this.connect = this.connect.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('open', (e) => {
      console.info('connected to socket at:', this.url);

      this.currentTimeout = this.opts.timeout;

      // Call all the user defined callbacks
      this.openHandlers.forEach(fn => fn(e));
    });

    this.ws.addEventListener('close', (e) => {
      if (!e.wasClean) {
        console.error('Socket closed:', e);
        setTimeout(this.connect, this.currentTimeout);
        this.currentTimeout = this.currentTimeout * 1.5;
      }

      // Call all the user defined callbacks
      this.closeHandlers.forEach(fn => fn(e));
    });

    this.ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);

      const channel = `${msg.topic}:${msg.room}`;
      if (this.rooms[channel]) {
        this.rooms[channel].messageReceived(msg.event, msg.payload);
      } else {
        console.warn(`Channel (${channel}) not found for message:`, msg);
      }
    });

    this.ws.addEventListener('error', (e) => {
      console.error('Socket error:', e);

      // Call all the user defined callbacks
      this.errorHandlers.forEach(fn => fn(e));
    });
  }

  join(roomName: string) {
    if (!this.ws) {
      throw Socket.notConnectedError;
    }

    const room = new Room(this.ws, roomName);
    this.rooms[roomName] = room;
    room.join();
    return room;
  }

  onOpen(fn: WSEventHandler) {
    this.openHandlers.push(fn);
  }

  onClose(fn: WSEventHandler) {
    this.closeHandlers.push(fn);
  }

  onError(fn: WSEventHandler) {
    this.errorHandlers.push(fn);
  }
}
