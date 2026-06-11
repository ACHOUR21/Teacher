import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../courses/domain/models/course.dart';
import '../../../courses/presentation/providers/courses_provider.dart';

/// Horizontal scrolling list of recently accessed / enrolled courses.
/// Uses [enrolledCoursesProvider] which returns courses the user is enrolled in.
class RecentCoursesSection extends ConsumerWidget {
  const RecentCoursesSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(enrolledCoursesProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'My Courses',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            TextButton(
              onPressed: () => context.go('/home/courses'),
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        coursesAsync.when(
          loading: () => SizedBox(
            height: 160,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 3,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, __) => _CourseCardSkeleton(),
            ),
          ),
          error: (e, _) => Center(
            child: Text(
              'Could not load courses',
              style: TextStyle(color: Colors.grey.shade500),
            ),
          ),
          data: (courses) {
            if (courses.isEmpty) {
              return _EmptyCourses(
                onBrowse: () => context.go('/home/marketplace'),
              );
            }
            return SizedBox(
              height: 160,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: courses.take(6).length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) =>
                    _CourseCard(course: courses[index]),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _CourseCard extends StatelessWidget {
  final Course course;
  const _CourseCard({required this.course});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final progress = course.progress ?? 0.0;

    return GestureDetector(
      onTap: () => context.go('/home/courses/${course.id}'),
      child: Container(
        width: 200,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: colorScheme.primaryContainer,
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: colorScheme.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.book_rounded,
                    color: colorScheme.primary,
                    size: 20,
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    course.levelLabel,
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.primary,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              course.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress / 100,
                minHeight: 4,
                backgroundColor: colorScheme.primary.withOpacity(0.15),
                valueColor: AlwaysStoppedAnimation<Color>(colorScheme.primary),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${progress.toStringAsFixed(0)}% complete',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCourses extends StatelessWidget {
  final VoidCallback onBrowse;
  const _EmptyCourses({required this.onBrowse});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.school_outlined, size: 48, color: Colors.grey.shade300),
          const SizedBox(height: 8),
          Text(
            'No courses yet',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: Colors.grey.shade500),
          ),
          const SizedBox(height: 4),
          TextButton(
            onPressed: onBrowse,
            child: const Text('Browse Courses'),
          ),
        ],
      ),
    );
  }
}

class _CourseCardSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 200,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.grey.shade100,
      ),
    );
  }
}
