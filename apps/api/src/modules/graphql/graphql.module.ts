/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { join } from 'path';

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { AiEducationModule } from '../ai-education/ai-education.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { CoursesModule } from '../courses/courses.module';
import { GamificationModule } from '../gamification/gamification.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { UsersModule } from '../users/users.module';

import { GqlAuthGuard } from './guards/gql-auth.guard';
import { AiAdvancedResolver } from './resolvers/ai-advanced.resolver';
import { AnalyticsResolver } from './resolvers/analytics.resolver';
import { AssignmentsResolver } from './resolvers/assignments.resolver';
import { CoursesResolver } from './resolvers/courses.resolver';
import { GamificationResolver } from './resolvers/gamification.resolver';
import { NotificationsResolver } from './resolvers/notifications.resolver';
import { SubscriptionsResolver } from './resolvers/subscriptions.resolver';
import { SuperAdminResolver } from './resolvers/super-admin.resolver';
import { UsersResolver } from './resolvers/users.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env['NODE_ENV'] !== 'production',
      introspection: process.env['NODE_ENV'] !== 'production',
      subscriptions: {
        'graphql-ws': {
          onConnect: (context: any) => {
            const { connectionParams } = context;
            if (connectionParams?.Authorization) {
              return { req: { headers: { authorization: connectionParams.Authorization } } };
            }
            return {};
          },
        },
        'subscriptions-transport-ws': false,
      },
      context: ({ req, extra }: { req?: Request; extra?: { request?: Request } }) => ({
        req: req ?? extra?.request,
      }),
      formatError: (error) => ({
        message: error.message,
        code: error.extensions?.['code'] ?? 'INTERNAL_SERVER_ERROR',
        path: error.path,
      }),
    }),
    CoursesModule,
    UsersModule,
    AnalyticsModule,
    NotificationsModule,
    GamificationModule,
    AssignmentsModule,
    SuperAdminModule,
    AiEducationModule,
  ],
  providers: [
    CoursesResolver,
    UsersResolver,
    AnalyticsResolver,
    NotificationsResolver,
    GamificationResolver,
    AssignmentsResolver,
    SuperAdminResolver,
    SubscriptionsResolver,
    AiAdvancedResolver,
    GqlAuthGuard,
  ],
})
export class AppGraphQLModule {}
