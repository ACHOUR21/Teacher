import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

final _dioProvider = Provider((ref) => Dio());

final _lessonProvider = FutureProvider.family<Map<String, dynamic>?, (String, String)>((ref, ids) async {
  final dio = ref.read(_dioProvider);
  final res = await dio.get('/courses/${ids.$1}/lessons/${ids.$2}');
  return res.data['data'] as Map<String, dynamic>?;
});

class LessonScreen extends ConsumerStatefulWidget {
  final String courseId;
  final String lessonId;
  const LessonScreen({super.key, required this.courseId, required this.lessonId});

  @override
  ConsumerState<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends ConsumerState<LessonScreen> {
  bool _completed = false;

  Future<void> _markComplete(Dio dio) async {
    try {
      await dio.post('/courses/${widget.courseId}/lessons/${widget.lessonId}/progress', data: {'completed': true});
      if (mounted) setState(() => _completed = true);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final lessonAsync = ref.watch(_lessonProvider((widget.courseId, widget.lessonId)));
    final dio = ref.read(_dioProvider);

    return lessonAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (lesson) {
        if (lesson == null) {
          return const Scaffold(body: Center(child: Text('Lesson not found')));
        }
        return Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            title: Text(lesson['title'] ?? 'Lesson', style: const TextStyle(fontSize: 15)),
            actions: [
              if (!_completed)
                TextButton(
                  onPressed: () => _markComplete(dio),
                  child: const Text('Mark Done', style: TextStyle(color: Colors.greenAccent)),
                )
              else
                const Padding(
                  padding: EdgeInsets.only(right: 12),
                  child: Icon(Icons.check_circle, color: Colors.greenAccent),
                ),
            ],
          ),
          body: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Video placeholder
                if (lesson['videoUrl'] != null)
                  Container(
                    height: 220,
                    color: Colors.grey.shade900,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.play_circle_outline, size: 64, color: Colors.white.withOpacity(0.8)),
                          const SizedBox(height: 8),
                          Text('Video Lesson', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13)),
                        ],
                      ),
                    ),
                  )
                else
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [Colors.blue.shade800, Colors.purple.shade700]),
                    ),
                    child: Center(
                      child: Icon(
                        lesson['type'] == 'QUIZ' ? Icons.quiz_outlined : Icons.article_outlined,
                        size: 48,
                        color: Colors.white,
                      ),
                    ),
                  ),

                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _TypeChip(type: lesson['type'] ?? 'LESSON'),
                          const SizedBox(width: 8),
                          if (lesson['duration'] != null)
                            Text('${lesson['duration']} min', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        lesson['title'] ?? '',
                        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      if (lesson['description'] != null) ...[
                        const SizedBox(height: 8),
                        Text(lesson['description'], style: TextStyle(color: Colors.grey.shade300, fontSize: 14, height: 1.6)),
                      ],
                      if (lesson['content'] != null) ...[
                        const SizedBox(height: 16),
                        const Divider(color: Colors.grey),
                        const SizedBox(height: 16),
                        Text(
                          lesson['content'],
                          style: TextStyle(color: Colors.grey.shade200, fontSize: 14, height: 1.8),
                        ),
                      ],
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ],
            ),
          ),
          floatingActionButton: !_completed
              ? FloatingActionButton.extended(
                  onPressed: () => _markComplete(dio),
                  icon: const Icon(Icons.check),
                  label: const Text('Complete Lesson'),
                  backgroundColor: Colors.green,
                )
              : null,
        );
      },
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String type;
  const _TypeChip({required this.type});

  @override
  Widget build(BuildContext context) {
    final color = type == 'VIDEO'
        ? Colors.blue
        : type == 'QUIZ'
            ? Colors.orange
            : Colors.purple;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
      child: Text(type, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}
