import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import '../config.dart';

class ScheduleScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const ScheduleScreen({
    Key? key,
    required this.token,
    required this.onLogout,
  }) : super(key: key);

  @override
  _ScheduleScreenState createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  List<dynamic> bookings = [];
  List<dynamic> resources = [];
  List<dynamic> users = [];
  bool loading = true;
  DateTime currentDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _currentDateStartOfDay();
    fetchData();
  }

  void _currentDateStartOfDay() {
    currentDate = DateTime(currentDate.year, currentDate.month, currentDate.day);
  }

  Future<void> fetchData() async {
    setState(() {
      loading = true;
    });

    try {
      final responses = await Future.wait([
        http.get(Uri.parse('${Config.baseUrl}/api/bookings/'),
            headers: {'Authorization': 'Bearer ${widget.token}'}),
        http.get(Uri.parse('${Config.baseUrl}/api/resources/'),
            headers: {'Authorization': 'Bearer ${widget.token}'}),
        http.get(Uri.parse('${Config.baseUrl}/api/users/'),
            headers: {'Authorization': 'Bearer ${widget.token}'}),
      ]);

      if (responses[0].statusCode == 200 &&
          responses[1].statusCode == 200 &&
          responses[2].statusCode == 200) {
        setState(() {
          bookings = json.decode(responses[0].body);
          resources = json.decode(responses[1].body);
          users = json.decode(responses[2].body);
        });
      } else if (responses[0].statusCode == 401 ||
          responses[1].statusCode == 401 ||
          responses[2].statusCode == 401) {
        widget.onLogout();
      }
    } catch (e) {
      debugPrint("Failed to fetch data: $e");
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  void changeDate(int days) {
    setState(() {
      currentDate = currentDate.add(Duration(days: days));
      _currentDateStartOfDay();
    });
  }

  List<dynamic> getTodaysBookings(int resourceId) {
    return bookings.where((b) {
      if (b['resource_id'] != resourceId) return false;
      DateTime start = DateTime.parse(b['start_time']).toLocal();
      DateTime dayStart = DateTime(start.year, start.month, start.day);
      return dayStart.isAtSameMomentAs(currentDate);
    }).toList();
  }

  void showBookingModal([dynamic booking]) {
    showDialog(
      context: context,
      builder: (context) {
        return BookingDialog(
          token: widget.token,
          resources: resources,
          users: users,
          currentDate: currentDate,
          booking: booking,
          onSuccess: () {
            fetchData();
          },
        );
      },
    );
  }

  Color getStatusColor(String status) {
    switch (status) {
      case 'Scheduled':
        return Colors.blue;
      case 'Completed':
        return Colors.green;
      case 'Cancelled':
        return Colors.grey;
      default:
        return Colors.indigo;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Schedule'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => showBookingModal(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Date Navigator
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => changeDate(-1),
                ),
                Text(
                  DateFormat('EEEE, MMMM d, yyyy').format(currentDate),
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => changeDate(1),
                ),
              ],
            ),
          ),
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator())
                : resources.isEmpty
                    ? const Center(
                        child: Text(
                            'No resources found. Seed the database to display resources.'))
                    : ListView.builder(
                        itemCount: resources.length,
                        itemBuilder: (context, index) {
                          final resource = resources[index];
                          final resBookings = getTodaysBookings(resource['id']);

                          return Card(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            child: ExpansionTile(
                              title: Text(
                                resource['name'],
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold),
                              ),
                              subtitle: Text(resource['type']),
                              leading: Icon(
                                resource['type'] == 'Aircraft'
                                    ? Icons.flight
                                    : Icons.access_time,
                              ),
                              children: resBookings.isEmpty
                                  ? [
                                      const Padding(
                                        padding: EdgeInsets.all(16.0),
                                        child: Text('No bookings for today.',
                                            style:
                                                TextStyle(color: Colors.grey)),
                                      )
                                    ]
                                  : resBookings.map((b) {
                                      final start = DateTime.parse(b['start_time']).toLocal();
                                      final end = DateTime.parse(b['end_time']).toLocal();
                                      final statusColor =
                                          getStatusColor(b['status'] ?? '');
                                      
                                      String title = b['student'] != null
                                          ? b['student']['full_name']
                                          : 'Solo Flight';
                                      String subtitle = b['instructor'] != null
                                          ? 'Instructor: ${b['instructor']['full_name']}'
                                          : 'No Instructor';

                                      return ListTile(
                                        title: Text(title),
                                        subtitle: Text(
                                            '$subtitle\n${DateFormat('HH:mm').format(start)} - ${DateFormat('HH:mm').format(end)}'),
                                        isThreeLine: true,
                                        leading: Container(
                                          width: 16,
                                          height: 16,
                                          decoration: BoxDecoration(
                                            color: statusColor,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                        onTap: () => showBookingModal(b),
                                      );
                                    }).toList(),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showBookingModal(),
        child: const Icon(Icons.add),
        tooltip: 'Schedule Flight',
      ),
    );
  }
}

class BookingDialog extends StatefulWidget {
  final String token;
  final List<dynamic> resources;
  final List<dynamic> users;
  final DateTime currentDate;
  final dynamic booking;
  final VoidCallback onSuccess;

  const BookingDialog({
    Key? key,
    required this.token,
    required this.resources,
    required this.users,
    required this.currentDate,
    this.booking,
    required this.onSuccess,
  }) : super(key: key);

  @override
  _BookingDialogState createState() => _BookingDialogState();
}

class _BookingDialogState extends State<BookingDialog> {
  String? resourceId;
  String? instructorId;
  String? studentId;
  TimeOfDay? startTime;
  TimeOfDay? endTime;
  String error = '';
  bool isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.booking != null) {
      resourceId = widget.booking['resource_id']?.toString();
      instructorId = widget.booking['instructor_id']?.toString();
      studentId = widget.booking['student_id']?.toString();
      final startDt = DateTime.parse(widget.booking['start_time']).toLocal();
      final endDt = DateTime.parse(widget.booking['end_time']).toLocal();
      startTime = TimeOfDay(hour: startDt.hour, minute: startDt.minute);
      endTime = TimeOfDay(hour: endDt.hour, minute: endDt.minute);
    }
  }

  Future<void> _submit() async {
    setState(() {
      error = '';
      isSubmitting = true;
    });

    try {
      if (resourceId == null || startTime == null || endTime == null) {
        setState(() {
          error = 'Resource, Start Time, and End Time are required.';
          isSubmitting = false;
        });
        return;
      }

      DateTime startIso = DateTime(
          widget.currentDate.year,
          widget.currentDate.month,
          widget.currentDate.day,
          startTime!.hour,
          startTime!.minute);
      DateTime endIso = DateTime(
          widget.currentDate.year,
          widget.currentDate.month,
          widget.currentDate.day,
          endTime!.hour,
          endTime!.minute);

      if (!endIso.isAfter(startIso)) {
        setState(() {
          error = 'End time must be after start time.';
          isSubmitting = false;
        });
        return;
      }

      Map<String, dynamic> payload = {
        'resource_id': int.parse(resourceId!),
        'start_time': startIso.toUtc().toIso8601String(),
        'end_time': endIso.toUtc().toIso8601String(),
      };

      if (instructorId != null && instructorId!.isNotEmpty && instructorId != 'null') {
        payload['instructor_id'] = int.parse(instructorId!);
      }
      if (studentId != null && studentId!.isNotEmpty && studentId != 'null') {
        payload['student_id'] = int.parse(studentId!);
      }

      final url = widget.booking != null
          ? '${Config.baseUrl}/api/bookings/${widget.booking['id']}'
          : '${Config.baseUrl}/api/bookings/';
      final method = widget.booking != null ? 'PUT' : 'POST';

      http.Response res;
      if (method == 'PUT') {
        res = await http.put(
          Uri.parse(url),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${widget.token}',
          },
          body: json.encode(payload),
        );
      } else {
        res = await http.post(
          Uri.parse(url),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${widget.token}',
          },
          body: json.encode(payload),
        );
      }

      if (res.statusCode == 200 || res.statusCode == 201) {
        widget.onSuccess();
        Navigator.of(context).pop();
      } else {
        final data = json.decode(res.body);
        setState(() {
          error = data['detail'] ?? 'Failed to save flight.';
          isSubmitting = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Network error. Please try again.';
        isSubmitting = false;
      });
    }
  }

  Future<void> _selectTime(bool isStart) async {
    final initialTime = isStart
        ? (startTime ?? const TimeOfDay(hour: 9, minute: 0))
        : (endTime ?? const TimeOfDay(hour: 10, minute: 0));
    final picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          startTime = picked;
        } else {
          endTime = picked;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final instructors = widget.users.where((u) => u['role'] == 'Instructor').toList();
    final students = widget.users.where((u) => u['role'] == 'Student').toList();

    return AlertDialog(
      title: Text(widget.booking != null ? 'Edit Flight' : 'Schedule Flight'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (error.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(8),
                color: Colors.red.shade50,
                child: Text(error, style: const TextStyle(color: Colors.red)),
              ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Resource / Aircraft'),
              value: resourceId,
              items: widget.resources.map<DropdownMenuItem<String>>((r) {
                return DropdownMenuItem<String>(
                  value: r['id'].toString(),
                  child: Text('${r['name']} (${r['type']})'),
                );
              }).toList(),
              onChanged: (val) => setState(() => resourceId = val),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Instructor (Optional)'),
              value: instructorId,
              items: [
                const DropdownMenuItem(value: null, child: Text('None (Solo)')),
                ...instructors.map<DropdownMenuItem<String>>((u) {
                  return DropdownMenuItem<String>(
                    value: u['id'].toString(),
                    child: Text(u['full_name']),
                  );
                }).toList(),
              ],
              onChanged: (val) => setState(() => instructorId = val),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Student (Optional)'),
              value: studentId,
              items: [
                const DropdownMenuItem(value: null, child: Text('None')),
                ...students.map<DropdownMenuItem<String>>((u) {
                  return DropdownMenuItem<String>(
                    value: u['id'].toString(),
                    child: Text(u['full_name']),
                  );
                }).toList(),
              ],
              onChanged: (val) => setState(() => studentId = val),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _selectTime(true),
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Start Time'),
                      child: Text(startTime?.format(context) ?? 'Select Time'),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: InkWell(
                    onTap: () => _selectTime(false),
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'End Time'),
                      child: Text(endTime?.format(context) ?? 'Select Time'),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: isSubmitting ? null : _submit,
          child: isSubmitting
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(widget.booking != null ? 'Update' : 'Schedule'),
        ),
      ],
    );
  }
}
