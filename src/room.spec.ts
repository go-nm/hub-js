import { Room } from './room';

describe('room', () => {
  const topic = 'testing';
  const roomId = '123';
  const channel = `${topic}:${roomId}`;
  const ws = <WebSocket><unknown>{};
  console.warn = jest.fn();

  it('can create an instance', () => {
    // Act
    const room = new Room(ws, channel);

    // Assert
    expect(room).toBeDefined();
  });

  it('can join the room', () => {
    // Arrange
    ws.send = jest.fn();

    // Act
    new Room(ws, channel).join();

    // Assert
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
      topic,
      room: roomId,
      event: 'join',
    }));
  });

  it('throws on join when already joined', () => {
    // Arrange
    const room = new Room(ws, channel);
    room.messageReceived('joined', '');

    // Act
    expect(() => room.join()).toThrow(Room.alreadyJoinedError);
  });

  it('can send an event to the server when joined', () => {
    // Arrange
    const event = 'test_event';
    const payload = 'testing';
    ws.send = jest.fn();
    const room = new Room(ws, channel);
    room.messageReceived('joined', '');

    // Act
    room.send(event, payload);

    // Assert
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
      event,
      payload,
      topic,
      room: roomId,
    }));
  });

  it('throws on send when not joined', () => {
    // Arrange
    const event = 'test_event';
    const payload = 'testing';
    ws.send = jest.fn();
    const room = new Room(ws, channel);

    // Act
    expect(() => room.send(event, payload)).toThrow(Room.notJoinedError);
  });

  it('does not allow sending messages after left message received', () => {
    // Arrange
    const event = 'test_event';
    const payload = 'testing';
    ws.send = jest.fn();
    const room = new Room(ws, channel);
    room.messageReceived('joined', '');
    room.messageReceived('left', '');

    // Act
    expect(() => room.send(event, payload)).toThrow(Room.notJoinedError);
  });

  it('can leave the room', () => {
    // Arrange
    const payload = 'testing';
    ws.send = jest.fn();
    const room = new Room(ws, channel);
    room.messageReceived('joined', '');

    // Act
    room.leave(payload);

    // Assert
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
      payload,
      topic,
      room: roomId,
      event: 'leave',
    }));
  });

  it('does not send leave request when not joined', () => {
    // Arrange
    const payload = 'testing';
    ws.send = jest.fn();
    const room = new Room(ws, channel);

    // Act
    room.leave(payload);

    // Assert
    expect(ws.send).not.toHaveBeenCalled();
  });

  it('calls an event handler on message received', () => {
    // Arrange
    const callback = jest.fn();
    const event = 'testing_event';
    const payload = 'test';
    const room = new Room(ws, channel);
    room.onEvent(event, callback);

    // Act
    room.messageReceived(event, payload);

    // Assert
    expect(callback).toHaveBeenCalledWith(event, payload);
  });

  it('calls multiple event handlers on message received', () => {
    // Arrange
    const callback = jest.fn();
    const callback2 = jest.fn();
    const event = 'testing_event';
    const payload = 'test';
    const room = new Room(ws, channel);
    room.onEvent(event, callback);
    room.onEvent(event, callback2);

    // Act
    room.messageReceived(event, payload);

    // Assert
    expect(callback).toHaveBeenCalledWith(event, payload);
    expect(callback2).toHaveBeenCalledWith(event, payload);
  });
});
