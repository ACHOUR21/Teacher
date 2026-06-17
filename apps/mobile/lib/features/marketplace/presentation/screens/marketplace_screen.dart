import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/api/endpoints.dart';

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

class _MarketCourse {
  final String id;
  final String title;
  final String instructorName;
  final String category;
  final double rating;
  final int studentCount;
  final double price;
  final String level;
  final bool isFree;

  const _MarketCourse({
    required this.id,
    required this.title,
    required this.instructorName,
    required this.category,
    required this.rating,
    required this.studentCount,
    required this.price,
    required this.level,
    required this.isFree,
  });

  factory _MarketCourse.fromJson(Map<String, dynamic> json) {
    final priceRaw = json['price'] ?? json['priceAmount'] ?? 0;
    final price = (priceRaw is num) ? priceRaw.toDouble() : double.tryParse('$priceRaw') ?? 0.0;
    final isFree = price == 0.0 || json['isFree'] == true;

    final instructor = json['instructor'];
    String instructorName = 'Instructor';
    if (instructor is Map<String, dynamic>) {
      instructorName = instructor['name'] as String? ??
          instructor['fullName'] as String? ??
          instructor['displayName'] as String? ??
          'Instructor';
    } else if (instructor is String) {
      instructorName = instructor;
    } else {
      instructorName = json['instructorName'] as String? ?? 'Instructor';
    }

    final rating = (json['rating'] ?? json['averageRating'] ?? 0);
    final ratingDouble = (rating is num) ? rating.toDouble() : 0.0;

    final students = json['studentCount'] ?? json['enrollments'] ?? json['enrollmentCount'] ?? 0;
    final studentCount = (students is num) ? students.toInt() : 0;

    final category = json['category'] is Map<String, dynamic>
        ? (json['category']['name'] as String? ?? 'General')
        : (json['category'] as String? ?? 'General');

    return _MarketCourse(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Untitled Course',
      instructorName: instructorName,
      category: category,
      rating: ratingDouble,
      studentCount: studentCount,
      price: price,
      level: json['level'] as String? ?? json['difficulty'] as String? ?? 'All Levels',
      isFree: isFree,
    );
  }
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final _marketplaceQueryProvider = StateProvider<_MarketplaceQuery>((ref) => const _MarketplaceQuery());

class _MarketplaceQuery {
  final String search;
  final String category;

  const _MarketplaceQuery({this.search = '', this.category = 'All'});

