import { Room } from './room';

/**
 * The options for connecting and managing the WebSocket connection with the server.
 */
export interface SocketOpts {
  /**
   * The amount of time to wait before giving up on the connection.
   */
  timeout: number;

  /**
   * The scale used to backoff the timeout.
   */
  backoffScale: number;
}

/**
 * The event handler type for the callback functions
 *
 * @param event - The event that was passed from the WebSocket connection
 */
export type WSEventHandler = (event: Event) => void;

interface RoomType {
  [key: string]: Room;
}

/**
 * The root connection for the WebSocket client.
 * It contains the WebSocket connection and is responsible for creating the channel connections.
 */
export class Socket {
  ws: WebSocket | null;
  url: string;
  opts: SocketOpts = {
    timeout: 1000,
    backoffScale: 1.5,
  };
  currentTimeout: number = 0;
  private openHandlers: WSEventHandler[] = [];
  private closeHandlers: WSEventHandler[] = [];
  private errorHandlers: WSEventHandler[] = [];
  private rooms: RoomType = {};

  static notConnectedError = new Error('Not connected to WebSocket');

  /**
   * Create the WebSocket object for the URL
   *
   * @param url - The full URL to connect to the WebSocket on. E.g. `ws://localhost:9000/ws?token=test`
   * @param opts - Options object for the connection.
   */
  constructor(url: string, opts?: Partial<SocketOpts>) {
    this.url = url;
    this.opts = { ...this.opts, ...opts };
    this.currentTimeout = this.opts.timeout;

    this.connect = this.connect.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);
  }

  /**
   * Connect to the WebSocket server.
   * It is recommended that all of the event handlers are registered before connecting.
   */
  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('open', (e) => {
      console.info('connected to socket at:', this.url);

      this.currentTimeout = this.opts.timeout;

      // Call all the user defined callbacks
      this.openHandlers.forEach(fn => fn(e));
    });

    this.ws.addEventListener('close', (e) => {
      this.ws = null;

      if (!e.wasClean) {
        console.error('Socket closed:', e);
        setTimeout(this.connect, this.currentTimeout);
        this.currentTimeout = this.currentTimeout * this.opts.backoffScale;
      }

      // Call all the user defined callbacks
      this.closeHandlers.forEach(fn => fn(e));
    });

    this.ws.addEventListener('error', (e) => {
      console.error('Socket error:', e);

      // Call all the user defined callbacks
      this.errorHandlers.forEach(fn => fn(e));
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
  }

  /**
   * Join a channel on the connection.
   *
   * @param channel - The cobined topic and room string to connect to. E.g. `chat:342`
   * @param opts - Optional payload to send to the server on join.
   */
  join(channel: string, opts?: any) {
    if (!this.ws) {
      throw Socket.notConnectedError;
    }

    const room = new Room(this.ws, channel);
    this.rooms[channel] = room;
    room.join(opts);
    return room;
  }

  /**
   * Register a callback function for when the WebSocket connection is successfully opened with the server.
   *
   * @param fn - The callback function handler
   */
  onOpen(fn: WSEventHandler) {
    this.openHandlers.push(fn);
  }

  /**
   * Register a callback function for when the WebSocket connection is closed.
   *
   * **Note:** This will be called when the connection is gracefully disconnected and when it errors.
   *
   * @param fn - The callback function handler
   */
  onClose(fn: WSEventHandler) {
    this.closeHandlers.push(fn);
  }

  /**
   * Register a callback function for when the WebSocket connection falis.
   *
   * @param fn - The callback function handler
   */
  onError(fn: WSEventHandler) {
    this.errorHandlers.push(fn);
  }
}
