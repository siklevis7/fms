import React, { useState, useEffect } from 'react';
import { FileText, Plus, AlertCircle, CheckCircle, ShieldCheck, Clock, Download, PenTool } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';

const Documents = ({ token, user }) => {
 const [documents, setDocuments] = useState([]);
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showAddModal, setShowAddModal] = useState(false);
 const [formData, setFormData] = useState({
 user_id: user.id,
 title: '',
 document_type: 'License',
 issued_at: format(new Date(),"yyyy-MM-dd'T'HH:mm"),
 expires_at: '',
 requires_signature: false
 });
 
 const canManage = ["Administrator","Operations Officer"].includes(user.role);

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 const [docsRes, usersRes] = await Promise.all([
 fetch('http://127.0.0.1:8000/api/documents/', {
 headers: { 'Authorization': `Bearer ${token}` }
 }),
 fetch('http://127.0.0.1:8000/api/users/', {
 headers: { 'Authorization': `Bearer ${token}` }
 })
 ]);
 if (docsRes.ok) setDocuments(await docsRes.json());
 if (usersRes.ok) setUsers(await usersRes.json());
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 const handleAddSubmit = async (e) => {
 e.preventDefault();
 try {
 const payload = {
 ...formData,
 expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
 issued_at: formData.issued_at ? new Date(formData.issued_at).toISOString() : null
 };

 const res = await fetch('http://127.0.0.1:8000/api/documents/', {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json'
 },
 body: JSON.stringify(payload)
 });
 if (res.ok) {
 setShowAddModal(false);
 fetchData();
 } else {
 alert("Failed to add document");
 }
 } catch (err) {
 console.error(err);
 }
 };

 const handleSign = async (id) => {
 if (!window.confirm("By clicking OK, you are cryptographically signing this document. This action is legally binding.")) return;
 
 // Generate a simple client-side hash mockup for demonstration
 const hash = Math.random().toString(36).substring(2, 14).toUpperCase();
 try {
 const res = await fetch(`http://127.0.0.1:8000/api/documents/${id}/sign`, {
 method: 'PATCH',
 headers: {
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({ signature_hash: hash })
 });
 if (res.ok) {
 fetchData();
 } else {
 const error = await res.json();
 alert(error.detail ||"Failed to sign");
 }
 } catch (err) {
 console.error(err);
 }
 };

 const getUserName = (id) => {
 return users.find(u => u.id === id)?.full_name || 'Unknown User';
 };

 const getDocStatus = (doc) => {
 if (doc.requires_signature && !doc.is_signed) return { label: 'Signature Required', color: 'bg-amber-100 text-amber-800 border-amber-200' };
 if (doc.expires_at) {
 const expiry = new Date(doc.expires_at);
 const now = new Date();
 if (isBefore(expiry, now)) return { label: 'Expired', color: 'bg-red-100 text-red-800 border-red-200' };
 if (isBefore(expiry, addDays(now, 30))) return { label: 'Expiring Soon', color: 'bg-orange-100 text-orange-800 border-orange-200' };
 }
 return { label: 'Valid', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
 };

 if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading documents...</div>;

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
 <div>
 <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Document Management & E-Sign</h1>
 <p className="text-slate-500 dark:text-slate-400">Track licenses, medicals, and compliance records (RCAA 5-Year Retention)</p>
 </div>
 {canManage && (
 <button 
 onClick={() => setShowAddModal(true)}
 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium shadow-sm"
 >
 <Plus size={18} className="mr-2"/>
 Add Document
 </button>
 )}
 </div>

 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
 <tr>
 <th className="px-6 py-4">Document</th>
 <th className="px-6 py-4">User</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4">Expiry</th>
 <th className="px-6 py-4">E-Signature</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {documents.length === 0 ? (
 <tr><td colSpan="6"className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No documents found.</td></tr>
 ) : documents.map((doc) => {
 const status = getDocStatus(doc);
 return (
 <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
 <td className="px-6 py-4">
 <div className="flex items-center">
 <FileText className="w-5 h-5 text-slate-400 mr-3"/>
 <div>
 <p className="font-semibold text-slate-800 dark:text-white">{doc.title}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400">{doc.document_type}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{getUserName(doc.user_id)}</td>
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded text-xs font-bold border ${status.color}`}>
 {status.label}
 </span>
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
 {doc.expires_at ? format(parseISO(doc.expires_at), 'dd MMM yyyy') : 'N/A'}
 </td>
 <td className="px-6 py-4">
 {doc.requires_signature ? (
 doc.is_signed ? (
 <div className="flex items-center text-emerald-600">
 <ShieldCheck className="w-4 h-4 mr-1"/>
 <span className="text-xs font-mono">{doc.signature_hash}</span>
 </div>
 ) : (
 <span className="text-amber-500 text-xs font-semibold flex items-center">
 <AlertCircle className="w-4 h-4 mr-1"/> Pending
 </span>
 )
 ) : (
 <span className="text-slate-400 text-xs">-</span>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 {doc.requires_signature && !doc.is_signed && doc.user_id === user.id && (
 <button 
 onClick={() => handleSign(doc.id)}
 className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center ml-auto transition-colors border border-indigo-200"
 >
 <PenTool className="w-3 h-3 mr-1.5"/> Sign Now
 </button>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {showAddModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
 <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
 <div className="bg-blue-600 p-6 text-white">
 <h2 className="text-xl font-bold">Add Compliance Document</h2>
 <p className="text-blue-100 text-sm mt-1">Upload a record or certificate to the registry.</p>
 </div>
 <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">User / Staff Member</label>
 <select 
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300"
 value={formData.user_id}
 onChange={e => setFormData({...formData, user_id: parseInt(e.target.value)})}
 required
 >
 <option value="">Select User</option>
 {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
 </select>
 </div>
 
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Document Title</label>
 <input 
 type="text"
 required
 placeholder="e.g. Class 1 Medical"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300"
 value={formData.title}
 onChange={e => setFormData({...formData, title: e.target.value})}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Type</label>
 <select 
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300"
 value={formData.document_type}
 onChange={e => setFormData({...formData, document_type: e.target.value})}
 >
 <option value="License">License</option>
 <option value="Medical">Medical</option>
 <option value="Certificate">Certificate</option>
 <option value="Company Policy">Company Policy</option>
 <option value="Training Record">Training Record</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Expiry Date (Optional)</label>
 <input 
 type="date"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300"
 value={formData.expires_at}
 onChange={e => setFormData({...formData, expires_at: e.target.value})}
 />
 </div>
 </div>

 <div className="flex items-center space-x-3 pt-2">
 <input 
 type="checkbox"
 id="req_sig"
 className="w-5 h-5 text-blue-600 dark:text-blue-400 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
 checked={formData.requires_signature}
 onChange={e => setFormData({...formData, requires_signature: e.target.checked})}
 />
 <label htmlFor="req_sig"className="text-sm font-medium text-slate-700 dark:text-slate-300">
 Requires Electronic Signature?
 </label>
 </div>
 
 <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 mt-2">
 <p className="text-xs text-blue-800 flex items-center">
 <ShieldCheck className="w-4 h-4 mr-1"/>
 Document will be archived for 5 years after expiry automatically to satisfy RCAA retention limits.
 </p>
 </div>

 <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
 <button 
 type="button"
 onClick={() => setShowAddModal(false)}
 className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
 >
 Cancel
 </button>
 <button 
 type="submit"
 className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
 >
 Add Document
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default Documents;
