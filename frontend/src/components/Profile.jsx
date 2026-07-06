import React, { useState, useEffect } from 'react';
import { UserCircle, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Profile({ token }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    weight: 0,
    role: ''
  });

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          dob: data.dob ? data.dob.split('T')[0] : '', // Extract just YYYY-MM-DD
          weight: data.weight || 0,
          role: data.role || ''
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        dob: formData.dob ? new Date(formData.dob).toISOString() : null,
      };

      const res = await fetch('http://127.0.0.1:8000/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <UserCircle className="w-10 h-10 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
          <p className="text-slate-500 text-sm">Manage your personal details and aviation records</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Profile updated successfully!
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 border-b pb-2">Personal Details</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Full Name</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2" placeholder="+250..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Date of Birth</label>
                <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 border-b pb-2">Aviation Details</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Assigned Role</label>
                <input type="text" value={formData.role} disabled className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-lg px-4 py-2 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Body Weight (kg)</label>
                <div className="relative">
                  <input required type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value) || 0})} className="w-full bg-blue-50 border border-blue-300 text-blue-900 font-bold rounded-lg px-4 py-2 pr-12" />
                  <span className="absolute right-4 top-2.5 text-blue-500 font-bold text-sm">kg</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Required for accurate Mass & Balance calculations.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end">
            <button disabled={saving} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center transition-colors shadow-sm disabled:opacity-50">
              <Save className="w-5 h-5 mr-2" /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
