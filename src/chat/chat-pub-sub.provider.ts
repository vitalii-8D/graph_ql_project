import { type Provider } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

export const CHAT_PUB_SUB = 'CHAT_PUB_SUB';

export const CHAT_MESSAGE_ADDED_TOPIC = 'chatMessageAdded';
export const CHAT_ROOM_PRESENCE_TOPIC = 'chatRoomPresence';

export const chatPubSubProvider: Provider = {
  provide: CHAT_PUB_SUB,
  useValue: new PubSub(),
};
