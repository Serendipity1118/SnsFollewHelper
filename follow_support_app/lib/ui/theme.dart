import 'package:flutter/material.dart';

/// Webサービス（web-service/src/public/style.css）・Chrome拡張と同じ色。
/// scenawright のデザイン（ティールのアクセント・白いカード・薄い影）に合わせている。
class AppPalette {
  const AppPalette({
    required this.bg,
    required this.surface,
    required this.surface2,
    required this.text,
    required this.muted,
    required this.line,
    required this.input,
    required this.buttonLine,
    required this.accent,
    required this.accentDark,
    required this.accentSoft,
    required this.accentInk,
    required this.onAccent,
    required this.dead,
    required this.deadSoft,
    required this.deadLine,
    required this.toast,
    required this.onToast,
    required this.shadow,
  });

  final Color bg;
  final Color surface;
  final Color surface2;
  final Color text;
  final Color muted;
  final Color line;
  final Color input;
  final Color buttonLine;
  final Color accent;
  final Color accentDark;
  final Color accentSoft;
  final Color accentInk;
  final Color onAccent;
  final Color dead;
  final Color deadSoft;
  final Color deadLine;
  final Color toast;
  final Color onToast;
  final Color shadow;

  static const light = AppPalette(
    bg: Color(0xfff6f8f7),
    surface: Color(0xffffffff),
    surface2: Color(0xfff0f5f2),
    text: Color(0xff243b39),
    muted: Color(0xff687b76),
    line: Color(0xffe0e7e4),
    input: Color(0xffccd8d3),
    buttonLine: Color(0xffd4dfd9),
    accent: Color(0xff147b69),
    accentDark: Color(0xff106554),
    accentSoft: Color(0xffe7f3ed),
    accentInk: Color(0xff136f5d),
    onAccent: Color(0xffffffff),
    dead: Color(0xffa33329),
    deadSoft: Color(0xfffff5f3),
    deadLine: Color(0xffefc8c2),
    toast: Color(0xff244b3b),
    onToast: Color(0xffffffff),
    shadow: Color(0x10233d35),
  );

  static const dark = AppPalette(
    bg: Color(0xff131413),
    surface: Color(0xff1d1d1d),
    surface2: Color(0xff222523),
    text: Color(0xffd6f1ee),
    muted: Color(0xff8da19b),
    line: Color(0xff2d3330),
    input: Color(0xff3a423e),
    buttonLine: Color(0xff353d39),
    accent: Color(0xff63bda8),
    accentDark: Color(0xff87d2be),
    accentSoft: Color(0xff222b27),
    accentInk: Color(0xff77c8b3),
    onAccent: Color(0xff1d1d1d),
    dead: Color(0xffff8a80),
    deadSoft: Color(0xff2e1f1d),
    deadLine: Color(0xff5a2f2a),
    toast: Color(0xffbbe6d2),
    onToast: Color(0xff1d1d1d),
    shadow: Color(0x40000000),
  );

  static AppPalette of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? dark : light;

  /// カード・パネルの薄い影（web の 0 3px 14px）
  List<BoxShadow> get cardShadow => [
    BoxShadow(color: shadow, blurRadius: 14, offset: const Offset(0, 3)),
  ];
}

const _radiusCard = 12.0;
const _radiusInput = 8.0;
const _radiusButton = 7.0;
const _buttonHeight = 42.0;

