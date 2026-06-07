import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/api/endpoints.dart';

final _profileProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final res = await apiClient.dio.get('${Endpoints.baseUrl}/users/me');
  return res.data['data'] as Map<String, dynamic>;
});

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _uploadingAvatar = false;

  Future<void> _pickAndUploadAvatar() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from Gallery'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Take a Photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;

    final picked = await picker.pickImage(source: source, maxWidth: 512, imageQuality: 85);
    if (picked == null) return;

    setState(() => _uploadingAvatar = true);
    try {
      final apiClient = ref.read(apiClientProvider);
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(picked.path, filename: 'avatar.jpg'),
        'folder': 'avatars',
      });
      final uploadRes = await apiClient.dio.post(
        '${Endpoints.baseUrl}/storage/upload',
        data: formData,
      );
      final avatarUrl = ((uploadRes.data['data'] ?? uploadRes.data) as Map<String, dynamic>)['url'] as String?;
      if (avatarUrl != null) {
        await apiClient.dio.patch('${Endpoints.baseUrl}/users/me', data: {'avatarUrl': avatarUrl});
        ref.invalidate(_profileProvider);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Avatar upload failed. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(_profileProvider);

    return Scaffold(
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => _ProfileBody(user: null, ref: ref, onAvatarTap: _pickAndUploadAvatar, uploadingAvatar: _uploadingAvatar),
        data: (profile) => _ProfileBody(user: profile, ref: ref, onAvatarTap: _pickAndUploadAvatar, uploadingAvatar: _uploadingAvatar),
      ),
    );
  }
}

class _ProfileBody extends ConsumerWidget {
  final Map<String, dynamic>? user;
  final WidgetRef ref;
  final VoidCallback onAvatarTap;
  final bool uploadingAvatar;
  const _ProfileBody({required this.user, required this.ref, required this.onAvatarTap, required this.uploadingAvatar});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final firstName = user?['firstName'] as String? ?? 'User';
    final lastName = user?['lastName'] as String? ?? '';
    final email = user?['email'] as String? ?? '';
    final role = user?['role'] as String? ?? 'STUDENT';
    final avatarUrl = user?['profile']?['avatarUrl'] as String?;

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 200,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Colors.blue.shade700, Colors.purple.shade600],
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 20),
                    _Avatar(
                      avatarUrl: avatarUrl,
                      firstName: firstName,
                      lastName: lastName,
                      onTap: onAvatarTap,
                      uploading: uploadingAvatar,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '$firstName $lastName',
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(role, style: const TextStyle(color: Colors.white, fontSize: 11)),
                    ),
                  ],
                ),
              ),
            ),
          ),
          title: const Text('Profile'),
          actions: [
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => context.push('/profile/edit'),
            ),
          ],
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Stats Row
                if (user != null) ...[
                  Row(
                    children: [
                      _StatCard(
                        label: 'Courses',
                        value: '${user?['_count']?['courseProgress'] ?? 0}',
                        icon: Icons.book_outlined,
                        color: Colors.blue,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        label: 'Points',
                        value: '${user?['points']?['total'] ?? 0}',
                        icon: Icons.star_outlined,
                        color: Colors.amber,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        label: 'Certs',
                        value: '${user?['_count']?['certificates'] ?? 0}',
                        icon: Icons.workspace_premium_outlined,
                        color: Colors.purple,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],

                // Account Info
                _SectionHeader('Account Information'),
                const SizedBox(height: 8),
                _InfoCard(items: [
                  _InfoItem(icon: Icons.email_outlined, label: 'Email', value: email),
                  _InfoItem(icon: Icons.person_outlined, label: 'Username', value: user?['username'] ?? '—'),
                  _InfoItem(
                    icon: Icons.calendar_today_outlined,
                    label: 'Member since',
                    value: user?['createdAt'] != null
                        ? _formatDate(user!['createdAt'] as String)
                        : '—',
                  ),
                ]),

                const SizedBox(height: 20),

                // Settings
                _SectionHeader('Settings'),
                const SizedBox(height: 8),
                _MenuCard(items: [
                  _MenuItem(
                    icon: Icons.notifications_outlined,
                    label: 'Notifications',
                    onTap: () => context.push('/notifications'),
                  ),
                  _MenuItem(
                    icon: Icons.security_outlined,
                    label: 'Security & Privacy',
                    onTap: () {},
                  ),
                  _MenuItem(
                    icon: Icons.language_outlined,
                    label: 'Language',
                    trailing: 'English',
                    onTap: () {},
                  ),
                  _MenuItem(
                    icon: Icons.dark_mode_outlined,
                    label: 'Dark Mode',
                    onTap: () {},
                  ),
                ]),

                const SizedBox(height: 20),

                // Danger Zone
                _MenuCard(items: [
                  _MenuItem(
                    icon: Icons.logout,
                    label: 'Sign Out',
                    color: Colors.red.shade600,
                    onTap: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: const Text('Sign Out'),
                          content: const Text('Are you sure you want to sign out?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                            TextButton(
                              onPressed: () => Navigator.pop(context, true),
                              child: Text('Sign Out', style: TextStyle(color: Colors.red.shade600)),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true) {
                        ref.read(authProvider.notifier).logout();
                        if (context.mounted) context.go('/login');
                      }
                    },
                  ),
                ]),

                const SizedBox(height: 32),
                Center(
                  child: Text(
                    'EduAI Ultimate v1.0.0',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _formatDate(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '—';
    return '${_monthName(dt.month)} ${dt.day}, ${dt.year}';
  }

  String _monthName(int m) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
}

class _Avatar extends StatelessWidget {
  final String? avatarUrl;
  final String firstName;
  final String lastName;
  final VoidCallback onTap;
  final bool uploading;
  const _Avatar({
    this.avatarUrl,
    required this.firstName,
    required this.lastName,
    required this.onTap,
    required this.uploading,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: uploading ? null : onTap,
      child: Stack(
        children: [
          if (avatarUrl != null)
            CircleAvatar(radius: 40, backgroundImage: NetworkImage(avatarUrl!))
          else
            CircleAvatar(
              radius: 40,
              backgroundColor: Colors.white.withOpacity(0.3),
              child: Text(
                '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}',
                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              ),
            ),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 4)],
              ),
              child: uploading
                  ? const Padding(
                      padding: EdgeInsets.all(4),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.camera_alt, size: 14, color: Colors.grey),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
        ],
      ),
    ),
  );
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);
  @override
  Widget build(BuildContext context) => Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 0.5));
}

