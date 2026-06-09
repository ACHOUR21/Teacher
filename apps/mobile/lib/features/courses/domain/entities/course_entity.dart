import 'package:equatable/equatable.dart';

/// Lightweight domain entity for a course.
///
/// Keeps only the fields the BLoC and UI layers need; full rich models with
/// sections and lessons live in the data layer's [Course] model.
class CourseEntity extends Equatable {
  final String id;
  final String title;
  final String description;
  final String instructorName;
  final String? thumbnailUrl;
  final double price;
  final double rating;
  final int totalLessons;
  final int enrolledCount;
  final bool isEnrolled;
  final double? progressPercent;

  const CourseEntity({
    required this.id,
    required this.title,
    required this.description,
    required this.instructorName,
    this.thumbnailUrl,
    required this.price,
    required this.rating,
    required this.totalLessons,
    required this.enrolledCount,
    required this.isEnrolled,
    this.progressPercent,
  });

  bool get isFree => price == 0;

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        instructorName,
        thumbnailUrl,
        price,
        rating,
        totalLessons,
        enrolledCount,
        isEnrolled,
        progressPercent,
      ];

  factory CourseEntity.fromJson(Map<String, dynamic> json) {
    return CourseEntity(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      instructorName: json['instructor_name'] as String,
      thumbnailUrl: json['thumbnail_url'] as String?,
      price: (json['price'] as num? ?? 0).toDouble(),
      rating: (json['rating'] as num? ?? 0).toDouble(),
      totalLessons: json['lesson_count'] as int? ?? 0,
      enrolledCount: json['enrollment_count'] as int? ?? 0,
      isEnrolled: json['is_enrolled'] as bool? ?? false,
      progressPercent: (json['progress'] as num?)?.toDouble(),
    );
  }
}
