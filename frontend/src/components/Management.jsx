import React, { useState, useEffect } from 'react';
import { Users, MapPin, Search, Plus, Shield, CheckCircle2, XCircle } from 'lucide-react';

export default function Management({ token }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, resourcesRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/users/', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://127.0.0.1:8000/api/resources/', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (usersRes.ok) setUsers(await usersRes.json());
        if (resourcesRes.ok) setResources(await resourcesRes.json());
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'users' ? 'users' : 'resources';
      const res = await fetch(`http://127.0.0.1:8000/api/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({});
        // Refresh data
        if (activeTab === 'users') {
          const uRes = await fetch('http://127.0.0.1:8000/api/users/', { headers: { 'Authorization': `Bearer ${token}` } });
          if (uRes.ok) setUsers(await uRes.json());
        } else {
          const rRes = await fetch('http://127.0.0.1:8000/api/resources/', { headers: { 'Authorization': `Bearer ${token}` } });
          if (rRes.ok) setResources(await rRes.json());
        }
      } else {
        alert('Failed to add ' + (activeTab === 'users' ? 'User' : 'Resource'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
            <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> Users</div>
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'resources' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
            <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> Resources</div>
          </button>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add {activeTab === 'users' ? 'User' : 'Resource'}
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading...</div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{user.full_name}</td>
                    <td className="py-3 px-4 text-slate-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex inline-flex items-center w-fit
                        ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
                          user.role === 'Instructor' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {user.role === 'Admin' && <Shield className="w-3 h-3 mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.is_active ? 
                        <span className="text-emerald-600 flex items-center text-sm font-medium"><CheckCircle2 className="w-4 h-4 mr-1"/> Active</span> : 
                        <span className="text-red-500 flex items-center text-sm font-medium"><XCircle className="w-4 h-4 mr-1"/> Inactive</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="py-3 px-4 font-semibold">Identifier</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(resource => (
                  <tr key={resource.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{resource.name}</td>
                    <td className="py-3 px-4 text-slate-600">{resource.type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                        ${resource.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {resource.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Add New {activeTab === 'users' ? 'User' : 'Resource'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {activeTab === 'users' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input required type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input required type="password" className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                      onChange={(e) => setFormData({...formData, role: e.target.value})}>
                      <option value="">Select a role...</option>
                      <option value="Student">Student</option>
                      <option value="Instructor">Instructor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration / Name</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="e.g. C172-N9999"
                      onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                      onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="">Select a type...</option>
                      <option value="Aircraft">Aircraft</option>
                      <option value="Simulator">Simulator</option>
                      <option value="Classroom">Classroom</option>
                    </select>
                  </div>
                </>
              )}
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
