import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, UserPlus, Clock, ShieldAlert, CheckCircle2, UserCircle, Briefcase, Plus } from 'lucide-react';

export default function CrewRoster({ token, user }) {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [duties, setDuties] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUserId, setModalUserId] = useState('');
  const [dutyInputs, setDutyInputs] = useState({
    duty_type: 'Standby',
    start_time: '',
    end_time: '',
    notes: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const [uRes, bRes, dRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/users/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://127.0.0.1:8000/api/bookings/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://127.0.0.1:8000/api/duties/', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.filter(u => ['Instructor', 'Examiner', 'Operations Officer', 'Maintenance Engineer'].includes(u.role)));
      }
      if (bRes.ok) {
        setBookings(await bRes.json());
      }
      if (dRes.ok) {
        setDuties(await dRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Utility to generate the 7 days of the currently viewed week
  const getDaysInWeek = () => {
    const days = [];
    const startOfWeek = new Date(viewDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Start on Monday
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getEventsForUserAndDay = (userId, dateObj) => {
    const targetDateStr = dateObj.toISOString().split('T')[0];
    
    // Filter bookings where user is instructor (or student)
    const userBookings = bookings.filter(b => 
      (b.instructor_id === userId || b.student_id === userId) && 
      b.start_time.startsWith(targetDateStr)
    ).map(b => ({
      id: `b-${b.id}`,
      title: `Flight: ${b.resource?.name}`,
      start: new Date(b.start_time),
      end: new Date(b.end_time),
      type: 'flight',
      status: b.status
    }));

    // Filter duties
    const userDuties = duties.filter(d => 
      d.user_id === userId && 
      d.start_time.startsWith(targetDateStr)
    ).map(d => ({
      id: `d-${d.id}`,
      title: d.duty_type,
      start: new Date(d.start_time),
      end: new Date(d.end_time),
      type: 'duty',
      rawDutyType: d.duty_type
    }));

    // Sort combined events chronologically
    return [...userBookings, ...userDuties].sort((a, b) => a.start - b.start);
  };

  const saveDuty = async () => {
    setErrorMsg('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/duties/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: parseInt(modalUserId),
          duty_type: dutyInputs.duty_type,
          start_time: new Date(dutyInputs.start_time).toISOString(),
          end_time: new Date(dutyInputs.end_time).toISOString(),
          notes: dutyInputs.notes
        })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || 'Failed to assign duty');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    }
  };

  const deleteDuty = async (dutyId) => {
    if (!window.confirm("Remove this duty assignment?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/duties/${dutyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const days = getDaysInWeek();

  // Color mapping
  const getColor = (event) => {
    if (event.type === 'flight') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (event.rawDutyType === 'Standby') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (event.rawDutyType === 'Leave' || event.rawDutyType === 'Day Off') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Ground Training
  };

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <CalendarIcon className="w-8 h-8 mr-3 text-indigo-600" /> Crew Roster & Duty Tracking
          </h1>
          <p className="text-slate-500 mt-2">Manage staff assignments, standby shifts, and rest periods to comply with FTL.</p>
        </div>
        {(user.role === 'Administrator' || user.role === 'Operations Officer') && (
          <button 
            onClick={() => {
              setDutyInputs({ duty_type: 'Standby', start_time: '', end_time: '', notes: '' });
              setModalUserId(users[0]?.id || '');
              setErrorMsg('');
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-bold flex items-center transition-colors shadow-sm"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Assign Duty
          </button>
        )}
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 shadow-sm">
        <button 
          onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 7); setViewDate(d); }}
          className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2"
        >
          &larr; Previous Week
        </button>
        <h2 className="text-lg font-bold text-slate-800">
          Week of {days[0].toLocaleDateString()}
        </h2>
        <button 
          onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 7); setViewDate(d); }}
          className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2"
        >
          Next Week &rarr;
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <th className="p-4 w-64 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">Crew Member</th>
              {days.map(d => (
                <th key={d.toISOString()} className="p-4 text-center min-w-[160px] border-r border-slate-200 last:border-0">
                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="p-4 border-r border-slate-200 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                  <div className="flex items-center">
                    <UserCircle className="w-8 h-8 text-slate-400 mr-3" />
                    <div>
                      <p className="font-bold text-slate-800">{u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.role}</p>
                      {u.medical_expiry && (
                        <p className={`text-[10px] mt-1 font-semibold ${new Date(u.medical_expiry) < new Date() ? 'text-red-500' : 'text-emerald-500'}`}>
                          Med Exp: {new Date(u.medical_expiry).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                
                {days.map(d => {
                  const events = getEventsForUserAndDay(u.id, d);
                  return (
                    <td key={d.toISOString()} className="p-3 border-r border-slate-200 align-top h-24 last:border-0">
                      <div className="space-y-2">
                        {events.length === 0 ? (
                          <div className="text-xs text-slate-300 text-center mt-6">Clear</div>
                        ) : (
                          events.map(ev => (
                            <div 
                              key={ev.id} 
                              className={`p-2 rounded border text-xs font-medium group relative ${getColor(ev)}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold truncate pr-2">{ev.title}</span>
                                {ev.type === 'duty' && (user.role === 'Administrator' || user.role === 'Operations Officer') && (
                                  <button onClick={() => deleteDuty(ev.id.replace('d-', ''))} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity">
                                    &times;
                                  </button>
                                )}
                              </div>
                              <div className="text-[10px] opacity-80 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {ev.start.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})} - {ev.end.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Duty Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Briefcase className="w-6 h-6 mr-3 text-indigo-400" /> Assign Duty
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <div className="p-6 space-y-5">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-medium flex items-start">
                  <ShieldAlert className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Staff Member</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
                  value={modalUserId}
                  onChange={e => setModalUserId(e.target.value)}
                >
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Duty Type</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
                  value={dutyInputs.duty_type}
                  onChange={e => setDutyInputs({...dutyInputs, duty_type: e.target.value})}
                >
                  <option value="Standby">Standby (Reserve)</option>
                  <option value="Ground Training">Ground Training</option>
                  <option value="Leave">Annual Leave</option>
                  <option value="Day Off">Day Off</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Start Time</label>
                  <input 
                    type="datetime-local" 
                    lang="en-GB"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    value={dutyInputs.start_time}
                    onChange={e => setDutyInputs({...dutyInputs, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">End Time</label>
                  <input 
                    type="datetime-local" 
                    lang="en-GB"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    value={dutyInputs.end_time}
                    onChange={e => setDutyInputs({...dutyInputs, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes (Optional)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  value={dutyInputs.notes}
                  onChange={e => setDutyInputs({...dutyInputs, notes: e.target.value})}
                  placeholder="e.g. Airport Standby, Recurrent SEP"
                />
              </div>

              <button 
                onClick={saveDuty}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" /> Confirm Duty Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
