import React, { useState, useEffect } from 'react';
import { ShieldAlert, Settings, Plus, CheckCircle, Clock, AlertTriangle, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ComplianceAudits = ({ token, user }) => {
 const [activeTab, setActiveTab] = useState('findings');
 const [findings, setFindings] = useState([]);
 const [settings, setSettings] = useState([]);
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(true);
 
 const [showAddModal, setShowAddModal] = useState(false);
 const [formData, setFormData] = useState({
 title: '',
 description: '',
 level: 'Observation',
 assigned_to: '',
 due_date: ''
 });
 const [editSetting, setEditSetting] = useState(null);
 const [showAddSettingModal, setShowAddSettingModal] = useState(false);
 const [newSettingForm, setNewSettingForm] = useState({
 key: '',
 value: '',
 description: ''
 });

 const KNOWN_RULES = [
 { key: '', label: '-- Select a parameter --', desc: '' },
 { key: 'max_flight_hours_daily', label: 'Max Daily Flight Hours', desc: 'Maximum flight hours allowed in a single day' },
 { key: 'max_duty_hours_daily', label: 'Max Daily Duty Hours', desc: 'Maximum duty hours allowed in a single day' },
 { key: 'min_rest_hours', label: 'Minimum Rest Hours', desc: 'Minimum consecutive rest hours required between duty periods' },
 { key: 'max_flight_hours_28_days', label: 'Max Flight Hours (28 Days)', desc: 'Maximum flight hours allowed in a 28-day period' },
 { key: 'max_flight_hours_yearly', label: 'Max Yearly Flight Hours', desc: 'Maximum flight hours allowed in a calendar year' },
 { key: 'currency_landings_90_days', label: '90-Day Landing Currency', desc: 'Required landings in the last 90 days' },
 { key: 'medical_validity_months', label: 'Medical Validity (Months)', desc: 'Validity period of medical certificate in months' },
 { key: 'max_wind_student_solo_knots', label: 'Max Wind - Student Solo (Knots)', desc: 'Maximum wind limit for student solo flights' }
 ];

 const handleAddSettingSubmit = async (e) => {
 e.preventDefault();
 try {
 const res = await fetch('http://127.0.0.1:8000/api/settings/', {
 method: 'POST',
 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(newSettingForm)
 });
 if (res.ok) {
 setShowAddSettingModal(false);
 setNewSettingForm({ key: '', value: '', description: '' });
 fetchData();
 } else {
 const error = await res.json();
 alert(error.detail || "Failed to add rule");
 }
 } catch (err) {
 console.error(err);
 }
 };

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 const headers = { 'Authorization': `Bearer ${token}` };
 const [findRes, setRes, usersRes] = await Promise.all([
 fetch('http://127.0.0.1:8000/api/findings/', { headers }),
 user.role === 'Administrator' ? fetch('http://127.0.0.1:8000/api/settings/', { headers }) : Promise.resolve(null),
 fetch('http://127.0.0.1:8000/api/users/', { headers })
 ]);
 
 if (findRes.ok) setFindings(await findRes.json());
 if (setRes && setRes.ok) setSettings(await setRes.json());
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
 assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
 due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
 };

 const res = await fetch('http://127.0.0.1:8000/api/findings/', {
 method: 'POST',
 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 if (res.ok) {
 setShowAddModal(false);
 fetchData();
 } else {
 const error = await res.json();
 alert(error.detail ||"Failed to add finding");
 }
 } catch (err) {
 console.error(err);
 }
 };

 const handleUpdateStatus = async (id, newStatus) => {
 try {
 const res = await fetch(`http://127.0.0.1:8000/api/findings/${id}`, {
 method: 'PATCH',
 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: newStatus })
 });
 if (res.ok) {
 fetchData();
 }
 } catch (err) {
 console.error(err);
 }
 };

 const handleSettingSave = async () => {
 try {
 const res = await fetch(`http://127.0.0.1:8000/api/settings/`, {
 method: 'POST',
 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify(editSetting)
 });
 if (res.ok) {
 setEditSetting(null);
 fetchData();
 }
 } catch (err) {
 console.error(err);
 }
 };

 const getLevelColor = (level) => {
 switch(level) {
 case 'Level 1': return 'bg-red-100 text-red-800 border-red-200';
 case 'Level 2': return 'bg-orange-100 text-orange-800 border-orange-200';
 default: return 'bg-blue-100 text-blue-800 border-blue-200 dark:border-blue-800/50 ';
 }
 };

 const getStatusColor = (status) => {
 switch(status) {
 case 'Open': return 'bg-rose-100 text-rose-800';
 case 'CAP Submitted': return 'bg-amber-100 text-amber-800';
 case 'Closed': return 'bg-emerald-100 text-emerald-800';
 default: return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white ';
 }
 };

 const getUserName = (id) => users.find(u => u.id === id)?.full_name || 'Unassigned';

 if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading compliance data...</div>;

 return (
 <div className="space-y-6">
 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
 <div className="flex border-b border-slate-200 dark:border-slate-700">
 <button 
 className={`flex-1 py-4 font-semibold text-sm ${activeTab === 'findings' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 '}`}
 onClick={() => setActiveTab('findings')}
 >
 <ShieldAlert className="inline w-4 h-4 mr-2"/> RCAA Findings & Audits
 </button>
 {user.role === 'Administrator' && (
 <button 
 className={`flex-1 py-4 font-semibold text-sm ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 '}`}
 onClick={() => setActiveTab('settings')}
 >
 <Settings className="inline w-4 h-4 mr-2"/> Compliance Rules Engine
 </button>
 )}
 </div>

 {activeTab === 'findings' && (
 <div className="p-6">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h2 className="text-xl font-bold text-slate-800 dark:text-white">Audit Findings</h2>
 <p className="text-sm text-slate-500 dark:text-slate-400">Track discrepancies and Corrective Action Plans (CAP)</p>
 </div>
 <button 
 onClick={() => setShowAddModal(true)}
 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center"
 >
 <Plus size={16} className="mr-2"/> Log Finding
 </button>
 </div>

 <div className="space-y-4">
 {findings.length === 0 ? (
 <div className="text-center py-8 text-slate-500 dark:text-slate-400">No findings logged.</div>
 ) : findings.map(f => (
 <div key={f.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 flex items-start justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
 <div className="flex-1 pr-6">
 <div className="flex items-center space-x-3 mb-2">
 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getLevelColor(f.level)}`}>
 {f.level}
 </span>
 <h3 className="font-bold text-slate-800 dark:text-white">{f.title}</h3>
 </div>
 <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{f.description}</p>
 <div className="flex items-center space-x-6 text-xs text-slate-500 dark:text-slate-400">
 <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> Issued: {format(parseISO(f.date_issued), 'MMM dd, yyyy')}</span>
 <span className="flex items-center"><AlertTriangle className="w-3 h-3 mr-1 text-orange-500"/> Due: {f.due_date ? format(parseISO(f.due_date), 'MMM dd, yyyy') : 'N/A'}</span>
 <span className="flex items-center font-medium">Assigned to: {getUserName(f.assigned_to)}</span>
 </div>
 </div>
 <div className="flex flex-col items-end space-y-2 w-40">
 <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(f.status)}`}>
 {f.status}
 </span>
 {f.status === 'Open' && (
 <button onClick={() => handleUpdateStatus(f.id, 'CAP Submitted')} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-2">
 Submit CAP
 </button>
 )}
 {f.status === 'CAP Submitted' && user.role === 'Administrator' && (
 <button onClick={() => handleUpdateStatus(f.id, 'Closed')} className="text-xs text-emerald-600 font-semibold hover:underline mt-2">
 Close Finding
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'settings' && (
 <div className="p-6">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Adjustable Compliance Rules</h2>
 <p className="text-sm text-slate-500 dark:text-slate-400">Modify school-level parameters that the legality engine uses.</p>
 </div>
 <button 
 onClick={() => setShowAddSettingModal(true)}
 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center"
 >
 <Plus size={16} className="mr-2"/> Add Rule
 </button>
 </div>
 
 <div className="space-y-4">
 {settings.map(setting => (
 <div key={setting.key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
 <div className="flex-1">
 <h4 className="font-bold text-slate-800 dark:text-white font-mono text-sm">{setting.key}</h4>
 <p className="text-sm text-slate-500 dark:text-slate-400">{setting.description}</p>
 </div>
 
 <div className="flex items-center space-x-3 w-64 justify-end">
 {editSetting?.key === setting.key ? (
 <>
 <input 
 type="text"
 value={editSetting.value} 
 onChange={(e) => setEditSetting({...editSetting, value: e.target.value})}
 className="w-24 px-2 py-1 border border-blue-500 dark:border-blue-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded text-right font-semibold"
 />
 <button onClick={handleSettingSave} className="text-emerald-600 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded hover:bg-emerald-100">Save</button>
 <button onClick={() => setEditSetting(null)} className="text-slate-500 dark:text-slate-400 font-bold text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
 </>
 ) : (
 <>
 <span className="text-lg font-bold text-slate-700 dark:text-slate-300 w-24 text-right pr-2">{setting.value}</span>
 <button onClick={() => setEditSetting(setting)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50">
 <Edit className="w-4 h-4"/>
 </button>
 </>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {showAddModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
 <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
 <div className="bg-rose-600 p-6 text-white">
 <h2 className="text-xl font-bold">Log Audit Finding</h2>
 <p className="text-rose-100 text-sm mt-1">Record an RCAA or Internal Audit discrepancy.</p>
 </div>
 <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title / Reference</label>
 <input 
 type="text"required
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2"
 value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
 />
 </div>
 
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
 <textarea 
 required rows="3"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
 ></textarea>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Level</label>
 <select 
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}
 >
 <option value="Level 1">Level 1</option>
 <option value="Level 2">Level 2</option>
 <option value="Observation">Observation</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Due Date for CAP</label>
 <input 
 type="date"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Assign To (Accountable Manager)</label>
 <select 
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}
 >
 <option value="">-- Unassigned --</option>
 {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
 </select>
 </div>

 <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
 <button type="button"onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
 <button type="submit"className="px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700">Save Finding</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showAddSettingModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
 <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
 <div className="bg-blue-600 p-6 text-white">
 <h2 className="text-xl font-bold">Add Compliance Rule</h2>
 <p className="text-blue-100 text-sm mt-1">Add a new parameter key for the engine.</p>
 </div>
 <form onSubmit={handleAddSettingSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rule Key</label>
 <select 
 required
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={newSettingForm.key} 
 onChange={e => {
 const selected = KNOWN_RULES.find(r => r.key === e.target.value);
 setNewSettingForm({
 ...newSettingForm, 
 key: e.target.value,
 description: selected && selected.desc ? selected.desc : newSettingForm.description
 });
 }}
 >
 {KNOWN_RULES.map(r => (
 <option key={r.key} value={r.key}>{r.key ? `${r.key} - ${r.label}` : r.label}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Value</label>
 <input 
 type="text" required
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={newSettingForm.value} onChange={e => setNewSettingForm({...newSettingForm, value: e.target.value})}
 placeholder="e.g., 14"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
 <textarea 
 rows="3"
 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
 value={newSettingForm.description} onChange={e => setNewSettingForm({...newSettingForm, description: e.target.value})}
 placeholder="Briefly describe what this rule does"
 ></textarea>
 </div>
 <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
 <button type="button" onClick={() => setShowAddSettingModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
 <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Save Rule</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default ComplianceAudits;
