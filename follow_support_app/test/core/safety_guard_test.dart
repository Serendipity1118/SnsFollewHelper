import 'package:flutter_test/flutter_test.dart';
import 'package:follow_support_app/core/safety/safety_guard.dart';
import '../support.dart';

void main() {
  late FakeClock clock;
  late SafetyGuard guard;
  setUp(() {
    clock = FakeClock();
    guard = SafetyGuard(clock);
  });
  test('14 allowed / 15 blocked and no session or interval restriction', () {
    expect(guard.evaluate(List.filled(14, clock.now())).allowed, true);
    final blocked = guard.evaluate(List.filled(15, clock.now()));
    expect(blocked.allowed, false);
    expect(
      blocked.retryAt,
      clock.now().add(const Duration(hours: 1, seconds: 1)),
    );
    expect(guard.evaluate([]).allowed, true);
  });
  test('59 allowed / 60 blocked outside one-hour window', () {
    final earlier = clock.now().subtract(const Duration(hours: 2));
    expect(guard.evaluate(List.filled(59, earlier)).allowed, true);
    expect(guard.evaluate(List.filled(60, earlier)).allowed, false);
  });
  test('inclusive hour boundary expires one second later', () {
    final dates = List.filled(
      15,
      clock.now().subtract(const Duration(hours: 1)),
    );
    expect(guard.evaluate(dates).allowed, false);
    clock.time = clock.time.add(const Duration(seconds: 1));
    expect(guard.evaluate(dates).allowed, true);
  });
  test('inclusive day boundary and midnight do not reset counts', () {
    final dates = List.filled(
      60,
      clock.now().subtract(const Duration(hours: 24)),
    );
    expect(guard.evaluate(dates).dayCount, 60);
    clock.time = clock.time.add(const Duration(seconds: 1));
    expect(guard.evaluate(dates).dayCount, 0);
    clock.time = DateTime.utc(2026, 9, 10, 0, 1);
    expect(
      guard.evaluate(List.filled(15, DateTime.utc(2026, 9, 9, 23, 55))).allowed,
      false,
    );
  });
  test('retry waits until enough records expire and both windows clear', () {
    final dates = [
      ...List.filled(46, clock.now().subtract(const Duration(hours: 2))),
      ...List.filled(16, clock.now()),
    ];
    final decision = guard.evaluate(dates);
    expect(
      decision.retryAt,
      clock.now().add(const Duration(hours: 22, seconds: 1)),
    );
    clock.time = decision.retryAt!;
    expect(guard.evaluate(dates).allowed, true);
  });
  test('clock rollback conservatively retains future dated records', () {
    expect(
      guard
          .evaluate(
            List.filled(15, clock.now().add(const Duration(minutes: 5))),
          )
          .allowed,
      false,
    );
  });
}
