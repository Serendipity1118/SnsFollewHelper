import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/db/app_database.dart';
import 'core/domain.dart';
import 'providers.dart';
import 'ui/common.dart';
import 'ui/dashboard_screen.dart';
import 'ui/settings_screen.dart';

class FollowSupportApp extends StatelessWidget {
  const FollowSupportApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'フォロー作業ノート',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff176c67)),
      scaffoldBackgroundColor: const Color(0xfff5f8f7),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
      appBarTheme: const AppBarTheme(centerTitle: false),
    ),
    home: const StartupScreen(),
  );
}

class StartupScreen extends ConsumerStatefulWidget {
  const StartupScreen({super.key});
  @override
  ConsumerState<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends ConsumerState<StartupScreen> {
  PlatformType platform = PlatformType.x;
  List<OperatingAccount> accounts = [];
  String? selected;
  String? pendingOwner;
  bool busy = true;
  String? error;
  final name = TextEditingController();
  @override
  void initState() {
    super.initState();
    refresh();
  }

  @override
  void dispose() {
    name.dispose();
    super.dispose();
  }

  Future<void> refresh() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final repo = ref.read(repositoryProvider);
      accounts = await repo.accounts();
      final pending = await repo.pendingTarget();
      pendingOwner = pending?.ownerId ?? await repo.setting('openingOwner');
      if (pending != null) platform = pending.platform;
      final previous = await repo.setting('lastOwner:${platform.name}');
      final choices = accounts.where((a) => a.platform == platform).toList();
      selected =
          pendingOwner ??
          (choices.any((a) => a.id == previous)
              ? previous
              : choices.firstOrNull?.id);
    } catch (_) {
      error = 'データを読み込めませんでした。再試行してください。';
    }
    if (mounted) setState(() => busy = false);
  }

  Future<void> add() async {
    if (name.text.trim().isEmpty) {
      message(context, '運用元の表示名を入力してください');
      return;
    }
    setState(() => busy = true);
    try {
      final a = await ref
          .read(repositoryProvider)
          .addAccount(platform, name.text);
      await ref
          .read(repositoryProvider)
          .putSetting('lastOwner:${platform.name}', a.id);
      name.clear();
      await refresh();
    } catch (_) {
      if (mounted) {
        setState(() => busy = false);
        message(context, '運用元を登録できませんでした');
      }
    }
  }

  Future<void> start() async {
    final owner = accounts.firstWhere((a) => a.id == selected);
    if (!await confirm(
      context,
      '運用元を確認',
      '${owner.platform.label}：${owner.displayName}\n\nSNSアプリ／ブラウザで、この運用元にログインしていることをご自身で確認してください。アプリはログイン状態を取得しません。\n\n運用元は次回アプリ起動時に変更できます。',
      action: '確認しました',
    )) {
      return;
    }
    if (!mounted) return;
    setState(() => busy = true);
    try {
      await ref
          .read(repositoryProvider)
          .putSetting('lastOwner:${platform.name}', owner.id);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => DashboardScreen(owner: owner)),
      );
    } catch (_) {
      if (mounted) {
        setState(() => busy = false);
        message(context, '設定を保存できませんでした');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final choices = accounts.where((a) => a.platform == platform).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('フォロー作業ノート')),
      body: busy
          ? const Center(child: CircularProgressIndicator())
          : PageBody(
              children: [
                Image.asset('assets/follow_work_notes_icon.png', height: 100),
                Text(
                  '今日の作業を、ひとつずつ。',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const Text('対象リストと手動の作業結果を端末内で管理します。フォロー操作はSNSアプリで行ってください。'),
                if (error != null) ...[
                  Text(error!),
                  OutlinedButton(onPressed: refresh, child: const Text('再試行')),
                ],
                if (pendingOwner != null)
                  const InfoCard(
                    title: '結果未登録の作業があります',
                    text: '前回の運用元を確認すると、結果入力を再開します。',
                  ),
                DropdownButtonFormField<PlatformType>(
                  initialValue: platform,
                  decoration: const InputDecoration(labelText: 'SNS'),
                  items: PlatformType.values
                      .map(
                        (p) => DropdownMenuItem(value: p, child: Text(p.label)),
                      )
                      .toList(),
                  onChanged: pendingOwner != null
                      ? null
                      : (p) {
                          platform = p!;
                          refresh();
                        },
                ),
                if (choices.isNotEmpty)
                  DropdownButtonFormField<String>(
                    key: ValueKey('$platform:$selected'),
                    initialValue: selected,
                    decoration: const InputDecoration(labelText: '運用元'),
                    isExpanded: true,
                    items: choices
                        .map(
                          (a) => DropdownMenuItem(
                            value: a.id,
                            child: Text(
                              '${a.displayName}（${a.id.substring(0, 6)}）',
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: pendingOwner != null
                        ? null
                        : (id) => setState(() => selected = id),
                  ),
                if (choices.isEmpty)
                  const Text('このSNSの運用元を登録してください。保存するのは表示名だけです。'),
                if (pendingOwner == null) ...[
                  TextField(
                    controller: name,
                    decoration: const InputDecoration(labelText: '新しい運用元の表示名'),
                    onSubmitted: (_) => add(),
                  ),
                  OutlinedButton.icon(
                    onPressed: add,
                    icon: const Icon(Icons.person_add_alt),
                    label: const Text('運用元を登録'),
                  ),
                ],
                FilledButton(
                  onPressed: selected == null ? null : start,
                  child: const Text('この運用元で始める'),
                ),
                TextButton(
                  onPressed: () async {
                    try {
                      await ref.read(repositoryProvider).installSamples();
                      await refresh();
                    } catch (_) {
                      if (context.mounted) message(context, 'サンプルを読み込めませんでした');
                    }
                  },
                  child: const Text('サンプルデータを読み込む'),
                ),
                TextButton(
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const AccountManagementScreen(),
                      ),
                    );
                    if (mounted) await refresh();
                  },
                  child: const Text('運用元の管理・アーカイブ復元'),
                ),
                TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AboutScreen()),
                  ),
                  child: const Text('このアプリについて'),
                ),
              ],
            ),
    );
  }
}
