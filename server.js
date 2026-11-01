const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const token = process.env.BOT_TOKEN;
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

// حارس الباب: لا يدخل التطبيق إلا بكلمة السر الصحيحة
io.use((socket, next) => {
  const secret = process.env.APP_SECRET;
  if (secret && socket.handshake.auth.key === secret) return next();
  next(new Error('unauthorized'));
});

// أمر من تيليجرام: /cmd اسم_الأمر
bot.onText(/^\/cmd(?:\s+(.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  if (String(msg.from.id) !== String(process.env.OWNER_ID)) {
    return bot.sendMessage(chatId, 'غير مصرح لك.');
  }
  if (!match[1]) return bot.sendMessage(chatId, 'اكتب الأمر بعد /cmd');
  if (io.sockets.sockets.size === 0) {
    return bot.sendMessage(chatId, 'التطبيق غير متصل الآن.');
  }
  io.emit('command', { text: match[1] });
  bot.sendMessage(chatId, 'تم إرسال الأمر إلى التطبيق...');
});

// النتيجة القادمة من التطبيق ترسل إليك
io.on('connection', (socket) => {
  socket.on('result', (data) => {
    bot.sendMessage(process.env.OWNER_ID, String(data.text).slice(0, 4000));
  });
});
