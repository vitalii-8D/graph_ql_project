# WebSocket Chat Implementation

This document describes the WebSocket-based chat functionality implemented in the GraphQL project.

## Features

### Implemented Functionality

1. **Admin Room Management**
   - Admins can create chat rooms via GraphQL mutation
   - Rooms have unique names and optional descriptions

2. **User Room Access**
   - Users can list all available rooms via GraphQL query
   - Users can join any room without being bound to it
   - Upon joining, users receive complete message history
   - Users receive real-time messages from other users via WebSocket

3. **Real-time Messaging**
   - Users can send messages via WebSocket
   - Messages are broadcast to all users in the room in real-time
   - All messages are stored in the database with user_id and message content

4. **Admin Broadcasting**
   - Admins can send messages to all existing rooms simultaneously
   - Broadcast messages are saved to all rooms in the database

5. **WebSocket Events**
   - **Receive events**: `newMessage`, `joinedRoom`, `leftRoom`, `userJoined`, `userLeft`, `messageSent`, `broadcastSent`, `error`
   - **Emit events**: `joinRoom`, `leaveRoom`, `sendMessage`, `adminBroadcast`
   - **Broadcast events**: Messages are broadcast to all users in a room
   - **Room management**: Users can join/leave rooms dynamically
   - **Event callbacks**: Acknowledgment events (`messageSent`, `broadcastSent`, `joinedRoom`) confirm successful operations

## Architecture

### Database Schema

#### chat_rooms Table
- `id` - Primary key
- `name` - Unique room name
- `description` - Optional room description
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

#### chat_messages Table
- `id` - Primary key
- `message` - Message content (text)
- `userId` - Foreign key to users table
- `roomId` - Foreign key to chat_rooms table
- `createdAt` - Message timestamp

### Module Structure

```
src/chat/
├── entities/
│   ├── chat-room.entity.ts      # Room entity
│   └── chat-message.entity.ts   # Message entity
├── dto/
│   ├── create-room.input.ts     # GraphQL input for creating rooms
│   └── send-message.input.ts    # Input for sending messages
├── chat.gateway.ts              # WebSocket gateway with JWT auth
├── chat.service.ts              # Business logic
├── chat.resolver.ts             # GraphQL resolvers
└── chat.module.ts               # Module configuration
```

## API Reference

### GraphQL Mutations

#### Create Chat Room (Admin Only)
```graphql
mutation {
  createChatRoom(createRoomInput: {
    name: "General Chat"
    description: "Main discussion room"
  }) {
    id
    name
    description
    createdAt
  }
}
```

### GraphQL Queries

#### Get All Rooms
```graphql
query {
  chatRooms {
    id
    name
    description
    createdAt
  }
}
```

#### Get Single Room
```graphql
query {
  chatRoom(id: 1) {
    id
    name
    description
    createdAt
  }
}
```

#### Get Room Messages
```graphql
query {
  chatRoomMessages(roomId: 1) {
    id
    message
    user {
      id
      name
      email
    }
    roomId
    createdAt
  }
}
```

### WebSocket Events

#### Client → Server Events

##### Join Room
```javascript
socket.emit('joinRoom', { roomId: 1 });
```

##### Leave Room
```javascript
socket.emit('leaveRoom', { roomId: 1 });
```

##### Send Message
```javascript
socket.emit('sendMessage', {
  roomId: 1,
  message: "Hello, everyone!"
});
```

##### Admin Broadcast (Admin Only)
```javascript
socket.emit('adminBroadcast', {
  message: "Server maintenance in 10 minutes"
});
```

#### Server → Client Events

##### Joined Room (Callback)
```javascript
socket.on('joinedRoom', (data) => {
  // data: { room, messages, success }
  console.log('Joined room:', data.room.name);
  console.log('Message history:', data.messages);
});
```

##### Left Room (Callback)
```javascript
socket.on('leftRoom', (data) => {
  // data: { roomId, success }
  console.log('Left room:', data.roomId);
});
```

##### New Message
```javascript
socket.on('newMessage', (data) => {
  // data: { id, message, userId, user, roomId, createdAt, isAdminBroadcast? }
  console.log(`${data.user.name}: ${data.message}`);
});
```

##### User Joined
```javascript
socket.on('userJoined', (data) => {
  // data: { userId, userName, roomId }
  console.log(`${data.userName} joined the room`);
});
```

##### User Left
```javascript
socket.on('userLeft', (data) => {
  // data: { userId, userName, roomId }
  console.log(`${data.userName} left the room`);
});
```

##### Message Sent (Callback)
```javascript
socket.on('messageSent', (data) => {
  // data: { success, messageId }
  console.log('Message sent successfully:', data.messageId);
});
```

##### Broadcast Sent (Callback)
```javascript
socket.on('broadcastSent', (data) => {
  // data: { success, roomCount, messageIds }
  console.log(`Broadcast sent to ${data.roomCount} rooms`);
});
```

