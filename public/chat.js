let socket;
let currentUser = '';

function connectToChat() {
    const username = document.getElementById('usernameInput').value.trim();
    
    if (!username) {
        alert('Por favor ingresa un nombre de usuario');
        return;
    }
    
    currentUser = username;
    socket = io();
    
    // Escuchar errores de autenticación
    socket.on('auth error', (errorMessage) => {
        alert(errorMessage);
        socket.disconnect();
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('chatContainer').style.display = 'none';
    });

    // Escuchar mensajes de sistema de seguridad (rate limiting)
    socket.on('system message', (msg) => {
        addSystemMessage(msg);
    });
    
    // Escuchar autenticación exitosa
    socket.on('auth success', (username) => {
        currentUser = username;
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'flex';
        document.getElementById('input').focus();
    });
    
    // Notificar al servidor el nombre del usuario
    socket.emit('user connected', username);
    
    // Escuchar mensajes del chat
    socket.on('chat message', (data) => {
        addMessage(data.user, data.text, data.time);
    });
    
    // Escuchar mensajes del sistema
    socket.on('system message', (msg) => {
        addSystemMessage(msg);
    });
    
    // Actualizar lista de usuarios
    socket.on('users list', (users) => {
        updateUsersList(users);
    });
}

function addMessage(user, text, time) {
    const messagesList = document.getElementById('messages');
    const li = document.createElement('li');

    if (user === currentUser) {
        li.className = 'my-message';
    } else {
        li.className = 'other-message';
    }

    li.innerHTML = `
        <span class="message-user">${escapeHtml(user)}</span>
        <div>${escapeHtml(text)}</div>
        <div class="message-time">${time}</div>
    `;

    messagesList.appendChild(li);
    scrollToBottom();
}

function addSystemMessage(msg) {
    const messagesList = document.getElementById('messages');
    const li = document.createElement('li');
    li.className = 'system';
    li.textContent = msg;
    messagesList.appendChild(li);
    scrollToBottom();
}

function updateUsersList(users) {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        usersList.appendChild(li);
    });
}

function scrollToBottom() {
    const messagesArea = document.querySelector('.messages-area');
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Función para prevenir XSS (seguridad)
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Enviar mensajes
const form = document.getElementById('form');
const input = document.getElementById('input');

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value && socket && socket.connected) {
            socket.emit('chat message', input.value);
            input.value = '';
            input.focus();
        }
    });
}