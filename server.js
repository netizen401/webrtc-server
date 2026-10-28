const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  console.log('مستخدم جديد متصل:', socket.id);

  socket.on('offer', (data) => socket.broadcast.emit('offer', data));
  socket.on('answer', (data) => socket.broadcast.emit('answer', data));
  socket.on('candidate', (data) => socket.broadcast.emit('candidate', data));

  socket.on('disconnect', () => {
    console.log('انقطع اتصال المستخدم:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('الخادم يعمل الآن على المنفذ 3000');
});