  _MarketplaceQuery copyWith({String? search, String? category}) =>
      _MarketplaceQuery(
        search: search ?? this.search,
        category: category ?? this.category,
      );
}

final _marketplaceCoursesProvider = FutureProvider.autoDispose<List<_MarketCourse>>((ref) async {
  final query = ref.watch(_marketplaceQueryProvider);

  const storage = FlutterSecureStorage();
  final token = await storage.read(key: 'access_token');

  final dio = Dio();
  final params = <String, dynamic>{};
  if (query.search.isNotEmpty) params['search'] = query.search;
  if (query.category != 'All') params['category'] = query.category;

  final response = await dio.get(
    '${Endpoints.baseUrl}${Endpoints.marketplaceCourses}',
    queryParameters: params.isEmpty ? null : params,
    options: Options(headers: {'Authorization': 'Bearer $token'}),
  );

  final data = response.data;
  List<dynamic> items = [];
  if (data is Map<String, dynamic>) {
    final inner = data['data'];
    if (inner is List) {
      items = inner;
    } else if (inner is Map<String, dynamic>) {
      final nested = inner['items'] ?? inner['courses'] ?? inner['data'];
      if (nested is List) items = nested;
    }
  } else if (data is List) {
    items = data;
  }

  return items
      .whereType<Map<String, dynamic>>()
      .map(_MarketCourse.fromJson)
      .toList();
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class MarketplaceScreen extends ConsumerStatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  ConsumerState<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends ConsumerState<MarketplaceScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;

  static const _categories = [
    'All',
    'Mathematics',
    'Science',
    'Technology',
    'Languages',
    'Arts',
  ];

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      ref.read(_marketplaceQueryProvider.notifier).update(
            (s) => s.copyWith(search: value),
          );
    });
  }

  void _onCategoryChanged(String category) {
    ref.read(_marketplaceQueryProvider.notifier).update(
          (s) => s.copyWith(category: category),
        );
  }

  Future<void> _refresh() async {
    ref.invalidate(_marketplaceCoursesProvider);
    await ref.read(_marketplaceCoursesProvider.future).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(_marketplaceQueryProvider);
    final coursesAsync = ref.watch(_marketplaceCoursesProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Marketplace'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Search courses...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Category filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final cat = _categories[i];
                final selected = cat == query.category;
                return FilterChip(
                  label: Text(cat),
                  selected: selected,
                  onSelected: (_) => _onCategoryChanged(cat),
                  selectedColor: Theme.of(context).colorScheme.primary,
                  labelStyle: TextStyle(
                    color: selected ? Colors.white : null,
                    fontSize: 13,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                );
              },
            ),
          ),

          // Course grid
          Expanded(
            child: coursesAsync.when(
              loading: () => _ShimmerGrid(),
              error: (e, _) => _ErrorRetry(
                message: e.toString(),
                onRetry: _refresh,
              ),
              data: (courses) {
                if (courses.isEmpty) {
                  return _EmptyState(
                    search: query.search,
                    category: query.category,
                  );
                }
                return RefreshIndicator(
                  onRefresh: _refresh,
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.68,
                    ),
                    itemCount: courses.length,
                    itemBuilder: (context, i) => _CourseCard(course: courses[i]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Course Card
// ---------------------------------------------------------------------------

class _CourseCard extends ConsumerWidget {
  final _MarketCourse course;
  const _CourseCard({required this.course});

  Future<void> _handleAction(BuildContext context, WidgetRef ref) async {
    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'access_token');
    final dio = Dio();

    try {
      if (course.isFree) {
        await dio.post(
          '${Endpoints.baseUrl}${Endpoints.courseEnroll(course.id)}',
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Enrolled in "${course.title}"'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        final res = await dio.post(
          '${Endpoints.baseUrl}${Endpoints.purchaseCourse(course.id)}',
          data: {'successUrl': null, 'cancelUrl': null},
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );
        final data = (res.data['data'] ?? res.data) as Map<String, dynamic>;
        if (data['requiresPayment'] == true && data['checkoutUrl'] != null) {
          final uri = Uri.tryParse(data['checkoutUrl'] as String);
          if (uri != null && context.mounted) {
            final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
            if (!launched && context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Could not open payment page'), backgroundColor: Colors.red),
              );
            }
          }
        } else if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Enrolled in "${course.title}"'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
      ref.invalidate(_marketplaceCoursesProvider);
    } on DioException catch (e) {
      if (context.mounted) {
        final msg = (e.response?.data is Map<String, dynamic>
                ? (e.response!.data as Map<String, dynamic>)['message']
                : null) ??
            'Action failed. Please try again.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$msg'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail / header
          Stack(
            children: [
              Container(
                height: 96,
                color: Colors
                    .primaries[course.title.length % Colors.primaries.length]
                    .withOpacity(0.25),
                child: Center(
                  child: Text(
                    _categoryEmoji(course.category),
                    style: const TextStyle(fontSize: 38),
                  ),
                ),
              ),
              // Level badge
              Positioned(
                bottom: 8,
                left: 8,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    course.level,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w500),
                  ),
                ),
              ),
              // FREE badge
              if (course.isFree)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'FREE',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
            ],
          ),

          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    course.title,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 12),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  // Instructor
                  Text(
                    course.instructorName,
                    style:
                        const TextStyle(fontSize: 11, color: Colors.grey),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  // Rating + students
                  Row(
                    children: [
                      const Icon(Icons.star_rounded,
                          size: 13, color: Colors.amber),
                      Text(
                        ' ${course.rating.toStringAsFixed(1)}',
                        style: const TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                      Text(
                        ' (${_formatCount(course.studentCount)})',
                        style: const TextStyle(
                            fontSize: 10, color: Colors.grey),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Action button
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 7),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () => _handleAction(context, ref),
                      child: Text(
                        course.isFree
                            ? 'Enroll Free'
                            : 'Buy \$${course.price.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _categoryEmoji(String category) => switch (category.toLowerCase()) {
        'mathematics' || 'math' || 'maths' => '\u{1F4D0}',
        'science' => '\u{1F52C}',
        'languages' || 'language' => '\u{1F310}',
        'arts' || 'art' => '\u{1F3A8}',
        'technology' || 'tech' || 'programming' || 'coding' => '\u{1F4BB}',
        'business' || 'finance' => '\u{1F4CA}',
        _ => '\u{1F4DA}',
      };

  String _formatCount(int count) {
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return '$count';
  }
}

// ---------------------------------------------------------------------------
// Shimmer placeholder grid
// ---------------------------------------------------------------------------

class _ShimmerGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.68,
        ),
        itemCount: 6,
        itemBuilder: (_, __) => Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

class _EmptyState extends StatelessWidget {
  final String search;
  final String category;

  const _EmptyState({required this.search, required this.category});

  @override
  Widget build(BuildContext context) {
    final hasFilter = search.isNotEmpty || category != 'All';
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off_rounded,
                size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              hasFilter ? 'No courses found' : 'No courses available',
              style: const TextStyle(
                  fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              hasFilter
                  ? 'Try adjusting your search or category filter.'
                  : 'Check back later for new courses.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Error + retry
// ---------------------------------------------------------------------------

class _ErrorRetry extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorRetry({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.cloud_off_rounded,
                size: 56, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            const Text(
              'Failed to load courses',
              style:
                  TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style:
                  TextStyle(fontSize: 12, color: Colors.grey.shade500),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
