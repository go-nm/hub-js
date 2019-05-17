export type RoomHandler = (event: string, payload: any) => void;

export interface RoomEventHandlersType {
  [key: string]: RoomHandler[];
}

/**
 * An instance of a room that the socket is connected to and currently a part of.
 */
export class Room {
  private ws: WebSocket;
  private isJoined: boolean;
  private topic: string;
  private room: string;
  private eventHandlers: RoomEventHandlersType = {};

  static errorAlreadyJoined = new Error('Already Joined');
  static errorNotJoined = new Error('Not Joined');

  /**
   * The constructor is generally used by the Socket class to create a new instance of the room for you.
   *
   * @param ws - The WebSocket connection to use to join the room.
   * @param fullName - The full name of the room to join. In the format of `name:id`
   */
  constructor(ws: WebSocket, fullName: string) {
    this.ws = ws;

    const [topic, room] = fullName.split(':');
    this.topic = topic;
    this.room = room;
  }

  /**
   * Trys to join the room.
   *
   * @param opts - Optional payload to pass to the server.
   * @throws {Room.errorAlreadyJoined}
   */
  join(opts?: any) {
    if (this.isJoined) {
      throw Room.errorAlreadyJoined;
    }

    this.ws.send(JSON.stringify({
      topic: this.topic,
      room: this.room,
      event: 'join',
      payload: opts,
    }));
  }

  /**
   * Send an event to the server.
   *
   * @param event - The event name to send to the server.
   * @param payload - The data to pass to the server for the event.
   */
  send(event: string, payload: any) {
    if (!this.isJoined) {
      throw Room.errorNotJoined;
    }

    this.ws.send(JSON.stringify({
      event,
      payload,
      topic: this.topic,
      room: this.room,
    }));
  }

  /**
   * Leave the room.
   *
   * @param payload - Optional payload to pass to the server for the close event.
   */
  leave(payload: any) {
    if (!this.isJoined) {
      return;
    }

    this.ws.send(JSON.stringify({
      payload,
      topic: this.topic,
      room: this.room,
      event: 'leave',
    }));
  }

  /**
   * Register a handler for when a new event comes in from the server.
   *
   * @param event - The name of the event to register against.
   * @param handler - The handler function to call when the event is sent from the server.
   */
  onEvent(event: string, handler: RoomHandler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }

    this.eventHandlers[event].push(handler);
  }

  /**
   * This function is used by the Socket class to send the message to this specific room.
   */
  messageReceived(event: string, payload: any) {
    // Handle system generated messages
    switch (event) {
      case 'joined':
        this.isJoined = true;
        break;

      case 'left':
        this.isJoined = false;
        break;

      default:
        break;
    }

    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(h => h(event, payload));
    } else {
      console.warn(`Event (${event}) not being watched`);
    }
  }
}
