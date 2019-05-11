export type RoomHandler = (event: string, payload: any) => void;

export interface RoomEventHandlersType {
  [key: string]: RoomHandler[];
}

export class Room {
  ws: WebSocket;
  isJoined: boolean;
  topic: string;
  room: string;
  eventHandlers: RoomEventHandlersType = {};

  static alreadyJoinedError = new Error('Already Joined');
  static notJoinedError = new Error('Not Joined');

  constructor(ws: WebSocket, fullName: string) {
    this.ws = ws;

    const [topic, room] = fullName.split(':');
    this.topic = topic;
    this.room = room;
  }

  join() {
    if (this.isJoined) {
      throw Room.alreadyJoinedError;
    }

    this.ws.send(JSON.stringify({
      topic: this.topic,
      room: this.room,
      event: 'join',
    }));
  }

  send(event: string, payload: any) {
    if (!this.isJoined) {
      throw Room.notJoinedError;
    }

    this.ws.send(JSON.stringify({
      event,
      payload,
      topic: this.topic,
      room: this.room,
    }));
  }

  leave(payload: any) {
    this.ws.send(JSON.stringify({
      payload,
      topic: this.topic,
      room: this.room,
      event: 'leave',
    }));
  }

  onEvent(event: string, handler: RoomHandler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }

    this.eventHandlers[event].push(handler);
  }

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
