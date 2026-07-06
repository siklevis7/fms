import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wrench, CheckCircle } from 'lucide-react';

export default function Maintenance({ token }) {
  const [squawks, setSquawks] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    resource_id: '',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSquawks, resResources] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/squawks/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://127.0.0.1:8000/api/resources/', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (resSquawks.ok && resResources.ok) {
        setSquawks(await resSquawks.json());
        setResources(await resResources.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleReportSquawk = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/squawks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resource_id: parseInt(formData.resource_id),
          description: formData.description
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchData();
      } else {
        alert('Failed to report squawk.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearSquawk = async (squawkId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/squawks/${squawkId}/clear`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('You do not have permission to clear this squawk (Admin or Instructor only).');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-center p-8 text-slate-500">Loading Maintenance...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Wrench className="w-5 h-5 mr-2 text-slate-500" />
          Aircraft Maintenance & Squawks
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" /> Report Squawk
        </button>
      </div>

      <div className="p-6">
        {squawks.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
            <p>All aircraft are healthy. No active squawks reported!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {squawks.map(squawk => (
              <div key={squawk.id} className={`p-4 rounded-lg border flex items-center justify-between ${squawk.status === 'Open' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-bold text-slate-800">{squawk.resource?.name} ({squawk.resource?.type})</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${squawk.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {squawk.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{squawk.description}</p>
                  <div className="text-xs text-slate-400">
                    Reported by {squawk.reporter?.full_name} • {new Date(squawk.reported_at).toLocaleString()}
                    {squawk.status === 'Fixed' && ` • Cleared by ${squawk.fixed_by?.full_name}`}
                  </div>
                </div>
                {squawk.status === 'Open' && (
                  <button 
                    onClick={() => handleClearSquawk(squawk.id)}
                    className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded font-medium text-sm transition-colors">
                    Clear Squawk
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-red-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" /> Report Aircraft Defect
              </h3>
            </div>
            <form onSubmit={handleReportSquawk} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aircraft</label>
                <select required className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                  onChange={(e) => setFormData({...formData, resource_id: e.target.value})}>
                  <option value="">Select an aircraft...</option>
                  {resources.filter(r => r.type === 'Aircraft').map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Squawk)</label>
                <textarea required className="w-full border border-slate-300 rounded-lg px-3 py-2 h-32" 
                  placeholder="e.g. Right main tire worn past limits..."
                  onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                  Ground Aircraft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
