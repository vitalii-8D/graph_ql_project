import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';

import { PostEntity } from '../../posts/entities/post.entity';

export enum OgType {
  ARTICLE = 'article',
  WEBSITE = 'website',
  VIDEO = 'video.movie',
  MUSIC = 'music.song',
  BOOK = 'book',
  PRODUCT = 'product',
  EVENT = 'event',
  RECIPE = 'recipe',
}

registerEnumType(OgType, {
  name: 'OgType',
  description: 'Open Graph content types',
});

// Docs: https://ogp.me/

@ObjectType()
@Entity('post_metadata')
export class OpenGraphMetadataEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  // Basic metadata
  @Field()
  @Column()
  title: string;

  @Field()
  @Column('text')
  description: string;

  @Field(() => OgType)
  @Column({ type: 'text', default: OgType.ARTICLE })
  type: OgType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'image_alt' })
  imageAlt?: string;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true, name: 'image_width' })
  imageWidth?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true, name: 'image_height' })
  imageHeight?: number;

  // Article specific
  @Field({ nullable: true })
  @Column({ nullable: true })
  author?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  publisher?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'published_time' })
  publishedTime?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'modified_time' })
  modifiedTime?: Date;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  tags?: string[];

  // Video/Audio specific
  @Field({ nullable: true })
  @Column({ nullable: true, name: 'video_url' })
  videoUrl?: string;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true, name: 'video_duration' })
  videoDuration?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true, name: 'video_width' })
  videoWidth?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true, name: 'video_height' })
  videoHeight?: number;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'audio_url' })
  audioUrl?: string;

  // Product specific
  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  availability?: string;

  // Event specific
  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'event_start_time' })
  eventStartTime?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'event_end_time' })
  eventEndTime?: Date;

  // Location specific
  @Field({ nullable: true })
  @Column({ nullable: true, name: 'location_address' })
  locationAddress?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'location_lat' })
  locationLatitude?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, name: 'location_lon' })
  locationLongitude?: number;

  // Locale
  @Field({ nullable: true })
  @Column({ default: 'en_US' })
  locale: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'site_name' })
  siteName?: string;

  // Twitter specific
  @Field({ nullable: true })
  @Column({ nullable: true, name: 'twitter_card' })
  twitterCard?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'twitter_site' })
  twitterSite?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'twitter_creator' })
  twitterCreator?: string;

  @Field(() => ID)
  @Column({ name: 'post_id' })
  postId: number;

  @Field(() => PostEntity)
  @OneToOne(() => PostEntity, (post) => post.openGraphMetadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;
}
