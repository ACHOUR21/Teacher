import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class CustomTextField extends StatefulWidget {
  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final String? errorText;
  final String? helperText;
  final bool isPassword;
  final bool readOnly;
  final bool enabled;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final FormFieldValidator<String>? validator;
  final List<TextInputFormatter>? inputFormatters;
  final int? maxLines;
  final int? minLines;
  final int? maxLength;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final FocusNode? focusNode;
  final bool autofocus;
  final AutovalidateMode autovalidateMode;
  final String? initialValue;

  const CustomTextField({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.isPassword = false,
    this.readOnly = false,
    this.enabled = true,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.onChanged,
    this.onTap,
    this.validator,
    this.inputFormatters,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.focusNode,
    this.autofocus = false,
    this.autovalidateMode = AutovalidateMode.onUserInteraction,
    this.initialValue,
  });

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Widget? suffixWidget = widget.suffixIcon;
    if (widget.isPassword) {
      suffixWidget = IconButton(
        icon: Icon(
          _obscureText ? Icons.visibility_outlined : Icons.visibility_off_outlined,
          size: 20,
          color: theme.hintColor,
        ),
        onPressed: () => setState(() => _obscureText = !_obscureText),
        splashRadius: 20,
      );
    }

    return TextFormField(
      controller: widget.controller,
      initialValue: widget.initialValue,
      focusNode: widget.focusNode,
      autofocus: widget.autofocus,
      readOnly: widget.readOnly,
      enabled: widget.enabled,
      obscureText: widget.isPassword && _obscureText,
      keyboardType: widget.isPassword ? TextInputType.visiblePassword : widget.keyboardType,
      textInputAction: widget.textInputAction,
      maxLines: widget.isPassword ? 1 : widget.maxLines,
      minLines: widget.minLines,
      maxLength: widget.maxLength,
      inputFormatters: widget.inputFormatters,
      onChanged: widget.onChanged,
      onTap: widget.onTap,
      validator: widget.validator,
      autovalidateMode: widget.autovalidateMode,
      style: theme.textTheme.bodyLarge,
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint,
        errorText: widget.errorText,
        helperText: widget.helperText,
        prefixIcon: widget.prefixIcon,
        suffixIcon: suffixWidget,
        counterText: widget.maxLength != null ? null : '',
      ),
    );
  }
}
