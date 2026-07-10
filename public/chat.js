let socket;
let currentUser = '';
let activityListenersAttached = false;

function clearMessages() {
    const messagesList = document.getElementById('messages');
    if (messagesList) {
        messagesList.innerHTML = '';
    }
}

function showLoginScreen() {
    const loginOverlay = document.getElementById('loginOverlay');
    const chatContainer = document.getElementById('chatContainer');
    const usernameInput = document.getElementById('usernameInput');

    if (loginOverlay) loginOverlay.style.display = 'flex';
    if (chatContainer) chatContainer.style.display = 'none';

    if (usernameInput) {
        usernameInput.value = '';
        usernameInput.focus();
    }
}

function resetChatState() {
    currentUser = '';
    clearMessages();
    updateUsersList([]);
    showLoginScreen();
}

function emitUserActivity() {
    if (socket?.connected) {
        socket.emit('user activity');
    }
}

function attachActivityListeners() {
    if (activityListenersAttached) return;

    const inputField = document.getElementById('input');
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

    events.forEach((eventName) => {
        document.addEventListener(eventName, emitUserActivity, { passive: true });
    });

    if (inputField) {
        inputField.addEventListener('input', emitUserActivity);
    }

    activityListenersAttached = true;
}

function logoutFromChat() {
    if (socket) {
        socket.disconnect();
    }

    socket = null;
    resetChatState();
}

function connectToChat() {
    const username = document.getElementById('usernameInput').value.trim();
    
    if (!username) {
        alert('Por favor ingresa un nombre de usuario');
        return;
    }
    
    currentUser = username;
    clearMessages();
    attachActivityListeners();

    if (socket && socket.connected) {
        socket.disconnect();
    }

    socket = io();
    
    // Escuchar errores de autenticación
    socket.on('auth error', (errorMessage) => {
        alert(errorMessage);
        socket.disconnect();
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('chatContainer').style.display = 'none';
    });

    // Escuchar autenticación exitosa
    socket.on('auth success', (username) => {
        currentUser = username;
        clearMessages();
        emitUserActivity();
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

    users.forEach((user) => {
        const normalizedUser = typeof user === 'string'
            ? { username: user, status: 'active' }
            : user;

        const li = document.createElement('li');
        li.className = 'user-item';

        const statusDot = document.createElement('span');
        statusDot.className = `user-status-dot ${normalizedUser.status || 'active'}`;

        const userName = document.createElement('span');
        userName.className = 'user-name';
        userName.textContent = normalizedUser.username || normalizedUser.name || 'Usuario';

        const statusLabel = document.createElement('span');
        statusLabel.className = 'user-status-label';
        statusLabel.textContent = normalizedUser.status === 'inactive' ? 'Inactivo' : 'Activo';

        li.appendChild(statusDot);
        li.appendChild(userName);
        li.appendChild(statusLabel);
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
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutFromChat);
}

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value && socket?.connected) {
            socket.emit('chat message', input.value);
            input.value = '';
            input.focus();
        }
    });
}