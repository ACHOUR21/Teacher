import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/api/endpoints.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

final _assignmentsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final res = await apiClient.dio.get('${Endpoints.baseUrl}/assignments/my');
  final data = res.data['data'];
  return (data is Map ? data['items'] ?? data['data'] ?? [] : data) as List;
});

class AssignmentsScreen extends ConsumerStatefulWidget {
  const AssignmentsScreen({super.key});

  @override
  ConsumerState<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends ConsumerState<AssignmentsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final assignmentsAsync = ref.watch(_assignmentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Assignments'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Pending'),
            Tab(text: 'Submitted'),
            Tab(text: 'Graded'),
          ],
        ),
      ),
      body: assignmentsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (assignments) {
          final pending = assignments.where((a) => a['status'] == 'PENDING' || a['status'] == 'LATE').toList();
          final submitted = assignments.where((a) => a['status'] == 'SUBMITTED').toList();
          final graded = assignments.where((a) => a['status'] == 'GRADED').toList();

          return TabBarView(
            controller: _tabController,
            children: [
              _AssignmentList(assignments: pending, emptyMessage: 'No pending assignments', isPending: true, onRefresh: () async => ref.invalidate(_assignmentsProvider)),
              _AssignmentList(assignments: submitted, emptyMessage: 'No submitted assignments', onRefresh: () async => ref.invalidate(_assignmentsProvider)),
              _AssignmentList(assignments: graded, emptyMessage: 'No graded assignments', onRefresh: () async => ref.invalidate(_assignmentsProvider)),
            ],
          );
        },
      ),
    );
  }
}

class _AssignmentList extends ConsumerWidget {
  final List<dynamic> assignments;
  final String emptyMessage;
  final bool isPending;
  final Future<void> Function() onRefresh;

  const _AssignmentList({
    required this.assignments,
    required this.emptyMessage,
    this.isPending = false,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (assignments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_outlined, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(emptyMessage, style: TextStyle(color: Colors.grey.shade500)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: assignments.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, i) => _AssignmentCard(assignment: assignments[i], isPending: isPending),
      ),
    );
  }
}

class _AssignmentCard extends ConsumerStatefulWidget {
  final Map<String, dynamic> assignment;
  final bool isPending;
  const _AssignmentCard({required this.assignment, this.isPending = false});

  @override
  ConsumerState<_AssignmentCard> createState() => _AssignmentCardState();
}

class _AssignmentCardState extends ConsumerState<_AssignmentCard> {
  bool _submitting = false;

  Future<void> _submit() async {
    final textController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Submit Assignment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Submit your work for: ${widget.assignment['title']}'),
            const SizedBox(height: 12),
            TextField(
              controller: textController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Your answer / submission notes',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Submit')),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _submitting = true);
      try {
        final apiClient = ref.read(apiClientProvider);
        await apiClient.dio.post('${Endpoints.baseUrl}/assignments/${widget.assignment['id']}/submit', data: {
          'content': textController.text,
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Assignment submitted successfully!'), backgroundColor: Colors.green),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to submit: $e'), backgroundColor: Colors.red),
          );
        }
      } finally {
        if (mounted) setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.assignment;
    final dueDate = a['dueDate'] != null ? DateTime.tryParse(a['dueDate'].toString()) : null;
    final isLate = a['status'] == 'LATE';
    final statusColor = a['status'] == 'GRADED'
        ? Colors.green
        : a['status'] == 'SUBMITTED'
            ? Colors.blue
            : isLate
                ? Colors.red
                : Colors.orange;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(a['title'] ?? 'Assignment', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: statusColor.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                  child: Text(a['status'] ?? '', style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            if (a['description'] != null) ...[
              const SizedBox(height: 6),
              Text(a['description'], maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                if (dueDate != null) ...[
                  Icon(Icons.calendar_today_outlined, size: 13, color: isLate ? Colors.red : Colors.grey.shade500),
                  const SizedBox(width: 4),
                  Text(
                    'Due ${DateFormat('MMM d, y').format(dueDate)}',
                    style: TextStyle(fontSize: 12, color: isLate ? Colors.red : Colors.grey.shade600, fontWeight: isLate ? FontWeight.w600 : null),
                  ),
                ],
                if (a['maxScore'] != null) ...[
                  const SizedBox(width: 12),
                  Icon(Icons.star_outline, size: 13, color: Colors.grey.shade500),
                  const SizedBox(width: 4),
                  Text('${a['maxScore']} pts', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                ],
                if (a['score'] != null) ...[
                  const SizedBox(width: 12),
                  Text('Score: ${a['score']}/${a['maxScore']}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.green)),
                ],
              ],
            ),
            if (widget.isPending) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: _submitting
                      ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Submit Assignment'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
