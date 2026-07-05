import React, { useState } from 'react'
import Login from './components/Login'
import DispatchCalendar from './components/DispatchCalendar'
import Management from './components/Management'

function App() {
  const [token, setToken] = useState(localStorage.getItem('fams_token'));
  const [navTab, setNavTab] = useState('calendar');

  const handleLogin = (newToken) => {
    localStorage.setItem('fams_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('fams_token');
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-white tracking-wider mr-4">FAMS<span className="text-blue-500">.aero</span></h1>
          <button 
            onClick={() => setNavTab('calendar')}
            className={`text-sm font-medium transition-colors ${navTab === 'calendar' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
            Dispatch Calendar
          </button>
          <button 
            onClick={() => setNavTab('management')}
            className={`text-sm font-medium transition-colors ${navTab === 'management' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
            Management
          </button>
        </div>
        <button 
          onClick={handleLogout}
          className="text-sm text-slate-300 hover:text-white transition-colors">
          Logout
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {navTab === 'calendar' ? (
            <DispatchCalendar token={token} />
          ) : (
            <Management token={token} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
