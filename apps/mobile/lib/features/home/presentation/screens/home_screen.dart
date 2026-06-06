import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {
  final Widget child;

  const HomeScreen({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/home/courses')) return 1;
    if (location.startsWith('/home/live')) return 2;
    if (location.startsWith('/home/ai-tutor') || location.startsWith('/home/ai-agents')) return 3;
    if (location.startsWith('/home/marketplace')) return 4;
    if (location.startsWith('/home/profile') ||
        location.startsWith('/home/notifications') ||
        location.startsWith('/home/settings') ||
        location.startsWith('/home/billing') ||
        location.startsWith('/home/gamification') ||
        location.startsWith('/home/messages')) return 5;
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0: context.go('/home/dashboard');
      case 1: context.go('/home/courses');
      case 2: context.go('/home/live');
      case 3: context.go('/home/ai-agents');
      case 4: context.go('/home/marketplace');
      case 5: context.go('/home/profile');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      drawer: _AppDrawer(),
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

class _AppDrawer extends StatelessWidget {
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
                child: const Text('JD', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 12),
              const Text('John Doe', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const Text('Student · Lincoln High', style: TextStyle(color: Colors.grey, fontSize: 13)),
            ],
          ),
        ),
        const Divider(),
        _drawerItem(context, Icons.dashboard_outlined, 'Dashboard', '/home/dashboard'),
        _drawerItem(context, Icons.menu_book_outlined, 'My Courses', '/home/courses'),
        _drawerItem(context, Icons.live_tv_outlined, 'Live Classes', '/home/live'),
        _drawerItem(context, Icons.smart_toy_outlined, 'AI Tutor', '/home/ai-tutor'),
        _drawerItem(context, Icons.psychology_outlined, 'AI Agents', '/home/ai-agents'),
        _drawerItem(context, Icons.store_outlined, 'Marketplace', '/home/marketplace'),
        _drawerItem(context, Icons.assignment_outlined, 'Assignments', '/home/assignments'),
        _drawerItem(context, Icons.workspace_premium_outlined, 'Certificates', '/home/certificates'),
        _drawerItem(context, Icons.emoji_events_outlined, 'Gamification', '/home/gamification'),
        _drawerItem(context, Icons.chat_outlined, 'Messages', '/home/messages'),
        _drawerItem(context, Icons.notifications_outlined, 'Notifications', '/home/notifications'),
        const Divider(),
        _drawerItem(context, Icons.credit_card_outlined, 'Billing', '/home/billing'),
        _drawerItem(context, Icons.settings_outlined, 'Settings', '/home/settings'),
        _drawerItem(context, Icons.person_outline, 'Profile', '/home/profile'),
      ],
    );
  }

  NavigationDrawerDestination _drawerItem(BuildContext context, IconData icon, String label, String path) {
    return NavigationDrawerDestination(
      icon: Icon(icon),
      label: Text(label),
    );
  }
}
