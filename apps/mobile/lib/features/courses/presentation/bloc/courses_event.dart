import 'package:equatable/equatable.dart';

sealed class CoursesEvent extends Equatable {
  const CoursesEvent();

  @override
  List<Object?> get props => [];
}

final class CoursesLoadRequested extends CoursesEvent {
  final int page;
  final int limit;
  final String? search;

  const CoursesLoadRequested({
    this.page = 1,
    this.limit = 20,
    this.search,
  });

  @override
  List<Object?> get props => [page, limit, search];
}

final class CourseDetailRequested extends CoursesEvent {
  final String id;

  const CourseDetailRequested(this.id);

  @override
  List<Object?> get props => [id];
}

final class CourseEnrollRequested extends CoursesEvent {
  final String id;

  const CourseEnrollRequested(this.id);

  @override
  List<Object?> get props => [id];
}

final class CourseProgressUpdated extends CoursesEvent {
  final String courseId;
  final String lessonId;
  final double percent;

  const CourseProgressUpdated({
    required this.courseId,
    required this.lessonId,
    required this.percent,
  });

  @override
  List<Object?> get props => [courseId, lessonId, percent];
}
