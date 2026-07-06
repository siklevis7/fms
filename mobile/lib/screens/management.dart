import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config.dart';

class ManagementScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const ManagementScreen({
    Key? key,
    required this.token,
    required this.onLogout,
  }) : super(key: key);

  @override
  _ManagementScreenState createState() => _ManagementScreenState();
}

class _ManagementScreenState extends State<ManagementScreen> {
  List<dynamic> users = [];
  List<dynamic> resources = [];
  String activeTab = 'users';

  int? editingUserId;
  int? editingResourceId;

  Map<String, dynamic> userForm = {
    'full_name': '',
    'email': '',
    'role': 'Student Pilot',
    'password': ''
  };

  Map<String, dynamic> resourceForm = {
    'name': '',
    'type': 'Aircraft',
    'status': 'Active',
    'basic_empty_weight': 0.0,
    'empty_moment': 0.0,
    'max_takeoff_weight': 0.0,
    'arm_front_seats': 0.0,
    'arm_rear_seats': 0.0,
    'arm_baggage_1': 0.0,
    'arm_fuel': 0.0,
  };

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  Future<void> fetchData() async {
    try {
      final userResFuture = http.get(
        Uri.parse('${Config.baseUrl}/api/users/'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      final resourceResFuture = http.get(
        Uri.parse('${Config.baseUrl}/api/resources/'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );

      final results = await Future.wait([userResFuture, resourceResFuture]);
      final uRes = results[0];
      final rRes = results[1];

      if (uRes.statusCode == 200) {
        setState(() {
          users = jsonDecode(uRes.body);
        });
      }
      if (rRes.statusCode == 200) {
        setState(() {
          resources = jsonDecode(rRes.body);
        });
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  Future<void> handleUserSubmit() async {
    final url = editingUserId != null
        ? '${Config.baseUrl}/api/users/$editingUserId'
        : '${Config.baseUrl}/api/users/';
    
    try {
      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${widget.token}'
      };
      
      final bodyData = Map<String, dynamic>.from(userForm);
      if (editingUserId != null) {
        bodyData.remove('password');
      }

      final body = jsonEncode(bodyData);
      
      http.Response res;
      if (editingUserId != null) {
        res = await http.put(Uri.parse(url), headers: headers, body: body);
      } else {
        res = await http.post(Uri.parse(url), headers: headers, body: body);
      }

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          userForm = {
            'full_name': '',
            'email': '',
            'role': 'Student Pilot',
            'password': ''
          };
          editingUserId = null;
        });
        fetchData();
      } else {
        final errorData = jsonDecode(res.body);
        _showErrorDialog(errorData['detail'] ?? 'Error');
      }
    } catch (err) {
      debugPrint(err.toString());
    }
  }

  Future<void> handleResourceSubmit() async {
    final url = editingResourceId != null
        ? '${Config.baseUrl}/api/resources/$editingResourceId'
        : '${Config.baseUrl}/api/resources/';
    
    try {
      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${widget.token}'
      };
      final body = jsonEncode(resourceForm);

      http.Response res;
      if (editingResourceId != null) {
        res = await http.put(Uri.parse(url), headers: headers, body: body);
      } else {
        res = await http.post(Uri.parse(url), headers: headers, body: body);
      }

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          resourceForm = {
            'name': '',
            'type': 'Aircraft',
            'status': 'Active',
            'basic_empty_weight': 0.0,
            'empty_moment': 0.0,
            'max_takeoff_weight': 0.0,
            'arm_front_seats': 0.0,
            'arm_rear_seats': 0.0,
            'arm_baggage_1': 0.0,
            'arm_fuel': 0.0,
          };
          editingResourceId = null;
        });
        fetchData();
      }
    } catch (err) {
      debugPrint(err.toString());
    }
  }

  void editUser(dynamic u) {
    setState(() {
      editingUserId = u['id'];
      userForm = {
        'full_name': u['full_name'] ?? '',
        'email': u['email'] ?? '',
        'role': u['role'] ?? 'Student Pilot',
        'password': ''
      };
    });
  }

  void editResource(dynamic r) {
    setState(() {
      editingResourceId = r['id'];
      resourceForm = {
        'name': r['name'] ?? '',
        'type': r['type'] ?? 'Aircraft',
        'status': r['status'] ?? 'Active',
        'basic_empty_weight': (r['basic_empty_weight'] ?? 0).toDouble(),
        'empty_moment': (r['empty_moment'] ?? 0).toDouble(),
        'max_takeoff_weight': (r['max_takeoff_weight'] ?? 0).toDouble(),
        'arm_front_seats': (r['arm_front_seats'] ?? 0).toDouble(),
        'arm_rear_seats': (r['arm_rear_seats'] ?? 0).toDouble(),
        'arm_baggage_1': (r['arm_baggage_1'] ?? 0).toDouble(),
        'arm_fuel': (r['arm_fuel'] ?? 0).toDouble(),
      };
    });
  }

  Future<void> deleteUser(dynamic u) async {
    final confirm = await _showConfirmDialog('Are you sure you want to delete user ${u['full_name']}?');
    if (!confirm) return;

    try {
      final res = await http.delete(
        Uri.parse('${Config.baseUrl}/api/users/${u['id']}'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200 || res.statusCode == 204) {
        fetchData();
      } else {
        _showErrorDialog("Failed to delete user.");
      }
    } catch (err) {
      debugPrint(err.toString());
    }
  }

  Future<void> deleteResource(dynamic r) async {
    final confirm = await _showConfirmDialog('Are you sure you want to delete ${r['name']}?');
    if (!confirm) return;

    try {
      final res = await http.delete(
        Uri.parse('${Config.baseUrl}/api/resources/${r['id']}'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200 || res.statusCode == 204) {
        fetchData();
      } else {
        _showErrorDialog("Failed to delete resource.");
      }
    } catch (err) {
      debugPrint(err.toString());
    }
  }

  Future<bool> _showConfirmDialog(String title) async {
    return await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm'),
        content: Text(title),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('OK')),
        ],
      ),
    ) ?? false;
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Error'),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
        ],
      ),
    );
  }

  Widget _buildTabs() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        ChoiceChip(
          label: const Text('Staff & Students'),
          selected: activeTab == 'users',
          onSelected: (val) {
            if (val) setState(() => activeTab = 'users');
          },
        ),
        const SizedBox(width: 8),
        ChoiceChip(
          label: const Text('Fleet & Resources'),
          selected: activeTab == 'resources',
          onSelected: (val) {
            if (val) setState(() => activeTab = 'resources');
          },
        ),
      ],
    );
  }

  Widget _buildUserForm() {
    return Card(
      key: ValueKey('user_${editingUserId ?? 'new'}'),
      margin: const EdgeInsets.all(16.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(editingUserId != null ? 'Edit User' : 'Add New User', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextFormField(
              initialValue: userForm['full_name'],
              decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
              onChanged: (val) => userForm['full_name'] = val,
            ),
            const SizedBox(height: 16),
            TextFormField(
              initialValue: userForm['email'],
              decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder()),
              keyboardType: TextInputType.emailAddress,
              onChanged: (val) => userForm['email'] = val,
            ),
            if (editingUserId == null) ...[
              const SizedBox(height: 16),
              TextFormField(
                initialValue: userForm['password'],
                decoration: const InputDecoration(labelText: 'Temporary Password', border: OutlineInputBorder()),
                onChanged: (val) => userForm['password'] = val,
              ),
            ],
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: userForm['role'],
              decoration: const InputDecoration(labelText: 'Role', border: OutlineInputBorder()),
              items: [
                'Administrator', 'Operations Officer', 'Instructor', 'Student Pilot',
                'Examiner', 'Maintenance Engineer', 'Finance Officer'
              ].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
              onChanged: (val) => setState(() => userForm['role'] = val!),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                    icon: Icon(editingUserId != null ? Icons.check_circle : Icons.add),
                    label: Text(editingUserId != null ? 'Update User' : 'Create User'),
                    onPressed: handleUserSubmit,
                  ),
                ),
                if (editingUserId != null) ...[
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        editingUserId = null;
                        userForm = {
                          'full_name': '',
                          'email': '',
                          'role': 'Student Pilot',
                          'password': ''
                        };
                      });
                    },
                    child: const Text('Cancel'),
                  ),
                ]
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildNumberField(String label, String key) {
    return TextFormField(
      initialValue: resourceForm[key].toString(),
      decoration: InputDecoration(labelText: label, border: const OutlineInputBorder(), isDense: true),
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      onChanged: (val) {
        resourceForm[key] = double.tryParse(val) ?? 0.0;
      },
    );
  }

  Widget _buildResourceForm() {
    return Card(
      key: ValueKey('resource_${editingResourceId ?? 'new'}'),
      margin: const EdgeInsets.all(16.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(editingResourceId != null ? 'Edit Resource' : 'Add New Resource', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextFormField(
              initialValue: resourceForm['name'],
              decoration: const InputDecoration(labelText: 'Registration / Name', border: OutlineInputBorder()),
              onChanged: (val) => resourceForm['name'] = val,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: resourceForm['type'],
                    decoration: const InputDecoration(labelText: 'Type', border: OutlineInputBorder()),
                    items: ['Aircraft', 'Simulator', 'Classroom']
                        .map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                    onChanged: (val) => setState(() => resourceForm['type'] = val!),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: resourceForm['status'],
                    decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()),
                    items: ['Active', 'Maintenance']
                        .map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                    onChanged: (val) => setState(() => resourceForm['status'] = val!),
                  ),
                ),
              ],
            ),
            if (resourceForm['type'] == 'Aircraft') ...[
              const SizedBox(height: 16),
              const Text('MASS & BALANCE SPECS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
              const SizedBox(height: 8),
              Column(
                children: [
                  Row(children: [ Expanded(child: _buildNumberField('BEW (kg)', 'basic_empty_weight')), const SizedBox(width: 8), Expanded(child: _buildNumberField('MTOW (kg)', 'max_takeoff_weight')) ]),
                  const SizedBox(height: 8),
                  Row(children: [ Expanded(child: _buildNumberField('Empty Moment', 'empty_moment')), const SizedBox(width: 8), Expanded(child: _buildNumberField('Front Seat Arm', 'arm_front_seats')) ]),
                  const SizedBox(height: 8),
                  Row(children: [ Expanded(child: _buildNumberField('Rear Seat Arm', 'arm_rear_seats')), const SizedBox(width: 8), Expanded(child: _buildNumberField('Baggage Arm', 'arm_baggage_1')) ]),
                  const SizedBox(height: 8),
                  Row(children: [ Expanded(child: _buildNumberField('Fuel Arm', 'arm_fuel')), const SizedBox(width: 8), const Spacer() ]),
                ]
              )
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                    icon: Icon(editingResourceId != null ? Icons.check_circle : Icons.add),
                    label: Text(editingResourceId != null ? 'Update Fleet' : 'Add to Fleet'),
                    onPressed: handleResourceSubmit,
                  ),
                ),
                if (editingResourceId != null) ...[
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        editingResourceId = null;
                        resourceForm = {
                          'name': '',
                          'type': 'Aircraft',
                          'status': 'Active',
                          'basic_empty_weight': 0.0,
                          'empty_moment': 0.0,
                          'max_takeoff_weight': 0.0,
                          'arm_front_seats': 0.0,
                          'arm_rear_seats': 0.0,
                          'arm_baggage_1': 0.0,
                          'arm_fuel': 0.0,
                        };
                      });
                    },
                    child: const Text('Cancel'),
                  ),
                ]
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildUsersTable() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Card(
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            columns: const [
              DataColumn(label: Text('Name')),
              DataColumn(label: Text('Role')),
              DataColumn(label: Text('Actions')),
            ],
            rows: users.map((u) {
              return DataRow(cells: [
                DataCell(Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(u['full_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(u['email'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                )),
                DataCell(Text(u['role'] ?? '')),
                DataCell(Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(icon: const Icon(Icons.edit, color: Colors.blue), onPressed: () => editUser(u)),
                    IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => deleteUser(u)),
                  ],
                )),
              ]);
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildResourcesTable() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Card(
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            columns: const [
              DataColumn(label: Text('Resource')),
              DataColumn(label: Text('Status')),
              DataColumn(label: Text('Actions')),
            ],
            rows: resources.map((r) {
              return DataRow(cells: [
                DataCell(Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(r['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(r['type'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                )),
                DataCell(Chip(
                  label: Text(r['status'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 10)),
                  backgroundColor: r['status'] == 'Active' ? Colors.green : Colors.red,
                )),
                DataCell(Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(icon: const Icon(Icons.edit, color: Colors.blue), onPressed: () => editResource(r)),
                    IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => deleteResource(r)),
                  ],
                )),
              ]);
            }).toList(),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          const SizedBox(height: 16),
          _buildTabs(),
          if (activeTab == 'users') ...[
            _buildUserForm(),
            _buildUsersTable(),
          ] else ...[
            _buildResourceForm(),
            _buildResourcesTable(),
          ],
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
