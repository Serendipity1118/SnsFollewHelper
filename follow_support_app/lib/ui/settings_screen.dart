import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/db/app_database.dart';
import '../core/domain.dart';
import '../core/safety/safety_policy.dart';
import '../providers.dart';
import 'common.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key, required this.owner});
  final OperatingAccount owner;
  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool busy = false;
  Future<void> delete(bool history) async {
    final title = history ? '処理履歴のみ削除' : '全対象削除';
    if (!await confirm(
      context,
      title,
      history
          ? '${widget.owner.displayName} の操作履歴だけを削除します。対象の状態と安全制限のカウントは保持します。この操作は取り消せません。'
          : '${widget.owner.displayName} に割り当てられた対象だけを削除します。未割り当て・他の運用元の対象と操作履歴は保持します。この操作は取り消せません。',
      action: '削除する',
    )) {
      return;
    }
    if (!mounted) return;
    setState(() => busy = true);
    try {
      final repo = ref.read(repositoryProvider);
      if (history) {
        await repo.deleteHistory(widget.owner);
      } else {
        await repo.deleteTargets(widget.owner);
      }
      if (mounted) message(context, '削除しました');
    } catch (_) {
      if (mounted) message(context, '削除できませんでした。作業中の場合は先に結果を登録してください。');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('設定')),
    body: PageBody(
      children: [
        const InfoCard(
          title: '安全マージン設定',
          text:
              '直近1時間：15件\n直近24時間：60件\n運用元・SNS別に新規フォローを集計\n累積5件で休憩案内を1回表示\nセッション上限・起動間隔・強制休憩なし',
        ),
        const Text(SafetyPolicy.notice),
        OutlinedButton(
          onPressed: busy
              ? null
              : () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => AccountManagementScreen(
                      currentOwnerId: widget.owner.id,
                    ),
                  ),
                ),
          child: const Text('運用元の管理'),
        ),
        TextButton(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AboutScreen()),
          ),
          child: const Text('このアプリについて'),
        ),
        TextButton(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen()),
          ),
          child: const Text('プライバシーポリシー'),
        ),
        const Divider(),
        Text('削除対象の運用元：${widget.owner.displayName}'),
        OutlinedButton(
          onPressed: busy ? null : () => delete(true),
          child: const Text('処理履歴のみ削除'),
        ),
        OutlinedButton(
          onPressed: busy ? null : () => delete(false),
          child: const Text('全対象削除'),
        ),
        if (busy) const LinearProgressIndicator(),
      ],
    ),
  );
}

class AccountManagementScreen extends ConsumerStatefulWidget {
  const AccountManagementScreen({super.key, this.currentOwnerId});
  final String? currentOwnerId;
  @override
  ConsumerState<AccountManagementScreen> createState() =>
      _AccountManagementScreenState();
}

