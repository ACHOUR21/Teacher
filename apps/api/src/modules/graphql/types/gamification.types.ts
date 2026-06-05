import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class UserPoints {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  level: number;
}

@ObjectType()
export class Achievement {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  icon?: string;

  @Field(() => Int)
  points: number;

  @Field({ nullable: true })
  unlockedAt?: Date;
}

@ObjectType()
export class LeaderboardEntry {
  @Field(() => Int)
  rank: number;

  @Field(() => ID)
  userId: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => Int)
  points: number;

  @Field(() => Int)
  level: number;
}

@ObjectType()
export class GamificationProfile {
  @Field(() => UserPoints, { nullable: true })
  points?: UserPoints;

  @Field(() => [Achievement])
  achievements: Achievement[];
}
