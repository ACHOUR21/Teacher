import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PushNotificationService {
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const _androidChannel = AndroidNotificationChannel(
    'eduai_push',
    'EduAI Push Notifications',
    description: 'Push notifications from EduAI',
    importance: Importance.high,
  );

  Future<void> initialize() async {
    // Request permission
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Initialize local notifications
    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      ),
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (response) {
        // Payload-based routing is handled externally via handleNotificationTap
      },
    );

    // Create Android notification channel
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_androidChannel);

    // Set up FCM foreground handler
    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // Subscribe to topic
    await FirebaseMessaging.instance.subscribeToTopic('all');
  }

  Future<String?> getToken() async {
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (_) {
      return null;
    }
  }

  Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch & 0x7FFFFFFF,
      title,
      body,
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
      payload: payload,
    );
  }

  void _onForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;
    showLocalNotification(
      title: notification.title ?? 'EduAI',
      body: notification.body ?? '',
      payload: message.data['route'] as String?,
    );
  }

  /// Handle notification tap and navigate to the correct screen.
  /// Pass the GoRouter via a callback to avoid importing go_router here.
  void handleNotificationTap(
    RemoteMessage message,
    void Function(String route) navigate,
  ) {
    final data = message.data;
    final type = (data['type'] as String? ?? '').toUpperCase();
    final id = data['id'] as String?;

    if (type.contains('COURSE') && id != null) {
      navigate('/home/courses/$id');
    } else if (type.contains('LESSON') && id != null) {
      navigate('/home/courses/${data['courseId'] ?? ''}/lesson/$id');
    } else if (type.contains('LIVE') && id != null) {
      navigate('/home/live/$id');
    } else if (type.contains('MESSAGE')) {
      navigate('/home/messages');
    } else if (type.contains('ACHIEVEMENT') || type.contains('BADGE')) {
      navigate('/home/gamification');
    } else {
      navigate('/home/notifications');
    }
  }
}

final pushNotificationServiceProvider =
    Provider<PushNotificationService>((ref) => PushNotificationService());
