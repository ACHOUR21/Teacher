import { ObjectType, Field, ID } from '@nestjs/graphql';

import { PaginationMeta } from './common.types';

@ObjectType()
export class UserProfile {
  @Field({ nullable: true })
  bio?: string;

  @Field()
  timezone: string;

  @Field()
  language: string;
}

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  role: string;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  emailVerified: boolean;

  @Field()
  mfaEnabled: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field()
  createdAt: Date;

  @Field(() => UserProfile, { nullable: true })
  profile?: UserProfile;
}

@ObjectType()
export class UserPage {
  @Field(() => [User])
  data: User[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