class _InfoItem {
  final IconData icon;
  final String label;
  final String value;
  const _InfoItem({required this.icon, required this.label, required this.value});
}

class _InfoCard extends StatelessWidget {
  final List<_InfoItem> items;
  const _InfoCard({required this.items});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.grey.shade100),
    ),
    child: Column(
      children: items.asMap().entries.map((entry) {
        final i = entry.key;
        final item = entry.value;
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(item.icon, size: 18, color: Colors.grey.shade500),
                  const SizedBox(width: 12),
                  Text(item.label, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                  const Spacer(),
                  Text(item.value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            if (i < items.length - 1) Divider(height: 1, color: Colors.grey.shade100),
          ],
        );
      }).toList(),
    ),
  );
}

class _MenuItem {
  final IconData icon;
  final String label;
  final String? trailing;
  final Color? color;
  final VoidCallback onTap;
  const _MenuItem({required this.icon, required this.label, this.trailing, this.color, required this.onTap});
}

class _MenuCard extends StatelessWidget {
  final List<_MenuItem> items;
  const _MenuCard({required this.items});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.grey.shade100),
    ),
    child: Column(
      children: items.asMap().entries.map((entry) {
        final i = entry.key;
        final item = entry.value;
        return Column(
          children: [
            InkWell(
              onTap: item.onTap,
              borderRadius: BorderRadius.vertical(
                top: i == 0 ? const Radius.circular(12) : Radius.zero,
                bottom: i == items.length - 1 ? const Radius.circular(12) : Radius.zero,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Icon(item.icon, size: 18, color: item.color ?? Colors.grey.shade600),
                    const SizedBox(width: 12),
                    Text(item.label, style: TextStyle(fontSize: 14, color: item.color ?? Colors.grey.shade800)),
                    const Spacer(),
                    if (item.trailing != null)
                      Text(item.trailing!, style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
                    const SizedBox(width: 4),
                    Icon(Icons.chevron_right, size: 16, color: Colors.grey.shade400),
                  ],
                ),
              ),
            ),
            if (i < items.length - 1) Divider(height: 1, color: Colors.grey.shade100),
          ],
        );
      }).toList(),
    ),
  );
}
