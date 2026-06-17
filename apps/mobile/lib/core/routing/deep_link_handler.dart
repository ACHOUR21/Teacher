import 'package:go_router/go_router.dart';

/// Handles deep links using the custom scheme `eduai://`.
///
/// Supported paths:
///   eduai://course/:id       → /home/courses/:id
///   eduai://lesson/:id       → /home/courses (best-effort; full path needs courseId)
///   eduai://profile          → /home/profile
///   eduai://notifications    → /home/notifications
class DeepLinkHandler {
  /// Parse [uri] and navigate using [router].
  static void handleLink(Uri uri, GoRouter router) {
    final segments = uri.pathSegments;
    if (segments.isEmpty) return;

    switch (segments[0]) {
      case 'course':
        final id = segments.length > 1 ? segments[1] : null;
        if (id != null && id.isNotEmpty) {
          router.go('/home/courses/$id');
        } else {
          router.go('/home/courses');
        }
        break;

      case 'lesson':
        // A lesson deep-link needs both courseId and lessonId.
        // The URI is expected to be: eduai://lesson/:lessonId?courseId=:courseId
        final lessonId = segments.length > 1 ? segments[1] : null;
        final courseId = uri.queryParameters['courseId'];
        if (lessonId != null && courseId != null) {
          router.go('/home/courses/$courseId/lesson/$lessonId');
        } else {
          router.go('/home/courses');
        }
        break;

      case 'profile':
        router.go('/home/profile');
        break;

      case 'notifications':
        router.go('/home/notifications');
        break;

      case 'live':
        final sessionId = segments.length > 1 ? segments[1] : null;
        if (sessionId != null && sessionId.isNotEmpty) {
          router.go('/home/live/$sessionId');
        } else {
          router.go('/home/live');
        }
        break;

      case 'flashcards':
        final deckId = segments.length > 1 ? segments[1] : null;
        if (deckId != null && deckId.isNotEmpty) {
          router.go('/home/flashcards/$deckId');
        } else {
          router.go('/home/flashcards');
        }
        break;

      default:
        router.go('/home/dashboard');
        break;
    }
  }
}
