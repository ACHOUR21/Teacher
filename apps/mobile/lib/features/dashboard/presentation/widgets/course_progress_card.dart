import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';

class CourseProgressCard extends StatelessWidget {
  final String courseId;
  final String title;
  final String instructor;
  final double progress;
  final String? thumbnailUrl;
  final String? nextLesson;
  final VoidCallback onTap;

  const CourseProgressCard({
    super.key,
    required this.courseId,
    required this.title,
    required this.instructor,
    required this.progress,
    this.thumbnailUrl,
    this.nextLesson,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final progressPercent = (progress * 100).toStringAsFixed(0);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 240,
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
            SizedBox(
              height: 120,
              child: thumbnailUrl != null
                  ? CachedNetworkImage(
                      imageUrl: thumbnailUrl!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      placeholder: (context, url) => Shimmer.fromColors(
                        baseColor: const Color(0xFFE2E8F0),
                        highlightColor: const Color(0xFFF8FAFC),
                        child: Container(color: Colors.white),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: colorScheme.primary.withOpacity(0.1),
                        child: Icon(
                          Icons.menu_book_rounded,
                          size: 40,
                          color: colorScheme.primary.withOpacity(0.5),
                        ),
                      ),
                    )
                  : Container(
                      color: colorScheme.primary.withOpacity(0.1),
                      child: Center(
                        child: Icon(
                          Icons.menu_book_rounded,
                          size: 40,
                          color: colorScheme.primary.withOpacity(0.5),
                        ),
                      ),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    instructor,
                    style: theme.textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progress,
                            backgroundColor: colorScheme.primary.withOpacity(0.12),
                            valueColor: AlwaysStoppedAnimation<Color>(
                              colorScheme.primary,
                            ),
                            minHeight: 6,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '$progressPercent%',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  if (nextLesson != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.play_circle_outline,
                          size: 14,
                          color: colorScheme.primary,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            'Next: $nextLesson',
                            style: TextStyle(
                              fontSize: 11,
                              color: colorScheme.primary,
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
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
}
