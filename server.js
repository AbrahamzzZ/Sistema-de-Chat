const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Almacenar usuarios conectados
const users = {};

io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado:', socket.id);

    // Cuando un usuario se identifica
    socket.on('user connected', (username) => {
        users[socket.id] = username;
        socket.username = username;
        
        // Enviar lista actualizada a todos
        io.emit('users list', Object.values(users));
        
        // Notificar que alguien se unió
        socket.broadcast.emit('system message', `✨ ${username} se unió al chat`);
    });

    // Recibir y reenviar mensajes
    socket.on('chat message', (msg) => {
        io.emit('chat message', {
            user: socket.username || 'Anónimo',
            text: msg,
            time: new Date().toLocaleTimeString()
        });
    });

    // Usuario desconectado
    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('system message', `${socket.username} abandonó el chat`);
            delete users[socket.id];
            io.emit('users list', Object.values(users));
        }
        console.log('Usuario desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});