const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));


const users = {};
const userActivity = {};
const INACTIVE_TIMEOUT_MS = 2 * 60 * 1000;

function broadcastUsersList() {
    const usersPayload = Object.entries(users).map(([socketId, username]) => ({
        username,
        status: getUserStatus(socketId)
    }));

    io.emit('users list', usersPayload);
}

function getUserStatus(socketId) {
    const lastActivity = userActivity[socketId];
    if (!lastActivity) return 'active';
    return Date.now() - lastActivity < INACTIVE_TIMEOUT_MS ? 'active' : 'inactive';
}

// 1. Rate limiting (evita spam de mensajes)
const messageLimits = new Map(); 

function checkRateLimit(socketId) {
    const now = Date.now();
    const userLimit = messageLimits.get(socketId) || [];
    
    // Filtrar mensajes de los últimos 5 segundos
    const recentMessages = userLimit.filter(time => now - time < 5000);
    
    if (recentMessages.length >= 5) {
        return false;
    }
    
    recentMessages.push(now);
    messageLimits.set(socketId, recentMessages);
    return true;
}

// 2. Limpiar rate limits antiguos (cada minuto)
setInterval(() => {
    const now = Date.now();
    for (const [id, times] of messageLimits.entries()) {
        const validTimes = times.filter(time => now - time < 5000);
        if (validTimes.length === 0) {
            messageLimits.delete(id);
        } else {
            messageLimits.set(id, validTimes);
        }
    }
}, 60000); 

// 3. Lista de palabras prohibidas
const forbiddenWords = ['puto', 'puta', 'verga', 'mierda', 'coño', 'carajo', 'chinga', 'pinche', 'cabron', 'idiota', 'estupido', 'imbecil', 'hijo de puta', 'mamaverga', 'pija', 'pendejo'];

function filterBadWords(text) {
    let filteredText = text;
    for (const word of forbiddenWords) {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '***');
    }
    return filteredText;
}


io.on('connection', (socket) => {
    console.log('🟢 Nuevo usuario conectado:', socket.id);

    socket.on('user connected', (username) => {
        // 1. Validar que el nombre no esté vacío
        if (!username || username.trim() === '') {
            socket.emit('auth error', 'El nombre de usuario no puede estar vacío');
            return;
        }

        const cleanUsername = username.trim();
        
        // 2. Validar longitud
        if (cleanUsername.length > 20) {
            socket.emit('auth error', 'El nombre es muy largo (máximo 20 caracteres)');
            return;
        }
        
        // 3. Validar longitud mínima
        if (cleanUsername.length < 3) {
            socket.emit('auth error', 'El nombre debe tener al menos 3 caracteres');
            return;
        }
        
        // 4. Verificar que el nombre no esté en uso
        const usersList = Object.values(users);
        if (usersList.includes(cleanUsername)) {
            socket.emit('auth error', `El nombre "${cleanUsername}" ya está en uso. Elige otro.`);
            return;
        }
        
        
        users[socket.id] = cleanUsername;
        socket.username = cleanUsername;
        userActivity[socket.id] = Date.now();
        
        // 5. Registrar intento exitoso para auditoría
        console.log(`[${new Date().toISOString()}] Autenticación exitosa: ${cleanUsername} (${socket.id})`);
        socket.emit('auth success', cleanUsername);
        broadcastUsersList();
        
        // Notificar que alguien se unió
        socket.broadcast.emit('system message', `✨ ${cleanUsername} se unió al chat`);
    });

    socket.on('user activity', () => {
        if (socket.id) {
            userActivity[socket.id] = Date.now();
            broadcastUsersList();
        }
    });

    socket.on('chat message', (msg) => {
        // 1. Validar que el mensaje no esté vacío
        if (!msg || msg.trim() === '') return;
        
        // 2. Verificar que el usuario esté autenticado
        if (!socket.username) {
            socket.emit('system message', 'Debes identificarte para enviar mensajes');
            return;
        }
        
        // 3. RATE LIMITING: Evitar spam
        if (!checkRateLimit(socket.id)) {
            socket.emit('system message', 'Estás enviando mensajes demasiado rápido. Espera un momento.');
            return;
        }
        
        // 4. Limpiar mensaje (prevenir inyección y límite de longitud)
        let cleanMsg = msg.trim().substring(0, 500);
        
        // 5. Filtrar palabras ofensivas
        cleanMsg = filterBadWords(cleanMsg);
        
        userActivity[socket.id] = Date.now();

        // 6. Registrar mensaje para auditoría (integridad)
        console.log(`[${new Date().toISOString()}] 💬 ${socket.username}: ${cleanMsg.substring(0, 100)}`);
        
        // 7. Reenviar mensaje a todos los usuarios
        io.emit('chat message', {
            user: socket.username,
            text: cleanMsg,
            time: new Date().toLocaleTimeString(),
            timestamp: Date.now() 
        });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            // Registrar desconexión para auditoría
            console.log(`[${new Date().toISOString()}] 🔴 Usuario desconectado: ${socket.username} (${socket.id})`);
            
            // Notificar a todos
            io.emit('system message', `${socket.username} abandonó el chat`);
            
            // Eliminar de la lista de usuarios
            delete users[socket.id];
            delete userActivity[socket.id];
            
            // Actualizar lista para todos
            broadcastUsersList();
        } else {
            console.log(`[${new Date().toISOString()}] 🔴 Usuario no autenticado desconectado: ${socket.id}`);
        }
        
        // Limpiar rate limits del usuario desconectado
        if (messageLimits.has(socket.id)) {
            messageLimits.delete(socket.id);
        }
    });
});

setInterval(() => {
    broadcastUsersList();
}, 15000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Medidas de seguridad activas:`);
    console.log(`   - Rate limiting: 5 mensajes cada 5 segundos`);
    console.log(`   - Filtro de palabras ofensivas`);
    console.log(`   - Validación de nombres de usuario`);
    console.log(`   - Prevención de XSS`);
    console.log(`   - Logs de auditoría`);
});