import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';

class OfflineStorage {
  static const _coursesBox = 'cached_courses';
  static const _lessonsBox = 'cached_lessons';
  static const _flashcardsBox = 'cached_flashcards';
  static const _progressBox = 'offline_progress';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Future.wait([
      Hive.openBox<String>(_coursesBox),
      Hive.openBox<String>(_lessonsBox),
      Hive.openBox<String>(_flashcardsBox),
      Hive.openBox<Map>(_progressBox),
    ]);
  }

  // ── Courses ──────────────────────────────────────────────────────────────

  static Future<void> cacheCourse(String courseId, Map<String, dynamic> data) async {
    await Hive.box<String>(_coursesBox).put(courseId, jsonEncode(data));
  }

  static Map<String, dynamic>? getCachedCourse(String courseId) {
    final raw = Hive.box<String>(_coursesBox).get(courseId);
    return raw != null ? jsonDecode(raw) as Map<String, dynamic> : null;
  }

  static List<Map<String, dynamic>> getAllCachedCourses() {
    return Hive.box<String>(_coursesBox)
        .values
        .map((v) => jsonDecode(v) as Map<String, dynamic>)
        .toList();
  }

  // ── Lessons ──────────────────────────────────────────────────────────────

  static Future<void> cacheLesson(String lessonId, Map<String, dynamic> data) async {
    await Hive.box<String>(_lessonsBox).put(lessonId, jsonEncode(data));
  }

  static Map<String, dynamic>? getCachedLesson(String lessonId) {
    final raw = Hive.box<String>(_lessonsBox).get(lessonId);
    return raw != null ? jsonDecode(raw) as Map<String, dynamic> : null;
  }

  // ── Flashcards ────────────────────────────────────────────────────────────

  static Future<void> cacheFlashcardDeck(
      String deckId, List<Map<String, dynamic>> cards) async {
    await Hive.box<String>(_flashcardsBox).put(deckId, jsonEncode(cards));
  }

  static List<Map<String, dynamic>>? getCachedFlashcardDeck(String deckId) {
    final raw = Hive.box<String>(_flashcardsBox).get(deckId);
    return raw != null
        ? (jsonDecode(raw) as List).cast<Map<String, dynamic>>()
        : null;
  }

  // ── Offline progress ─────────────────────────────────────────────────────

  static Future<void> saveOfflineProgress(
      String courseId, Map<String, dynamic> progress) async {
    await Hive.box<Map>(_progressBox).put(courseId, progress);
  }

  static Map<String, dynamic>? getOfflineProgress(String courseId) {
    final data = Hive.box<Map>(_progressBox).get(courseId);
    return data != null ? Map<String, dynamic>.from(data) : null;
  }

  static Map<String, Map<String, dynamic>> getAllOfflineProgress() {
    return Map.fromEntries(
      Hive.box<Map>(_progressBox).toMap().entries.map(
            (e) => MapEntry(e.key as String, Map<String, dynamic>.from(e.value)),
          ),
    );
  }

  static Future<void> clearOfflineProgress(String courseId) async {
    await Hive.box<Map>(_progressBox).delete(courseId);
  }
}
