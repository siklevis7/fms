import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class Config {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:8000';
    }
    if (Platform.isAndroid) {
      // 10.0.2.2 is the special alias for the host loopback interface in Android emulators
      return 'http://10.0.2.2:8000';
    }
    return 'http://127.0.0.1:8000';
  }
}
