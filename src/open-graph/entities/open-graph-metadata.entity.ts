import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

export enum OgType {
  ARTICLE = 'article',
  WEBSITE = 'website',
  VIDEO = 'video.movie',
  MUSIC = 'music.song',
  BOOK = 'book',
  PROFILE = 'profile',
  PRODUCT = 'product',
  EVENT = 'event',
  RECIPE = 'recipe',
}

registerEnumType(OgType, {
  name: 'OgType',
  description: 'Open Graph content types',
});

@ObjectType()
@Entity()
export class OpenGraphMetadata {
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
  @Column({
    type: 'text',
    default: OgType.ARTICLE,
  })
  type: OgType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  imageAlt?: string;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  imageWidth?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  imageHeight?: number;

  // Article specific
  @Field({ nullable: true })
  @Column({ nullable: true })
  author?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  publisher?: string;

  @Field({ nullable: true })
  @Column({ type: 'datetime', nullable: true })
  publishedTime?: Date;

  @Field({ nullable: true })
  @Column({ type: 'datetime', nullable: true })
  modifiedTime?: Date;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  tags?: string[];

  // Video/Audio specific
  @Field({ nullable: true })
  @Column({ nullable: true })
  videoUrl?: string;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  videoDuration?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  videoWidth?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  videoHeight?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
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
  @Column({ type: 'datetime', nullable: true })
  eventStartTime?: Date;

  @Field({ nullable: true })
  @Column({ type: 'datetime', nullable: true })
  eventEndTime?: Date;

  // Location specific
  @Field({ nullable: true })
  @Column({ nullable: true })
  locationAddress?: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLatitude?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLongitude?: number;

  // Locale
  @Field({ nullable: true })
  @Column({ default: 'en_US' })
  locale: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  siteName?: string;

  // Twitter specific
  @Field({ nullable: true })
  @Column({ nullable: true })
  twitterCard?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  twitterSite?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  twitterCreator?: string;

  // Relationship
  @Field(() => Post)
  @OneToOne(() => Post, post => post.openGraphMetadata, { onDelete: 'CASCADE' })
  @JoinColumn()
  post: Post;
}
