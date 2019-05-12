# Go Hub (JS Client)

This is the client library for [Go Hub](https://gitlab.com/go-nm/hub). It aims to simplify the use of the topic and room concepts that exist in the Go Hub library.

## Basic Usage

This library is compatible with both Common JS and ES6 modules. The examples shown here are using the Common
JS library version. However, they can easily be changed to work with ES6 modules.

```js
let sock = new Socket('ws://localhost:3000/ws');

// When the channel is opened join rooms (this will be called with reconnects too)
sock.onOpen(e => {
  // Connect to the channel
  const channel = sock.join('chatroom:334');

  // On event 'message_received' from the server log the event and data
  channel.onEvent('message_received', (event, payload) => {
    console.log(event, payload);
  });

  // Send a message to the server
  channel.send('send_message', 'sweet');

  // Leave the channel
  channel.leave();
});

// Connect to the WebSocket
sock.connect();
```
