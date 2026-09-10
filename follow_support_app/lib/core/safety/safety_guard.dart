import '../domain.dart';
import 'safety_policy.dart';

class SafetyDecision {
  const SafetyDecision(this.hourCount, this.dayCount, this.retryAt);
  final int hourCount;
  final int dayCount;
  final DateTime? retryAt;
  bool get allowed => retryAt == null;
}

class SafetyGuard {
  const SafetyGuard(this.clock, {this.policy = const SafetyPolicy()});
  final AppClock clock;
  final SafetyPolicy policy;
  SafetyDecision evaluate(List<DateTime> followedDates) {
    final now = clock.now();
    final day =
        followedDates
            .where((d) => !d.isBefore(now.subtract(const Duration(hours: 24))))
            .toList()
          ..sort();
    final hour = day
        .where((d) => !d.isBefore(now.subtract(const Duration(hours: 1))))
        .toList();
    DateTime? retry;
    void check(List<DateTime> dates, int limit, Duration window) {
      if (dates.length < limit) return;
      // SQLite dates have second precision. The lower bound is inclusive.
      final at = dates[dates.length - limit]
          .add(window)
          .add(const Duration(seconds: 1));
      if (retry == null || at.isAfter(retry!)) retry = at;
    }

    check(hour, policy.rolling1hFollowLimit, const Duration(hours: 1));
    check(day, policy.rolling24hFollowLimit, const Duration(hours: 24));
    return SafetyDecision(hour.length, day.length, retry);
  }
}
