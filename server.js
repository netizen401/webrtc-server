const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const token = '9107834577:AAH-AiMtQDUgRyG1TFHSUe1fYmVamjawsec';
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🟢 سيرفر الـ WebRTC يعمل بنجاح ومستقر على مدار الساعة!');
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text && !msg.text.startsWith('/')) {
        bot.sendMessage(chatId, `أهلاً بك! تلقيت رسالتك: "${msg.text}". السيرفر يعمل وجاهز لاستقبال المكالمات.`);
    }
});

io.on('connection', (socket) => {
    console.log('مستخدم جديد متصل:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`المستخدم ${socket.id} انضم للغرفة: ${roomId}`);
        socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', data.answer);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', data.candidate);
    });

    socket.on('disconnect', () => {
        console.log('انقطع اتصال المستخدم:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
