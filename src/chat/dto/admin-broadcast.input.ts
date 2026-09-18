import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Payload shape for the `adminBroadcast` Socket.IO event. */
export class AdminBroadcastInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;
}
