# Chat en Tiempo Real con Sockets

Sistema de chat en tiempo real que permite la comunicación instantánea entre múltiples usuarios utilizando WebSockets (Socket.IO).

## Características

* Comunicación en tiempo real mediante sockets
* Lista de usuarios conectados en vivo
* Envío y recepción de mensajes instantáneos
* Interfaz moderna y responsive
* Notificaciones de entrada/salida de usuarios
* Timestamps en cada mensaje
* Diferenciación visual entre mensajes propios y de otros usuarios
* Botón de cerrar sesión para salir del chat de forma ordenada
* Indicador de estado visible: verde para activo y naranja para inactivo tras 2 minutos sin interacción

## Tecnologías Utilizadas

* **Server:** Node.js + Express + Socket.IO
* **Client:** HTML5, CSS3, JavaScript
* **Comunicación:** WebSockets (Socket.IO)

## Requisitos Previos

* Node.js (v14 o superior)
* npm (incluido con Node.js)

## Instalación y Ejecución Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/AbrahamzzZ/Sistema-de-Chat.git
cd Sistema-de-Chat
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar el servidor

```bash
node server.js
```

### 4. Abrir el navegador

```text
http://localhost:3000
```

## Estructura del Proyecto

```text
Sistema-de-Chat/
├── public/
│   ├── style.css
│   ├── chat.js
│   └── index.html
├── server.js
├── package.json
├── .gitignore
└── README.md
```

### Descripción de Archivos

| Archivo/Carpeta        | Descripción                    |
| ---------------------- | ------------------------------ |
| `public/style.css`    | Estilos de la interfaz         |
| `public/chat.js`      | Lógica del cliente             |
| `public/index.html`   | Página principal               |
| `server.js`            | Servidor Node.js con Socket.IO |
| `package.json`         | Dependencias y scripts         |
| `.gitignore`           | Archivos ignorados por Git     |
| `README.md`            | Documentación del proyecto     |

## Cómo Usar el Chat

### Conectarse

Ingresa un nombre de usuario en la pantalla de inicio.

### Chatear

Escribe tu mensaje en el campo de texto y presiona **Enviar**.

### Ver Usuarios Conectados

La lista de usuarios conectados se muestra en el panel lateral, junto con un punto de estado que indica si están activos o inactivos.

### Salir

Puedes cerrar la sesión con el botón de "Cerrar sesión" o simplemente cerrar la pestaña o ventana del navegador.

### Estado de actividad

Si un usuario no interactúa con la página durante aproximadamente 2 minutos, su estado pasa a inactivo y se muestra con color naranja. La actividad del mouse, teclado, scroll y mensajes recientes lo vuelven a activar.

## Despliegue en la Nube

El proyecto está desplegado en Render:

🔗 https://sistema-de-chat.onrender.com

## Medidas de Seguridad Implementadas

### Autenticación de Usuarios

* Validación de nombres únicos.
* Longitud mínima de 3 caracteres.
* Longitud máxima de 20 caracteres.

### Protección contra Spam

* Máximo de 5 mensajes cada 5 segundos por usuario.

### Filtro de Contenido

* Reemplazo automático de lenguaje inapropiado por `***`.

### Prevención de XSS

* Escape de HTML en mensajes para evitar inyección de código.

### Auditoría

* Registro de conexiones.
* Registro de desconexiones.
* Registro de mensajes enviados.

### Seguridad en Producción

* Comunicación cifrada mediante HTTPS.

## Autor

Desarrollado por Abraham Farfan y Jose Agurto.
