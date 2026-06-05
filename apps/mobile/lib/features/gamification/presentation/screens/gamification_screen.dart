import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class GamificationScreen extends ConsumerWidget {
  const GamificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: Colors.grey[50],
        body: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverAppBar(
              expandedHeight: 200,
              pinned: true,
              backgroundColor: Colors.deepPurple,
              flexibleSpace: FlexibleSpaceBar(
                background: _PointsHero(),
              ),
              bottom: const TabBar(
                indicatorColor: Colors.white,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white70,
                tabs: [
                  Tab(text: 'Overview'),
                  Tab(text: 'Leaderboard'),
                  Tab(text: 'Achievements'),
                ],
              ),
            ),
          ],
          body: const TabBarView(
            children: [
              _OverviewTab(),
              _LeaderboardTab(),
              _AchievementsTab(),
            ],
          ),
        ),
      ),
    );
  }
}

class _PointsHero extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF7B1FA2), Color(0xFF512DA8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 16),
            const Text('🏆', style: TextStyle(fontSize: 40)),
            const SizedBox(height: 8),
            const Text(
              '2,450 Points',
              style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const Text(
              'Rank #12 this week',
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionTitle('This Week'),
        const SizedBox(height: 8),
        Row(
          children: const [
            Expanded(child: _StatCard(label: 'Points Earned', value: '320', icon: '⭐')),
            SizedBox(width: 12),
            Expanded(child: _StatCard(label: 'Lessons Done', value: '8', icon: '📚')),
            SizedBox(width: 12),
            Expanded(child: _StatCard(label: 'Quiz Score', value: '88%', icon: '✅')),
          ],
        ),
        const SizedBox(height: 20),
        _SectionTitle('Recent Badges'),
        const SizedBox(height: 8),
        _BadgeRow(badge: '🔥', name: 'On Fire!', desc: '7-day streak'),
        _BadgeRow(badge: '🎯', name: 'Perfect Score', desc: 'Quiz 100%'),
        _BadgeRow(badge: '📖', name: 'Bookworm', desc: '50 lessons completed'),
      ],
    );
  }
}

class _LeaderboardTab extends StatelessWidget {
  const _LeaderboardTab();

  static const _entries = [
    ('Emma Wilson', 5420, '🥇'),
    ('James Chen', 4890, '🥈'),
    ('Aisha Rahman', 4310, '🥉'),
    ('Carlos Garcia', 3750, ''),
    ('Sophie Martin', 3200, ''),
    ('You', 2450, ''),
    ('Noah Johnson', 2100, ''),
    ('Mia Thompson', 1980, ''),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _entries.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, i) {
        final (name, points, medal) = _entries[i];
        final isMe = name == 'You';
        return Container(
          color: isMe ? Colors.deepPurple.withOpacity(0.08) : null,
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: isMe ? Colors.deepPurple : Colors.grey[200],
              child: Text(
                medal.isNotEmpty ? medal : '${i + 1}',
                style: TextStyle(
                  fontSize: medal.isNotEmpty ? 18 : 14,
                  fontWeight: FontWeight.bold,
                  color: isMe ? Colors.white : Colors.black87,
                ),
              ),
            ),
            title: Text(
              name,
              style: TextStyle(fontWeight: isMe ? FontWeight.bold : FontWeight.normal),
            ),
            trailing: Text(
              '$points pts',
              style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.deepPurple),
            ),
          ),
        );
      },
    );
  }
}

class _AchievementsTab extends StatelessWidget {
  const _AchievementsTab();

  static const _achievements = [
    ('🎓', 'First Course', 'Complete your first course', true),
    ('🔥', 'On Fire!', '7-day learning streak', true),
    ('💯', 'Perfect Score', 'Score 100% on any quiz', true),
    ('📚', 'Bookworm', 'Complete 50 lessons', false),
    ('🏆', 'Top 10', 'Reach top 10 on leaderboard', false),
    ('⚡', 'Speed Reader', 'Complete a course in one day', false),
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.9,
      ),
      itemCount: _achievements.length,
      itemBuilder: (context, i) {
        final (emoji, name, desc, earned) = _achievements[i];
        return Opacity(
          opacity: earned ? 1.0 : 0.45,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(emoji, style: const TextStyle(fontSize: 40)),
                  const SizedBox(height: 8),
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                  const SizedBox(height: 4),
                  Text(desc, style: const TextStyle(fontSize: 12, color: Colors.grey), textAlign: TextAlign.center),
                  if (earned) ...[
                    const SizedBox(height: 8),
                    const Chip(
                      label: Text('Earned', style: TextStyle(fontSize: 11)),
                      backgroundColor: Color(0xFFE8F5E9),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final String icon;

  const _StatCard({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _BadgeRow extends StatelessWidget {
  final String badge;
  final String name;
  final String desc;

  const _BadgeRow({required this.badge, required this.name, required this.desc});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Text(badge, style: const TextStyle(fontSize: 32)),
      title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(desc),
      contentPadding: EdgeInsets.zero,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold));
  }
}
