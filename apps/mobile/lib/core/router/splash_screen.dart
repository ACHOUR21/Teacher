import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primaryLight,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.school_rounded,
                size: 56,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'EduAI Ultimate',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'AI-Powered Education',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.8),
                fontWeight: FontWeight.w400,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(
              color: Colors.white,
              strokeWidth: 2.5,
            ),
          ],
        ),
      ),
    );
  }
}
