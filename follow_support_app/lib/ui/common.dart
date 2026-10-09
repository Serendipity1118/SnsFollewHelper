import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'theme.dart';

String dateLabel(DateTime? date) => date == null
    ? '—'
    : DateFormat('yyyy/MM/dd HH:mm:ss').format(date.toLocal());
void message(BuildContext context, String text) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
}

Future<bool> confirm(
  BuildContext context,
  String title,
  String content, {
  String action = '実行する',
}) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: SingleChildScrollView(child: Text(content)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('キャンセル'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(action),
          ),
        ],
      ),
    ) ??
    false;

class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 760),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: children
            .map(
              (w) =>
                  Padding(padding: const EdgeInsets.only(bottom: 16), child: w),
            )
            .toList(),
      ),
    ),
  );
}

class InfoCard extends StatelessWidget {
  const InfoCard({
    super.key,
    required this.title,
    required this.text,
    this.icon = Icons.info_outline,
  });
  final String title;
  final String text;
  final IconData icon;
  @override
  Widget build(BuildContext context) {
    final p = AppPalette.of(context);
    return SurfaceCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconTile(icon: icon, size: 40),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(fontSize: 15),
                ),
                const SizedBox(height: 6),
                Text(text, style: TextStyle(color: p.muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// 白いカード＋枠線＋薄い影（Webサービスの .card）
class SurfaceCard extends StatelessWidget {
  const SurfaceCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
  });
  final Widget child;
  final EdgeInsetsGeometry padding;
  @override
  Widget build(BuildContext context) {
    final p = AppPalette.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: p.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: p.line),
        boxShadow: p.cardShadow,
      ),
      child: Padding(padding: padding, child: child),
    );
  }
}

/// 一覧の1行分のカード。ListTile のタップの波紋がカードの中に収まるよう Card で包む。
class ListCard extends StatelessWidget {
  const ListCard({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(12),
      boxShadow: AppPalette.of(context).cardShadow,
    ),
    child: Card(clipBehavior: Clip.antiAlias, child: child),
  );
}

/// 行を白いカードで並べる一覧（Webサービスの今日の名簿の行と同じ見た目）
class CardListView extends StatelessWidget {
  const CardListView({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
  });
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  @override
  Widget build(BuildContext context) => ListView.separated(
    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
    itemCount: itemCount,
    separatorBuilder: (_, _) => const SizedBox(height: 8),
    itemBuilder: (context, i) => ListCard(child: itemBuilder(context, i)),
  );
}

/// 淡いアクセント色の角丸タイルに入れたアイコン（Webサービスの .heading-tile）
class IconTile extends StatelessWidget {
  const IconTile({super.key, required this.icon, this.size = 48});
  final IconData icon;
  final double size;
  @override
  Widget build(BuildContext context) {
    final p = AppPalette.of(context);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: p.accentSoft,
        borderRadius: BorderRadius.circular(size / 4),
      ),
      child: Icon(icon, color: p.accent, size: size * 0.48),
    );
  }
}

/// 各画面の先頭。アイコンのタイル・小さな英字ラベル・見出し・説明。
class PageHeading extends StatelessWidget {
  const PageHeading({
    super.key,
    required this.icon,
    required this.eyebrow,
    required this.title,
    this.lead,
  });
  final IconData icon;
  final String eyebrow;
  final String title;
  final String? lead;
  @override
  Widget build(BuildContext context) {
    final p = AppPalette.of(context);
    final lead = this.lead;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        IconTile(icon: icon),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                eyebrow.toUpperCase(),
                style: TextStyle(
                  color: p.muted,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.6,
                ),
              ),
              const SizedBox(height: 2),
              Text(title, style: Theme.of(context).textTheme.headlineSmall),
              if (lead != null) ...[
                const SizedBox(height: 4),
                Text(lead, style: TextStyle(color: p.muted, fontSize: 13)),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
