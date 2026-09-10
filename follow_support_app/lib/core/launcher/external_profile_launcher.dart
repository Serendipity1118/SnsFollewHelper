import 'package:url_launcher/url_launcher.dart';
import '../db/app_database.dart';
import '../domain.dart';

abstract interface class ExternalProfileLauncher {
  Future<bool> open(TargetAccount target);
}

class UrlLauncherProfileLauncher implements ExternalProfileLauncher {
  @override
  Future<bool> open(TargetAccount target) async {
    if (target.isSample) return false;
    final uri = profileUrl(target.platform, target.username, target.profileUrl);
    try {
      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      return false;
    }
  }
}