class _AccountManagementScreenState
    extends ConsumerState<AccountManagementScreen> {
  List<OperatingAccount> accounts = [];
  PlatformType platform = PlatformType.x;
  final name = TextEditingController();
  bool busy = true;
  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    name.dispose();
    super.dispose();
  }

  Future<void> load() async {
    try {
      final list = await ref
          .read(repositoryProvider)
          .accounts(includeArchived: true);
      if (mounted) {
        setState(() {
          accounts = list;
          busy = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => busy = false);
        message(context, '運用元を読み込めませんでした');
      }
    }
  }

  Future<void> perform(Future<void> Function() action) async {
    setState(() => busy = true);
    try {
      await action();
      await load();
    } catch (_) {
      if (mounted) {
        setState(() => busy = false);
        message(context, '変更できませんでした。表示名や未登録の作業結果を確認してください。');
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('運用元の管理')),
    body: PageBody(
      children: [
        const Text('運用元は表示名と内部IDで管理します。同じ表示名も登録できます。現在の作業の運用元は次回起動時に変更してください。'),
        DropdownButtonFormField<PlatformType>(
          initialValue: platform,
          decoration: const InputDecoration(labelText: '新規運用元のSNS'),
          items: PlatformType.values
              .map((p) => DropdownMenuItem(value: p, child: Text(p.label)))
              .toList(),
          onChanged: busy ? null : (p) => setState(() => platform = p!),
        ),
        TextField(
          controller: name,
          decoration: const InputDecoration(labelText: '表示名'),
        ),
        FilledButton(
          onPressed: busy
              ? null
              : () => perform(() async {
                  await ref
                      .read(repositoryProvider)
                      .addAccount(platform, name.text);
                  name.clear();
                }),
          child: const Text('登録する'),
        ),
        if (busy) const LinearProgressIndicator(),
        for (final a in accounts)
          Card(
            child: ListTile(
              title: Text('${a.platform.label} · ${a.displayName}'),
              subtitle: Text(
                '${a.id.substring(0, 8)} · ${a.archived ? 'アーカイブ済み' : '有効'}${a.id == widget.currentOwnerId ? ' · 選択中' : ''}',
              ),
              trailing: IconButton(
                tooltip: a.archived ? '復元' : 'アーカイブ',
                icon: Icon(
                  a.archived
                      ? Icons.unarchive_outlined
                      : Icons.archive_outlined,
                ),
                onPressed: busy || a.id == widget.currentOwnerId
                    ? null
                    : () => perform(
                        () => ref
                            .read(repositoryProvider)
                            .archive(a.id, !a.archived),
                      ),
              ),
            ),
          ),
        TextButton(
          onPressed: busy
              ? null
              : () => perform(
                  () => ref.read(repositoryProvider).installSamples(),
                ),
          child: const Text('サンプルデータを読み込む'),
        ),
        TextButton(
          onPressed:
              busy ||
                  accounts.any(
                    (a) => a.id == widget.currentOwnerId && a.isSample,
                  )
              ? null
              : () async {
                  if (!await confirm(
                    context,
                    'サンプルデータを削除',
                    '架空のサンプル運用元・対象・履歴だけを削除します。',
                  )) {
                    return;
                  }
                  if (mounted) {
                    await perform(
                      () => ref.read(repositoryProvider).removeSamples(),
                    );
                  }
                },
          child: const Text('サンプルデータを削除'),
        ),
      ],
    ),
  );
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('このアプリについて')),
    body: PageBody(
      children: [
        Image.asset('assets/follow_work_notes_icon.png', height: 120),
        Text('フォロー作業ノート', style: Theme.of(context).textTheme.headlineSmall),
        const Text(
          'バージョン 1.0.0\n\n利用者が用意したプロフィール一覧と、手動で判断した作業結果を端末内に保存するアプリです。',
        ),
        const Text(
          'フォロー・いいね・DMなどの自動操作は行いません。第三者SNSの画面を解析せず、SNS認証情報を取得しません。フォロー状態は利用者が手動で登録します。',
        ),
        const Text('本アプリはX、Instagram、Meta等とは提携・承認・後援関係にありません。'),
        const Text(SafetyPolicy.notice),
        TextButton(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen()),
          ),
          child: const Text('プライバシーポリシー'),
        ),
        TextButton(
          onPressed: () => showLicensePage(
            context: context,
            applicationName: 'フォロー作業ノート',
            applicationVersion: '1.0.0',
          ),
          child: const Text('オープンソースライセンス'),
        ),
      ],
    ),
  );
}

class PrivacyPolicyScreen extends StatefulWidget {
  const PrivacyPolicyScreen({super.key});
  @override
  State<PrivacyPolicyScreen> createState() => _PrivacyPolicyScreenState();
}

class _PrivacyPolicyScreenState extends State<PrivacyPolicyScreen> {
  late final policy = rootBundle.loadString('assets/privacy_policy.txt');
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('プライバシーポリシー')),
    body: FutureBuilder<String>(
      future: policy,
      builder: (context, snapshot) => snapshot.hasData
          ? PageBody(children: [SelectableText(snapshot.data!)])
          : Center(
              child: snapshot.hasError
                  ? const Text('表示できませんでした')
                  : const CircularProgressIndicator(),
            ),
    ),
  );
}
