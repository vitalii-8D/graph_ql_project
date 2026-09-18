import { IsInt, Min } from 'class-validator';

/** Payload shape for the `joinRoom`/`leaveRoom` Socket.IO events. */
export class RoomIdInput {
  @IsInt()
  @Min(1)
  roomId: number;
}
