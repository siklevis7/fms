import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';

class MassBalanceScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const MassBalanceScreen({super.key, required this.token, required this.onLogout});

  @override
  State<MassBalanceScreen> createState() => _MassBalanceScreenState();
}

class _MassBalanceScreenState extends State<MassBalanceScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _resources = [];
  List<dynamic> _instructors = [];
  
  String? _selectedResourceId;
  Map<String, dynamic>? _activeResource;
  
  String? _selectedInstructorId;
  Map<String, dynamic>? _existingMb;
  
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isSigning = false;

  double _rearSeats = 0;
  double _baggage1 = 0;
  double _fuelLiters = 0;

  Map<String, dynamic>? _calc;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final meRes = await http.get(
        Uri.parse('${Config.baseUrl}/api/users/me'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (meRes.statusCode == 200) {
        _user = json.decode(meRes.body);
      }

      final rRes = await http.get(
        Uri.parse('${Config.baseUrl}/api/resources/'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (rRes.statusCode == 200) {
        final List<dynamic> data = json.decode(rRes.body);
        _resources = data.where((r) => r['type'] == 'Aircraft').toList();
      }

      final uRes = await http.get(
        Uri.parse('${Config.baseUrl}/api/users/'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (uRes.statusCode == 200) {
        final List<dynamic> data = json.decode(uRes.body);
        _instructors = data.where((u) => u['role'] == 'Instructor' || u['role'] == 'Examiner').toList();
      }
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchLatestMB(String resourceId) async {
    try {
      final res = await http.get(
        Uri.parse('${Config.baseUrl}/api/massbalance/$resourceId'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200) {
        final mb = json.decode(res.body);
        setState(() {
          _existingMb = mb;
          _rearSeats = (mb['rear_seats_weight'] ?? 0).toDouble();
          _baggage1 = (mb['baggage_1_weight'] ?? 0).toDouble();
          _fuelLiters = (mb['fuel_gallons'] ?? 0).toDouble();
          _selectedInstructorId = mb['instructor_id']?.toString();
        });
      } else {
        setState(() {
          _existingMb = null;
          _rearSeats = 0;
          _baggage1 = 0;
          _fuelLiters = 0;
          _selectedInstructorId = null;
        });
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  void _onResourceChanged(String? val) {
    setState(() {
      _selectedResourceId = val;
      if (val != null) {
        _activeResource = _resources.firstWhere((r) => r['id'].toString() == val);
        _fetchLatestMB(val);
      } else {
        _activeResource = null;
        _existingMb = null;
      }
    });
  }

  double _getFrontSeatsWeight() {
    double weight = 0;
    if (_user == null) return weight;

    if (_user!['role'] == 'Student Pilot') {
      weight += (_user!['weight'] ?? 0).toDouble();
    } else if (_existingMb != null && _existingMb!['student'] != null) {
      weight += (_existingMb!['student']['weight'] ?? 0).toDouble();
    } else if (_user!['role'] == 'Instructor' || _user!['role'] == 'Examiner') {
      if (_selectedInstructorId == null || _selectedInstructorId == _user!['id'].toString()) {
        weight += (_user!['weight'] ?? 0).toDouble();
      }
    }

    if (_selectedInstructorId != null) {
      final instructor = _instructors.firstWhere((i) => i['id'].toString() == _selectedInstructorId, orElse: () => null);
      if (instructor != null && instructor['id'] != _user!['id']) {
        weight += (instructor['weight'] ?? 0).toDouble();
      }
    }
    return weight;
  }

  void _calculateMB() {
    if (_activeResource == null) {
      setState(() => _calc = null);
      return;
    }

    const double fuelKgPerLiter = 0.72;
    double fuelWeight = _fuelLiters * fuelKgPerLiter;
    double frontSeats = _getFrontSeatsWeight();

    double basicEmptyWeight = (_activeResource!['basic_empty_weight'] ?? 0).toDouble();
    double totalWeight = basicEmptyWeight + frontSeats + _rearSeats + _baggage1 + fuelWeight;
    double zfw = totalWeight - fuelWeight;

    double emptyMoment = (_activeResource!['empty_moment'] ?? 0).toDouble();
    double armFront = (_activeResource!['arm_front_seats'] ?? 0).toDouble();
    double armRear = (_activeResource!['arm_rear_seats'] ?? 0).toDouble();
    double armBaggage = (_activeResource!['arm_baggage_1'] ?? 0).toDouble();
    double armFuel = (_activeResource!['arm_fuel'] ?? 0).toDouble();

    double totalMoment = emptyMoment +
        (frontSeats * armFront) +
        (_rearSeats * armRear) +
        (_baggage1 * armBaggage) +
        (fuelWeight * armFuel);

    double cg = totalWeight > 0 ? (totalMoment / totalWeight) : 0;
    double mtow = (_activeResource!['max_takeoff_weight'] ?? 0).toDouble();

    bool isWithinMTOW = totalWeight <= mtow;
    bool isWithinCG = cg >= 35 && cg <= 47;

    setState(() {
      _calc = {
        'frontSeats': frontSeats,
        'fuelWeight': fuelWeight,
        'totalWeight': totalWeight,
        'zfw': zfw,
        'totalMoment': totalMoment,
        'cg': cg,
        'isWithinMTOW': isWithinMTOW,
        'isWithinCG': isWithinCG,
        'isValid': isWithinMTOW && isWithinCG,
      };
    });
  }

  Future<void> _saveMassBalance() async {
    if (_activeResource == null || _calc == null || _user == null) return;
    setState(() => _isSaving = true);

    final payload = {
      'resource_id': _activeResource!['id'],
      'instructor_id': _selectedInstructorId != null ? int.parse(_selectedInstructorId!) : null,
      'student_id': _user!['role'] == 'Student Pilot' ? _user!['id'] : (_existingMb != null ? _existingMb!['student_id'] : null),
      'front_seats_weight': _calc!['frontSeats'],
      'rear_seats_weight': _rearSeats,
      'baggage_1_weight': _baggage1,
      'fuel_gallons': _fuelLiters, // It's labeled Liters in UI but gallons in DB in the original code
      'zero_fuel_weight': _calc!['zfw'],
      'takeoff_weight': _calc!['totalWeight'],
      'takeoff_cg': _calc!['cg'],
      'is_valid': _calc!['isValid']
    };

    try {
      final res = await http.post(
        Uri.parse('${Config.baseUrl}/api/massbalance/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
        body: json.encode(payload),
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        final newMb = json.decode(res.body);
        setState(() {
          _existingMb = newMb;
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Mass & Balance saved successfully!')));
      }
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _signDocument() async {
    if (_existingMb == null) return;
    setState(() => _isSigning = true);
    try {
      final res = await http.patch(
        Uri.parse('${Config.baseUrl}/api/massbalance/${_existingMb!['id']}/signoff'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200) {
        final signedMb = json.decode(res.body);
        setState(() {
          _existingMb = signedMb;
        });
      }
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      setState(() => _isSigning = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    _calculateMB(); // recalculate on build

    bool isSigned = _existingMb?['signature_hash'] != null;
    bool isInstructor = _user?['role'] == 'Instructor' || _user?['role'] == 'Examiner';
    bool canSign = isInstructor && _existingMb != null && _calc != null && _calc!['isValid'] && !isSigned && (_user!['id'].toString() == _existingMb!['instructor_id']?.toString() || _existingMb!['instructor_id'] == null);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('1. Select Aircraft', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Aircraft'),
            value: _selectedResourceId,
            items: _resources.map((r) => DropdownMenuItem<String>(
              value: r['id'].toString(),
              child: Text(r['name']),
            )).toList(),
            onChanged: _onResourceChanged,
          ),
          const SizedBox(height: 16),
          
          if (_activeResource != null) ...[
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Instructor (PIC)'),
              value: _selectedInstructorId,
              items: [
                const DropdownMenuItem(value: null, child: Text('-- No Instructor (Solo) --')),
                ..._instructors.map((i) => DropdownMenuItem<String>(
                  value: i['id'].toString(),
                  child: Text('${i['full_name']} (${i['weight']} kg)'),
                )),
              ],
              onChanged: (val) {
                setState(() {
                  _selectedInstructorId = val;
                  if (_existingMb != null) _existingMb!['signature_hash'] = null;
                });
              },
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  children: [
                    const Text('2. Enter Load Data', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 16),
                    TextField(
                      readOnly: true,
                      decoration: InputDecoration(
                        labelText: 'Front Seats (Auto: ${_getFrontSeatsWeight()} kg)',
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      decoration: const InputDecoration(labelText: 'Rear Seats (Pax) [kg]', border: OutlineInputBorder()),
                      keyboardType: TextInputType.number,
                      onChanged: (v) {
                        setState(() {
                          _rearSeats = double.tryParse(v) ?? 0;
                          if (_existingMb != null) _existingMb!['signature_hash'] = null;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      decoration: const InputDecoration(labelText: 'Baggage Area 1 [kg]', border: OutlineInputBorder()),
                      keyboardType: TextInputType.number,
                      onChanged: (v) {
                        setState(() {
                          _baggage1 = double.tryParse(v) ?? 0;
                          if (_existingMb != null) _existingMb!['signature_hash'] = null;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      decoration: const InputDecoration(labelText: 'Fuel Load [Liters]', border: OutlineInputBorder()),
                      keyboardType: TextInputType.number,
                      onChanged: (v) {
                        setState(() {
                          _fuelLiters = double.tryParse(v) ?? 0;
                          if (_existingMb != null) _existingMb!['signature_hash'] = null;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            if (_calc != null) ...[
              Card(
                color: _calc!['isWithinMTOW'] ? Colors.green.shade50 : Colors.red.shade50,
                child: ListTile(
                  leading: Icon(_calc!['isWithinMTOW'] ? Icons.check_circle : Icons.warning, color: _calc!['isWithinMTOW'] ? Colors.green : Colors.red),
                  title: const Text('Max Takeoff Weight'),
                  subtitle: Text(_calc!['isWithinMTOW'] ? 'Within limits (${_calc!['totalWeight'].toStringAsFixed(1)} kg)' : 'OVERWEIGHT! (${_calc!['totalWeight'].toStringAsFixed(1)} kg)'),
                ),
              ),
              Card(
                color: _calc!['isWithinCG'] ? Colors.green.shade50 : Colors.red.shade50,
                child: ListTile(
                  leading: Icon(_calc!['isWithinCG'] ? Icons.check_circle : Icons.warning, color: _calc!['isWithinCG'] ? Colors.green : Colors.red),
                  title: const Text('Center of Gravity'),
                  subtitle: Text(_calc!['isWithinCG'] ? 'CG at ${_calc!['cg'].toStringAsFixed(2)} is within limits' : 'CG at ${_calc!['cg'].toStringAsFixed(2)} is OUT OF LIMITS!'),
                ),
              ),
              const SizedBox(height: 16),
            ],

            if (!isSigned || _existingMb == null)
              ElevatedButton(
                onPressed: _isSaving ? null : _saveMassBalance,
                style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
                child: Text(_isSaving ? 'Saving...' : 'Save Mass & Balance'),
              ),
              
            const SizedBox(height: 16),
            
            if (isSigned)
              Card(
                color: Colors.green.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      const Icon(Icons.verified, color: Colors.green, size: 48),
                      const SizedBox(height: 8),
                      const Text('Electronically Signed', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                      Text('Hash: ${_existingMb!['signature_hash']}', style: const TextStyle(fontSize: 12, color: Colors.green)),
                    ],
                  ),
                ),
              )
            else if (canSign)
              ElevatedButton.icon(
                onPressed: _isSigning ? null : _signDocument,
                icon: const Icon(Icons.edit_document),
                label: Text(_isSigning ? 'Signing...' : 'Sign Document (PIC)'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                  backgroundColor: Colors.black87,
                  foregroundColor: Colors.white,
                ),
              ),
          ]
        ],
      ),
    );
  }
}
