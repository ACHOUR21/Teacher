import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsArray, Min, MaxLength } from 'class-validator';

export enum CourseLevelInput {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

@InputType()
export class CreateCourseInput {
  @Field()
  @IsString()
  @MaxLength(200)
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  level?: CourseLevelInput;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;
}

@InputType()
export class CourseFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  level?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  limit?: number;
}
