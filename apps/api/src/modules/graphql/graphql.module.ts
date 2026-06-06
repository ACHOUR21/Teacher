import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { CoursesModule } from '../courses/courses.module';
import { UsersModule } from '../users/users.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { CoursesResolver } from './resolvers/courses.resolver';
import { UsersResolver } from './resolvers/users.resolver';
import { AnalyticsResolver } from './resolvers/analytics.resolver';
import { NotificationsResolver } from './resolvers/notifications.resolver';
import { GamificationResolver } from './resolvers/gamification.resolver';
import { AssignmentsResolver } from './resolvers/assignments.resolver';
import { SuperAdminResolver } from './resolvers/super-admin.resolver';
import { GqlAuthGuard } from './guards/gql-auth.guard';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env['NODE_ENV'] !== 'production',
      introspection: process.env['NODE_ENV'] !== 'production',
      context: ({ req }: { req: Request }) => ({ req }),
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
  ],
  providers: [
    CoursesResolver,
    UsersResolver,
    AnalyticsResolver,
    NotificationsResolver,
    GamificationResolver,
    AssignmentsResolver,
    SuperAdminResolver,
    GqlAuthGuard,
  ],
})
export class AppGraphQLModule {}
