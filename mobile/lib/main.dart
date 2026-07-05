import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/login.dart';
import 'screens/roster.dart';

void main() {
  runApp(const FamsMobileApp());
}

class FamsMobileApp extends StatelessWidget {
  const FamsMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FAMS.aero',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const AuthChecker(),
    );
  }
}

class AuthChecker extends StatefulWidget {
  const AuthChecker({super.key});

  @override
  State<AuthChecker> createState() => _AuthCheckerState();
}

class _AuthCheckerState extends State<AuthChecker> {
  bool _isLoading = true;
  String? _token;

  @override
  void initState() {
    super.initState();
    _checkToken();
  }

  Future<void> _checkToken() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _token = prefs.getString('fams_token');
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_token == null) {
      return LoginScreen(onLoginSuccess: _checkToken);
    }

    return RosterScreen(token: _token!, onLogout: () async {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fams_token');
      _checkToken();
    });
  }
}
