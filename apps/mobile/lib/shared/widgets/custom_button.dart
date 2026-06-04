import 'package:flutter/material.dart';

enum ButtonVariant { primary, secondary, outline, text, danger }

class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final bool isLoading;
  final bool isFullWidth;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final double? height;
  final double? fontSize;
  final EdgeInsetsGeometry? padding;

  const CustomButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = ButtonVariant.primary,
    this.isLoading = false,
    this.isFullWidth = true,
    this.prefixIcon,
    this.suffixIcon,
    this.height,
    this.fontSize,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    Widget child = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading)
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: _getForegroundColor(colorScheme),
            ),
          )
        else ...[
          if (prefixIcon != null) ...[
            Icon(prefixIcon, size: 18),
            const SizedBox(width: 8),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize ?? 15,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.1,
            ),
          ),
          if (suffixIcon != null) ...[
            const SizedBox(width: 8),
            Icon(suffixIcon, size: 18),
          ],
        ],
      ],
    );

    final buttonPadding =
        padding ?? const EdgeInsets.symmetric(horizontal: 24, vertical: 14);

    Widget button;
    switch (variant) {
      case ButtonVariant.primary:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            minimumSize:
                isFullWidth ? Size(double.infinity, height ?? 50) : null,
            padding: isFullWidth ? null : buttonPadding,
            fixedSize: height != null && !isFullWidth
                ? Size.fromHeight(height!)
                : null,
          ),
          child: child,
        );
        break;

      case ButtonVariant.secondary:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: colorScheme.secondary,
            foregroundColor: Colors.white,
            minimumSize:
                isFullWidth ? Size(double.infinity, height ?? 50) : null,
            padding: isFullWidth ? null : buttonPadding,
          ),
          child: child,
        );
        break;

      case ButtonVariant.outline:
        button = OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            minimumSize:
                isFullWidth ? Size(double.infinity, height ?? 50) : null,
            padding: isFullWidth ? null : buttonPadding,
          ),
          child: child,
        );
        break;

      case ButtonVariant.text:
        button = TextButton(
          onPressed: isLoading ? null : onPressed,
          style: TextButton.styleFrom(
            minimumSize: isFullWidth ? Size(double.infinity, height ?? 44) : null,
            padding: isFullWidth ? null : buttonPadding,
          ),
          child: child,
        );
        break;

      case ButtonVariant.danger:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: colorScheme.error,
            foregroundColor: Colors.white,
            minimumSize:
                isFullWidth ? Size(double.infinity, height ?? 50) : null,
            padding: isFullWidth ? null : buttonPadding,
          ),
          child: child,
        );
        break;
    }

    return button;
  }

  Color _getForegroundColor(ColorScheme colorScheme) {
    switch (variant) {
      case ButtonVariant.primary:
        return Colors.white;
      case ButtonVariant.secondary:
        return Colors.white;
      case ButtonVariant.outline:
        return colorScheme.primary;
      case ButtonVariant.text:
        return colorScheme.primary;
      case ButtonVariant.danger:
        return Colors.white;
    }
  }
}

class SocialButton extends StatelessWidget {
  final String label;
  final Widget icon;
  final VoidCallback? onPressed;
  final bool isLoading;

  const SocialButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return OutlinedButton(
      onPressed: isLoading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, 50),
        side: BorderSide(
          color: theme.dividerColor,
          width: 1,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      child: isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: theme.colorScheme.primary,
              ),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(width: 20, height: 20, child: icon),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: TextStyle(
                    color: theme.textTheme.bodyLarge?.color,
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
    );
  }
}
