import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/courses_provider.dart';

class CourseDetailScreen extends ConsumerWidget {
  final String courseId;
  const CourseDetailScreen({super.key, required this.courseId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final courseAsync = ref.watch(courseDetailProvider(courseId));

    return courseAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (course) {
        if (course == null) return const Scaffold(body: Center(child: Text('Course not found')));

        return Scaffold(
          body: CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 220,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(course.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  background: course.thumbnailUrl != null
                      ? Image.network(course.thumbnailUrl!, fit: BoxFit.cover)
                      : Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Colors.blue.shade700, Colors.purple.shade600],
                            ),
                          ),
                        ),
                ),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Stats Row
                      Row(
                        children: [
                          _Stat(icon: Icons.star, value: course.rating.toStringAsFixed(1), color: Colors.amber),
                          const SizedBox(width: 16),
                          _Stat(icon: Icons.people, value: '${course.enrollmentCount}', color: Colors.blue),
                          const SizedBox(width: 16),
                          _Stat(icon: Icons.bar_chart, value: course.level, color: Colors.purple),
                        ],
                      ),
                      const SizedBox(height: 16),

                      if (course.description != null) ...[
                        Text('About this course', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text(course.description!, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600, height: 1.6)),
                        const SizedBox(height: 16),
                      ],

                      if (course.tags.isNotEmpty) ...[
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: course.tags.map((tag) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(tag, style: TextStyle(fontSize: 11, color: Colors.blue.shade700)),
                          )).toList(),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
          bottomNavigationBar: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  course.price == 0 ? 'Enroll for Free' : 'Enroll · \$${course.price.toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String value;
  final Color color;
  const _Stat({required this.icon, required this.value, required this.color});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(width: 4),
      Text(value, style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
    ],
  );
}
