"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppGraphQLModule = void 0;
var _path = require("path");
var _apollo = require("@nestjs/apollo");
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _aiEducation = require("../ai-education/ai-education.module");
var _analytics = require("../analytics/analytics.module");
var _assignments = require("../assignments/assignments.module");
var _courses = require("../courses/courses.module");
var _gamification = require("../gamification/gamification.module");
var _notifications = require("../notifications/notifications.module");
var _superAdmin = require("../super-admin/super-admin.module");
var _users = require("../users/users.module");
var _gqlAuth = require("./guards/gql-auth.guard");
var _aiAdvanced = require("./resolvers/ai-advanced.resolver");
var _analytics2 = require("./resolvers/analytics.resolver");
var _assignments2 = require("./resolvers/assignments.resolver");
var _courses2 = require("./resolvers/courses.resolver");
var _gamification2 = require("./resolvers/gamification.resolver");
var _notifications2 = require("./resolvers/notifications.resolver");
var _subscriptions = require("./resolvers/subscriptions.resolver");
var _superAdmin2 = require("./resolvers/super-admin.resolver");
var _users2 = require("./resolvers/users.resolver");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let AppGraphQLModule = exports.AppGraphQLModule = class AppGraphQLModule {};
exports.AppGraphQLModule = AppGraphQLModule = __decorate([(0, _common.Module)({
  imports: [_graphql.GraphQLModule.forRoot({
    driver: _apollo.ApolloDriver,
    autoSchemaFile: (0, _path.join)(process.cwd(), 'src/schema.gql'),
    sortSchema: true,
    playground: process.env['NODE_ENV'] !== 'production',
    introspection: process.env['NODE_ENV'] !== 'production',
    subscriptions: {
      'graphql-ws': {
        onConnect: context => {
          const {
            connectionParams
          } = context;
          if (connectionParams?.Authorization) {
            return {
              req: {
                headers: {
                  authorization: connectionParams.Authorization
                }
              }
            };
          }
          return {};
        }
      },
      'subscriptions-transport-ws': false
    },
    context: ({
      req,
      extra
    }) => ({
      req: req ?? extra?.request
    }),
    formatError: error => ({
      message: error.message,
      code: error.extensions?.['code'] ?? 'INTERNAL_SERVER_ERROR',
      path: error.path
    })
  }), _courses.CoursesModule, _users.UsersModule, _analytics.AnalyticsModule, _notifications.NotificationsModule, _gamification.GamificationModule, _assignments.AssignmentsModule, _superAdmin.SuperAdminModule, _aiEducation.AiEducationModule],
  providers: [_courses2.CoursesResolver, _users2.UsersResolver, _analytics2.AnalyticsResolver, _notifications2.NotificationsResolver, _gamification2.GamificationResolver, _assignments2.AssignmentsResolver, _superAdmin2.SuperAdminResolver, _subscriptions.SubscriptionsResolver, _aiAdvanced.AiAdvancedResolver, _gqlAuth.GqlAuthGuard]
})], AppGraphQLModule);