import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

import { ChatPresenceEventType } from '../enums/chat-presence-event-type.enum';

registerEnumType(ChatPresenceEventType, {
  name: 'ChatPresenceEventType',
});

@ObjectType()
export class ChatPresenceEvent {
  @Field(() => ChatPresenceEventType)
  type: ChatPresenceEventType;

  @Field(() => ID)
  roomId: string;

  @Field(() => ID)
  userId: string;

  @Field()
  userName: string;
}
