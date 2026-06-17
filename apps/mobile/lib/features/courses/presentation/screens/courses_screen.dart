import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/courses_provider.dart';
import '../widgets/course_card.dart';

class CoursesScreen extends ConsumerStatefulWidget {
  const CoursesScreen({super.key});

  @override
  ConsumerState<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends ConsumerState<CoursesScreen> {
  final _searchController = TextEditingController();
  String _selectedLevel = 'All';

  static const _levels = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final coursesAsync = ref.watch(coursesProvider(CoursesQuery(
      search: _searchController.text.isEmpty ? null : _searchController.text,
      level: _selectedLevel == 'All' ? null : _selectedLevel,
    )));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Courses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => showSearch(context: context, delegate: _CourseSearchDelegate()),
          ),
        ],
      ),
      body: Column(
        children: [
          // Level Filter
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _levels.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) => FilterChip(
                label: Text(_levels[i], style: const TextStyle(fontSize: 12)),
                selected: _selectedLevel == _levels[i],
                onSelected: (_) => setState(() => _selectedLevel = _levels[i]),
                selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.15),
                checkmarkColor: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),

          // Courses Grid
          Expanded(
            child: coursesAsync.when(
              data: (courses) => courses.isEmpty
                  ? const Center(child: Text('No courses found', style: TextStyle(color: Colors.grey)))
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.75,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: courses.length,
                      itemBuilder: (_, i) => CourseCard(
                        course: courses[i],
                        onTap: () => context.push('/courses/${courses[i].id}'),
                      ),
                    ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.red))),
            ),
          ),
        ],
      ),
    );
  }
}

class _CourseSearchDelegate extends SearchDelegate<String> {
  @override
  List<Widget>? buildActions(BuildContext context) => [
    IconButton(icon: const Icon(Icons.clear), onPressed: () => query = ''),
  ];

  @override
  Widget? buildLeading(BuildContext context) =>
      IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => close(context, ''));

  @override
  Widget buildResults(BuildContext context) => const Center(child: Text('Search results'));

  @override
  Widget buildSuggestions(BuildContext context) => const Center(child: Text('Type to search courses'));
}
