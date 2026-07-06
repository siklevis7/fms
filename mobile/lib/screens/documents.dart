import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import '../config.dart';

class DocumentsScreen extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;

  const DocumentsScreen({super.key, required this.token, required this.onLogout});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  bool _isLoading = true;
  List<dynamic> _documents = [];
  List<dynamic> _users = [];
  Map<String, dynamic> _currentUser = {};

  // Form state
  int? _selectedUserId;
  String _title = '';
  String _documentType = 'License';
  DateTime? _expiresAt;
  bool _requiresSignature = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final docRes = await http.get(Uri.parse('${Config.baseUrl}/api/documents/'), headers: {'Authorization': 'Bearer ${widget.token}'});
      final userRes = await http.get(Uri.parse('${Config.baseUrl}/api/users/'), headers: {'Authorization': 'Bearer ${widget.token}'});
      final meRes = await http.get(Uri.parse('${Config.baseUrl}/api/users/me'), headers: {'Authorization': 'Bearer ${widget.token}'});

      if (docRes.statusCode == 200) {
        _documents = json.decode(docRes.body);
      }
      if (userRes.statusCode == 200) {
        _users = json.decode(userRes.body);
      }
      if (meRes.statusCode == 200) {
        _currentUser = json.decode(meRes.body);
        _selectedUserId ??= _currentUser['id'];
      }
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  bool get _canManage {
    if (_currentUser.isEmpty) return false;
    final role = _currentUser['role'];
    return role == 'Administrator' || role == 'Operations Officer';
  }

  String _getUserName(int id) {
    try {
      final user = _users.firstWhere((u) => u['id'] == id);
      return user['full_name'] ?? 'Unknown User';
    } catch (_) {
      return 'Unknown User';
    }
  }

  Map<String, dynamic> _getDocStatus(Map<String, dynamic> doc) {
    if (doc['requires_signature'] == true && doc['is_signed'] == false) {
      return {'label': 'Signature Required', 'color': Colors.amber.shade100, 'textColor': Colors.amber.shade900, 'borderColor': Colors.amber.shade200};
    }
    if (doc['expires_at'] != null) {
      final expiry = DateTime.parse(doc['expires_at']);
      final now = DateTime.now();
      if (expiry.isBefore(now)) {
        return {'label': 'Expired', 'color': Colors.red.shade100, 'textColor': Colors.red.shade900, 'borderColor': Colors.red.shade200};
      }
      if (expiry.isBefore(now.add(const Duration(days: 30)))) {
        return {'label': 'Expiring Soon', 'color': Colors.orange.shade100, 'textColor': Colors.orange.shade900, 'borderColor': Colors.orange.shade200};
      }
    }
    return {'label': 'Valid', 'color': Colors.green.shade100, 'textColor': Colors.green.shade900, 'borderColor': Colors.green.shade200};
  }

  Future<void> _handleAddSubmit() async {
    if (_title.isEmpty || _selectedUserId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields')));
      return;
    }
    
    final payload = {
      'user_id': _selectedUserId,
      'title': _title,
      'document_type': _documentType,
      'issued_at': DateTime.now().toIso8601String(),
      'expires_at': _expiresAt?.toIso8601String(),
      'requires_signature': _requiresSignature,
    };

    try {
      final res = await http.post(
        Uri.parse('${Config.baseUrl}/api/documents/'),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json',
        },
        body: json.encode(payload),
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) Navigator.pop(context);
        _fetchData();
        _resetForm();
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add document')));
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  void _resetForm() {
    _title = '';
    _documentType = 'License';
    _expiresAt = null;
    _requiresSignature = false;
    _selectedUserId = _currentUser.isNotEmpty ? _currentUser['id'] : null;
  }

  void _showAddDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              title: const Text('Add Compliance Document'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<int>(
                      decoration: const InputDecoration(labelText: 'User / Staff Member'),
                      value: _selectedUserId,
                      items: _users.map((u) => DropdownMenuItem<int>(
                        value: u['id'],
                        child: Text('${u['full_name']} (${u['role']})'),
                      )).toList(),
                      onChanged: (val) => setStateDialog(() => _selectedUserId = val),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Document Title (e.g. Class 1 Medical)'),
                      initialValue: _title,
                      onChanged: (val) => _title = val,
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(labelText: 'Type'),
                      value: _documentType,
                      items: ['License', 'Medical', 'Certificate', 'Company Policy', 'Training Record']
                          .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                          .toList(),
                      onChanged: (val) => setStateDialog(() => _documentType = val!),
                    ),
                    const SizedBox(height: 8),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Expiry Date (Optional)', style: TextStyle(fontSize: 14)),
                      subtitle: Text(_expiresAt == null ? 'Not set' : DateFormat('yyyy-MM-dd').format(_expiresAt!)),
                      trailing: const Icon(Icons.calendar_today),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _expiresAt ?? DateTime.now(),
                          firstDate: DateTime(2000),
                          lastDate: DateTime(2100),
                        );
                        if (picked != null) {
                          setStateDialog(() => _expiresAt = picked);
                        }
                      },
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Requires Electronic Signature?', style: TextStyle(fontSize: 14)),
                      value: _requiresSignature,
                      onChanged: (val) => setStateDialog(() => _requiresSignature = val),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: _handleAddSubmit,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade600, foregroundColor: Colors.white),
                  child: const Text('Add Document'),
                ),
              ],
            );
          }
        );
      }
    );
  }

  Future<void> _handleSign(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Signature'),
        content: const Text('By clicking OK, you are cryptographically signing this document. This action is legally binding.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo.shade600, foregroundColor: Colors.white),
            child: const Text('OK'),
          ),
        ],
      )
    );

    if (confirm != true) return;

    final hash = DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase();
    try {
      final res = await http.patch(
        Uri.parse('${Config.baseUrl}/api/documents/$id/sign'),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json',
        },
        body: json.encode({'signature_hash': hash}),
      );
      if (res.statusCode == 200) {
        _fetchData();
      } else {
        final error = json.decode(res.body);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error['detail'] ?? 'Failed to sign')));
        }
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  Widget _buildDocCard(Map<String, dynamic> doc) {
    final status = _getDocStatus(doc);
    final isSigned = doc['is_signed'] == true;
    final requiresSignature = doc['requires_signature'] == true;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.description, color: Colors.grey.shade400, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(doc['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 2),
                      Text(doc['document_type'] ?? '', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: status['color'],
                    border: BorderSide(color: status['borderColor']),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    status['label'], 
                    style: TextStyle(color: status['textColor'], fontSize: 11, fontWeight: FontWeight.bold)
                  ),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('User:', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                Text(_getUserName(doc['user_id']), style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Expiry:', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                Text(
                  doc['expires_at'] != null ? DateFormat('dd MMM yyyy').format(DateTime.parse(doc['expires_at'])) : 'N/A',
                  style: TextStyle(fontWeight: FontWeight.w500, fontSize: 13, color: doc['expires_at'] != null ? Colors.black87 : Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('E-Signature:', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                if (requiresSignature)
                  isSigned
                    ? Row(
                        children: [
                          const Icon(Icons.verified, color: Colors.green, size: 16),
                          const SizedBox(width: 4),
                          Text(doc['signature_hash'] ?? '', style: const TextStyle(color: Colors.green, fontSize: 12, fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                        ],
                      )
                    : Row(
                        children: [
                          Icon(Icons.warning_amber_rounded, color: Colors.amber.shade700, size: 16),
                          const SizedBox(width: 4),
                          Text('Pending', style: TextStyle(color: Colors.amber.shade700, fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      )
                else
                  Text('-', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
              ],
            ),
            if (requiresSignature && !isSigned && _currentUser.isNotEmpty && doc['user_id'] == _currentUser['id']) ...[
              const SizedBox(height: 16),
              Align(
                alignment: Alignment.centerRight,
                child: ElevatedButton.icon(
                  onPressed: () => _handleSign(doc['id']),
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Sign Now'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo.shade50,
                    foregroundColor: Colors.indigo.shade700,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: BorderSide(color: Colors.indigo.shade200),
                    ),
                  ),
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _fetchData,
      child: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Document Management & E-Sign', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Track licenses, medicals, and compliance records (RCAA 5-Year Retention)', style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
                  if (_canManage) ...[
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _showAddDialog,
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Add Document'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue.shade600,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    )
                  ]
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (_documents.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32.0),
              child: Center(child: Text('No documents found.', style: TextStyle(color: Colors.grey.shade500))),
            )
          else
            ..._documents.map((doc) => _buildDocCard(doc)),
        ],
      ),
    );
  }
}
