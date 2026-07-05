import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import '../config.dart';

class RosterScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const RosterScreen({super.key, required this.token, required this.onLogout});

  @override
  State<RosterScreen> createState() => _RosterScreenState();
}

class _RosterScreenState extends State<RosterScreen> {
  List<dynamic> _bookings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchBookings();
  }

  Future<void> _fetchBookings() async {
    try {
      final response = await http.get(
        Uri.parse('${Config.baseUrl}/api/bookings/'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );

      if (response.statusCode == 200) {
        setState(() {
          _bookings = json.decode(response.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load roster. Check network.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // slate-50
      appBar: AppBar(
        title: const Text('My Roster', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF0F172A), // slate-900
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchBookings();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: widget.onLogout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _bookings.isEmpty
              ? const Center(
                  child: Text(
                    'No flights scheduled.',
                    style: TextStyle(color: Colors.black54, fontSize: 16),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: _bookings.length,
                  itemBuilder: (context, index) {
                    final booking = _bookings[index];
                    final startTime = DateTime.parse(booking['start_time']);
                    final endTime = DateTime.parse(booking['end_time']);
                    
                    return Card(
                      elevation: 2,
                      margin: const EdgeInsets.only(bottom: 16.0),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    booking['resource']['name'],
                                    style: const TextStyle(
                                      color: Colors.blue,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Text(
                                  booking['status'],
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: booking['status'] == 'Completed' 
                                        ? Colors.green 
                                        : Colors.orange,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                const Icon(Icons.calendar_today, size: 16, color: Colors.black54),
                                const SizedBox(width: 8),
                                Text(
                                  DateFormat('EEEE, MMM d, yyyy').format(startTime),
                                  style: const TextStyle(fontSize: 16),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.access_time, size: 16, color: Colors.black54),
                                const SizedBox(width: 8),
                                Text(
                                  '${DateFormat('HH:mm').format(startTime)} - ${DateFormat('HH:mm').format(endTime)}',
                                  style: const TextStyle(fontSize: 16),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Divider(),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.person, size: 16, color: Colors.black54),
                                const SizedBox(width: 8),
                                Text(
                                  'Instructor: ${booking['instructor'] != null ? booking['instructor']['full_name'] : 'N/A'}',
                                  style: const TextStyle(color: Colors.black87),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.person_outline, size: 16, color: Colors.black54),
                                const SizedBox(width: 8),
                                Text(
                                  'Student: ${booking['student'] != null ? booking['student']['full_name'] : 'Solo'}',
                                  style: const TextStyle(color: Colors.black87),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: booking['status'] == 'Completed' ? null : () => _showSignOffDialog(booking),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0F172A),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: const Text('Sign-off / Grade Flight'),
                              ),
                            )
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  void _showSignOffDialog(dynamic booking) {
    final gradeController = TextEditingController();
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Flight Sign-off'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: gradeController,
              decoration: const InputDecoration(labelText: 'Grade (e.g. Pass, 4/5)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Instructor Notes', border: OutlineInputBorder()),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              setState(() => _isLoading = true);
              try {
                await http.patch(
                  Uri.parse('${Config.baseUrl}/api/bookings/${booking['id']}/signoff'),
                  headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ${widget.token}'},
                  body: json.encode({
                    'grade': gradeController.text,
                    'instructor_notes': notesController.text,
                    'signature_hash': 'demo-signature-hash-12345'
                  }),
                );
                _fetchBookings();
              } catch (e) {
                setState(() => _isLoading = false);
              }
            },
            child: const Text('Sign & Complete'),
          ),
        ],
      ),
    );
  }
}
