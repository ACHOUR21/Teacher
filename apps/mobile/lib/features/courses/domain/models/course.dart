enum CourseLevel { beginner, intermediate, advanced }

enum CourseStatus { draft, published, archived }

enum LessonType { video, document, quiz, assignment }

class Course {
  final String id;
  final String title;
  final String description;
  final String instructorId;
  final String instructorName;
  final String? instructorAvatarUrl;
  final String? thumbnailUrl;
  final String category;
  final CourseLevel level;
  final CourseStatus status;
  final double price;
  final double rating;
  final int reviewCount;
  final int enrollmentCount;
  final int lessonCount;
  final Duration totalDuration;
  final List<CourseSection> sections;
  final bool isEnrolled;
  final double? progress;
  final String tenantId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<String> tags;
  final String? language;
  final List<String> learningObjectives;

  const Course({
    required this.id,
    required this.title,
    required this.description,
    required this.instructorId,
    required this.instructorName,
    this.instructorAvatarUrl,
    this.thumbnailUrl,
    required this.category,
    required this.level,
    required this.status,
    required this.price,
    required this.rating,
    required this.reviewCount,
    required this.enrollmentCount,
    required this.lessonCount,
    required this.totalDuration,
    required this.sections,
    required this.isEnrolled,
    this.progress,
    required this.tenantId,
    required this.createdAt,
    required this.updatedAt,
    required this.tags,
    this.language,
    required this.learningObjectives,
  });

  bool get isFree => price == 0;

  String get levelLabel {
    switch (level) {
      case CourseLevel.beginner:
        return 'Beginner';
      case CourseLevel.intermediate:
        return 'Intermediate';
      case CourseLevel.advanced:
        return 'Advanced';
    }
  }

  String get durationLabel {
    final hours = totalDuration.inHours;
    final minutes = totalDuration.inMinutes.remainder(60);
    if (hours > 0) return '${hours}h ${minutes}m';
    return '${minutes}m';
  }

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      instructorId: json['instructor_id'] as String,
      instructorName: json['instructor_name'] as String,
      instructorAvatarUrl: json['instructor_avatar_url'] as String?,
      thumbnailUrl: json['thumbnail_url'] as String?,
      category: json['category'] as String,
      level: _parseLevel(json['level'] as String? ?? 'beginner'),
      status: _parseStatus(json['status'] as String? ?? 'published'),
      price: (json['price'] as num? ?? 0).toDouble(),
      rating: (json['rating'] as num? ?? 0).toDouble(),
      reviewCount: json['review_count'] as int? ?? 0,
      enrollmentCount: json['enrollment_count'] as int? ?? 0,
      lessonCount: json['lesson_count'] as int? ?? 0,
      totalDuration: Duration(
        seconds: json['total_duration_seconds'] as int? ?? 0,
      ),
      sections: (json['sections'] as List<dynamic>? ?? [])
          .map((s) => CourseSection.fromJson(s as Map<String, dynamic>))
          .toList(),
      isEnrolled: json['is_enrolled'] as bool? ?? false,
      progress: (json['progress'] as num?)?.toDouble(),
      tenantId: json['tenant_id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      tags: (json['tags'] as List<dynamic>? ?? []).cast<String>(),
      language: json['language'] as String?,
      learningObjectives: (json['learning_objectives'] as List<dynamic>? ?? [])
          .cast<String>(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'instructor_id': instructorId,
        'instructor_name': instructorName,
        'instructor_avatar_url': instructorAvatarUrl,
        'thumbnail_url': thumbnailUrl,
        'category': category,
        'level': level.name,
        'status': status.name,
        'price': price,
        'rating': rating,
        'review_count': reviewCount,
        'enrollment_count': enrollmentCount,
        'lesson_count': lessonCount,
        'total_duration_seconds': totalDuration.inSeconds,
        'sections': sections.map((s) => s.toJson()).toList(),
        'is_enrolled': isEnrolled,
        'progress': progress,
        'tenant_id': tenantId,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
        'tags': tags,
        'language': language,
        'learning_objectives': learningObjectives,
      };

  static CourseLevel _parseLevel(String level) {
    switch (level.toLowerCase()) {
      case 'intermediate':
        return CourseLevel.intermediate;
      case 'advanced':
        return CourseLevel.advanced;
      default:
        return CourseLevel.beginner;
    }
  }

  static CourseStatus _parseStatus(String status) {
    switch (status.toLowerCase()) {
      case 'draft':
        return CourseStatus.draft;
      case 'archived':
        return CourseStatus.archived;
      default:
        return CourseStatus.published;
    }
  }
}

class CourseSection {
  final String id;
  final String title;
  final int order;
  final List<Lesson> lessons;

