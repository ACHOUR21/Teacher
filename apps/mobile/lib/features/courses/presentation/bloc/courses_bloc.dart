import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/enroll_course_usecase.dart';
import '../../domain/usecases/get_course_by_id_usecase.dart';
import '../../domain/usecases/get_courses_usecase.dart';
import '../../domain/usecases/update_progress_usecase.dart';
import '../../../../core/result/result.dart';
import 'courses_event.dart';
import 'courses_state.dart';

class CoursesBloc extends Bloc<CoursesEvent, CoursesState> {
  final GetCoursesUseCase _getCoursesUseCase;
  final GetCourseByIdUseCase _getCourseByIdUseCase;
  final EnrollCourseUseCase _enrollCourseUseCase;
  final UpdateProgressUseCase _updateProgressUseCase;

  CoursesBloc({
    required GetCoursesUseCase getCoursesUseCase,
    required GetCourseByIdUseCase getCourseByIdUseCase,
    required EnrollCourseUseCase enrollCourseUseCase,
    required UpdateProgressUseCase updateProgressUseCase,
  })  : _getCoursesUseCase = getCoursesUseCase,
        _getCourseByIdUseCase = getCourseByIdUseCase,
        _enrollCourseUseCase = enrollCourseUseCase,
        _updateProgressUseCase = updateProgressUseCase,
        super(const CoursesInitial()) {
    on<CoursesLoadRequested>(_onCoursesLoadRequested);
    on<CourseDetailRequested>(_onCourseDetailRequested);
    on<CourseEnrollRequested>(_onCourseEnrollRequested);
    on<CourseProgressUpdated>(_onCourseProgressUpdated);
  }

  Future<void> _onCoursesLoadRequested(
    CoursesLoadRequested event,
    Emitter<CoursesState> emit,
  ) async {
    emit(const CoursesLoading());

    final result = await _getCoursesUseCase(
      page: event.page,
      limit: event.limit,
      search: event.search,
    );

    switch (result) {
      case Success(:final value):
        emit(CoursesLoaded(
          courses: value.courses,
          totalCount: value.totalCount,
        ));
      case Failure(:final message):
        emit(CoursesError(message));
    }
  }

  Future<void> _onCourseDetailRequested(
    CourseDetailRequested event,
    Emitter<CoursesState> emit,
  ) async {
    emit(const CoursesLoading());

    final result = await _getCourseByIdUseCase(event.id);

    switch (result) {
      case Success(:final value):
        emit(CourseDetailLoaded(value));
      case Failure(:final message):
        emit(CoursesError(message));
    }
  }

  Future<void> _onCourseEnrollRequested(
    CourseEnrollRequested event,
    Emitter<CoursesState> emit,
  ) async {
    emit(const CoursesLoading());

    final result = await _enrollCourseUseCase(event.id);

    switch (result) {
      case Success():
        emit(CoursesEnrolled(event.id));
      case Failure(:final message):
        emit(CoursesError(message));
    }
  }

  Future<void> _onCourseProgressUpdated(
    CourseProgressUpdated event,
    Emitter<CoursesState> emit,
  ) async {
    // Progress updates are fire-and-forget; no loading state to avoid
    // disrupting the lesson playback UI.
    final result = await _updateProgressUseCase(
      courseId: event.courseId,
      lessonId: event.lessonId,
      progressPercent: event.percent,
    );

    switch (result) {
      case Success():
        break; // nothing to emit; the UI keeps its current state
      case Failure(:final message):
        emit(CoursesError(message));
    }
  }
}
