import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/data/auth_repository.dart';
import '../providers/auth_provider.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String? token;
  const ResetPasswordScreen({super.key, this.token});

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _loading = false;
  bool _done = false;
  bool _showPw = false;
  bool _showConfirm = false;
  String? _error;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  double get _strength {
    final pw = _passwordController.text;
    if (pw.length < 4) return 0;
    double score = 0;
    if (pw.length >= 8) score += 0.25;
    if (pw.length >= 12) score += 0.25;
    if (RegExp(r'[A-Z]').hasMatch(pw)) score += 0.25;
    if (RegExp(r'[0-9]').hasMatch(pw) && RegExp(r'[@$!%*?&]').hasMatch(pw)) score += 0.25;
    return score;
  }

  String get _strengthLabel {
    final s = _strength;
    if (s <= 0.25) return 'Weak';
    if (s <= 0.5) return 'Fair';
    if (s <= 0.75) return 'Good';
    return 'Strong';
  }

  Color get _strengthColor {
    final s = _strength;
    if (s <= 0.25) return Colors.red;
    if (s <= 0.5) return Colors.orange;
    if (s <= 0.75) return Colors.amber;
    return AppTheme.success;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final token = widget.token;
    if (token == null || token.isEmpty) {
      setState(() => _error = 'Invalid or missing reset token. Please request a new link.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.resetPassword(token: token, newPassword: _passwordController.text);
      if (mounted) setState(() => _done = true);
    } catch (e) {
      if (mounted) setState(() => _error = 'This reset link has expired or is invalid. Please request a new one.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (widget.token == null || widget.token!.isEmpty) {
      return _buildInvalidToken(theme);
    }

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: _done ? _buildSuccess(theme) : _buildForm(theme),
        ),
      ),
    );
  }

  Widget _buildInvalidToken(ThemeData theme) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(color: theme.colorScheme.errorContainer, shape: BoxShape.circle),
                child: Icon(Icons.link_off_rounded, size: 40, color: theme.colorScheme.error),
              ),
              const SizedBox(height: 24),
              Text('Invalid Reset Link', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Text('This link is missing or invalid. Please request a new password reset.', textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant, height: 1.5)),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity, height: 52,
                child: FilledButton(
                  onPressed: () => context.go('/forgot-password'),
                  child: const Text('Request New Link', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccess(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 48),
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(color: AppTheme.success.withOpacity(0.12), shape: BoxShape.circle),
          child: Icon(Icons.check_circle_outline_rounded, size: 44, color: AppTheme.success),
        ),
        const SizedBox(height: 24),
        Text('Password Updated!', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Text(
          'Your password has been reset successfully. You can now sign in with your new password.',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant, height: 1.5),
        ),
        const SizedBox(height: 40),
        SizedBox(
          width: double.infinity, height: 52,
          child: FilledButton(
            onPressed: () => context.go('/login'),
            child: const Text('Sign In Now', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ),
      ],
    );
  }

  Widget _buildForm(ThemeData theme) {
    final pw = _passwordController.text;

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: AppTheme.primaryLight.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(Icons.lock_outlined, size: 32, color: AppTheme.primaryLight),
          ),
          const SizedBox(height: 24),
          Text('Set New Password', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            'Choose a strong password you haven\'t used before.',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant, height: 1.5),
          ),
          const SizedBox(height: 32),

          // New password
          Text('New password', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          TextFormField(
            controller: _passwordController,
            obscureText: !_showPw,
            textInputAction: TextInputAction.next,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'Min. 8 characters',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(_showPw ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                onPressed: () => setState(() => _showPw = !_showPw),
              ),
              filled: true,
              fillColor: theme.colorScheme.surfaceContainerHighest.withOpacity(0.4),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: theme.colorScheme.primary, width: 1.5),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Password is required';
              if (v.length < 8) return 'Must be at least 8 characters';
              return null;
            },
          ),

          // Strength indicator
          if (pw.isNotEmpty) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: _strength,
                      backgroundColor: theme.colorScheme.surfaceContainerHighest,
                      valueColor: AlwaysStoppedAnimation(_strengthColor),
                      minHeight: 5,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(_strengthLabel, style: TextStyle(fontSize: 12, color: _strengthColor, fontWeight: FontWeight.w600)),
              ],
            ),
          ],

          const SizedBox(height: 20),

          // Confirm password
          Text('Confirm password', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          TextFormField(
            controller: _confirmController,
            obscureText: !_showConfirm,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _submit(),
            decoration: InputDecoration(
              hintText: 'Repeat new password',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(_showConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                onPressed: () => setState(() => _showConfirm = !_showConfirm),
              ),
              filled: true,
              fillColor: theme.colorScheme.surfaceContainerHighest.withOpacity(0.4),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: theme.colorScheme.primary, width: 1.5),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Please confirm your password';
              if (v != _passwordController.text) return 'Passwords don\'t match';
              return null;
            },
          ),

          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: theme.colorScheme.error, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!, style: TextStyle(color: theme.colorScheme.error, fontSize: 13))),
                ],
              ),
            ),
          ],

          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity, height: 52,
            child: FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                  : const Text('Reset Password', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
