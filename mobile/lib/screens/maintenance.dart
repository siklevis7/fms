import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

class MaintenanceScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const MaintenanceScreen({Key? key, required this.token, required this.onLogout}) : super(key: key);

  @override
  _MaintenanceScreenState createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen> {
  List<dynamic> squawks = [];
  List<dynamic> resources = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  Future<void> fetchData() async {
    setState(() {
      loading = true;
    });
    try {
      final squawksRes = await http.get(
        Uri.parse('${Config.baseUrl}/api/squawks/'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      final resourcesRes = await http.get(
        Uri.parse('${Config.baseUrl}/api/resources/'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );

      if (squawksRes.statusCode == 200 && resourcesRes.statusCode == 200) {
        setState(() {
          squawks = json.decode(squawksRes.body);
          resources = json.decode(resourcesRes.body);
        });
      }
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  Future<void> handleReportSquawk(int resourceId, String description) async {
    try {
      final res = await http.post(
        Uri.parse('${Config.baseUrl}/api/squawks/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
        body: json.encode({
          'resource_id': resourceId,
          'description': description,
        }),
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        fetchData();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to report squawk.')),
          );
        }
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  Future<void> handleClearSquawk(int squawkId) async {
    try {
      final res = await http.patch(
        Uri.parse('${Config.baseUrl}/api/squawks/$squawkId/clear'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200) {
        fetchData();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('You do not have permission to clear this squawk (Admin or Instructor only).')),
          );
        }
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  void _showReportDialog() {
    final aircrafts = resources.where((r) => r['type'] == 'Aircraft').toList();
    int? selectedResourceId;
    final descriptionController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Row(
                children: const [
                  Icon(Icons.warning, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Report Aircraft Defect', style: TextStyle(color: Colors.red)),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<int>(
                      decoration: const InputDecoration(
                        labelText: 'Aircraft',
                        border: OutlineInputBorder(),
                      ),
                      items: aircrafts.map((r) {
                        return DropdownMenuItem<int>(
                          value: r['id'],
                          child: Text(r['name']),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          selectedResourceId = val;
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: descriptionController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Description (Squawk)',
                        hintText: 'e.g. Right main tire worn past limits...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  onPressed: () {
                    if (selectedResourceId != null && descriptionController.text.isNotEmpty) {
                      Navigator.pop(context);
                      handleReportSquawk(selectedResourceId!, descriptionController.text);
                    }
                  },
                  child: const Text('Ground Aircraft', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          }
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Colors.red,
        onPressed: _showReportDialog,
        icon: const Icon(Icons.warning, color: Colors.white),
        label: const Text('Report Squawk', style: TextStyle(color: Colors.white)),
      ),
      body: squawks.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.check_circle, size: 64, color: Colors.green),
                  SizedBox(height: 16),
                  Text('All aircraft are healthy. No active squawks reported!', style: TextStyle(fontSize: 16)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: squawks.length,
              itemBuilder: (context, index) {
                final squawk = squawks[index];
                final isOpen = squawk['status'] == 'Open';
                
                final resourceName = squawk['resource']?['name'] ?? '';
                final resourceType = squawk['resource']?['type'] ?? '';
                final reporterName = squawk['reporter']?['full_name'] ?? '';
                
                String reportedAt = '';
                if (squawk['reported_at'] != null) {
                  try {
                    reportedAt = DateTime.parse(squawk['reported_at']).toLocal().toString();
                    reportedAt = reportedAt.split('.')[0];
                  } catch (e) {
                    reportedAt = squawk['reported_at'];
                  }
                }
                
                final fixedByName = squawk['fixed_by']?['full_name'] ?? '';

                return Card(
                  color: isOpen ? Colors.red.shade50 : Colors.green.shade50,
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    side: BorderSide(color: isOpen ? Colors.red.shade200 : Colors.green.shade200),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('$resourceName ($resourceType)', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isOpen ? Colors.red.shade100 : Colors.green.shade100,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                squawk['status'] ?? '',
                                style: TextStyle(
                                  color: isOpen ? Colors.red.shade700 : Colors.green.shade700,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            )
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(squawk['description'] ?? ''),
                        const SizedBox(height: 8),
                        Text(
                          'Reported by $reporterName • $reportedAt${!isOpen && fixedByName.isNotEmpty ? ' • Cleared by $fixedByName' : ''}',
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        if (isOpen) ...[
                          const SizedBox(height: 16),
                          Align(
                            alignment: Alignment.centerRight,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green.shade100,
                                foregroundColor: Colors.green.shade700,
                              ),
                              onPressed: () => handleClearSquawk(squawk['id']),
                              child: const Text('Clear Squawk'),
                            ),
                          )
                        ]
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
