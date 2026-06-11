import 'package:flutter/material.dart';

/// A reusable XP progress bar widget showing a level badge, progress bar,
/// and an XP label. Use this in any screen's profile section.
///
/// Example usage in dashboard AppBar or profile card:
/// ```dart
/// XpProgressBar(level: 5, currentXp: 450, nextLevelXp: 600)
/// ```
class XpProgressBar extends StatelessWidget {
  /// The user's current level.
  final int level;

  /// XP earned within the current level (not total XP).
  final int currentXp;

  /// Total XP needed to complete the current level (i.e., reach next level).
  final int nextLevelXp;

  /// Optional accent color for the progress bar. Defaults to deep purple.
  final Color? color;

  /// Whether to show the compact single-row layout (for use in AppBar/header)
  /// or the full two-row layout with separate label. Defaults to false.
  final bool compact;

  const XpProgressBar({
    super.key,
    required this.level,
    required this.currentXp,
    required this.nextLevelXp,
    this.color,
    this.compact = false,
  });

  double get _progress =>
      nextLevelXp > 0 ? (currentXp / nextLevelXp).clamp(0.0, 1.0) : 0.0;

  @override
  Widget build(BuildContext context) {
    final accentColor = color ?? Colors.deepPurple;

    if (compact) {
      return _buildCompact(context, accentColor);
    }
    return _buildFull(context, accentColor);
  }

  Widget _buildFull(BuildContext context, Color accentColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            _LevelBadge(level: level, color: accentColor),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: _progress,
                      minHeight: 10,
                      backgroundColor: accentColor.withOpacity(0.15),
                      valueColor: AlwaysStoppedAnimation<Color>(accentColor),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Level $level  —  $currentXp / $nextLevelXp XP',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCompact(BuildContext context, Color accentColor) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _LevelBadge(level: level, color: accentColor, size: 28, fontSize: 11),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 100,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _progress,
                  minHeight: 6,
                  backgroundColor: accentColor.withOpacity(0.15),
                  valueColor: AlwaysStoppedAnimation<Color>(accentColor),
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '$currentXp/$nextLevelXp XP',
              style: const TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ],
        ),
      ],
    );
  }
}

/// Circular badge displaying the level number.
class _LevelBadge extends StatelessWidget {
  final int level;
  final Color color;
  final double size;
  final double fontSize;

  const _LevelBadge({
    required this.level,
    required this.color,
    this.size = 40,
    this.fontSize = 14,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [color, color.withOpacity(0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.35),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          '$level',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: fontSize,
          ),
        ),
      ),
    );
  }
}
