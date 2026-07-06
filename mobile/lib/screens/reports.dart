import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';

class ReportsScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const ReportsScreen({super.key, required this.token, required this.onLogout});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _data;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _fetchAnalytics() async {
    try {
      final res = await http.get(
        Uri.parse('${Config.baseUrl}/api/reports/analytics'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200) {
        setState(() {
          _data = json.decode(res.body);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to fetch analytics data.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Network error fetching analytics.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error.isNotEmpty) {
      return Center(child: Text(_error, style: const TextStyle(color: Colors.red)));
    }

    if (_data == null) {
      return const Center(child: Text('No data available.'));
    }

    final total = (_data!['total_bookings'] as num?)?.toInt() ?? 1;
    final int safeTotal = total == 0 ? 1 : total;
    
    final completed = (_data!['completed_bookings'] as num?)?.toInt() ?? 0;
    final cancelled = (_data!['cancelled_bookings'] as num?)?.toInt() ?? 0;
    final scheduled = (_data!['scheduled_bookings'] as num?)?.toInt() ?? 0;
    
    final int completionRate = ((completed / safeTotal) * 100).round();
    final int cancellationRate = ((cancelled / safeTotal) * 100).round();
    final int scheduledRate = ((scheduled / safeTotal) * 100).round();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Analytics & Reporting', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('CSV Export not available on mobile.')));
                },
                icon: const Icon(Icons.download),
                label: const Text('Export CSV'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          _buildStatCard('Total Flights', Icons.show_chart, Colors.blue, _data!['total_bookings'].toString(), 'All time scheduled'),
          const SizedBox(height: 8),
          _buildStatCard('Flight Hours', Icons.flight, Colors.indigo, '${_data!['total_flight_hours']?.toStringAsFixed(1) ?? '0.0'} hrs', 'Total PIC & Dual logged'),
          const SizedBox(height: 8),
          _buildStatCard('Active Findings', Icons.warning, Colors.red, _data!['active_findings'].toString(), 'Open RCAA / Audit CAPs', bgColor: Colors.red.shade50),
          const SizedBox(height: 8),
          _buildStatCard('Expiring Docs', Icons.insert_drive_file, Colors.orange, _data!['expiring_documents'].toString(), 'Expiring within 30 days', bgColor: Colors.orange.shade50),
          
          const SizedBox(height: 24),
          const Text('Scheduled vs Realized', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          
          _buildProgressBar('Completed ($completed)', completionRate, Colors.green),
          const SizedBox(height: 12),
          _buildProgressBar('Cancelled ($cancelled)', cancellationRate, Colors.red),
          const SizedBox(height: 12),
          _buildProgressBar('Scheduled/Upcoming ($scheduled)', scheduledRate, Colors.blue),
          
          const SizedBox(height: 24),
          const Text('Fleet Utilization', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          
          if (_data!['fleet_utilization'] != null && (_data!['fleet_utilization'] as List).isNotEmpty)
            ...(_data!['fleet_utilization'] as List).map((fleet) {
              final fleetMap = fleet as Map<String, dynamic>;
              final double hours = (fleetMap['hours'] as num?)?.toDouble() ?? 0.0;
              final String name = fleetMap['name'] ?? 'Unknown';
              
              final allHours = (_data!['fleet_utilization'] as List).map((f) => (f['hours'] as num?)?.toDouble() ?? 0.0).toList();
              final double maxHours = allHours.isEmpty ? 1.0 : allHours.reduce((a, b) => a > b ? a : b);
              final safeMax = maxHours == 0 ? 1.0 : maxHours;
              
              final int width = ((hours / safeMax) * 100).round();
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: _buildProgressBar('$name (${hours.toStringAsFixed(1)} hrs)', width, Colors.indigo),
              );
            }).toList()
          else
            const Text('No fleet data available.', style: TextStyle(color: Colors.grey)),
            
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, IconData icon, Color iconColor, String value, String subtitle, {Color? bgColor}) {
    return Card(
      color: bgColor,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                Icon(icon, color: iconColor),
              ],
            ),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar(String label, int percentage, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            Text('$percentage%', style: const TextStyle(color: Colors.grey, fontSize: 14)),
          ],
        ),
        const SizedBox(height: 4),
        Container(
          height: 8,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(4),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: percentage / 100.0,
            child: Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
