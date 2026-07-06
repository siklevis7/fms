import 'package:flutter/material.dart';
import 'roster.dart';
import 'profile.dart';
import 'schedule.dart';
import 'management.dart';
import 'documents.dart';
import 'maintenance.dart';
import 'mass_balance.dart';
import 'weather_notams.dart';
import 'reports.dart';
import '../main.dart'; // to access themeNotifier

class MainLayout extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const MainLayout({super.key, required this.token, required this.onLogout});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;
  String _appBarTitle = 'Schedule';

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      ScheduleScreen(token: widget.token, onLogout: widget.onLogout), // 0
      RosterScreen(token: widget.token, onLogout: widget.onLogout), // 1
      ManagementScreen(token: widget.token, onLogout: widget.onLogout), // 2
      DocumentsScreen(token: widget.token, onLogout: widget.onLogout), // 3
      MaintenanceScreen(token: widget.token, onLogout: widget.onLogout), // 4
      MassBalanceScreen(token: widget.token, onLogout: widget.onLogout), // 5
      WeatherNotamsScreen(token: widget.token, onLogout: widget.onLogout), // 6
      ReportsScreen(token: widget.token, onLogout: widget.onLogout), // 7
      ProfileScreen(token: widget.token, onLogout: widget.onLogout), // 8
    ];
  }

  void _onItemTapped(int index, String title) {
    setState(() {
      _currentIndex = index;
      _appBarTitle = title;
    });
    Navigator.pop(context); // Close the drawer
  }

  @override
  Widget build(BuildContext context) {
    final isDark = themeNotifier.value == ThemeMode.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(_appBarTitle),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () {
              themeNotifier.value = isDark ? ThemeMode.light : ThemeMode.dark;
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: Color(0xFF0F172A)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Text('KFMS Mobile', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Aviation Management', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.calendar_today),
              title: const Text('Schedule'),
              selected: _currentIndex == 0,
              onTap: () => _onItemTapped(0, 'Schedule'),
            ),
            ListTile(
              leading: const Icon(Icons.people),
              title: const Text('My Roster'),
              selected: _currentIndex == 1,
              onTap: () => _onItemTapped(1, 'My Roster'),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard),
              title: const Text('Management'),
              selected: _currentIndex == 2,
              onTap: () => _onItemTapped(2, 'Management'),
            ),
            ListTile(
              leading: const Icon(Icons.folder),
              title: const Text('Documents'),
              selected: _currentIndex == 3,
              onTap: () => _onItemTapped(3, 'Documents'),
            ),
            ListTile(
              leading: const Icon(Icons.build),
              title: const Text('Maintenance'),
              selected: _currentIndex == 4,
              onTap: () => _onItemTapped(4, 'Maintenance'),
            ),
            ListTile(
              leading: const Icon(Icons.scale),
              title: const Text('Mass & Balance'),
              selected: _currentIndex == 5,
              onTap: () => _onItemTapped(5, 'Mass & Balance'),
            ),
            ListTile(
              leading: const Icon(Icons.cloud),
              title: const Text('Weather / NOTAMs'),
              selected: _currentIndex == 6,
              onTap: () => _onItemTapped(6, 'Weather / NOTAMs'),
            ),
            ListTile(
              leading: const Icon(Icons.pie_chart),
              title: const Text('Reports'),
              selected: _currentIndex == 7,
              onTap: () => _onItemTapped(7, 'Reports'),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('My Profile'),
              selected: _currentIndex == 8,
              onTap: () => _onItemTapped(8, 'My Profile'),
            ),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Logout', style: TextStyle(color: Colors.red)),
              onTap: widget.onLogout,
            ),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
    );
  }
}
