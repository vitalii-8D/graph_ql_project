import { type DataSourceOptions } from 'typeorm';

import { CategoryEntity } from '../categories/entities/category.entity';
import { ChatMessageEntity } from '../chat/entities/chat-message.entity';
import { ChatRoomEntity } from '../chat/entities/chat-room.entity';
import { UserEntity } from '../users/entities/user.entity';
import { PostEntity } from '../posts/entities/post.entity';
import { CommentEntity } from '../comments/entities/comment.entity';
import { OpenGraphMetadataEntity } from '../open-graph/entities/open-graph-metadata.entity';
import { PostImageEntity } from '../post-images/entities/post-image.entity';
import { UserAvatarEntity } from '../user-avatars/entities/user-avatar.entity';
import { config } from '../constants/config';

export const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  entities: [
    CategoryEntity,
    UserEntity,
    PostEntity,
    CommentEntity,
    OpenGraphMetadataEntity,
    ChatRoomEntity,
    ChatMessageEntity,
    PostImageEntity,
    UserAvatarEntity,
  ],
  synchronize: false,
  logging: false,
};
