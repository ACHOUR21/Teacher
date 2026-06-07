import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/endpoints.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final _studentMeProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio.get('${Endpoints.baseUrl}/students/me');
  final body = response.data;
  if (body is Map<String, dynamic>) {
    final inner = body['data'];
    if (inner is Map<String, dynamic>) return inner;
  }
  return body as Map<String, dynamic>;
});

final _timetableProvider =
    FutureProvider.autoDispose.family<List<dynamic>, String>((ref, classId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.dio
      .get('${Endpoints.baseUrl}/school-erp/classes/$classId/timetable');
  final body = response.data;
  if (body is Map<String, dynamic>) {
    final data = body['data'];
    if (data is List) return data;
  }
  if (body is List) return body;
  return [];
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class TimetableScreen extends ConsumerStatefulWidget {
  const TimetableScreen({super.key});

  @override
  ConsumerState<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends ConsumerState<TimetableScreen> {
  // weekday: 1 = Monday … 5 = Friday (clamped to school week)
  late int _selectedDay;

  static const _dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  @override
  void initState() {
    super.initState();
    final today = DateTime.now().weekday; // 1=Mon, 7=Sun
    // Default to today if it is a school day, otherwise Monday
    _selectedDay = (today >= 1 && today <= 5) ? today : 1;
  }

  @override
  Widget build(BuildContext context) {
    final studentAsync = ref.watch(_studentMeProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Class Timetable'),
        elevation: 0,
      ),
      body: studentAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorRetry(
          message: e.toString(),
          onRetry: () => ref.invalidate(_studentMeProvider),
        ),
        data: (student) {
          final classId = (student['classId'] ?? student['class_id'] ?? '') as String;
          if (classId.isEmpty) {
            return const _NoClassState();
          }
          return Column(
            children: [
              _DayTabBar(
                selectedDay: _selectedDay,
                onDaySelected: (day) => setState(() => _selectedDay = day),
                dayLabels: _dayLabels,
              ),
              Expanded(
                child: _TimetableBody(
                  classId: classId,
                  selectedDay: _selectedDay,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Day Tab Bar
// ---------------------------------------------------------------------------

class _DayTabBar extends StatelessWidget {
  final int selectedDay; // 1-5
  final ValueChanged<int> onDaySelected;
  final List<String> dayLabels;

  const _DayTabBar({
    required this.selectedDay,
    required this.onDaySelected,
    required this.dayLabels,
  });

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now().weekday;
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      color: colorScheme.surface,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: List.generate(5, (i) {
            final day = i + 1; // 1=Mon
            final isSelected = day == selectedDay;
            final isToday = day == today;

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: GestureDetector(
                onTap: () => onDaySelected(day),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? colorScheme.primary
                        : isToday
                            ? colorScheme.primaryContainer
                            : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(24),
                    border: isToday && !isSelected
                        ? Border.all(color: colorScheme.primary, width: 1.5)
                        : null,
                  ),
                  child: Text(
                    dayLabels[i],
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? colorScheme.onPrimary
                          : isToday
                              ? colorScheme.primary
                              : Colors.grey.shade700,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Timetable body (fetches by classId)
// ---------------------------------------------------------------------------

class _TimetableBody extends ConsumerWidget {
  final String classId;
  final int selectedDay;

  const _TimetableBody({required this.classId, required this.selectedDay});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timetableAsync = ref.watch(_timetableProvider(classId));

    return timetableAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(
        message: e.toString(),
        onRetry: () => ref.invalidate(_timetableProvider(classId)),
      ),
      data: (entries) {
        // Filter by selected day and sort by startTime
        final dayEntries = entries
            .whereType<Map<String, dynamic>>()
            .where((e) {
              final dow = e['dayOfWeek'];
              return dow != null && int.tryParse(dow.toString()) == selectedDay;
            })
            .toList()
          ..sort((a, b) {
            final aTime = (a['startTime'] as String? ?? '');
            final bTime = (b['startTime'] as String? ?? '');
            return aTime.compareTo(bTime);
          });

        if (dayEntries.isEmpty) {
          return const _EmptyDayState();
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(_timetableProvider(classId)),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            itemCount: dayEntries.length,
            itemBuilder: (_, i) => _TimetableCard(entry: dayEntries[i]),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Timetable Entry Card
// ---------------------------------------------------------------------------

class _TimetableCard extends StatelessWidget {
  final Map<String, dynamic> entry;

  const _TimetableCard({required this.entry});

  @override
  Widget build(BuildContext context) {
    final startTime = entry['startTime'] as String? ?? '--:--';
    final endTime = entry['endTime'] as String? ?? '--:--';
    final room = entry['room'] as String?;
    final subjectId = entry['subjectId'] as String?;
    final teacherId = entry['teacherId'] as String?;

    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Time column
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    startTime,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Icon(Icons.arrow_downward, size: 12, color: colorScheme.onPrimaryContainer),
                  const SizedBox(height: 2),
                  Text(
                    endTime,
                    style: TextStyle(
                      fontSize: 13,
                      color: colorScheme.onPrimaryContainer.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            // Details column
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$startTime – $endTime',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (subjectId != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.book_outlined,
                            size: 14, color: Colors.grey.shade500),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            'Subject: $subjectId',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (room != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.meeting_room_outlined,
                            size: 14, color: Colors.grey.shade500),
                        const SizedBox(width: 4),
                        Text(
                          'Room $room',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (teacherId != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.person_outline,
                            size: 14, color: Colors.grey.shade500),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            'Teacher: $teacherId',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
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

// ---------------------------------------------------------------------------
// Empty day state
// ---------------------------------------------------------------------------

class _EmptyDayState extends StatelessWidget {
  const _EmptyDayState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.calendar_today_outlined,
              size: 48,
              color: Colors.grey.shade300,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No classes today',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Enjoy your free time!',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.grey.shade500, fontSize: 13, height: 1.5),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// No class assigned state
// ---------------------------------------------------------------------------

class _NoClassState extends StatelessWidget {
  const _NoClassState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.school_outlined, size: 56, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            'No class assigned',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Contact your school admin to be assigned to a class.',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.grey.shade500, fontSize: 13, height: 1.5),
            maxLines: 2,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Error + Retry
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
            Icon(Icons.error_outline_rounded,
                size: 56, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            const Text(
              'Failed to load timetable',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
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
