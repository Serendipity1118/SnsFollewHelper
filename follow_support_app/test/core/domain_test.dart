import 'package:flutter_test/flutter_test.dart';
import 'package:follow_support_app/core/domain.dart';

void main() {
  test('username trims @ and preserves first spelling', () {
    expect(
      normalizeUsername(' @Example_User ', PlatformType.x),
      'Example_User',
    );
    expect(
      normalizeUsername(
        'https://www.instagram.com/Some.User/',
        PlatformType.instagram,
      ),
      'Some.User',
    );
    expect(
      normalizeUsername('https://twitter.com/Some_User', PlatformType.x),
      'Some_User',
    );
  });
  for (final input in [
    '',
    '@',
    'a b',
    'bad/name',
    'https://evil.test/name',
    'https://x.com/user/status/1',
    'abcdefghijklmnop',
  ]) {
    test(
      'reject invalid X username: $input',
      () => expect(
        () => normalizeUsername(input, PlatformType.x),
        throwsFormatException,
      ),
    );
  }
  test('platform aliases are case insensitive', () {
    expect(PlatformType.parse(' TWITTER '), PlatformType.x);
    expect(PlatformType.parse('Ig'), PlatformType.instagram);
    expect(() => PlatformType.parse('other'), throwsFormatException);
  });
  test('canonical profile URLs and explicit HTTPS override', () {
    expect(
      profileUrl(PlatformType.x, 'SomeUser').toString(),
      'https://x.com/SomeUser',
    );
    expect(
      profileUrl(PlatformType.instagram, 'some.user').toString(),
      'https://www.instagram.com/some.user/',
    );
    expect(
      profileUrl(PlatformType.x, 'u', 'https://example.org/path?q=1').host,
      'example.org',
    );
  });
  for (final url in [
    'http://x.com/u',
    'javascript:alert(1)',
    'https://',
    'https://user:pass@x.com/u',
    'https://bad host/u',
    'https://x.com\\evil',
  ]) {
    test(
      'reject unsafe or malformed URL: $url',
      () => expect(
        () => profileUrl(PlatformType.x, 'u', url),
        throwsFormatException,
      ),
    );
  }
}
