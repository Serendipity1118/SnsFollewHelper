class SafetyPolicy {
  const SafetyPolicy({
    this.rolling1hFollowLimit = 15,
    this.rolling24hFollowLimit = 60,
  });
  final int rolling1hFollowLimit;
  final int rolling24hFollowLimit;
  static const notice =
      '本制限値はSNS運営会社が保証する安全値ではありません。短時間・大量の連続操作を抑止するためのアプリ独自の安全マージンです。';
}
