enum PlatformType {
  x('X'),
  instagram('Instagram');

  const PlatformType(this.label);
  final String label;
  static PlatformType parse(String input) =>
      switch (input.trim().toLowerCase()) {
        'x' || 'twitter' => x,
        'instagram' || 'ig' => instagram,
        _ => throw const FormatException('SNS種別が不正です'),
      };
}

enum TargetStatus {
  pending('未処理'),
  followed('今回新しくフォローした'),
  previouslyFollowed('以前からフォロー済み'),
  requested('フォロー申請済み'),
  notFollowed('未フォロー'),
  privateAccount('非公開'),
  suspended('凍結・停止'),
  notFound('存在しない'),
  skipped('スキップ');

  const TargetStatus(this.label);
  final String label;
}

enum ActionType {
  profileOpened,
  statusChanged,
  cancelled,
  reassigned,
  memoChanged,
}

abstract interface class AppClock {
  DateTime now();
}

class SystemClock implements AppClock {
  const SystemClock();
  @override
  DateTime now() => DateTime.now().toUtc();
}

String normalizeUsername(String input, PlatformType platform) {
  var value = input.trim();
  if (value.startsWith('https://') || value.startsWith('http://')) {
    final uri = Uri.tryParse(value);
    final hosts = platform == PlatformType.x
        ? ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com']
        : ['instagram.com', 'www.instagram.com'];
    if (uri == null ||
        !hosts.contains(uri.host) ||
        uri.pathSegments.where((s) => s.isNotEmpty).length != 1) {
      throw const FormatException('プロフィールURLからユーザー名を取得できません');
    }
    value = uri.pathSegments.first;
  }
  value = value.replaceFirst(RegExp(r'^@+'), '');
  final valid = platform == PlatformType.x
      ? RegExp(r'^[a-zA-Z0-9_]{1,15}$')
      : RegExp(r'^[a-zA-Z0-9_.]{1,30}$');
  if (!valid.hasMatch(value)) throw const FormatException('ユーザー名が不正です');
  return value;
}

Uri profileUrl(PlatformType platform, String username, [String? override]) {
  if (override != null && override.trim().isNotEmpty) {
    final text = override.trim();
    final uri = Uri.tryParse(text);
    if (uri == null ||
        uri.scheme != 'https' ||
        uri.host.isEmpty ||
        uri.userInfo.isNotEmpty ||
        RegExp(r'\s').hasMatch(text) ||
        text.contains('\\')) {
      throw const FormatException('有効なHTTPS URLを指定してください');
    }
    return uri;
  }
  return platform == PlatformType.x
      ? Uri.https('x.com', '/$username')
      : Uri.https('www.instagram.com', '/$username/');
}
