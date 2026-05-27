/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Navigation, Footprints, Clock, Zap, Flame, Compass, ChevronDown, ChevronUp } from 'lucide-react';
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all">
      {/* Background glow styling */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
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

        <div className="flex items-center gap-3">
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

      <AnimatePresence initial={false}>
        {(!isCollapsed || isRunning) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {!isRunning ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-950/60 rounded-xl border border-slate-800/80">
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

                <div className="flex justify-center w-full">
                  <button
                    onClick={() => startRun(false)}
                    id="btn-start-real-run"
                    className="w-full max-w-sm bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    Start GPS Run
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
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
