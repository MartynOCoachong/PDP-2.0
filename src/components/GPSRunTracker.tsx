/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Navigation, Footprints, Clock, Zap, Flame, Compass, ChevronDown, ChevronUp, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RunLog, GPSTrackPoint } from '../types';

interface GPSRunTrackerProps {
  playerId: string;
  onSaveRun: (newRun: Omit<RunLog, 'id' | 'playerId' | 'date'>) => void;
  activeAssignmentId?: string;
  requiredDistanceKm?: number;
}

// Haversine formula to compute distance between two points in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GPSRunTracker({ playerId, onSaveRun, activeAssignmentId, requiredDistanceKm }: GPSRunTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showAlternativeForm, setShowAlternativeForm] = useState(false);
  const [altDistance, setAltDistance] = useState('');
  const [altDurationMin, setAltDurationMin] = useState('');
  const [alternativeSuccessMsg, setAlternativeSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (alternativeSuccessMsg) {
      const timer = setTimeout(() => {
        setAlternativeSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alternativeSuccessMsg]);
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0); // seconds
  const [distance, setDistance] = useState(0); // km
  const [points, setPoints] = useState<GPSTrackPoint[]>([]);
  const [speeds, setSpeeds] = useState<number[]>([]); // in km/h

  const watchIdRef = useRef<number | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const simTimerIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<GPSTrackPoint | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported');
    } else {
      // Check query permission if supported
      navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
        result.onchange = () => {
          setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
        };
      }).catch(() => {
        // Fallback
        setPermissionState('prompt');
      });
    }

    return () => {
      stopTracker();
    };
  }, []);

  const stopTracker = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    if (simTimerIdRef.current !== null) {
      window.clearInterval(simTimerIdRef.current);
      simTimerIdRef.current = null;
    }
  };

  const startRun = (simulate: boolean = false) => {
    setIsRunning(true);
    setIsSimulated(simulate);
    const start = Date.now();
    setStartTime(start);
    setDuration(0);
    setDistance(0);
    setPoints([]);
    setSpeeds([]);
    lastPointRef.current = null;

    // 1. Timer update
    timerIdRef.current = window.setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    if (simulate) {
      // 2. Mock GPS track simulator
      let lat = 34.0522 + (Math.random() - 0.5) * 0.001;
      let lng = -118.2437 + (Math.random() - 0.5) * 0.001;
      
      const firstPoint: GPSTrackPoint = {
        latitude: lat,
        longitude: lng,
        timestamp: start,
        speed: 3.5 // m/s (approx 12.6 km/h)
      };
      setPoints([firstPoint]);
      lastPointRef.current = firstPoint;
      setSpeeds([12.6]);

      simTimerIdRef.current = window.setInterval(() => {
        // Move mock player forward slightly
        const deltaLat = 0.00008 + (Math.random() - 0.4) * 0.00003;
        const deltaLng = 0.00008 + (Math.random() - 0.4) * 0.00003;
        lat += deltaLat;
        lng += deltaLng;

        // Current Speed: ~10 to ~16 km/h with noise
        const simulatedSpeedKmh = 11.5 + Math.random() * 4.5;
        const speedMps = simulatedSpeedKmh / 3.6;

        const newPoint: GPSTrackPoint = {
          latitude: lat,
          longitude: lng,
          timestamp: Date.now(),
          speed: speedMps
        };

        setPoints((prev) => [...prev, newPoint]);
        setSpeeds((prev) => [...prev, simulatedSpeedKmh]);

        if (lastPointRef.current) {
          const addedDistance = calculateDistanceKm(
            lastPointRef.current.latitude,
            lastPointRef.current.longitude,
            newPoint.latitude,
            newPoint.longitude
          );
          setDistance((prev) => prev + addedDistance);
        }
        lastPointRef.current = newPoint;
      }, 2000);

    } else {
      // 3. Real GPS tracking
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords;
          const currentSpeedMps = speed || 0;
          const currentSpeedKmh = currentSpeedMps * 3.6;

          const newPoint: GPSTrackPoint = {
            latitude,
            longitude,
            timestamp: position.timestamp,
            speed: currentSpeedMps
          };

          setPoints((prev) => [...prev, newPoint]);
          if (currentSpeedKmh > 0) {
            setSpeeds((prev) => [...prev, currentSpeedKmh]);
          }

          if (lastPointRef.current) {
            const addedDistance = calculateDistanceKm(
              lastPointRef.current.latitude,
              lastPointRef.current.longitude,
              latitude,
              longitude
            );
            // Cap unrealistic jumps
            if (addedDistance < 0.1) {
              setDistance((prev) => prev + addedDistance);
            }
          }
          lastPointRef.current = newPoint;
        },
        (error) => {
          console.error("GPS Watch Exception:", error);
        },
        options
      );
    }
  };

  const endAndSaveRun = () => {
    stopTracker();
    setIsRunning(false);

    // Calculate speed stats
    const averageSpeedVal = speeds.length > 0 
      ? parseFloat((speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2)) 
      : distance > 0 && duration > 0 
        ? parseFloat(((distance / (duration / 3600))).toFixed(2)) 
        : 0;

    const maxSpeedVal = speeds.length > 0 ? parseFloat(Math.max(...speeds).toFixed(2)) : 0;
    // Suppress zeros or non-moving values for slowest speed
    const movingSpeeds = speeds.filter(s => s > 1.5);
    const minSpeedVal = movingSpeeds.length > 0 ? parseFloat(Math.min(...movingSpeeds).toFixed(2)) : 0;

    onSaveRun({
      durationSeconds: duration,
      distanceKm: parseFloat(distance.toFixed(3)),
      avgSpeedKmH: averageSpeedVal,
      maxSpeedKmH: maxSpeedVal,
      minSpeedKmH: minSpeedVal,
      gpsTrackPoints: points,
      fromAssignmentId: activeAssignmentId
    });

    // Reset values
    setDuration(0);
    setDistance(0);
    setPoints([]);
    setSpeeds([]);
    lastPointRef.current = null;
  };

  const cancelRun = () => {
    stopTracker();
    setIsRunning(false);
    setDuration(0);
    setDistance(0);
    setPoints([]);
    setSpeeds([]);
    lastPointRef.current = null;
  };

  // Human readings
  const formattedTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentSecondsSpeed = speeds.length > 0 ? speeds[speeds.length - 1] : 0;

  // Coordinate mapping helpers to auto-scale actual coordinates onto the 400x220 visual canvas viewport
  const getSingleMappedPointX = (index: number) => {
    if (points.length === 0) return 200;
    const lngs = points.map(p => p.longitude);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const lngRange = maxLng - minLng;
    if (lngRange === 0) return 200;
    
    const paddingX = 40;
    const width = 400;
    const normX = (points[index].longitude - minLng) / lngRange;
    return paddingX + normX * (width - paddingX * 2);
  };

  const getSingleMappedPointY = (index: number) => {
    if (points.length === 0) return 110;
    const lats = points.map(p => p.latitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const latRange = maxLat - minLat;
    if (latRange === 0) return 110;
    
    const paddingY = 40;
    const height = 220;
    const normY = 1 - (points[index].latitude - minLat) / latRange;
    return paddingY + normY * (height - paddingY * 2);
  };

  const getMappedPathPoints = () => {
    if (points.length === 0) return '';
    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    
    if (latRange === 0 || lngRange === 0) return '';
    
    const paddingX = 40;
    const paddingY = 40;
    const width = 400;
    const height = 220;
    
    return points.map(p => {
      const normX = (p.longitude - minLng) / lngRange;
      const normY = 1 - (p.latitude - minLat) / latRange;
      const x = paddingX + normX * (width - paddingX * 2);
      const y = paddingY + normY * (height - paddingY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const getMilestonePoints = () => {
    if (points.length < 3) return [];
    const markers: { x: number; y: number; label: string }[] = [];
    let cumulativeDist = 0;
    let nextMilestone = 1; // 1km, 2km, 3km...
    
    for (let i = 1; i < points.length; i++) {
      const segDist = calculateDistanceKm(
        points[i-1].latitude,
        points[i-1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      cumulativeDist += segDist;
      
      if (cumulativeDist >= nextMilestone) {
        const x = getSingleMappedPointX(i);
        const y = getSingleMappedPointY(i);
        markers.push({
          x,
          y,
          label: `${nextMilestone}K`
        });
        nextMilestone++;
        if (markers.length >= 6) break;
      }
    }
    return markers;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all">
      {/* Background glow styling */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle Translucent Gray Street Grid Mapping the entire widget background (Reference image Yorkville style) */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none select-none">
        <svg className="w-full h-full text-slate-300" viewBox="0 0 400 220" preserveAspectRatio="none">
          <g fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M30,5 L30,215" />
            <path d="M130,5 L160,215" />
            <path d="M240,30 L240,215" strokeWidth="10" />
            <path d="M120,40 L245,40" strokeWidth="6" />
            <path d="M140,65 L245,65" strokeWidth="5" />
            <path d="M5,100 C60,110 100,125 150,135" />
            <path d="M5,70 L130,110" />
            <path d="M130,110 L180,105 L210,115 L240,95" />
            <path d="M240,120 C290,132 340,115 390,40" />
            <path d="M5,200 L395,200" strokeWidth="12" />
          </g>
        </svg>
      </div>
      
      <div 
        onClick={() => { if (!isRunning) setIsCollapsed(!isCollapsed); }}
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 relative select-none ${(!isCollapsed || isRunning) ? 'mb-6 border-b border-slate-800/40 pb-4' : ''} ${!isRunning ? 'cursor-pointer hover:opacity-95' : ''}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              GPS ENGINE ONLINE
            </span>
          </div>
          <h2 className="text-xl font-sans font-semibold text-slate-100 mt-1.5">
            Active GPS Path Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronizes automatically to your coach dashboard statistics.
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          {activeAssignmentId && requiredDistanceKm && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl text-xs text-amber-300 font-mono">
              🎯 Target Run: <span className="font-bold text-amber-200">{requiredDistanceKm.toFixed(1)} km</span>
            </div>
          )}
          
          {!isRunning && (
            <button
              type="button"
              className="p-2 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-400 hover:text-slate-250 transition"
              aria-label={isCollapsed ? "Expand tracker" : "Collapse tracker"}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {alternativeSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl flex items-center justify-between gap-2.5 text-xs font-medium relative z-20"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>{alternativeSuccessMsg}</span>
            </div>
            <button 
              type="button"
              onClick={() => setAlternativeSuccessMsg(null)}
              className="text-emerald-500/60 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-wider pl-2"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {(!isCollapsed || isRunning) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden relative"
          >
            {!isRunning ? (
              showAlternativeForm ? (
                <div className="w-full flex flex-col p-6 bg-slate-950/60 rounded-xl border border-slate-800/80 relative overflow-hidden">
                  <h3 className="text-slate-200 font-semibold text-sm mb-1 self-start">Submit Alternative Workout Record</h3>
                  <p className="text-slate-400 text-xs mb-4 text-left">
                    Manual override submission if active GPS connection is unavailable.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-450 uppercase mb-1.5">Distance (km)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 5.10"
                        value={altDistance}
                        onChange={(e) => setAltDistance(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-450 uppercase mb-1.5">Duration (mins)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="e.g. 25"
                        value={altDurationMin}
                        onChange={(e) => setAltDurationMin(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAlternativeForm(false);
                        setAltDistance('');
                        setAltDurationMin('');
                      }}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const dist = parseFloat(altDistance);
                        const mins = parseFloat(altDurationMin);
                        if (isNaN(dist) || dist <= 0 || isNaN(mins) || mins <= 0) {
                          return;
                        }
                        const durationSeconds = Math.round(mins * 60);
                        const avgSpeed = parseFloat(((dist / (durationSeconds / 3600))).toFixed(2));
                        
                        onSaveRun({
                          durationSeconds,
                          distanceKm: dist,
                          avgSpeedKmH: avgSpeed,
                          maxSpeedKmH: parseFloat((avgSpeed * 1.25).toFixed(2)),
                          minSpeedKmH: parseFloat((avgSpeed * 0.75).toFixed(2)),
                          gpsTrackPoints: [],
                          fromAssignmentId: activeAssignmentId
                        });

                        setAlternativeSuccessMsg(`Successfully logged workout: ${dist.toFixed(2)} km in ${mins} mins stored in run history.`);
                        setShowAlternativeForm(false);
                        setAltDistance('');
                        setAltDurationMin('');
                      }}
                      className="bg-[#00bbff] hover:bg-[#009be0] text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition shadow-md shadow-sky-500/10"
                    >
                      Confirm Record
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-950/60 rounded-xl border border-slate-800/80 relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Navigation className="w-8 h-8 text-emerald-400 animate-bounce" />
                  </div>

                  <h3 className="text-slate-200 font-medium text-base mb-1.5">Ready to Track Workout</h3>
                  <p className="text-slate-400 text-xs text-center max-w-sm mb-6 leading-relaxed">
                    Ensure device location services are enabled. Permissions status: 
                    <span className="font-semibold text-emerald-400 ml-1">
                      {permissionState === 'granted' ? 'Allowed' : permissionState === 'denied' ? 'Blocked (Reset in Browser)' : 'Checking...'}
                    </span>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
                    <button
                      onClick={() => startRun(false)}
                      id="btn-start-real-run"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition text-xs sm:text-sm"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      Start GPS Run
                    </button>
                    <button
                      onClick={() => setShowAlternativeForm(true)}
                      id="btn-start-sim-run"
                      className="flex-1 bg-[#00bbff] hover:bg-[#009be0] text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition text-xs sm:text-sm shadow-md shadow-sky-500/10"
                    >
                      <PlusSquare className="w-4.5 h-4.5 text-slate-950" />
                      Submit An Alternative
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-6 relative">
                {/* Running Dashboard Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Footprints className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Distance</div>
                      <div className="text-lg font-mono font-bold text-slate-100 flex items-baseline gap-1">
                        {distance.toFixed(3)}
                        <span className="text-xs text-slate-400 font-normal">km</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Timer</div>
                      <div className="text-lg font-mono font-bold text-emerald-400">
                        {formattedTime(duration)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Current Pace</div>
                      <div className="text-lg font-mono font-bold text-slate-100 flex items-baseline gap-1">
                        {currentSecondsSpeed.toFixed(1)}
                        <span className="text-xs text-slate-400 font-normal">km/h</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium font-mono">Calorie Burn</div>
                      <div className="text-lg lg:text-md font-mono font-bold text-slate-100 flex items-baseline gap-1">
                        {Math.floor(distance * 68)}
                        <span className="text-xs text-slate-400 font-normal">kcal</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Running progress visual for assignment target */}
                {requiredDistanceKm && requiredDistanceKm > 0 && (
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-slate-400">Target Assignment Completion</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {Math.min(100, Math.floor((distance / requiredDistanceKm) * 100))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (distance / requiredDistanceKm) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                      <span>0 km</span>
                      <span>{distance.toFixed(2)} km tracked</span>
                      <span>{requiredDistanceKm.toFixed(1)} km dued</span>
                    </div>
                  </div>
                )}

                {/* Styled Street Map with Transparent Grey Road Lines */}
                <div className="relative w-full h-[240px] bg-slate-950 rounded-xl overflow-hidden border border-slate-850 flex items-center justify-center shadow-inner">
                  {/* Subtle Grid Pattern Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px]" />
                  
                  <svg className="absolute inset-0 w-full h-full text-slate-700/60" viewBox="0 0 400 220" preserveAspectRatio="none">
                    {/* Route Glow Filter */}
                    <defs>
                      <filter id="routeGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Toronto Yorkville Styled Grey Road Lines (Thick, Semi-Transparent Background) */}
                    <g opacity="0.6">
                      {/* Spadina Ave */}
                      <path d="M30,5 L30,215" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/70" />
                      {/* Avenue Rd */}
                      <path d="M130,5 L160,215" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/70" />
                      {/* Yonge St */}
                      <path d="M240,30 L240,215" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/70" />
                      {/* MacPherson Ave */}
                      <path d="M120,40 L245,40" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/60" />
                      {/* Roxborough St */}
                      <path d="M140,65 L245,65" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/60" />
                      {/* Davenport Rd */}
                      <path d="M5,100 C60,110 100,125 150,135" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/50" />
                      {/* Dupont St */}
                      <path d="M5,70 L130,110" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/50" />
                      {/* Pears Ave */}
                      <path d="M130,110 L180,105 L210,115 L240,95" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/65" />
                      {/* Aylmer Ave */}
                      <path d="M240,120 C290,132 340,115 390,40" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/50" />
                      {/* Cumberland Ave */}
                      <path d="M160,180 L230,170" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/60" />
                      {/* Yorkville Ave */}
                      <path d="M210,150 L250,145" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/60" />
                      {/* Bloor St */}
                      <path d="M5,200 L395,200" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" className="text-slate-850/80" />
                    </g>

                    {/* Street Inner Fine Lines for realistic vector map mapping */}
                    <g opacity="0.35">
                      <path d="M30,5 L30,215" stroke="#475569" strokeWidth="1.5" />
                      <path d="M130,5 L160,215" stroke="#475569" strokeWidth="1.5" />
                      <path d="M240,30 L240,215" stroke="#475569" strokeWidth="1.5" />
                      <path d="M120,40 L245,40" stroke="#475569" strokeWidth="1.5" />
                      <path d="M140,65 L245,65" stroke="#475569" strokeWidth="1.5" />
                      <path d="M5,100 C60,110 100,125 150,135" stroke="#475569" strokeWidth="1.5" />
                      <path d="M5,70 L130,110" stroke="#475569" strokeWidth="1.5" />
                      <path d="M130,110 L180,105 L210,115 L240,95" stroke="#475569" strokeWidth="1.5" />
                      <path d="M240,120 C290,132 340,115 390,40" stroke="#475569" strokeWidth="1.5" />
                      <path d="M160,180 L230,170" stroke="#475569" strokeWidth="1" />
                      <path d="M210,150 L250,145" stroke="#475569" strokeWidth="1" />
                      <path d="M5,200 L395,200" stroke="#475569" strokeWidth="2.5" />
                    </g>

                    {/* Street Names (Low opacity, clean design font styling) */}
                    <g className="select-none font-mono text-[6px] font-semibold tracking-wider text-slate-500/50 fill-current">
                      <text x="18" y="100" transform="rotate(-85 18 100)">SPADINA AVE</text>
                      <text x="141" y="90" transform="rotate(82 141 90)">AVENUE RD</text>
                      <text x="234" y="100" transform="rotate(90 234 100)">YONGE ST</text>
                      <text x="210" y="208">BLOOR ST</text>
                      <text x="160" y="34">MACPHERSON AVE</text>
                      <text x="165" y="59">ROXBOROUGH ST W</text>
                      <text x="160" y="112">PEARS AVE</text>
                      <text x="60" y="112" transform="rotate(8 60 112)">DAVENPORT RD</text>
                      <text x="45" y="81" transform="rotate(18 45 81)">DUPONT ST</text>
                      <text x="280" y="132" transform="rotate(-6 280 132)">AYLMER AVE</text>
                    </g>

                    {/* Active Track Path - Vibrantly Colored Glowing Line */}
                    {points.length > 1 && (
                      <polyline
                        points={getMappedPathPoints()}
                        fill="none"
                        stroke="#facc15" /* Vibrant Nike-Yellow corresponding to reference picture path */
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#routeGlow)"
                        className="drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]"
                      />
                    )}

                    {/* Start Pointer Badge */}
                    {points.length > 0 && (() => {
                      const firstX = getSingleMappedPointX(0);
                      const firstY = getSingleMappedPointY(0);
                      return (
                        <g>
                          <circle cx={firstX} cy={firstY} r="6" fill="#ffffff" stroke="#facc15" strokeWidth="1.5" />
                          <circle cx={firstX} cy={firstY} r="2" fill="#1e293b" />
                          <text x={firstX} y={firstY - 8} textAnchor="middle" className="fill-slate-100 font-mono text-[6px] font-bold">START</text>
                        </g>
                      );
                    })()}

                    {/* Milestone markers along the trail (e.g. 1K, 2K, 3K, like the image) */}
                    {points.length > 2 && getMilestonePoints().map((milestone, idx) => (
                      <g key={idx}>
                        <circle cx={milestone.x} cy={milestone.y} r="7" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                        <text x={milestone.x} y={milestone.y + 2} textAnchor="middle" className="fill-slate-900 font-bold font-sans text-[5.5px]">
                          {milestone.label}
                        </text>
                      </g>
                    ))}

                    {/* Present Coordinates Pulsing Dot + Logo Pointer */}
                    {points.length > 0 ? (() => {
                      const lastX = getSingleMappedPointX(points.length - 1);
                      const lastY = getSingleMappedPointY(points.length - 1);
                      return (
                        <g>
                          {/* Pulsing Glow Base Ring */}
                          <circle cx={lastX} cy={lastY} r="10" fill="rgba(56,189,248,0.25)" className="animate-ping" style={{ transformOrigin: `${lastX}px ${lastY}px` }} />
                          {/* Deep Blue/Indigo Circular Run Logo */}
                          <circle cx={lastX} cy={lastY} r="8" fill="#1e3a8a" stroke="#ffffff" strokeWidth="1.5" />
                          
                          {/* Inner pointer detail */}
                          <path d={`M${lastX - 2},${lastY} L${lastX},${lastY - 2} L${lastX + 2},${lastY} M${lastX - 2},${lastY + 2} L${lastX},${lastY} L${lastX + 2},${lastY + 2}`} stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" fill="none" />
                        </g>
                      );
                    })() : (
                      /* Standby State: Draw a nice preview message */
                      <g className="select-none pointer-events-none">
                        <text x="200" y="105" textAnchor="middle" className="fill-slate-500/70 font-sans text-[9px] font-bold tracking-widest uppercase">
                          No Active Route Plot
                        </text>
                        <text x="200" y="118" textAnchor="middle" className="fill-slate-600/60 font-sans text-[7.5px]">
                          Pulsing GPS beacons will write to coordinates live
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* Map/Track simulation indicators */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-xs flex justify-between items-center font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>
                      {isSimulated ? '📡 SIMULATING ACTIVE GPS LOOP' : '📡 RECEIVING RAW INTEGRATED GPS BEACONS'}
                    </span>
                  </div>
                  <div>
                    <span>Points logged: <b className="text-slate-200">{points.length}</b></span>
                  </div>
                </div>

                {/* GPS control keys */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelRun}
                    id="btn-cancel-run"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-lg transition"
                  >
                    Discard Run
                  </button>
                  <button
                    onClick={endAndSaveRun}
                    id="btn-end-run"
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
                  >
                    <Square className="w-4 h-4 fill-slate-950" />
                    Save & Log run
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

