import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/custom_button.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  bool _forgotPasswordLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
  }

  Future<void> _forgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter your email address first'),
        ),
      );
      return;
    }

    setState(() => _forgotPasswordLoading = true);
    try {
      await ref.read(authProvider.notifier).forgotPassword(email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Password reset email sent to $email'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _forgotPasswordLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authProvider);

    ref.listen(authProvider, (prev, next) {
      if (next.error != null && next.error != prev?.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: theme.colorScheme.error,
          ),
        );
        ref.read(authProvider.notifier).clearError();
      }
    });

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 48),
                // Logo + Title
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryLight,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.school_rounded,
                          size: 40,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Welcome Back',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Sign in to continue learning',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.textTheme.bodySmall?.color,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),

                // Email field
                CustomTextField(
                  controller: _emailController,
                  focusNode: _emailFocus,
                  label: 'Email',
                  hint: 'Enter your email',
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.email_outlined, size: 20),
                  onChanged: (_) {},
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Email is required';
                    }
                    if (!RegExp(r'^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$')
                        .hasMatch(value.trim())) {
                      return 'Enter a valid email address';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password field
                CustomTextField(
                  controller: _passwordController,
                  focusNode: _passwordFocus,
                  label: 'Password',
                  hint: 'Enter your password',
                  isPassword: true,
                  textInputAction: TextInputAction.done,
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Password is required';
                    }
                    if (value.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                // Forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _forgotPasswordLoading ? null : _forgotPassword,
                    child: _forgotPasswordLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Forgot Password?'),
                  ),
                ),
                const SizedBox(height: 24),

                // Login button
                CustomButton(
                  label: 'Sign In',
                  onPressed: _login,
                  isLoading: authState.isLoading,
                ),
                const SizedBox(height: 24),

                // Divider
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'or continue with',
                        style: theme.textTheme.bodySmall,
                      ),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 24),

                // Social buttons
                SocialButton(
                  label: 'Continue with Google',
                  icon: _GoogleIcon(),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Google sign-in coming soon'),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                SocialButton(
                  label: 'Continue with Apple',
                  icon: const Icon(Icons.apple, size: 20),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Apple sign-in coming soon'),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 32),

                // Register link
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        "Don't have an account? ",
                        style: theme.textTheme.bodyMedium,
                      ),
                      TextButton(
                        onPressed: () => context.go('/register'),
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Sign Up',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: const Size(20, 20),
      painter: _GoogleLogoPainter(),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    // Simplified Google icon as colored circles
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(
      Rect.fromLTWH(0, 0, size.width, size.height),
      -1.57,
      3.14,
      false,
      paint..style = PaintingStyle.stroke
        ..strokeWidth = size.width * 0.18
        ..color = const Color(0xFF4285F4),
    );
    paint.style = PaintingStyle.fill;
    // Draw simplified 'G' shape using colored blocks
    paint.color = const Color(0xFF4285F4);
    canvas.drawRect(
      Rect.fromLTWH(size.width * 0.5, size.height * 0.3, size.width * 0.5, size.height * 0.2),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
