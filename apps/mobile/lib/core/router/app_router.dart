import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/mfa_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/courses/presentation/screens/courses_screen.dart';
import '../../features/courses/presentation/screens/course_detail_screen.dart';
import '../../features/courses/presentation/screens/lesson_screen.dart';
import '../../features/live/presentation/screens/live_class_screen.dart';
import '../../features/live/presentation/screens/live_session_screen.dart';
import '../../features/ai_tutor/presentation/screens/ai_tutor_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/gamification/presentation/screens/gamification_screen.dart';
import '../../features/messages/presentation/screens/messages_screen.dart';
import '../../features/marketplace/presentation/screens/marketplace_screen.dart';
import '../../features/billing/presentation/screens/billing_screen.dart';
import '../../features/ai_agents/presentation/screens/ai_agents_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/assignments/presentation/screens/assignments_screen.dart';
import '../../features/certificates/presentation/screens/certificates_screen.dart';
import 'splash_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoading = authState.status == AuthStatus.initial;
      final isAuthenticated = authState.status == AuthStatus.authenticated;
      final requiresMfa = authState.status == AuthStatus.mfaRequired;

      if (isLoading) return '/';

      final location = state.matchedLocation;

      if (requiresMfa && location != '/verify-mfa') {
        return '/verify-mfa';
      }

      if (!isAuthenticated && !requiresMfa) {
        if (location == '/login' || location == '/register' ||
            location == '/forgot-password' || location.startsWith('/reset-password')) return null;
        return '/login';
      }

      if (isAuthenticated) {
        if (location == '/' ||
            location == '/login' ||
            location == '/register' ||
            location == '/verify-mfa') {
          return '/home/dashboard';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/verify-mfa',
        builder: (context, state) => const MFAScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) {
          final token = state.uri.queryParameters['token'];
          return ResetPasswordScreen(token: token);
        },
      ),
      ShellRoute(
        builder: (context, state, child) => HomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/home/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/home/courses',
            builder: (context, state) => const CoursesScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final courseId = state.pathParameters['id']!;
                  return CourseDetailScreen(courseId: courseId);
                },
                routes: [
                  GoRoute(
                    path: 'lesson/:lessonId',
                    builder: (context, state) {
                      final courseId = state.pathParameters['id']!;
                      final lessonId = state.pathParameters['lessonId']!;
                      return LessonScreen(
                        courseId: courseId,
                        lessonId: lessonId,
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
          GoRoute(
            path: '/home/live',
            builder: (context, state) => const LiveClassScreen(),
            routes: [
              GoRoute(
                path: ':sessionId',
                builder: (context, state) {
                  final sessionId = state.pathParameters['sessionId']!;
                  return LiveSessionScreen(sessionId: sessionId);
                },
              ),
            ],
          ),
          GoRoute(
            path: '/home/ai-tutor',
            builder: (context, state) => const AITutorScreen(),
          ),
          GoRoute(
            path: '/home/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/home/notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/home/gamification',
            builder: (context, state) => const GamificationScreen(),
          ),
          GoRoute(
            path: '/home/messages',
            builder: (context, state) => const MessagesScreen(),
          ),
          GoRoute(
            path: '/home/marketplace',
            builder: (context, state) => const MarketplaceScreen(),
          ),
          GoRoute(
            path: '/home/billing',
            builder: (context, state) => const BillingScreen(),
          ),
          GoRoute(
            path: '/home/ai-agents',
            builder: (context, state) => const AiAgentsScreen(),
          ),
          GoRoute(
            path: '/home/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/home/assignments',
            builder: (context, state) => const AssignmentsScreen(),
          ),
          GoRoute(
            path: '/home/certificates',
            builder: (context, state) => const CertificatesScreen(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.error?.toString() ?? 'Unknown error',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/home/dashboard'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});
