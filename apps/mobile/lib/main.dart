import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'app.dart';
import 'core/notifications/fcm_service.dart';
import 'core/notifications/notification_handler.dart';
import 'core/notifications/push_notification_service.dart';
import 'core/offline/offline_storage.dart';

// firebase_options.dart must exist before running.
// Copy firebase_options.dart.example → firebase_options.dart and fill in values,
// or run `flutterfire configure` to generate it automatically.
//
// If firebase_options.dart is not present, comment out the two Firebase lines below
// and pass no options to Firebase.initializeApp().

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await OfflineStorage.init();
  await Firebase.initializeApp();

  // Register the top-level background message handler BEFORE any
  // FirebaseMessaging stream is listened to.
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  // Initialise the full push notification service (permissions + local
  // notifications + topic subscription).
  await PushNotificationService().initialize();

  final container = ProviderContainer();
  await container.read(fcmServiceProvider).initialize();

  runApp(UncontrolledProviderScope(
    container: container,
    child: const EduAIApp(),
  ));
}
