export enum ChatSocketEvent {
  JoinRoom = 'joinRoom',
  LeaveRoom = 'leaveRoom',
  SendMessage = 'sendMessage',
  AdminBroadcast = 'adminBroadcast',
  JoinedRoom = 'joinedRoom',
  UserJoined = 'userJoined',
  UserLeft = 'userLeft',
  NewMessage = 'newMessage',
  LeftRoom = 'leftRoom',
  MessageSent = 'messageSent',
  BroadcastSent = 'broadcastSent',
  Error = 'error',
}
