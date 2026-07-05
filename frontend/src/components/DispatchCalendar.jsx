import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, addHours, differenceInMinutes, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, MapPin, Loader2 } from 'lucide-react';

export default function DispatchCalendar({ token }) {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resBookings, resResources] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/bookings/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://127.0.0.1:8000/api/resources/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (resBookings.ok && resResources.ok) {
          setBookings(await resBookings.json());
          setResources(await resResources.json());
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, currentDate]);

  // Timeline configuration
  const START_HOUR = 6; // 6 AM
  const END_HOUR = 22; // 10 PM
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const HOUR_WIDTH = 120; // pixels per hour

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  const getBookingStyle = (booking) => {
    const start = parseISO(booking.start_time);
    const end = parseISO(booking.end_time);
    const dayStart = addHours(currentDate, START_HOUR);
    
    // Calculate pixels based on minutes from timeline start
    const offsetMinutes = differenceInMinutes(start, dayStart);
    const durationMinutes = differenceInMinutes(end, start);
    
    const left = (offsetMinutes / 60) * HOUR_WIDTH;
    const width = (durationMinutes / 60) * HOUR_WIDTH;

    return {
      left: `${Math.max(0, left)}px`,
      width: `${width}px`,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-500 border-blue-600';
      case 'Completed': return 'bg-emerald-500 border-emerald-600';
      case 'Cancelled': return 'bg-slate-400 border-slate-500';
      default: return 'bg-indigo-500 border-indigo-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Filter bookings to only show current date
  const todaysBookings = bookings.filter(b => {
    const start = parseISO(b.start_time);
    return start >= currentDate && start < addDays(currentDate, 1);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-lg">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span>{format(currentDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div> Scheduled</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> Completed</div>
        </div>
      </div>

      {/* Gantt Timeline */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Time Header */}
          <div className="flex border-b border-slate-200 bg-slate-100/50">
            <div className="w-48 shrink-0 border-r border-slate-200 p-4 font-semibold text-slate-600 flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] relative z-10 bg-slate-50">
              Resource / Aircraft
            </div>
            <div className="flex relative" style={{ width: `${TOTAL_HOURS * HOUR_WIDTH}px` }}>
              {hours.map(hour => (
                <div key={hour} className="shrink-0 border-r border-slate-200 text-xs text-slate-500 font-medium p-2" style={{ width: `${HOUR_WIDTH}px` }}>
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
              ))}
            </div>
          </div>

          {/* Resource Rows */}
          {resources.map(resource => (
            <div key={resource.id} className="flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
              {/* Resource Label */}
              <div className="w-48 shrink-0 border-r border-slate-200 p-4 flex flex-col justify-center bg-white group-hover:bg-slate-50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] relative z-10">
                <span className="font-bold text-slate-800">{resource.name}</span>
                <span className="text-xs text-slate-500 flex items-center mt-1">
                  {resource.type === 'Aircraft' ? <MapPin className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1"/>}
                  {resource.type}
                </span>
              </div>
              
              {/* Timeline Row */}
              <div className="relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTE5LjUgMEwxMTkuNSAxMDAiIHN0cm9rZT0iI2YxZjVmOSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] bg-repeat" style={{ width: `${TOTAL_HOURS * HOUR_WIDTH}px` }}>
                {todaysBookings
                  .filter(b => b.resource_id === resource.id)
                  .map(booking => (
                  <div 
                    key={booking.id}
                    className={`absolute top-2 bottom-2 rounded-md shadow-sm border text-white p-2 text-xs overflow-hidden ${getStatusColor(booking.status)} hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 cursor-pointer transition-all`}
                    style={getBookingStyle(booking)}
                    title={`${booking.student?.full_name} with ${booking.instructor?.full_name}`}
                  >
                    <div className="font-semibold truncate">{booking.student ? booking.student.full_name : 'Solo Flight'}</div>
                    <div className="text-white/80 truncate mt-0.5">{booking.instructor ? booking.instructor.full_name : 'No Instructor'}</div>
                    <div className="text-white/60 text-[10px] mt-1 hidden sm:block">
                      {format(parseISO(booking.start_time), 'HH:mm')} - {format(parseISO(booking.end_time), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {resources.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No resources found. Seed the database to display resources.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
