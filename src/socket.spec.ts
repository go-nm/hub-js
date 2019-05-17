import { Socket } from './socket';

describe('socket', () => {
  const url = 'ws://localhost:9999';
  const wsAddEventListener = jest.fn();
  const wsSend = jest.fn();
  const ws = jest.fn().mockImplementation(() => ({
    addEventListener: wsAddEventListener,
    send: wsSend,
  }));

  beforeAll(() => {
    (<any>global).WebSocket = ws;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can create an instance', () => {
    // Act
    const sock = new Socket(url);

    // Assert
    expect(sock).toBeDefined();
  });

  it('can create an instance with opts', () => {
    // Act
    const timeout = 9999;
    const backoffScale = 1.25;
    const sock = new Socket(url, { timeout });

    // Assert
    expect(sock).toBeDefined();
    expect(sock.opts).toEqual({ backoffScale, timeout });
  });

  it('can connect', () => {
    // Arrange
    const sock = new Socket(url);

    // Act
    sock.connect();

    // Assert
    expect(ws).toHaveBeenCalledWith(url);
    expect(wsAddEventListener).toHaveBeenCalledTimes(4);
  });

  it('can join a room', () => {
    // Arrange
    const topic = 'testing';
    const roomId = '123';
    const sock = new Socket(url);
    sock.connect();

    // Act
    const room = sock.join(`${topic}:${roomId}`);

    // Assert
    expect(room).toBeDefined();
    expect(wsSend).toHaveBeenCalledWith(JSON.stringify({
      topic,
      room: roomId,
      event: 'join',
    }));
  });

  it('can not join a room when not connected', () => {
    // Arrange
    const sock = new Socket(url);

    // Act
    expect(() => sock.join('test:123')).toThrow(Socket.notConnectedError);
  });

  it('sets properties when connection opened', () => {
    // Arrange
    console.info = jest.fn();
    let openHandler: any;
    const timeout = 10;
    const sock = new Socket(url, { timeout });
    sock.currentTimeout = 99999;
    wsAddEventListener.mockImplementation((name, handler) => name === 'open' ? openHandler = handler : null);
    sock.connect();

    // Act
    openHandler();

    // Assert
    expect(console.info).toHaveBeenCalledWith('connected to socket at:', url);
    expect(sock.currentTimeout).toBe(timeout);
  });

  it('calls user defined onOpen handlers when connection opened', () => {
    // Arrange
    let openHandler: any;
    const event = new Event('TEST_EVENT');
    const openFn = jest.fn();
    const sock = new Socket(url);
    wsAddEventListener.mockImplementation((name, handler) => name === 'open' ? openHandler = handler : null);
    sock.onOpen(openFn);
    sock.connect();

    // Act
    openHandler(event);

    // Assert
    expect(openFn).toHaveBeenCalledWith(event);
  });

  it('retries connection when connection closed dirty', () => {
    // Arrange
    console.error = jest.fn();
    global.setTimeout = jest.fn();
    const timeout = 9999;
    let closeHandler: any;
    const event = new Event('TEST_EVENT');
    Object.defineProperty(event, 'wasClean', { value: false });
    const sock = new Socket(url, { timeout });
    wsAddEventListener.mockImplementation((name, handler) => name === 'close' ? closeHandler = handler : null);
    sock.connect();

    // Act
    closeHandler(event);

    // Assert
    expect(console.error).toHaveBeenCalledWith('Socket closed:', event);
    expect(global.setTimeout).toHaveBeenCalledWith(sock.connect, timeout);
    expect(sock.currentTimeout).toEqual(timeout * 1.5);
  });

  it('calls onClose handlers when connection closed', () => {
    // Arrange
    let closeHandler: any;
    const event = new Event('TEST_EVENT');
    Object.defineProperty(event, 'wasClean', { value: true });
    const closeFn = jest.fn();
    const sock = new Socket(url);
    wsAddEventListener.mockImplementation((name, handler) => name === 'close' ? closeHandler = handler : null);
    sock.onClose(closeFn);
    sock.connect();

    // Act
    closeHandler(event);

    // Assert
    expect(closeFn).toHaveBeenCalledWith(event);
  });

  it('logs error when connection errors', () => {
    // Arrange
    console.error = jest.fn();
    let errorHandler: any;
    const event = new Event('TEST_EVENT');
    const sock = new Socket(url);
    wsAddEventListener.mockImplementation((name, handler) => name === 'error' ? errorHandler = handler : null);
    sock.connect();

    // Act
    errorHandler(event);

    // Assert
    expect(console.error).toHaveBeenCalledWith('Socket error:', event);
  });

  it('calls onError handlers when connection errors', () => {
    // Arrange
    let errorHandler: any;
    const event = new Event('TEST_EVENT');
    const errorFn = jest.fn();
    const sock = new Socket(url);
    wsAddEventListener.mockImplementation((name, handler) => name === 'error' ? errorHandler = handler : null);
    sock.onError(errorFn);
    sock.connect();

    // Act
    errorHandler(event);

    // Assert
    expect(errorFn).toHaveBeenCalledWith(event);
  });
});
