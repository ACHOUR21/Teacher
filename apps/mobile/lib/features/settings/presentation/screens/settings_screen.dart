import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/notifications/fcm_service.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool? _pushNotifications;
  bool _emailNotifications = true;
  bool _courseReminders = true;
  bool _marketingEmails = false;
  bool _darkMode = false;
  String _language = 'English';
  String _timezone = 'America/New_York';

  @override
  void initState() {
    super.initState();
    ref.read(pushPermissionProvider.future).then((granted) {
      if (mounted) setState(() => _pushNotifications = granted);
    });
  }

  Future<void> _togglePush(bool enable) async {
    setState(() => _pushNotifications = null); // loading
    final fcm = ref.read(fcmServiceProvider);
    if (enable) {
      final success = await fcm.registerToken();
      if (mounted) setState(() => _pushNotifications = success);
    } else {
      await fcm.unregisterToken();
      if (mounted) setState(() => _pushNotifications = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          _SectionHeader('Account'),
          _NavTile(
            icon: Icons.person_outline,
            title: 'Edit Profile',
            subtitle: 'Update your personal information',
            onTap: () {},
          ),
          _NavTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            onTap: () {},
          ),
          _NavTile(
            icon: Icons.security,
            title: 'Two-Factor Authentication',
            subtitle: 'Add an extra layer of security',
            onTap: () {},
          ),
          _NavTile(
            icon: Icons.devices,
            title: 'Active Sessions',
            subtitle: 'Manage devices logged in',
            onTap: () {},
          ),

          _SectionHeader('Notifications'),
          SwitchListTile(
            title: const Text('Push Notifications'),
            subtitle: const Text('Receive alerts on this device'),
            value: _pushNotifications ?? false,
            onChanged: _pushNotifications == null ? null : _togglePush,
            secondary: _pushNotifications == null
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.notifications_outlined),
          ),
          SwitchListTile(
            title: const Text('Email Notifications'),
            subtitle: const Text('Important updates via email'),
            value: _emailNotifications,
            onChanged: (v) => setState(() => _emailNotifications = v),
            secondary: const Icon(Icons.email_outlined),
          ),
          SwitchListTile(
            title: const Text('Course Reminders'),
            subtitle: const Text('Reminders for upcoming deadlines'),
            value: _courseReminders,
            onChanged: (v) => setState(() => _courseReminders = v),
            secondary: const Icon(Icons.alarm_outlined),
          ),
          SwitchListTile(
            title: const Text('Marketing Emails'),
            subtitle: const Text('News and promotional content'),
            value: _marketingEmails,
            onChanged: (v) => setState(() => _marketingEmails = v),
            secondary: const Icon(Icons.campaign_outlined),
          ),

          _SectionHeader('Appearance & Language'),
          SwitchListTile(
            title: const Text('Dark Mode'),
            value: _darkMode,
            onChanged: (v) => setState(() => _darkMode = v),
            secondary: const Icon(Icons.dark_mode_outlined),
          ),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('Language'),
            subtitle: Text(_language),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showPicker(
              title: 'Language',
              options: ['English', 'Spanish', 'French', 'Arabic', 'Chinese', 'Portuguese'],
              current: _language,
              onSelect: (v) => setState(() => _language = v),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.schedule),
            title: const Text('Timezone'),
            subtitle: Text(_timezone),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showPicker(
              title: 'Timezone',
              options: ['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Dubai'],
              current: _timezone,
              onSelect: (v) => setState(() => _timezone = v),
            ),
          ),

          _SectionHeader('Privacy & Data'),
          _NavTile(
            icon: Icons.download_outlined,
            title: 'Download My Data',
            subtitle: 'Export all your data (GDPR)',
            onTap: () {},
          ),
          _NavTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            onTap: () {},
          ),
          _NavTile(
            icon: Icons.description_outlined,
            title: 'Terms of Service',
            onTap: () {},
          ),

          _SectionHeader('Support'),
          _NavTile(
            icon: Icons.help_outline,
            title: 'Help Center',
            onTap: () {},
          ),
          _NavTile(
            icon: Icons.feedback_outlined,
            title: 'Send Feedback',
            onTap: () {},
          ),
          _NavTile(
            icon: Icons.info_outline,
            title: 'App Version',
            subtitle: '1.0.0 (build 42)',
            onTap: null,
          ),

          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
                minimumSize: const Size(double.infinity, 48),
              ),
              icon: const Icon(Icons.logout),
              label: const Text('Sign Out'),
              onPressed: () => _confirmSignOut(context),
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextButton(
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              onPressed: () => _confirmDeleteAccount(context),
              child: const Text('Delete Account'),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  void _showPicker({
    required String title,
    required List<String> options,
    required String current,
    required ValueChanged<String> onSelect,
  }) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
            const Divider(height: 1),
            ...options.map((opt) => ListTile(
              title: Text(opt),
              trailing: opt == current ? const Icon(Icons.check, color: Colors.blue) : null,
              onTap: () { onSelect(opt); Navigator.pop(ctx); },
            )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _confirmSignOut(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).signOut();
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteAccount(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text('This action is permanent and cannot be undone. All your data will be deleted.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 4),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey[600], letterSpacing: 1.2),
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  const _NavTile({required this.icon, required this.title, this.subtitle, this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: onTap != null ? const Icon(Icons.chevron_right, size: 20) : null,
      onTap: onTap,
    );
  }
}