  const CourseSection({
    required this.id,
    required this.title,
    required this.order,
    required this.lessons,
  });

  factory CourseSection.fromJson(Map<String, dynamic> json) {
    return CourseSection(
      id: json['id'] as String,
      title: json['title'] as String,
      order: json['order'] as int? ?? 0,
      lessons: (json['lessons'] as List<dynamic>? ?? [])
          .map((l) => Lesson.fromJson(l as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'order': order,
        'lessons': lessons.map((l) => l.toJson()).toList(),
      };
}

class Lesson {
  final String id;
  final String title;
  final String? description;
  final LessonType type;
  final Duration? duration;
  final int order;
  final bool isCompleted;
  final bool isLocked;
  final String? videoUrl;
  final String? documentUrl;
  final String? thumbnailUrl;

  const Lesson({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    this.duration,
    required this.order,
    required this.isCompleted,
    required this.isLocked,
    this.videoUrl,
    this.documentUrl,
    this.thumbnailUrl,
  });

  String get typeIcon {
    switch (type) {
      case LessonType.video:
        return 'video';
      case LessonType.document:
        return 'document';
      case LessonType.quiz:
        return 'quiz';
      case LessonType.assignment:
        return 'assignment';
    }
  }

  String get durationLabel {
    if (duration == null) return '';
    final m = duration!.inMinutes;
    final s = duration!.inSeconds.remainder(60);
    if (m == 0) return '${s}s';
    return '${m}m ${s}s';
  }

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      type: _parseType(json['type'] as String? ?? 'video'),
      duration: json['duration_seconds'] != null
          ? Duration(seconds: json['duration_seconds'] as int)
          : null,
      order: json['order'] as int? ?? 0,
      isCompleted: json['is_completed'] as bool? ?? false,
      isLocked: json['is_locked'] as bool? ?? false,
      videoUrl: json['video_url'] as String?,
      documentUrl: json['document_url'] as String?,
      thumbnailUrl: json['thumbnail_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'type': type.name,
        'duration_seconds': duration?.inSeconds,
        'order': order,
        'is_completed': isCompleted,
        'is_locked': isLocked,
        'video_url': videoUrl,
        'document_url': documentUrl,
        'thumbnail_url': thumbnailUrl,
      };

  static LessonType _parseType(String type) {
    switch (type.toLowerCase()) {
      case 'document':
        return LessonType.document;
      case 'quiz':
        return LessonType.quiz;
      case 'assignment':
        return LessonType.assignment;
      default:
        return LessonType.video;
    }
  }
}

class CourseReview {
  final String id;
  final String userId;
  final String userName;
  final String? userAvatarUrl;
  final double rating;
  final String? comment;
  final DateTime createdAt;

  const CourseReview({
    required this.id,
    required this.userId,
    required this.userName,
    this.userAvatarUrl,
    required this.rating,
    this.comment,
    required this.createdAt,
  });

  factory CourseReview.fromJson(Map<String, dynamic> json) {
    return CourseReview(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      userName: json['user_name'] as String,
      userAvatarUrl: json['user_avatar_url'] as String?,
      rating: (json['rating'] as num).toDouble(),
      comment: json['comment'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class CoursesFilter {
  final String? category;
  final CourseLevel? level;
  final String? search;
  final bool? isFree;
  final int page;
  final int limit;

  const CoursesFilter({
    this.category,
    this.level,
    this.search,
    this.isFree,
    this.page = 1,
    this.limit = 20,
  });

  Map<String, dynamic> toQueryParams() => {
        if (category != null) 'category': category,
        if (level != null) 'level': level!.name,
        if (search != null && search!.isNotEmpty) 'search': search,
        if (isFree != null) 'is_free': isFree.toString(),
        'page': page.toString(),
        'limit': limit.toString(),
      };

  CoursesFilter copyWith({
    String? category,
    CourseLevel? level,
    String? search,
    bool? isFree,
    int? page,
    int? limit,
    bool clearCategory = false,
    bool clearLevel = false,
  }) {
    return CoursesFilter(
      category: clearCategory ? null : (category ?? this.category),
      level: clearLevel ? null : (level ?? this.level),
      search: search ?? this.search,
      isFree: isFree ?? this.isFree,
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }
}