##### Error
```javascript
socket.on('error', (data) => {
  // data: { message, event }
  console.error(`Error in ${data.event}:`, data.message);
});
```

## Authentication

### WebSocket Connection

The WebSocket gateway requires JWT authentication. Pass the JWT token in the Authorization header:

```javascript
const socket = io('http://localhost:3000', {
  extraHeaders: {
    Authorization: `Bearer ${jwtToken}`
  }
});
```

### Getting a JWT Token

Use the login mutation to get a token:

```graphql
mutation {
  login(loginInput: {
    email: "user@example.com"
    password: "password"
  }) {
    access_token
    user {
      id
      email
      name
      role
    }
  }
}
```

## Testing

### Using the HTML Test Client

1. Start the server:
   ```bash
   npm run start:dev
   ```

2. Open the test client:
   ```
   http://localhost:3000/chat-test.html
   ```

3. Get a JWT token:
   - Go to GraphQL Playground: `http://localhost:3000/graphql`
   - Run the login mutation
   - Copy the `access_token`

4. In the test client:
   - Paste the JWT token
   - Click "Connect"
   - Create a room via GraphQL (if admin) or use existing room
   - Enter room ID and click "Join Room"
   - Start chatting!

### Testing with Multiple Users

1. Open multiple browser tabs/windows
2. Login as different users and get their tokens
3. Connect each tab with a different token
4. Join the same room in all tabs
5. Send messages and observe real-time updates

### Testing Admin Broadcast

1. Login as an admin user
2. Connect to WebSocket
3. Join a room (or multiple rooms in different tabs)
4. Use the "Admin Broadcast" feature
5. Observe the message appearing in all rooms

## Usage Examples

### JavaScript/TypeScript Client

```typescript
import { io } from 'socket.io-client';

// Connect with JWT
const socket = io('http://localhost:3000', {
  extraHeaders: {
    Authorization: `Bearer ${jwtToken}`
  }
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected to chat server');

  // Join a room
  socket.emit('joinRoom', { roomId: 1 });
});

// Listen for room join confirmation
socket.on('joinedRoom', (data) => {
  console.log('Joined room:', data.room.name);
  console.log('Message history:', data.messages);
});

// Listen for new messages
socket.on('newMessage', (data) => {
  console.log(`${data.user.name}: ${data.message}`);
});

// Send a message
socket.emit('sendMessage', {
  roomId: 1,
  message: 'Hello, world!'
});

// Admin broadcast (admin only)
socket.emit('adminBroadcast', {
  message: 'Important announcement!'
});

// Leave room
socket.emit('leaveRoom', { roomId: 1 });
```

## Event Flow Diagrams

### Joining a Room

```
Client                  Server                  Database
  |                       |                         |
  |-- joinRoom(roomId)--->|                         |
  |                       |--- verify room -------->|
  |                       |<--- room data ----------|
  |                       |--- get messages ------->|
  |                       |<--- message history ----|
  |<-- joinedRoom --------|                         |
  |<-- userJoined --------|  (broadcast to room)    |
```

### Sending a Message

```
Client                  Server                  Database
  |                       |                         |
  |-- sendMessage ------->|                         |
  |                       |--- save message ------->|
  |                       |<--- saved message ------|
  |<-- newMessage --------|  (broadcast to room)    |
  |<-- messageSent -------|  (acknowledgment)       |
```

### Admin Broadcast

```
Client (Admin)          Server                  Database
  |                       |                         |
  |-- adminBroadcast ---->|                         |
  |                       |--- check admin role     |
  |                       |--- get all rooms ------>|
  |                       |<--- room IDs -----------|
  |                       |                         |
  |                       |--- save to room 1 ----->|
  |                       |--- save to room 2 ----->|
  |                       |--- save to room N ----->|
  |                       |                         |
  |                       |-- broadcast to all rooms|
  |<-- broadcastSent -----|  (acknowledgment)       |

  (All users in all rooms receive newMessage event)
```

## Security Features

1. **JWT Authentication**: All WebSocket connections require valid JWT tokens
2. **Role-based Access Control**: Only admins can create rooms and broadcast to all rooms
3. **Room Verification**: Server verifies room existence before allowing joins or messages
4. **User Context**: Each socket connection maintains user context from JWT payload

## Error Handling

The system provides error events for:
- Invalid room IDs
- Unauthorized access (non-admin trying to broadcast)
- Database errors
- Invalid JWT tokens (connection rejected)

All errors are emitted via the `error` event with details:
```javascript
socket.on('error', (data) => {
  console.error(`Error in ${data.event}: ${data.message}`);
});
```

## Future Enhancements

Potential improvements:
- Private/direct messaging between users
- Typing indicators
- Read receipts
- File/image sharing
- Room permissions (public/private)
- User roles per room (moderators)
- Message editing/deletion
- User online/offline status
- Pagination for message history
- Message search functionality
