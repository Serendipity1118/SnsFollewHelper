import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/db/app_database.dart';
import '../core/domain.dart';
import '../providers.dart';
import 'common.dart';
import 'work_screen.dart';

class TargetListScreen extends ConsumerStatefulWidget {
  const TargetListScreen({super.key, required this.owner});
  final OperatingAccount owner;
  @override
  ConsumerState<TargetListScreen> createState() => _TargetListScreenState();
}

class _TargetListScreenState extends ConsumerState<TargetListScreen> {
  TargetStatus? status;
  final search = TextEditingController();
  final group = TextEditingController();
  int offset = 0;
  int revision = 0;
  List<TargetAccount> rows = [];
  bool busy = true;
  String? error;
  Timer? debounce;
  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    debounce?.cancel();
    search.dispose();
    group.dispose();
    super.dispose();
  }

  void filter() {
    debounce?.cancel();
    debounce = Timer(const Duration(milliseconds: 300), () {
      offset = 0;
      load();
    });
  }

  Future<void> load() async {
    final ticket = ++revision;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final result = await ref
          .read(repositoryProvider)
          .page(
            widget.owner,
            status: status,
            search: search.text,
            group: group.text,
            offset: offset,
          );
      if (mounted && ticket == revision) {
        setState(() {
          rows = result;
          busy = false;
        });
      }
    } catch (_) {
      if (mounted && ticket == revision) {
        setState(() {
          error = '一覧を読み込めませんでした';
          busy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('対象一覧')),
    body: Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Text(
                '${widget.owner.platform.label} · ${widget.owner.displayName} と未割り当ての対象',
              ),
              const SizedBox(height: 12),
              TextField(
                controller: search,
                onChanged: (_) => filter(),
                decoration: const InputDecoration(
                  labelText: 'ユーザー名・メモを検索',
                  prefixIcon: Icon(Icons.search),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<TargetStatus?>(
                      initialValue: status,
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: '状態'),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('すべて')),
                        ...TargetStatus.values.map(
                          (s) => DropdownMenuItem(
                            value: s,
                            child: Text(
                              s.label,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ],
                      onChanged: (s) {
                        status = s;
                        offset = 0;
                        load();
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: group,
                      onChanged: (_) => filter(),
                      decoration: const InputDecoration(
                        labelText: 'グループ（完全一致）',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (busy) const LinearProgressIndicator(),
        if (error != null)
          TextButton(onPressed: load, child: Text('$error · 再試行')),
        Expanded(
          child: rows.isEmpty && !busy
              ? const Center(child: Text('該当する対象はありません'))
              : ListView.builder(
                  itemCount: rows.length,
                  itemBuilder: (context, index) {
                    final t = rows[index];
                    return ListTile(
                      title: Text('@${t.username}'),
                      subtitle: Text(
                        '${t.status.label} · ${t.ownerId == null ? '未割り当て' : '担当中'}\n処理日時：${dateLabel(t.processedAt)}',
                      ),
                      isThreeLine: true,
                      trailing: const Icon(Icons.chevron_right),
                      onTap: busy
                          ? null
                          : () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => TargetDetailScreen(
                                    owner: widget.owner,
                                    targetId: t.id,
                                  ),
                                ),
                              );
                              if (mounted) await load();
                            },
                    );
                  },
                ),
        ),
        SafeArea(
          top: false,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              TextButton(
                onPressed: busy || offset == 0
                    ? null
                    : () {
                        offset -= 50;
                        load();
                      },
                child: const Text('前の50件'),
              ),
              Text(
                '${offset + (rows.isEmpty ? 0 : 1)}–${offset + rows.length}',
              ),
              TextButton(
                onPressed: busy || rows.length < 50
                    ? null
                    : () {
                        offset += 50;
                        load();
                      },
                child: const Text('次の50件'),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class TargetDetailScreen extends ConsumerStatefulWidget {
  const TargetDetailScreen({
    super.key,
    required this.owner,
    required this.targetId,
  });
  final OperatingAccount owner;
  final String targetId;
  @override
  ConsumerState<TargetDetailScreen> createState() => _TargetDetailScreenState();
}

class _TargetDetailScreenState extends ConsumerState<TargetDetailScreen> {
  TargetAccount? target;
  final memo = TextEditingController();
  final group = TextEditingController();
  bool busy = true;
  String? error;
  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    memo.dispose();
    group.dispose();
    super.dispose();
  }

  Future<void> load() async {
    try {
      final t = await ref.read(repositoryProvider).target(widget.targetId);
      if (!mounted) return;
      setState(() {
        target = t;
        memo.text = t?.memo ?? '';
        group.text = t?.groupName ?? '';
        busy = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          error = '対象を読み込めませんでした';
          busy = false;
        });
      }
    }
  }

  Future<void> perform(Future<void> Function() action) async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await action();
      await load();
      if (mounted) message(context, '保存しました');
    } catch (_) {
      if (mounted) {
        setState(() {
          error = '保存できませんでした。作業中の対象があれば先に結果を登録してください。';
          busy = false;
        });
      }
    }
  }

  Future<void> reassign() async {
    final accounts = (await ref.read(repositoryProvider).accounts())
        .where(
          (a) =>
              a.platform == widget.owner.platform &&
              a.id != widget.owner.id &&
              a.isSample == widget.owner.isSample,
        )
        .toList();
    if (!mounted) return;
    final to = await showDialog<OperatingAccount>(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('再割り当て先を選択'),
        children: accounts.isEmpty
            ? [
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('同じSNSの別の運用元を設定画面で登録してください。'),
                ),
              ]
            : accounts
                  .map(
                    (a) => SimpleDialogOption(
                      onPressed: () => Navigator.pop(context, a),
                      child: Text('${a.displayName}（${a.id.substring(0, 6)}）'),
                    ),
                  )
                  .toList(),
      ),
    );
    if (to == null || !mounted) return;
    if (!await confirm(
      context,
      '再割り当て',
      '${to.displayName} の未処理対象へ移動します。元の履歴を保持し、元の運用元の新規フォロー件数からは減らします。',
    )) {
      return;
    }
    if (!mounted) return;
    setState(() => busy = true);
    try {
      await ref
          .read(repositoryProvider)
          .reassign(widget.targetId, widget.owner, to);
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) {
        setState(() {
          error = '再割り当てできませんでした';
          busy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = target;
    return Scaffold(
      appBar: AppBar(title: const Text('対象詳細')),
      body: PageBody(
        children: [
          if (busy) const LinearProgressIndicator(),
          if (error != null) Text(error!),
          if (t != null) ...[
            Text(
              '@${t.username}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            SelectableText(t.profileUrl),
            Text(
              'あなたが登録した状態：${t.status.label}\n取込：${dateLabel(t.importedAt)}\n処理：${dateLabel(t.processedAt)}\n最終起動：${dateLabel(t.lastOpenedAt)}\n起動回数：${t.openCount}',
            ),
            FilledButton(
              onPressed: busy
                  ? null
                  : () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              WorkScreen(owner: widget.owner, targetId: t.id),
                        ),
                      );
                      if (mounted) await load();
                    },
              child: const Text('この対象で作業する'),
            ),
            if (t.ownerId != null)
              DropdownButtonFormField<TargetStatus>(
                key: ValueKey(t.status),
                initialValue: t.status,
                isExpanded: true,
                decoration: const InputDecoration(labelText: '手動で状態を修正'),
                items: TargetStatus.values
                    .map(
                      (s) => DropdownMenuItem(value: s, child: Text(s.label)),
                    )
                    .toList(),
                onChanged: busy
                    ? null
                    : (s) => perform(() async {
                        final notice = await ref
                            .read(repositoryProvider)
                            .setStatus(t.id, widget.owner, s!);
                        if (notice && context.mounted) {
                          message(context, '累積5件に達しました。少し休憩しませんか。');
                        }
                      }),
              ),
            TextField(
              controller: memo,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'メモ'),
            ),
            TextField(
              controller: group,
              decoration: const InputDecoration(labelText: 'グループ'),
            ),
            OutlinedButton(
              onPressed: busy
                  ? null
                  : () => perform(
                      () => ref
                          .read(repositoryProvider)
                          .editMemo(t.id, widget.owner, memo.text, group.text),
                    ),
              child: const Text('メモ・グループを保存'),
            ),
            TextButton(
              onPressed: busy ? null : reassign,
              child: const Text('別の運用元へ再割り当て'),
            ),
            TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) =>
                      HistoryScreen(owner: widget.owner, targetId: t.id),
                ),
              ),
              child: const Text('この対象の操作履歴'),
            ),
            const Text('状態は利用者による分類です。SNS上の状態を取得したものではありません。'),
          ],
        ],
      ),
    );
  }
}

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key, required this.owner, this.targetId});
  final OperatingAccount owner;
  final String? targetId;
  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  List<ActionLog> rows = [];
  int offset = 0;
  bool busy = true;
  String? error;
  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() => busy = true);
    try {
      final data = await ref
          .read(repositoryProvider)
          .logs(widget.owner, targetId: widget.targetId, offset: offset);
      if (mounted) {
        setState(() {
          rows = data;
          busy = false;
          error = null;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          error = '履歴を読み込めませんでした';
          busy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('操作履歴')),
    body: Column(
      children: [
        if (busy) const LinearProgressIndicator(),
        if (error != null)
          TextButton(onPressed: load, child: Text('$error · 再試行')),
        Expanded(
          child: rows.isEmpty && !busy
              ? const Center(child: Text('操作履歴はありません'))
              : ListView.builder(
                  itemCount: rows.length,
                  itemBuilder: (context, i) {
                    final l = rows[i];
                    final title = switch (l.actionType) {
                      ActionType.profileOpened => 'プロフィール起動',
                      ActionType.statusChanged => '手動の状態変更',
                      ActionType.cancelled => '作業キャンセル',
                      ActionType.reassigned => '再割り当て',
                      ActionType.memoChanged => 'メモ・グループ変更',
                    };
                    return ListTile(
                      title: Text(title),
                      subtitle: Text(
                        '${dateLabel(l.occurredAt)}\n${l.statusBefore?.label ?? '—'} → ${l.statusAfter?.label ?? '—'}\n対象ID：${l.targetId}',
                      ),
                    );
                  },
                ),
        ),
        SafeArea(
          top: false,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              TextButton(
                onPressed: busy || offset == 0
                    ? null
                    : () {
                        offset -= 50;
                        load();
                      },
                child: const Text('前へ'),
              ),
              Text(
                '${offset + (rows.isEmpty ? 0 : 1)}–${offset + rows.length}',
              ),
              TextButton(
                onPressed: busy || rows.length < 50
                    ? null
                    : () {
                        offset += 50;
                        load();
                      },
                child: const Text('次へ'),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
