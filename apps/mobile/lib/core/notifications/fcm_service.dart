import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';

@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  // Background messages are shown automatically by the OS via APNs/FCM.
  // This handler is intentionally minimal.
}

final fcmServiceProvider = Provider<FcmService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return FcmService(apiClient);
});

class FcmService {
  FcmService(this._apiClient);

  final ApiClient _apiClient;

  final _messaging = FirebaseMessaging.instance;
  final _localNotifications = FlutterLocalNotificationsPlugin();

  static const _androidChannel = AndroidNotificationChannel(
    'eduai_high_importance',
    'EduAI Notifications',
    description: 'Important alerts from EduAI',
    importance: Importance.high,
  );

  Future<void> initialize() async {
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);

    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_androidChannel);

    FirebaseMessaging.onMessage.listen(_showForegroundNotification);
  }

  Future<bool> requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (_) {
      return null;
    }
  }

  Future<bool> registerToken() async {
    final granted = await requestPermission();
    if (!granted) return false;

    final token = await getToken();
    if (token == null) return false;

    try {
      await _apiClient.dio.post(
        '/notifications/fcm-token',
        data: {'token': token, 'platform': 'MOBILE'},
      );
      _setupTokenRefresh();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> unregisterToken() async {
    final token = await getToken();
    if (token == null) return;
    try {
      await _apiClient.dio.delete(
        '/notifications/fcm-token',
        data: {'token': token},
      );
    } catch (_) {}
  }

  void _setupTokenRefresh() {
    _messaging.onTokenRefresh.listen((newToken) async {
      try {
        await _apiClient.dio.post(
          '/notifications/fcm-token',
          data: {'token': newToken, 'platform': 'MOBILE'},
        );
      } catch (_) {}
    });
  }

  void _showForegroundNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _androidChannel.id,
          _androidChannel.name,
          channelDescription: _androidChannel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(),
      ),
    );
  }
}

final pushPermissionProvider = FutureProvider.autoDispose<bool>((ref) async {
  final settings = await FirebaseMessaging.instance.getNotificationSettings();
  return settings.authorizationStatus == AuthorizationStatus.authorized ||
      settings.authorizationStatus == AuthorizationStatus.provisional;
});
