import { ObjectType, Field, ID } from '@nestjs/graphql';

import { PaginationMeta } from './common.types';

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field()
  title: string;

  @Field()
  body: string;

  @Field()
  isRead: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  readAt?: Date;
}

@ObjectType()
export class NotificationPage {
  @Field(() => [Notification])
  data: Notification[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
