import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../providers/home_provider.dart';
import '../widgets/course_progress_card.dart';

/// Main shell screen that wraps every tab with a [BottomNavigationBar] and a
/// side [Drawer].
///
/// The [child] widget is the currently active route, injected by the
/// [ShellRoute] in `app_router.dart`.
class HomeScreen extends StatelessWidget {
  final Widget child;

  const HomeScreen({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/home/courses')) return 1;
    if (location.startsWith('/home/live')) return 2;
    if (location.startsWith('/home/ai-tutor') ||
        location.startsWith('/home/ai-agents')) return 3;
    if (location.startsWith('/home/marketplace')) return 4;
    if (location.startsWith('/home/profile') ||
        location.startsWith('/home/notifications') ||
        location.startsWith('/home/settings') ||
        location.startsWith('/home/billing') ||
        location.startsWith('/home/gamification') ||
        location.startsWith('/home/messages') ||
        location.startsWith('/home/timetable')) return 5;
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/home/dashboard');
        break;
      case 1:
        context.go('/home/courses');
        break;
      case 2:
        context.go('/home/live');
        break;
      case 3:
        context.go('/home/ai-agents');
        break;
      case 4:
        context.go('/home/marketplace');
        break;
      case 5:
        context.go('/home/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      drawer: const _AppDrawer(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex(context),
        onDestinationSelected: (index) => _onTap(context, index),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.menu_book_outlined),
            selectedIcon: Icon(Icons.menu_book),
            label: 'Courses',
          ),
          NavigationDestination(
            icon: Icon(Icons.live_tv_outlined),
            selectedIcon: Icon(Icons.live_tv),
            label: 'Live',
          ),
          NavigationDestination(
            icon: Icon(Icons.smart_toy_outlined),
            selectedIcon: Icon(Icons.smart_toy),
            label: 'AI',
          ),
          NavigationDestination(
            icon: Icon(Icons.store_outlined),
            selectedIcon: Icon(Icons.store),
            label: 'Market',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// App Drawer
// ---------------------------------------------------------------------------

class _AppDrawer extends StatelessWidget {
  const _AppDrawer();

  @override
  Widget build(BuildContext context) {
    return NavigationDrawer(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 28, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: Theme.of(context).colorScheme.primary,
                child: const Text(
                  'JD',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'John Doe',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const Text(
                'Student · Lincoln High',
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
            ],
          ),
        ),
        const Divider(),
        _drawerItem(context, Icons.dashboard_outlined, 'Dashboard',
            '/home/dashboard'),
        _drawerItem(
            context, Icons.menu_book_outlined, 'My Courses', '/home/courses'),
        _drawerItem(
            context, Icons.live_tv_outlined, 'Live Classes', '/home/live'),
        _drawerItem(
            context, Icons.smart_toy_outlined, 'AI Tutor', '/home/ai-tutor'),
        _drawerItem(context, Icons.psychology_outlined, 'AI Agents',
            '/home/ai-agents'),
        _drawerItem(context, Icons.store_outlined, 'Marketplace',
            '/home/marketplace'),
        _drawerItem(context, Icons.assignment_outlined, 'Assignments',
            '/home/assignments'),
        _drawerItem(context, Icons.workspace_premium_outlined, 'Certificates',
            '/home/certificates'),
        _drawerItem(context, Icons.emoji_events_outlined, 'Gamification',
            '/home/gamification'),
        _drawerItem(
            context, Icons.chat_outlined, 'Messages', '/home/messages'),
        _drawerItem(context, Icons.notifications_outlined, 'Notifications',
            '/home/notifications'),
        _drawerItem(
            context, Icons.style_outlined, 'Flashcards', '/home/flashcards'),
        _drawerItem(context, Icons.calendar_month_outlined, 'Timetable',
            '/home/timetable'),
        const Divider(),
        _drawerItem(
            context, Icons.credit_card_outlined, 'Billing', '/home/billing'),
        _drawerItem(
            context, Icons.settings_outlined, 'Settings', '/home/settings'),
        _drawerItem(
            context, Icons.person_outline, 'Profile', '/home/profile'),
      ],
    );
  }

  NavigationDrawerDestination _drawerItem(
    BuildContext context,
    IconData icon,
    String label,
    String path,
  ) {
    return NavigationDrawerDestination(
      icon: Icon(icon),
      label: Text(label),
    );
  }
}

// ---------------------------------------------------------------------------
// Home Overview Screen
//
// Shown at /home/dashboard as a rich "home" experience.
// The DashboardScreen still exists for backward compat; this new
// HomeOverviewScreen is the Phase 7d screen wired up separately.
// ---------------------------------------------------------------------------

/// Greeting + streak + continue learning + daily goals + AI recommendations
/// + quick actions + recent achievements.
class HomeOverviewScreen extends ConsumerWidget {
  const HomeOverviewScreen({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final user = ref.watch(currentUserProvider);
    final userId = user?.id ?? 'me';
    final homeAsync = ref.watch(homeDataProvider(userId));

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'EduAI',
          style: theme.textTheme.titleLarge
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            onPressed: () => context.go('/home/notifications'),
            icon: const Icon(Icons.notifications_outlined),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: homeAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline,
                  size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 12),
              const Text('Could not load home data'),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => ref.invalidate(homeDataProvider(userId)),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (home) => RefreshIndicator(
          onRefresh: () async =>
              ref.invalidate(homeDataProvider(userId)),
          child: ListView(
            padding: const EdgeInsets.only(bottom: 32),
            children: [
              // --- Greeting + Streak ---
              _GreetingSection(
                greeting: _greeting(),
                userName: home.userName,
                streak: home.streak,
                colorScheme: colorScheme,
              ),

              const SizedBox(height: 24),

              // --- Continue Learning ---
              _SectionHeader(
                title: 'Continue Learning',
                onSeeAll: () => context.go('/home/courses'),
              ),
              const SizedBox(height: 12),
              if (home.inProgressCourses.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'No courses in progress yet.',
                    style: TextStyle(color: Colors.grey.shade500),
                  ),
                )
              else
                SizedBox(
                  height: 260,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: home.inProgressCourses.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, i) {
                      final course = home.inProgressCourses[i];
                      return HomeCourseProgressCard(
                        courseId: course.id,
                        title: course.title,
                        progressPercent: course.progressPercent,
                        coverImageUrl: course.coverImageUrl,
                        onContinue: () =>
                            context.go('/home/courses/${course.id}'),
                      );
                    },
                  ),
                ),

              const SizedBox(height: 28),

              // --- Daily Goals ---
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: _DailyGoalsCard(),
              ),

