import 'package:equatable/equatable.dart';
import '../../domain/entities/course_entity.dart';

sealed class CoursesState extends Equatable {
  const CoursesState();

  @override
  List<Object?> get props => [];
}

final class CoursesInitial extends CoursesState {
  const CoursesInitial();
}

final class CoursesLoading extends CoursesState {
  const CoursesLoading();
}

final class CoursesLoaded extends CoursesState {
  final List<CourseEntity> courses;
  final int totalCount;

  const CoursesLoaded({required this.courses, required this.totalCount});

  @override
  List<Object?> get props => [courses, totalCount];
}

final class CourseDetailLoaded extends CoursesState {
  final CourseEntity course;

  const CourseDetailLoaded(this.course);

  @override
  List<Object?> get props => [course];
}

final class CoursesError extends CoursesState {
  final String message;

  const CoursesError(this.message);

  @override
  List<Object?> get props => [message];
}

final class CoursesEnrolled extends CoursesState {
  final String courseId;

  const CoursesEnrolled(this.courseId);

  @override
  List<Object?> get props => [courseId];
}
