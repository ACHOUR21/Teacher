import { ObjectType, Field, Float, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class MindMapNodeType {
  @Field(() => ID)
  id: string;

  @Field()
  label: string;

  @Field(() => [MindMapNodeType])
  children: MindMapNodeType[];

  @Field({ nullable: true })
  color?: string;
}

@ObjectType()
export class MindMapResultType {
  @Field()
  topic: string;

  @Field(() => MindMapNodeType)
  root: MindMapNodeType;

  @Field()
  generatedAt: Date;
}

@ObjectType()
export class CareerMatchType {
  @Field()
  title: string;

  @Field(() => Float)
  matchScore: number;

  @Field()
  description: string;

  @Field(() => [String])
  requiredSkills: string[];
}

@ObjectType()
export class SkillGapType {
  @Field()
  skill: string;

  @Field()
  priority: string;

  @Field(() => [String])
  recommendedCourses: string[];
}

@ObjectType()
export class LearningStepType {
  @Field(() => Int)
  step: number;

  @Field()
  action: string;

  @Field(() => Int)
  timelineWeeks: number;
}

@ObjectType()
export class CareerRecommendationType {
  @Field(() => [CareerMatchType])
  careers: CareerMatchType[];

  @Field(() => [SkillGapType])
  skillGaps: SkillGapType[];

  @Field(() => [LearningStepType])
  learningPath: LearningStepType[];
}

@ObjectType()
export class PerformanceFactorType {
  @Field()
  name: string;

  @Field()
  impact: string;

  @Field(() => Float)
  weight: number;
}

@ObjectType()
export class PerformancePredictionType {
  @Field()
  studentId: string;

  @Field()
  predictedGrade: string;

  @Field(() => Float)
  confidence: number;

  @Field()
  riskLevel: string;

  @Field(() => Float)
  dropoutRisk: number;

  @Field(() => [String])
  recommendations: string[];

  @Field(() => [PerformanceFactorType])
  factors: PerformanceFactorType[];
}
