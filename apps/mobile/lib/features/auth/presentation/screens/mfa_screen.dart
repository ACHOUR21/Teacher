import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/custom_button.dart';
import '../providers/auth_provider.dart';

class MFAScreen extends ConsumerStatefulWidget {
  const MFAScreen({super.key});

  @override
  ConsumerState<MFAScreen> createState() => _MFAScreenState();
}

class _MFAScreenState extends ConsumerState<MFAScreen> {
  final List<TextEditingController> _controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes =
      List.generate(6, (_) => FocusNode());

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _otpCode => _controllers.map((c) => c.text).join();

  bool get _isComplete => _otpCode.length == 6 && !_otpCode.contains('');

  Future<void> _verify() async {
    if (!_isComplete) return;
    await ref.read(authProvider.notifier).verifyMfa(code: _otpCode);
  }

  void _onChanged(int index, String value) {
    if (value.length > 1) {
      // Handle paste
      final digits = value.replaceAll(RegExp(r'\D'), '');
      for (int i = 0; i < digits.length && i + index < 6; i++) {
        _controllers[index + i].text = digits[i];
      }
      final nextIndex = (index + digits.length).clamp(0, 5);
      _focusNodes[nextIndex].requestFocus();
    } else if (value.isNotEmpty) {
      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        _verify();
      }
    }
    setState(() {});
  }

  void _onKeyEvent(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _focusNodes[index - 1].requestFocus();
      _controllers[index - 1].clear();
      setState(() {});
    }
  }

  void _clearAll() {
    for (final c in _controllers) {
      c.clear();
    }
    _focusNodes[0].requestFocus();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authProvider);

    ref.listen(authProvider, (prev, next) {
      if (next.error != null && next.error != prev?.error) {
        _clearAll();
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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),
              IconButton(
                onPressed: () => context.go('/login'),
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                padding: EdgeInsets.zero,
              ),
              const SizedBox(height: 32),

              Center(
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryLight.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(
                        Icons.verified_user_outlined,
                        size: 44,
                        color: AppTheme.primaryLight,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Two-Factor Authentication',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Enter the 6-digit code from your authenticator app',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.textTheme.bodySmall?.color,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // OTP input
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return _OTPBox(
                    controller: _controllers[index],
                    focusNode: _focusNodes[index],
                    onChanged: (v) => _onChanged(index, v),
                    onKeyEvent: (event) => _onKeyEvent(index, event),
                  );
                }),
              ),
              const SizedBox(height: 40),

              CustomButton(
                label: 'Verify',
                onPressed: _isComplete ? _verify : null,
                isLoading: authState.isLoading,
              ),
              const SizedBox(height: 20),

              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "Didn't receive the code? ",
                      style: theme.textTheme.bodyMedium,
                    ),
                    TextButton(
                      onPressed: () {
                        // Resend logic
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Verification code resent'),
                          ),
                        );
                      },
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Resend',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OTPBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final ValueChanged<KeyEvent> onKeyEvent;

  const _OTPBox({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
    required this.onKeyEvent,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return SizedBox(
      width: 46,
      height: 56,
      child: KeyboardListener(
        focusNode: FocusNode(),
        onKeyEvent: onKeyEvent,
        child: TextFormField(
          controller: controller,
          focusNode: focusNode,
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          maxLength: 2,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: onChanged,
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w700,
            color: colorScheme.primary,
          ),
          decoration: InputDecoration(
            counterText: '',
            filled: true,
            fillColor: controller.text.isNotEmpty
                ? colorScheme.primary.withOpacity(0.08)
                : theme.inputDecorationTheme.fillColor,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: controller.text.isNotEmpty
                    ? colorScheme.primary
                    : theme.dividerColor,
                width: controller.text.isNotEmpty ? 2 : 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: colorScheme.primary,
                width: 2,
              ),
            ),
            contentPadding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}
