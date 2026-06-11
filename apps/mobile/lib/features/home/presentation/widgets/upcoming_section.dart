import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../dashboard/presentation/screens/dashboard_screen.dart';

/// Shows the next upcoming live sessions pulled from [upcomingSessionsProvider].
class UpcomingSection extends ConsumerWidget {
  const UpcomingSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(upcomingSessionsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Upcoming Sessions',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            TextButton(
              onPressed: () => context.go('/home/live'),
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        sessionsAsync.when(
          loading: () => Column(
            children: List.generate(2, (_) => _SessionItemSkeleton()),
          ),
          error: (_, __) => const SizedBox.shrink(),
          data: (sessions) {
            if (sessions.isEmpty) {
              return Card(
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor:
                        Theme.of(context).colorScheme.primaryContainer,
                    child: Icon(
                      Icons.check_circle_outline,
                      color: Colors.green.shade600,
                    ),
                  ),
                  title: const Text('No upcoming sessions'),
                  subtitle: const Text("You're all caught up!"),
                ),
              );
            }
            // Show at most 3 sessions
            final visible = sessions.take(3).toList();
            return Column(
              children: visible
                  .map((s) => _SessionItem(session: s))
                  .toList(),
            );
          },
        ),
      ],
    );
  }
}

class _SessionItem extends StatelessWidget {
  final UpcomingSession session;
  const _SessionItem({required this.session});

  String _timeLabel() {
    final diff = session.startsAt.difference(DateTime.now());
    if (diff.isNegative) return 'Live now';
    if (diff.inMinutes < 60) return 'In ${diff.inMinutes}m';
    if (diff.inHours < 24) {
      return 'In ${diff.inHours}h ${diff.inMinutes.remainder(60)}m';
    }
    return 'Tomorrow';
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLive = session.startsAt.isBefore(DateTime.now());

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: isLive
                ? Colors.red.shade50
                : colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            isLive ? Icons.live_tv_rounded : Icons.video_call_outlined,
            color: isLive ? Colors.red.shade600 : colorScheme.primary,
            size: 22,
          ),
        ),
        title: Text(
          session.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
        subtitle: Text(
          session.instructor,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: isLive
                    ? Colors.red.shade50
                    : colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _timeLabel(),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isLive ? Colors.red.shade600 : colorScheme.primary,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${session.participantCount} joined',
              style:
                  TextStyle(fontSize: 10, color: Colors.grey.shade400),
            ),
          ],
        ),
      ),
    );
  }
}

class _SessionItemSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        title: Container(
          height: 12,
          width: 140,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        subtitle: Container(
          height: 10,
          width: 80,
          margin: const EdgeInsets.only(top: 6),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }
}
