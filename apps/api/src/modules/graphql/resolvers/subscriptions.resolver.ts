import { UseGuards } from '@nestjs/common';
import { Resolver, Subscription, Args, ID , ObjectType, Field, ID as GqlID } from '@nestjs/graphql';

import { PubSub } from 'graphql-subscriptions';

import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { Notification } from '../types/notification.types';

export const pubSub = new PubSub();

export const GQL_EVENTS = {
  NOTIFICATION_ADDED: 'notificationAdded',
  MESSAGE_RECEIVED: 'messageReceived',
  ASSIGNMENT_GRADED: 'assignmentGraded',
  LIVE_SESSION_STARTED: 'liveSessionStarted',
} as const;


@ObjectType()
class ChatMessage {
  @Field(() => GqlID)
  id: string;

  @Field()
  content: string;

  @Field()
  senderName: string;

  @Field()
  conversationId: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
class LiveSessionEvent {
  @Field(() => GqlID)
  sessionId: string;

  @Field()
  title: string;

  @Field()
  event: string;

  @Field()
  timestamp: Date;
}

@ObjectType()
class AssignmentGradedEvent {
  @Field(() => GqlID)
  submissionId: string;

  @Field(() => GqlID)
  assignmentId: string;

  @Field()
  score: number;

  @Field({ nullable: true })
  feedback?: string;
}

@Resolver()
export class SubscriptionsResolver {
  @Subscription(() => Notification, {
    name: GQL_EVENTS.NOTIFICATION_ADDED,
    description: 'Receive real-time notifications for the authenticated user',
    filter: (payload: { notificationAdded: { userId: string } }, _args: unknown, context: { req: { user?: { id: string } } }) => {
      return payload.notificationAdded.userId === context.req?.user?.id;
    },
    resolve: (payload: { notificationAdded: Notification }) => payload.notificationAdded,
  })
  @UseGuards(GqlAuthGuard)
  notificationAdded() {
    return pubSub.asyncIterableIterator(GQL_EVENTS.NOTIFICATION_ADDED);
  }

  @Subscription(() => ChatMessage, {
    name: GQL_EVENTS.MESSAGE_RECEIVED,
    description: 'Receive new messages in a conversation',
    filter: (payload: { messageReceived: { conversationId: string } }, args: { conversationId: string }) => {
      return payload.messageReceived.conversationId === args.conversationId;
    },
    resolve: (payload: { messageReceived: ChatMessage }) => payload.messageReceived,
  })
  @UseGuards(GqlAuthGuard)
  messageReceived(
    @Args('conversationId', { type: () => ID }) _conversationId: string,
  ) {
    return pubSub.asyncIterableIterator(GQL_EVENTS.MESSAGE_RECEIVED);
  }

  @Subscription(() => AssignmentGradedEvent, {
    name: GQL_EVENTS.ASSIGNMENT_GRADED,
    description: 'Notified when one of your assignment submissions is graded',
    filter: (payload: { assignmentGraded: { studentId: string } }, _args: unknown, context: { req: { user?: { id: string } } }) => {
      return payload.assignmentGraded.studentId === context.req?.user?.id;
    },
    resolve: (payload: { assignmentGraded: AssignmentGradedEvent }) => payload.assignmentGraded,
  })
  @UseGuards(GqlAuthGuard)
  assignmentGraded() {
    return pubSub.asyncIterableIterator(GQL_EVENTS.ASSIGNMENT_GRADED);
  }

  @Subscription(() => LiveSessionEvent, {
    name: GQL_EVENTS.LIVE_SESSION_STARTED,
    description: 'Notified when a live session starts for your enrolled courses',
    resolve: (payload: { liveSessionStarted: LiveSessionEvent }) => payload.liveSessionStarted,
  })
  @UseGuards(GqlAuthGuard)
  liveSessionStarted() {
    return pubSub.asyncIterableIterator(GQL_EVENTS.LIVE_SESSION_STARTED);
  }
}
