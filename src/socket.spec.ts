import { Socket } from './socket';

describe('socket', () => {
  it('can create an instance', () => {
    // Act
    const sock = new Socket('ws://localhost:9999');

    // Assert
    expect(sock).toBeDefined();
  });
});
