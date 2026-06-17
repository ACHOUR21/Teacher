import 'package:firebase_messaging/firebase_messaging.dart';

/// Top-level background message handler.
/// Must be a top-level function (not a class method) and annotated with
/// @pragma('vm:entry-point') so the Dart VM keeps it alive when the app is
/// in the background or terminated.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase is already initialised by the time this is called (FlutterFire
  // guarantees that). We keep this intentionally minimal — the OS will display
  // the notification automatically via APNs/FCM data when a notification
  // payload is present. Heavy work (e.g. badge count update) should be done
  // here if needed.
}
