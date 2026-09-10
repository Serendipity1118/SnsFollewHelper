import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/db/app_database.dart';
import '../core/safety/safety_guard.dart';
import '../core/safety/safety_policy.dart';
import '../providers.dart';
import 'common.dart';
import 'work_screen.dart';
import 'target_screens.dart';
import 'import_export_screens.dart';
import 'settings_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key, required this.owner});
  final OperatingAccount owner;
  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen>
    with WidgetsBindingObserver {
  SafetyDecision? decision;
  int pending = 0;
  String? error;
  Timer? timer;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    refresh();
    timer = Timer.periodic(const Duration(seconds: 30), (_) => refresh());
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        if (await ref.read(repositoryProvider).pendingTarget() != null &&
            mounted) {
          await open(WorkScreen(owner: widget.owner));
        }
      } catch (_) {
        if (mounted) setState(() => error = '作業の復元に失敗しました');
      }
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) refresh();
  }

  Future<void> refresh() async {
    try {
      final repo = ref.read(repositoryProvider);
      final d = ref
          .read(safetyProvider)
          .evaluate(await repo.followedDates(widget.owner));
      final count = await repo.pendingCount(widget.owner);
      if (mounted) {
        setState(() {
          decision = d;
          pending = count;
          error = null;
        });
      }
    } catch (_) {
      if (mounted) setState(() => error = '集計を読み込めませんでした');
    }
  }

  Future<void> open(Widget page) async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => page));
    if (mounted) await refresh();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('ダッシュボード'),
      actions: [
        IconButton(
          onPressed: refresh,
          icon: const Icon(Icons.refresh),
          tooltip: '更新',
        ),
      ],
    ),
    body: PageBody(
      children: [
        Text(
          '${widget.owner.platform.label} · ${widget.owner.displayName}',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        Text(
          '運用元ID：${widget.owner.id.substring(0, 8)}${widget.owner.isSample ? ' · サンプル' : ''}',
        ),
        if (error != null) Text(error!),
        InfoCard(title: '未処理の対象', text: '$pending 件', icon: Icons.checklist),
        InfoCard(
          title: '安全マージン',
          text: decision == null
              ? '集計中…'
              : '直近1時間：${decision!.hourCount} / 15 件\n直近24時間：${decision!.dayCount} / 60 件\n\n${decision!.allowed ? 'プロフィールを開けます' : '新規プロフィール起動を停止中\n再開可能：${dateLabel(decision!.retryAt)}'}',
          icon: Icons.shield_outlined,
        ),
        FilledButton.icon(
          onPressed: () => open(WorkScreen(owner: widget.owner)),
          icon: const Icon(Icons.play_arrow),
          label: const Text('作業開始・再開'),
        ),
        OutlinedButton.icon(
          onPressed: () => open(TargetListScreen(owner: widget.owner)),
          icon: const Icon(Icons.list_alt),
          label: const Text('対象一覧'),
        ),
        OutlinedButton.icon(
          onPressed: () => open(const ImportScreen()),
          icon: const Icon(Icons.file_upload_outlined),
          label: const Text('CSVインポート'),
        ),
        OutlinedButton.icon(
          onPressed: () => open(const ExportScreen()),
          icon: const Icon(Icons.save_alt),
          label: const Text('エクスポート・バックアップ'),
        ),
        OutlinedButton.icon(
          onPressed: () => open(HistoryScreen(owner: widget.owner)),
          icon: const Icon(Icons.history),
          label: const Text('操作履歴'),
        ),
        TextButton(
          onPressed: () => open(SettingsScreen(owner: widget.owner)),
          child: const Text('設定'),
        ),
        const Text(SafetyPolicy.notice),
      ],
    ),
  );
}
