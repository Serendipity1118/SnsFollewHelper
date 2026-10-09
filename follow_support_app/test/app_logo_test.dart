import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('the logo shown on the home and about screens is bundled', () async {
    final data = await rootBundle.load('assets/app_logo.png');
    final bytes = data.buffer.asUint8List(0, 4);

    expect(bytes, [0x89, 0x50, 0x4e, 0x47]);
  });
}
