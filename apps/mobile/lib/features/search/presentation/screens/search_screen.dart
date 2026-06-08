import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

final searchQueryProvider = StateProvider<String>((ref) => '');

final searchResultsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, query) async {
  if (query.trim().isEmpty) return {'courses': [], 'users': []};
  final client = ref.watch(apiClientProvider);
  final response = await client.get('/search', queryParameters: {'q': query, 'limit': '20'});
  final data = response.data;
  if (data is Map && data['data'] != null) return Map<String, dynamic>.from(data['data'] as Map);
  return {'courses': [], 'users': []};
});

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> with SingleTickerProviderStateMixin {
  final _controller = TextEditingController();
  late TabController _tabController;
  String _activeQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _controller.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _search(String q) {
    setState(() => _activeQuery = q.trim());
  }

  @override
  Widget build(BuildContext context) {
    final resultsAsync = _activeQuery.isEmpty
        ? null
        : ref.watch(searchResultsProvider(_activeQuery));

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Search courses, people...',
            border: InputBorder.none,
            suffixIcon: _controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _controller.clear();
                      setState(() => _activeQuery = '');
                    },
                  )
                : null,
          ),
          onSubmitted: _search,
          textInputAction: TextInputAction.search,
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [Tab(text: 'Courses'), Tab(text: 'People')],
        ),
      ),
      body: _activeQuery.isEmpty
          ? _buildEmptyState()
          : resultsAsync!.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Search failed: $e')),
              data: (results) => TabBarView(
                controller: _tabController,
                children: [
                  _buildCourseResults(results['courses'] as List? ?? []),
                  _buildPeopleResults(results['users'] as List? ?? []),
                ],
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search, size: 72, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text('Search for courses or people', style: TextStyle(color: Colors.grey.shade500, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildCourseResults(List results) {
    if (results.isEmpty) return _buildNoResults('courses');
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: results.length,
      itemBuilder: (ctx, i) {
        final course = results[i] as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            leading: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Colors.blue.shade50,
              ),
              child: Icon(Icons.book_outlined, color: Colors.blue.shade400),
            ),
            title: Text(course['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(course['category'] ?? course['level'] ?? '', style: TextStyle(color: Colors.grey.shade600)),
            trailing: course['price'] != null
                ? Text(
                    (course['price'] as num) == 0 ? 'Free' : '\$${course['price']}',
                    style: TextStyle(color: Colors.blue.shade700, fontWeight: FontWeight.bold),
                  )
                : null,
          ),
        );
      },
    );
  }

  Widget _buildPeopleResults(List results) {
    if (results.isEmpty) return _buildNoResults('people');
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: results.length,
      itemBuilder: (ctx, i) {
        final user = results[i] as Map<String, dynamic>;
        final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
        final initials = name.isNotEmpty ? name.split(' ').take(2).map((s) => s.isNotEmpty ? s[0] : '').join().toUpperCase() : '?';
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.purple.shade100,
              child: Text(initials, style: TextStyle(color: Colors.purple.shade800, fontWeight: FontWeight.bold)),
            ),
            title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text((user['role'] as String? ?? '').replaceAll('_', ' ').toLowerCase(), style: TextStyle(color: Colors.grey.shade500)),
          ),
        );
      },
    );
  }

  Widget _buildNoResults(String type) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 48, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          Text('No $type found for "$_activeQuery"', style: TextStyle(color: Colors.grey.shade500)),
        ],
      ),
    );
  }
}
