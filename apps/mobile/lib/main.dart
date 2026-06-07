import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'app.dart';
import 'core/notifications/fcm_service.dart';

// firebase_options.dart must exist before running.
// Copy firebase_options.dart.example → firebase_options.dart and fill in values,
// or run `flutterfire configure` to generate it automatically.
//
// If firebase_options.dart is not present, comment out the two Firebase lines below
// and pass no options to Firebase.initializeApp().

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  final container = ProviderContainer();
  await container.read(fcmServiceProvider).initialize();

  runApp(UncontrolledProviderScope(
    container: container,
    child: const EduAIApp(),
  ));
}
