import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _loading = false;
  bool _submitted = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).forgotPassword(_emailController.text.trim());
      if (mounted) setState(() => _submitted = true);
    } catch (e) {
      // Always show success to prevent email enumeration
      if (mounted) setState(() => _submitted = true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: _submitted ? _buildSuccess(theme) : _buildForm(theme),
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
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppTheme.success.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.mark_email_read_outlined, size: 40, color: AppTheme.success),
        ),
        const SizedBox(height: 24),
        Text('Check your email', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Text(
          'If an account exists for ${_emailController.text.trim()}, we\'ve sent a password reset link.',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant, height: 1.5),
        ),
        const SizedBox(height: 8),
        Text(
          'Didn\'t receive it? Check your spam folder or try again.',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 40),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: () => context.go('/login'),
            child: const Text('Back to Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => setState(() { _submitted = false; _emailController.clear(); }),
          child: const Text('Try a different email'),
        ),
      ],
    );
  }

  Widget _buildForm(ThemeData theme) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          // Icon
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppTheme.primaryLight.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(Icons.lock_reset_rounded, size: 34, color: AppTheme.primaryLight),
          ),
          const SizedBox(height: 24),
          Text(
            'Forgot Password?',
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'No worries — enter your email and we\'ll send you reset instructions.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 36),
          // Email field
          Text('Email address', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autocorrect: false,
            onFieldSubmitted: (_) => _submit(),
            decoration: InputDecoration(
              hintText: 'you@school.edu',
              prefixIcon: const Icon(Icons.email_outlined),
              filled: true,
              fillColor: theme.colorScheme.surfaceContainerHighest.withOpacity(0.4),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: theme.colorScheme.primary, width: 1.5),
              ),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Email is required';
              final emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+$');
              if (!emailRegex.hasMatch(v.trim())) return 'Enter a valid email address';
              return null;
            },
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                    )
                  : const Text('Send Reset Link', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 24),
          Center(
            child: TextButton.icon(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back_ios_rounded, size: 14),
              label: const Text('Back to Sign In'),
            ),
          ),
        ],
      ),
    );
  }
}
