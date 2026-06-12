import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// A card showing a course with a progress bar and a "Continue" button.
///
/// Used in the home screen's "Continue Learning" horizontal scroll list.
class HomeCourseProgressCard extends StatelessWidget {
  final String courseId;
  final String title;
  final double progressPercent; // 0.0 – 1.0
  final String? coverImageUrl;
  final VoidCallback onContinue;

  const HomeCourseProgressCard({
    super.key,
    required this.courseId,
    required this.title,
    required this.progressPercent,
    this.coverImageUrl,
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final percentText =
        '${(progressPercent * 100).toStringAsFixed(0)}%';

    return Container(
      width: 200,
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.dividerColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover image / placeholder
          SizedBox(
            height: 110,
            width: double.infinity,
            child: coverImageUrl != null && coverImageUrl!.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: coverImageUrl!,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _ColorPlaceholder(colorScheme),
                  )
                : _ColorPlaceholder(colorScheme),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 10),

                // Progress bar + percentage
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progressPercent.clamp(0.0, 1.0),
                          minHeight: 6,
                          backgroundColor:
                              colorScheme.primary.withOpacity(0.12),
                          valueColor: AlwaysStoppedAnimation<Color>(
                              colorScheme.primary),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      percentText,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.primary,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // Continue button
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: onContinue,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      textStyle: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text('Continue'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ColorPlaceholder extends StatelessWidget {
  final ColorScheme colorScheme;
  const _ColorPlaceholder(this.colorScheme);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: colorScheme.primary.withOpacity(0.1),
      child: Center(
        child: Icon(
          Icons.menu_book_rounded,
          size: 36,
          color: colorScheme.primary.withOpacity(0.4),
        ),
      ),
    );
  }
}
