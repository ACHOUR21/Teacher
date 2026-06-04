import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/models/course.dart';

class CourseCard extends StatelessWidget {
  final Course course;
  final VoidCallback onTap;

  const CourseCard({
    super.key,
    required this.course,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.dividerColor, width: 1),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  course.thumbnailUrl != null
                      ? CachedNetworkImage(
                          imageUrl: course.thumbnailUrl!,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Shimmer.fromColors(
                            baseColor: const Color(0xFFE2E8F0),
                            highlightColor: const Color(0xFFF8FAFC),
                            child: Container(color: Colors.white),
                          ),
                          errorWidget: (context, url, error) => _PlaceholderThumbnail(),
                        )
                      : _PlaceholderThumbnail(),
                  // Level badge
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getLevelColor(course.level).withOpacity(0.9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        course.levelLabel,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  // Duration badge
                  Positioned(
                    bottom: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.access_time,
                            size: 10,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            course.durationLabel,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category chip
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      course.category,
                      style: TextStyle(
                        fontSize: 10,
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Title
                  Text(
                    course.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),

                  // Instructor
                  Row(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 12,
                        color: theme.textTheme.bodySmall?.color,
                      ),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          course.instructorName,
                          style: theme.textTheme.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Rating + enrollments + price
                  Row(
                    children: [
                      Icon(
                        Icons.star_rounded,
                        size: 14,
                        color: AppTheme.warning,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        course.rating.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.warning,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '(${course.reviewCount})',
                        style: theme.textTheme.labelSmall,
                      ),
                      const Spacer(),
                      Text(
                        course.isFree
                            ? 'Free'
                            : '\$${course.price.toStringAsFixed(2)}',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: course.isFree
                              ? AppTheme.success
                              : colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  if (course.isEnrolled && course.progress != null) ...[
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: course.progress!,
                        backgroundColor: colorScheme.primary.withOpacity(0.12),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          colorScheme.primary,
                        ),
                        minHeight: 4,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getLevelColor(CourseLevel level) {
    switch (level) {
      case CourseLevel.beginner:
        return AppTheme.success;
      case CourseLevel.intermediate:
        return AppTheme.warning;
      case CourseLevel.advanced:
        return AppTheme.error;
    }
  }
}

class _PlaceholderThumbnail extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Theme.of(context).colorScheme.primary.withOpacity(0.08),
      child: Center(
        child: Icon(
          Icons.menu_book_rounded,
          size: 36,
          color: Theme.of(context).colorScheme.primary.withOpacity(0.4),
        ),
      ),
    );
  }
}