ThemeData buildAppTheme(Brightness brightness) {
  final p = brightness == Brightness.dark ? AppPalette.dark : AppPalette.light;
  final scheme = ColorScheme(
    brightness: brightness,
    primary: p.accent,
    onPrimary: p.onAccent,
    primaryContainer: p.accentSoft,
    onPrimaryContainer: p.accentInk,
    secondary: p.accentInk,
    onSecondary: p.onAccent,
    secondaryContainer: p.accentSoft,
    onSecondaryContainer: p.accentInk,
    error: p.dead,
    onError: p.onAccent,
    errorContainer: p.deadSoft,
    onErrorContainer: p.dead,
    surface: p.surface,
    onSurface: p.text,
    onSurfaceVariant: p.muted,
    surfaceContainerLowest: p.surface,
    surfaceContainerLow: p.surface,
    surfaceContainer: p.surface,
    surfaceContainerHigh: p.surface,
    surfaceContainerHighest: p.surface2,
    outline: p.input,
    outlineVariant: p.line,
    inverseSurface: p.toast,
    onInverseSurface: p.onToast,
    shadow: p.shadow,
    surfaceTint: Colors.transparent,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme);
  final text = base.textTheme.apply(bodyColor: p.text, displayColor: p.text);
  const buttonText = TextStyle(fontSize: 14, fontWeight: FontWeight.w600);
  final buttonShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(_radiusButton),
  );
  const buttonSize = Size(64, _buttonHeight);
  OutlineInputBorder inputBorder(Color color, [double width = 1]) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radiusInput),
        borderSide: BorderSide(color: color, width: width),
      );

  return base.copyWith(
    scaffoldBackgroundColor: p.bg,
    textTheme: text.copyWith(
      headlineMedium: text.headlineMedium?.copyWith(
        fontWeight: FontWeight.w700,
      ),
      headlineSmall: text.headlineSmall?.copyWith(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
      titleLarge: text.titleLarge?.copyWith(
        fontSize: 19,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: text.titleMedium?.copyWith(fontWeight: FontWeight.w600),
      bodyMedium: text.bodyMedium?.copyWith(height: 1.6),
    ),
    dividerTheme: DividerThemeData(color: p.line, thickness: 1, space: 1),
    appBarTheme: AppBarTheme(
      centerTitle: false,
      backgroundColor: p.surface,
      foregroundColor: p.text,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      shape: Border(bottom: BorderSide(color: p.line)),
      titleTextStyle: TextStyle(
        color: p.text,
        fontSize: 17,
        fontWeight: FontWeight.w700,
      ),
    ),
    cardTheme: CardThemeData(
      color: p.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(_radiusCard),
        side: BorderSide(color: p.line),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: buttonSize,
        shape: buttonShape,
        textStyle: buttonText,
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: buttonSize,
        shape: buttonShape,
        textStyle: buttonText,
        foregroundColor: p.text,
        backgroundColor: p.surface,
        side: BorderSide(color: p.buttonLine),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: buttonSize,
        shape: buttonShape,
        textStyle: buttonText,
        foregroundColor: p.accentInk,
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        foregroundColor: p.muted,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      labelStyle: TextStyle(color: p.muted),
      floatingLabelStyle: TextStyle(
        color: p.accentInk,
        fontWeight: FontWeight.w600,
      ),
      hintStyle: TextStyle(color: p.muted),
      border: inputBorder(p.input),
      enabledBorder: inputBorder(p.input),
      disabledBorder: inputBorder(p.line),
      focusedBorder: inputBorder(p.accent, 1.5),
      errorBorder: inputBorder(p.dead),
      focusedErrorBorder: inputBorder(p.dead, 1.5),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      titleTextStyle: TextStyle(
        color: p.text,
        fontSize: 19,
        fontWeight: FontWeight.w700,
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: p.toast,
      contentTextStyle: TextStyle(color: p.onToast, fontSize: 14),
      actionTextColor: p.onToast,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
    listTileTheme: ListTileThemeData(
      iconColor: p.muted,
      subtitleTextStyle: TextStyle(color: p.muted, fontSize: 13),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: p.accent,
      linearTrackColor: p.surface2,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: p.surface,
      selectedColor: p.accentSoft,
      side: BorderSide(color: p.buttonLine),
      shape: const StadiumBorder(),
      labelStyle: TextStyle(color: p.text, fontSize: 13),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith(
        (s) => s.contains(WidgetState.selected) ? p.accent : null,
      ),
    ),
    switchTheme: SwitchThemeData(
      trackColor: WidgetStateProperty.resolveWith(
        (s) => s.contains(WidgetState.selected) ? p.accent : p.surface2,
      ),
    ),
  );
}