              const SizedBox(height: 28),

              // --- Quick Actions ---
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _QuickActionsRow(colorScheme: colorScheme),
              ),

              const SizedBox(height: 28),

              // --- AI Recommendations ---
              const _SectionHeader(title: 'AI Recommendations'),
              const SizedBox(height: 12),
              const _AIRecommendationsSection(),

              const SizedBox(height: 28),

              // --- Recent Achievements ---
              if (home.recentAchievements.isNotEmpty) ...[
                _SectionHeader(
                  title: 'Recent Achievements',
                  onSeeAll: () => context.go('/home/gamification'),
                ),
                const SizedBox(height: 12),
                _RecentAchievements(
                    achievements: home.recentAchievements),
                const SizedBox(height: 8),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Greeting Section
// ---------------------------------------------------------------------------

class _GreetingSection extends StatelessWidget {
  final String greeting;
  final String userName;
  final int streak;
  final ColorScheme colorScheme;

  const _GreetingSection({
    required this.greeting,
    required this.userName,
    required this.streak,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            colorScheme.primary,
            colorScheme.primary.withOpacity(0.75),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$greeting,',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withOpacity(0.85),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  userName,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          // Streak badge
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: Colors.white.withOpacity(0.3), width: 1),
            ),
            child: Column(
              children: [
                const Text('\u{1F525}',
                    style: TextStyle(fontSize: 22)),
                const SizedBox(height: 2),
                Text(
                  '$streak',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                Text(
                  'day streak',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Daily Goals Card
// ---------------------------------------------------------------------------

class _DailyGoalsCard extends StatefulWidget {
  const _DailyGoalsCard();

  @override
  State<_DailyGoalsCard> createState() => _DailyGoalsCardState();
}

class _DailyGoalsCardState extends State<_DailyGoalsCard> {
  bool _lessonDone = false;
  bool _flashcardsDone = false;
  bool _liveSessionDone = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final completed =
        (_lessonDone ? 1 : 0) + (_flashcardsDone ? 1 : 0) + (_liveSessionDone ? 1 : 0);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.dividerColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('\u{1F3AF}',
                    style: TextStyle(fontSize: 18)),
                const SizedBox(width: 8),
                Text(
                  'Daily Goals',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                const Spacer(),
                Text(
                  '$completed / 3',
                  style: TextStyle(
                    fontSize: 12,
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _GoalTile(
              label: 'Complete 1 lesson',
              done: _lessonDone,
              onChanged: (v) => setState(() => _lessonDone = v),
            ),
            _GoalTile(
              label: 'Review flashcards',
              done: _flashcardsDone,
              onChanged: (v) => setState(() => _flashcardsDone = v),
            ),
            _GoalTile(
              label: 'Attend live session',
              done: _liveSessionDone,
              onChanged: (v) => setState(() => _liveSessionDone = v),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoalTile extends StatelessWidget {
  final String label;
  final bool done;
  final ValueChanged<bool> onChanged;

  const _GoalTile({
    required this.label,
    required this.done,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Checkbox(
          value: done,
          onChanged: (v) => onChanged(v ?? false),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            decoration: done ? TextDecoration.lineThrough : null,
            color: done ? Colors.grey : null,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Quick Actions Row
// ---------------------------------------------------------------------------

class _QuickActionsRow extends StatelessWidget {
  final ColorScheme colorScheme;

  const _QuickActionsRow({required this.colorScheme});

  @override
  Widget build(BuildContext context) {
    final actions = [
      _QuickAction(
        icon: Icons.style_outlined,
        label: 'Flashcards',
        color: Colors.deepPurple,
        route: '/home/flashcards',
      ),
      _QuickAction(
        icon: Icons.smart_toy_outlined,
        label: 'AI Tutor',
        color: Colors.blue,
        route: '/home/ai-tutor',
      ),
      _QuickAction(
        icon: Icons.live_tv_outlined,
        label: 'Live',
        color: Colors.red,
        route: '/home/live',
      ),
      _QuickAction(
        icon: Icons.menu_book_outlined,
        label: 'My Courses',
        color: Colors.teal,
        route: '/home/courses',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context)
              .textTheme
              .titleSmall
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: actions
              .map((a) => _QuickActionButton(action: a))
              .toList(),
        ),
      ],
    );
  }
}

class _QuickAction {
  final IconData icon;
  final String label;
  final Color color;
  final String route;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.route,
  });
}

class _QuickActionButton extends StatelessWidget {
  final _QuickAction action;
  const _QuickActionButton({required this.action});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go(action.route),
      child: Column(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: action.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(action.icon, color: action.color, size: 26),
          ),
          const SizedBox(height: 6),
          Text(
            action.label,
            style: const TextStyle(
                fontSize: 11, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// AI Recommendations Section (inline, reuses dashboard provider pattern)
// ---------------------------------------------------------------------------

class _AIRecommendationsSection extends ConsumerWidget {
  const _AIRecommendationsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiClient = ref.watch(apiClientProvider);
    // Simple inline future — no shared provider needed here.
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: apiClient.dio
          .get('/dashboard/recommendations?limit=3')
          .then((r) {
        final data = r.data;
        List<dynamic> items = [];
        if (data is List) {
          items = data;
        } else if (data is Map<String, dynamic>) {
          final inner = data['data'];
          if (inner is List) items = inner;
        }
        return items.whereType<Map<String, dynamic>>().toList();
      }).catchError((_) => <Map<String, dynamic>>[]),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: LinearProgressIndicator(),
          );
        }
        final recs = snapshot.data ?? [];
        if (recs.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'No recommendations yet.',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            ),
          );
        }
        return Column(
          children: recs.take(3).map((r) {
            final title = r['title']?.toString() ?? 'Course';
            final reason = r['reason']?.toString() ?? '';
            final category = r['category']?.toString() ?? '';
            final id = r['id']?.toString() ?? '';
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: _RecommendationTile(
                title: title,
                reason: reason,
                category: category,
                onTap: () => context
                    .go(id.isNotEmpty ? '/home/courses/$id' : '/home/courses'),
              ),
            );
          }).toList(),
        );
      },
    );
  }
}

class _RecommendationTile extends StatelessWidget {
  final String title;
  final String reason;
  final String category;
  final VoidCallback onTap;

  const _RecommendationTile({
    required this.title,
    required this.reason,
    required this.category,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.dividerColor),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    theme.colorScheme.primary,
                    theme.colorScheme.secondary,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.auto_awesome,
                  color: Colors.white, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (reason.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      reason,
                      style: theme.textTheme.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (category.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        category,
                        style: TextStyle(
                          fontSize: 10,
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Recent Achievements
// ---------------------------------------------------------------------------

class _RecentAchievements extends StatelessWidget {
  final List<dynamic> achievements;

  const _RecentAchievements({required this.achievements});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 110,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: achievements.length.clamp(0, 3),
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final a = achievements[i];
          final name = a is Map ? (a['name'] ?? a['title'] ?? 'Badge') : 'Badge';
          final icon = a is Map ? (a['icon'] ?? '\u{1F3C6}') : '\u{1F3C6}';
          return _AchievementChip(name: name.toString(), icon: icon.toString());
        },
      ),
    );
  }
}

class _AchievementChip extends StatelessWidget {
  final String name;
  final String icon;

  const _AchievementChip({required this.name, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border:
            Border.all(color: Colors.amber.withOpacity(0.3), width: 1),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(icon, style: const TextStyle(fontSize: 28)),
          const SizedBox(height: 6),
          Text(
            name,
            style: const TextStyle(
                fontSize: 11, fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Section header helper
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;

  const _SectionHeader({required this.title, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Text(
            title,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const Spacer(),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              child: const Text('See All'),
            ),
        ],
      ),
    );
  }
}
