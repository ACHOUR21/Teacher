import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MarketplaceScreen extends ConsumerStatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  ConsumerState<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends ConsumerState<MarketplaceScreen> {
  String _selectedCategory = 'All';
  String _searchQuery = '';

  static const _categories = ['All', 'Mathematics', 'Science', 'Languages', 'Arts', 'Technology', 'Business'];

  static const _courses = [
    _MarketCourse('c-1', 'Calculus Mastery', 'Dr. James Wilson', 'Mathematics', 4.9, 1240, 49.99, 'https://picsum.photos/seed/calc/400/200', false),
    _MarketCourse('c-2', 'Python for Beginners', 'Sarah Chen', 'Technology', 4.7, 3890, 0.0, 'https://picsum.photos/seed/py/400/200', false),
    _MarketCourse('c-3', 'Spanish in 30 Days', 'Maria Lopez', 'Languages', 4.8, 2150, 29.99, 'https://picsum.photos/seed/esp/400/200', false),
    _MarketCourse('c-4', 'Organic Chemistry', 'Prof. Kim', 'Science', 4.6, 890, 39.99, 'https://picsum.photos/seed/chem/400/200', false),
    _MarketCourse('c-5', 'Digital Marketing', 'Alex Turner', 'Business', 4.5, 1670, 19.99, 'https://picsum.photos/seed/mkt/400/200', true),
    _MarketCourse('c-6', 'Watercolor Basics', 'Emma Davis', 'Arts', 4.8, 540, 0.0, 'https://picsum.photos/seed/art/400/200', false),
  ];

  List<_MarketCourse> get _filtered => _courses.where((c) {
    final matchCat = _selectedCategory == 'All' || c.category == _selectedCategory;
    final matchSearch = _searchQuery.isEmpty || c.title.toLowerCase().contains(_searchQuery.toLowerCase()) || c.instructor.toLowerCase().contains(_searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Marketplace'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: TextField(
              onChanged: (v) => setState(() => _searchQuery = v),
              decoration: InputDecoration(
                hintText: 'Search courses...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final cat = _categories[i];
                final selected = cat == _selectedCategory;
                return FilterChip(
                  label: Text(cat),
                  selected: selected,
                  onSelected: (_) => setState(() => _selectedCategory = cat),
                  selectedColor: Theme.of(context).colorScheme.primary,
                  labelStyle: TextStyle(color: selected ? Colors.white : null),
                );
              },
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.72,
              ),
              itemCount: _filtered.length,
              itemBuilder: (context, i) => _CourseCard(course: _filtered[i]),
            ),
          ),
        ],
      ),
    );
  }
}

class _CourseCard extends StatelessWidget {
  final _MarketCourse course;
  const _CourseCard({required this.course});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Container(
                height: 100,
                color: Colors.primaries[course.title.length % Colors.primaries.length].withOpacity(0.3),
                child: Center(child: Text(_emoji(course.category), style: const TextStyle(fontSize: 40))),
              ),
              if (course.isBestseller)
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: Colors.orange, borderRadius: BorderRadius.circular(4)),
                    child: const Text('BESTSELLER', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ),
              if (course.price == 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(4)),
                    child: const Text('FREE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ),
            ],
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    course.title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(course.instructor, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 13, color: Colors.amber),
                      Text(' ${course.rating}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      Text(' (${course.reviewCount})', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                  const Spacer(),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 6)),
                      onPressed: () {},
                      child: Text(
                        course.price == 0 ? 'Enroll Free' : '\$${course.price.toStringAsFixed(2)}',
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

  String _emoji(String category) => switch (category) {
    'Mathematics' => '📐',
    'Science' => '🔬',
    'Languages' => '🌍',
    'Arts' => '🎨',
    'Technology' => '💻',
    'Business' => '📊',
    _ => '📚',
  };
}

class _MarketCourse {
  final String id;
  final String title;
  final String instructor;
  final String category;
  final double rating;
  final int reviewCount;
  final double price;
  final String thumbnailUrl;
  final bool isBestseller;

  const _MarketCourse(this.id, this.title, this.instructor, this.category, this.rating, this.reviewCount, this.price, this.thumbnailUrl, this.isBestseller);
}
