import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Activity, Plane, FileText, Download, ShieldAlert, Calendar } from 'lucide-react';

const Reports = ({ token, user }) => {
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchAnalytics();
 }, []);

 const fetchAnalytics = async () => {
 try {
 const res = await fetch('http://127.0.0.1:8000/api/reports/analytics', {
 headers: { 'Authorization': `Bearer ${token}` }
 });
 if (res.ok) {
 setData(await res.json());
 }
 } catch (err) {
 console.error("Failed to fetch analytics:", err);
 } finally {
 setLoading(false);
 }
 };

 if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading analytics data...</div>;
 if (!data) return <div className="p-8 text-center text-rose-500">Failed to load analytics data.</div>;

 const total = data.total_bookings || 1; // Prevent division by zero
 const completionRate = Math.round((data.completed_bookings / total) * 100) || 0;
 const cancellationRate = Math.round((data.cancelled_bookings / total) * 100) || 0;

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
 <div>
 <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics & Reporting</h1>
 <p className="text-slate-500 dark:text-slate-400">Fleet utilization, flight completion rates, and compliance summary</p>
 </div>
 <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 :bg-slate-600 transition-colors flex items-center font-medium border border-slate-300 dark:border-slate-600">
 <Download size={18} className="mr-2"/>
 Export CSV
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-semibold text-slate-600 dark:text-slate-300">Total Flights</h3>
 <Activity className="text-blue-500 w-5 h-5"/>
 </div>
 <p className="text-3xl font-bold text-slate-800 dark:text-white">{data.total_bookings}</p>
 <p className="text-xs text-slate-400 mt-1">All time scheduled</p>
 </div>
 
 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-semibold text-slate-600 dark:text-slate-300">Flight Hours</h3>
 <Plane className="text-indigo-500 w-5 h-5"/>
 </div>
 <p className="text-3xl font-bold text-slate-800 dark:text-white">{data.total_flight_hours.toFixed(1)} <span className="text-lg text-slate-500 dark:text-slate-400">hrs</span></p>
 <p className="text-xs text-slate-400 mt-1">Total PIC & Dual logged</p>
 </div>

 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-rose-200 bg-rose-50 dark:bg-rose-900/20">
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-semibold text-rose-800">Active Findings</h3>
 <ShieldAlert className="text-rose-500 w-5 h-5"/>
 </div>
 <p className="text-3xl font-bold text-rose-700 dark:text-rose-400">{data.active_findings}</p>
 <p className="text-xs text-rose-500 mt-1">Open RCAA / Audit CAPs</p>
 </div>

 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-amber-200 bg-amber-50 dark:bg-amber-900/20">
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-semibold text-amber-800">Expiring Docs</h3>
 <FileText className="text-amber-500 w-5 h-5"/>
 </div>
 <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{data.expiring_documents}</p>
 <p className="text-xs text-amber-600 mt-1">Expiring within 30 days</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
 <div className="flex items-center mb-6">
 <PieChart className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2"/>
 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Scheduled vs Realized</h3>
 </div>
 
 <div className="space-y-6">
 <div>
 <div className="flex justify-between text-sm font-semibold mb-1">
 <span className="text-emerald-700 dark:text-emerald-400">Completed ({data.completed_bookings})</span>
 <span className="text-slate-500 dark:text-slate-400">{completionRate}%</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
 <div className="bg-emerald-500 h-3 rounded-full"style={{ width: `${completionRate}%` }}></div>
 </div>
 </div>

 <div>
 <div className="flex justify-between text-sm font-semibold mb-1">
 <span className="text-rose-700 dark:text-rose-400">Cancelled ({data.cancelled_bookings})</span>
 <span className="text-slate-500 dark:text-slate-400">{cancellationRate}%</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
 <div className="bg-rose-500 h-3 rounded-full"style={{ width: `${cancellationRate}%` }}></div>
 </div>
 </div>

 <div>
 <div className="flex justify-between text-sm font-semibold mb-1">
 <span className="text-blue-700">Scheduled/Upcoming ({data.scheduled_bookings})</span>
 <span className="text-slate-500 dark:text-slate-400">{Math.round((data.scheduled_bookings / total) * 100) || 0}%</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
 <div className="bg-blue-500 h-3 rounded-full"style={{ width: `${Math.round((data.scheduled_bookings / total) * 100) || 0}%` }}></div>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
 <div className="flex items-center mb-6">
 <BarChart3 className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2"/>
 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Fleet Utilization</h3>
 </div>
 
 <div className="space-y-5">
 {data.fleet_utilization && data.fleet_utilization.length > 0 ? (
 data.fleet_utilization.sort((a,b) => b.hours - a.hours).map((fleet, idx) => {
 const maxHours = Math.max(...data.fleet_utilization.map(f => f.hours)) || 1;
 const width = Math.round((fleet.hours / maxHours) * 100);
 return (
 <div key={idx}>
 <div className="flex justify-between text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
 <span>{fleet.name}</span>
 <span>{fleet.hours.toFixed(1)} hrs</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
 <div className="bg-indigo-500 h-2 rounded-full"style={{ width: `${width}%` }}></div>
 </div>
 </div>
 );
 })
 ) : (
 <p className="text-slate-500 dark:text-slate-400 text-sm">No fleet data available.</p>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

export default Reports;
