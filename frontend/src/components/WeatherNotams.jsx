import React, { useState, useEffect } from 'react';
import { Cloud, Wind, Thermometer, Navigation, Search, Map, Info, AlertTriangle } from 'lucide-react';

export default function WeatherNotams({ token }) {
  const [icao, setIcao] = useState('HRYR'); // Default to Kigali International
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async () => {
    if (!icao) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/weather/${icao}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      } else {
        setError('Failed to fetch weather data. Check the ICAO code.');
      }
    } catch (err) {
      setError('Network error while fetching weather.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWeather();
  };

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <Cloud className="w-8 h-8 mr-3 text-sky-500" /> Weather & NOTAMs
          </h1>
          <p className="text-slate-500 mt-2">Real-time METAR, TAF, and live global wind tracking via Windy.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Search Bar */}
        <div className="col-span-12">
          <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center max-w-lg">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input 
              type="text" 
              value={icao}
              onChange={(e) => setIcao(e.target.value.toUpperCase())}
              placeholder="Enter ICAO Code (e.g. HRYR, KATL)"
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-bold uppercase placeholder:normal-case placeholder:font-normal"
              maxLength={4}
            />
            <button type="submit" disabled={loading} className="ml-4 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* METAR & TAF Results */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          {error && (
             <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start">
               <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
               <span className="text-sm font-medium">{error}</span>
             </div>
          )}

          {!error && weather?.metar && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-sky-900 p-4 flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center">
                  <Thermometer className="w-5 h-5 mr-2 text-sky-300" /> Live METAR
                </h2>
                <span className="text-xs text-sky-300 bg-sky-800 px-2 py-1 rounded">AviationWeather.gov</span>
              </div>
              <div className="p-5">
                <p className="font-mono text-sm text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed">
                  {weather.metar.rawOb}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Temperature</p>
                    <p className="text-lg font-bold text-slate-700">{weather.metar.temp}°C</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dewpoint</p>
                    <p className="text-lg font-bold text-slate-700">{weather.metar.dewp}°C</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wind</p>
                    <p className="text-lg font-bold text-slate-700 flex items-center">
                      <Wind className="w-4 h-4 mr-1 text-sky-500" /> {weather.metar.wdir}° @ {weather.metar.wspd}kt
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Altimeter</p>
                    <p className="text-lg font-bold text-slate-700">{weather.metar.altim} hPa</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!error && weather?.taf && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-900 p-4 flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center">
                  <Navigation className="w-5 h-5 mr-2 text-indigo-300" /> Terminal Forecast (TAF)
                </h2>
              </div>
              <div className="p-5">
                <p className="font-mono text-sm text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-line">
                  {weather.taf.rawTAF.replace(/ (BECMG|FM|PROB|TEMPO) /g, '\n$1 ')}
                </p>
              </div>
            </div>
          )}
          
          {!error && !weather?.metar && !loading && (
             <div className="bg-slate-50 border border-slate-200 text-slate-500 p-6 rounded-xl text-center">
               <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
               <p className="text-sm font-medium">No METAR data available for {icao}.</p>
             </div>
          )}
        </div>

        {/* Windy Iframe & Mock NOTAMs */}
        <div className="col-span-12 md:col-span-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 p-4 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center">
                <Map className="w-5 h-5 mr-2 text-emerald-400" /> Live Weather Radar
              </h2>
              <span className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded">Powered by Windy</span>
            </div>
            <div className="h-[500px] w-full bg-slate-100 flex items-center justify-center">
              {weather?.airport ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=kt&zoom=7&overlay=wind&product=ecmwf&level=surface&lat=${weather.airport.lat}&lon=${weather.airport.lon}`}
                  frameBorder="0"
                  title="Windy Map"
                ></iframe>
              ) : (
                <div className="text-slate-500 font-medium">Search for a valid airport to display the weather map.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-500 p-4">
              <h2 className="font-bold text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" /> Active NOTAMs
              </h2>
            </div>
            <div className="p-0 divide-y divide-slate-100">
              {weather ? (
                 <>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">A0023/26</span>
                        <span className="text-xs text-slate-400 font-bold">Valid: 01 JUL 00:00 - 31 AUG 23:59</span>
                      </div>
                      <p className="font-mono text-sm text-slate-700">A) {weather?.airport?.icaoId || icao} B) 2607010000 C) 2608312359<br/>E) RWY 10/28 WIP. MEN AND EQPT ADJ TO TWY A. EXER CAUTION.</p>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">A0024/26</span>
                        <span className="text-xs text-slate-400 font-bold">Valid: 05 JUL 08:00 - 10 JUL 16:00</span>
                      </div>
                      <p className="font-mono text-sm text-slate-700">A) {weather?.airport?.icaoId || icao} B) 2607050800 C) 2607101600<br/>E) ILS GLIDE PATH RWY 28 OUT OF SERVICE DUE TO MAINTENANCE.</p>
                    </div>
                 </>
              ) : (
                 <div className="p-5 text-slate-500 text-center font-medium">No NOTAMs loaded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
