import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  static const Color primaryLight = Color(0xFF2563EB);
  static const Color primaryDark = Color(0xFF3B82F6);
  static const Color secondary = Color(0xFF7C3AED);
  static const Color secondaryLight = Color(0xFF8B5CF6);
  static const Color error = Color(0xFFDC2626);
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFD97706);

  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color backgroundDark = Color(0xFF0F172A);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1E293B);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF1E293B);

  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);

  static TextTheme _buildTextTheme(Color primaryColor, Color secondaryColor) {
    return TextTheme(
      displayLarge: GoogleFonts.inter(
        fontSize: 57,
        fontWeight: FontWeight.w400,
        color: primaryColor,
        letterSpacing: -0.25,
      ),
      displayMedium: GoogleFonts.inter(
        fontSize: 45,
        fontWeight: FontWeight.w400,
        color: primaryColor,
      ),
      displaySmall: GoogleFonts.inter(
        fontSize: 36,
        fontWeight: FontWeight.w400,
        color: primaryColor,
      ),
      headlineLarge: GoogleFonts.inter(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        color: primaryColor,
      ),
      headlineMedium: GoogleFonts.inter(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        color: primaryColor,
      ),
      headlineSmall: GoogleFonts.inter(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: primaryColor,
      ),
      titleLarge: GoogleFonts.inter(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: primaryColor,
      ),
      titleMedium: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: primaryColor,
        letterSpacing: 0.15,
      ),
      titleSmall: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: primaryColor,
        letterSpacing: 0.1,
      ),
      bodyLarge: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: primaryColor,
        letterSpacing: 0.5,
      ),
      bodyMedium: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: primaryColor,
        letterSpacing: 0.25,
      ),
      bodySmall: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: secondaryColor,
        letterSpacing: 0.4,
      ),
      labelLarge: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: primaryColor,
        letterSpacing: 0.1,
      ),
      labelMedium: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: primaryColor,
        letterSpacing: 0.5,
      ),
      labelSmall: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: secondaryColor,
        letterSpacing: 0.5,
      ),
    );
  }

  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryLight,
      brightness: Brightness.light,
      primary: primaryLight,
      secondary: secondary,
      error: error,
      surface: surfaceLight,
      surfaceContainerHighest: backgroundLight,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: Brightness.light,
      scaffoldBackgroundColor: backgroundLight,
      textTheme: _buildTextTheme(textPrimaryLight, textSecondaryLight),
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceLight,
        foregroundColor: textPrimaryLight,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimaryLight,
        ),
        iconTheme: const IconThemeData(color: textPrimaryLight),
        shadowColor: Colors.black12,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardTheme(
        color: cardLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryLight,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryLight,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          side: const BorderSide(color: primaryLight, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryLight,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF1F5F9),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryLight, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: error, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: GoogleFonts.inter(
          fontSize: 14,
          color: textSecondaryLight,
          fontWeight: FontWeight.w400,
        ),
        labelStyle: GoogleFonts.inter(
          fontSize: 14,
          color: textSecondaryLight,
          fontWeight: FontWeight.w500,
        ),
        errorStyle: GoogleFonts.inter(fontSize: 12, color: error),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFFEFF6FF),
        selectedColor: primaryLight,
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceLight,
        selectedItemColor: primaryLight,
        unselectedItemColor: textSecondaryLight,
        elevation: 8,
        type: BottomNavigationBarType.fixed,
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE2E8F0),
        thickness: 1,
        space: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: textPrimaryLight,
        contentTextStyle: GoogleFonts.inter(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w400,
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryDark,
      brightness: Brightness.dark,
      primary: primaryDark,
      secondary: secondaryLight,
      error: error,
      surface: surfaceDark,
      surfaceContainerHighest: backgroundDark,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundDark,
      textTheme: _buildTextTheme(textPrimaryDark, textSecondaryDark),
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceDark,
        foregroundColor: textPrimaryDark,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimaryDark,
        ),
        iconTheme: const IconThemeData(color: textPrimaryDark),
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardTheme(
        color: cardDark,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF334155), width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryDark,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryDark,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          side: const BorderSide(color: primaryDark, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryDark,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF0F172A),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF334155), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryDark, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: error, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: GoogleFonts.inter(
          fontSize: 14,
          color: textSecondaryDark,
          fontWeight: FontWeight.w400,
        ),
        labelStyle: GoogleFonts.inter(
          fontSize: 14,
          color: textSecondaryDark,
          fontWeight: FontWeight.w500,
        ),
        errorStyle: GoogleFonts.inter(fontSize: 12, color: error),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFF1E293B),
        selectedColor: primaryDark,
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceDark,
        selectedItemColor: primaryDark,
        unselectedItemColor: textSecondaryDark,
        elevation: 8,
        type: BottomNavigationBarType.fixed,
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFF334155),
        thickness: 1,
        space: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: surfaceDark,
        contentTextStyle: GoogleFonts.inter(
          color: textPrimaryDark,
          fontSize: 14,
          fontWeight: FontWeight.w400,
        ),
      ),
    );
  }
}
