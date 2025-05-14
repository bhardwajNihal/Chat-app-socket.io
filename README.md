
# A basic chat app to understand the architecture of real time communication
 - Using Socket.io
    - a library, facilitating real time communication using websockets, hiding underlying complexities of manual configurations, creation of rooms and multicasting and broadcasting messages. 

 - Features: 
    - One-to-One chats
    - group chats
    - typing indicator
    - showing latest message
    - 
    

## Socket.io : Complete walkthrough

Socket.IO enables real-time, bi-directional communication between client and server using WebSockets (or fallback to polling when needed). It consists of:
   - Server-side library (Node.js)
   - Client-side library (browser or mobile)

🔌 Server Side (Node.js) Setup : 
      import express from 'express';
      import http from 'http';
      import { Server } from 'socket.io';

      const app = express();
      const server = http.createServer(app); // Native HTTP server to attach Socket.IO
      const io = new Server(server, {
      cors: {
         origin: '*', // Replace with frontend domain in production
         methods: ['GET', 'POST'],
      },
      });

      // Shared Events
      const SOCKET_EVENTS = {
      SEND_MESSAGE: 'send_message',
      RECEIVE_MESSAGE: 'receive_message',
      USER_JOINED: 'user_joined',
      };

   // Socket.IO connection handling
      io.on('connection', (socket) => {
      console.log('🟢 Client connected:', socket.id);

      socket.broadcast.emit(SOCKET_EVENTS.USER_JOINED, {
         userId: socket.id,
      });

      socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) => {
         console.log('📥 Message:', data);

         // Emit to all clients
         io.emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
            text: data.text,
            from: socket.id,
         });
      });

      socket.on('disconnect', () => {
         console.log('🔌 Client disconnected:', socket.id);
      });
      });

      // Start the server
      const PORT = 3000;
      server.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      });


# NOTE: Why separate http instance if express is already there
   Even though Express is a web framework, it doesn't directly expose the low-level HTTP server instance. Socket.IO, however, needs to hook into that low-level server to upgrade the connection from HTTP to WebSocket (or fallback like long-polling).
      const app = express();
      const server = http.createServer(app);     // ⬅️ Create raw HTTP server using app
      const io = new Server(server);             // ⬅️ Attach Socket.IO to HTTP server
   express() gives a request handler function, like (req, res) => {}. But it doesn't start a server by itself.
   http.createServer(app) starts a proper HTTP server from that handler.
   new Server(server) allows Socket.IO to hook into that server for real-time communication.


   # Server Methods & Events
      1. io.on("connection", callback)
      Triggered when a client connects.
         io.on("connection", (socket) => {   
         console.log("New client connected:", socket.id);
         });

      2. socket.on("event", callback)
      Listen to events sent by the client.
         socket.on("send_message", (data) => {  
         console.log(data);
         });

      3. socket.emit("event", data)
      Send data to the connected client only.
         socket.emit("welcome", "Hello client!");

      4. io.emit("event", data)
      Broadcast to all connected clients.
         io.emit("new_user", "A new user has joined");

      5. socket.broadcast.emit("event", data)
      Send to all clients except sender.
         socket.broadcast.emit("user_typing", "Someone is typing...");

      6. socket.join("room")
      Adds a socket to a room.
         socket.join("room1");

      7. socket.to("room").emit("event", data)
      Send to all in a room except sender.
         socket.to("room1").emit("new_message", data);

      8. io.to("room").emit("event", data)
      Send to everyone in the room.
         io.to("room1").emit("new_message", data);

      9. socket.leave("room")
      Leave a room.
         socket.leave("room1");

      10. socket.disconnect()
      Disconnect the client manually.
         socket.disconnect();

🧑‍💻 Client Side (React / Browser) : Setup

   Install Socket.IO client: >> npm i socket.io-client
      import { useEffect } from "react";
      import { io } from "socket.io-client";

      const socket = io("http://localhost:3001");

      function Chat() {
      useEffect(() => {
         socket.on("welcome", (msg) => {
            console.log(msg);
         });

         return () => socket.disconnect(); // cleanup on unmount
      }, []);

      const sendMessage = () => {
         socket.emit("send_message", { text: "Hello server!" });
      };

      return <button onClick={sendMessage}>Send</button>;
      }


💬 Client Methods & Events
      1. io(url)
      Connect to the server.  
         const socket = io("http://localhost:3001");

      2. socket.on("event", callback)
      Listen to server events.
         socket.on("welcome", (data) => {
         console.log(data);   
         });

      3. socket.emit("event", data)
      Send events to server.
         socket.emit("send_message", { text: "hi" });

      4. socket.disconnect()
      Manually disconnect.
         socket.disconnect();

      5. socket.connect()
      Re-connect if disconnected.
         socket.connect();

      🧪 Example Flow
      // server.js
      io.on("connection", (socket) => {
      socket.emit("welcome", "Welcome to the chat");

      socket.on("send_message", (data) => {
         io.emit("receive_message", data); // send to everyone
      });
      });
      // client.jsx
      socket.on("receive_message", (data) => {
      console.log("Received:", data);
      });

   🏁 Best Practices
      Always clean up listeners on unmount (socket.off() or disconnect).
      Use rooms for group chats.
      Use UUIDs or socket.id to track users if not logged in.
      Use middleware for authentication on socket level.







# Note : 
   Both the event name and the callback function are custom, and the event names must match exactly between the client and the server.

🔁 Event Matching
   Socket.IO uses a pub-sub (publish-subscribe) pattern. So:
   The sender emits an event using a custom event name.
   The receiver must be listening for that exact event name using socket.on("event-name", callback).

✅ Example: Event Matching

   Client Side:
      socket.emit("send_message", { text: "Hello from client" });

   Server Side:
      socket.on("send_message", (data) => {
      console.log("Got message:", data);
      });

If you change "send_message" on either side (e.g. to "message_send"), they will no longer communicate unless you update both sides to match.

⚠️ What happens if names don't match?
   If the client emits "send_message", but the server is listening to "message_send":
   Nothing will happen.
   No error is thrown (unless you implement logging).
   This is a silent bug, so double-check your spelling and naming.