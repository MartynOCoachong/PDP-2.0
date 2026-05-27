/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users, Award, Calendar, ChevronRight, ChevronDown, Activity, Plus, Check, Clock, User, Sparkles, Filter, Database, Droplet, Star, ShieldAlert } from 'lucide-react';
import { UserProfile, RunLog, DailyMetrics, Assignment, EducationalModule } from '../types';

interface CoachesDashboardProps {
  currentProfile: UserProfile;
  players: UserProfile[];
  runLogs: RunLog[];
  metrics: Record<string, DailyMetrics[]>; // Raw calendar records keyed by playerId
  assignments: Assignment[];
  modules: EducationalModule[];
  onAddAssignment: (assignment: Omit<Assignment, 'id' | 'completedByPlayerIds'>) => void;
  onUpdatePlayerGoal?: (playerId: string, updatedGoals: Partial<DailyMetrics>) => void;
}

interface PlayerAccordionProps {
  player: UserProfile;
  isExpanded: boolean;
  onToggle: () => void;
  runLogs: RunLog[];
  playerMetrics: DailyMetrics[];
  onUpdatePlayerGoal?: (playerId: string, updatedGoals: Partial<DailyMetrics>) => void;
  key?: string;
}

function PlayerPerformanceAccordion({
  player,
  isExpanded,
  onToggle,
  runLogs,
  playerMetrics,
  onUpdatePlayerGoal
}: PlayerAccordionProps) {
  const logs = runLogs.filter(r => r.playerId === player.id);
  const totalDistance = logs.reduce((sum, r) => sum + r.distanceKm, 0);
  const totalSeconds = logs.reduce((sum, r) => sum + r.durationSeconds, 0);
  const avgSpeed = logs.length > 0 ? logs.reduce((sum, r) => sum + r.avgSpeedKmH, 0) / logs.length : 0;
  const currentStats = {
    count: logs.length,
    distance: totalDistance,
    duration: totalSeconds,
    avgSpeed: avgSpeed
  };

  const latestMetric = playerMetrics.length > 0 ? playerMetrics[playerMetrics.length - 1] : null;

  const [customHydration, setCustomHydration] = useState(latestMetric?.hydrationGoalMls || 3000);
  const [customSleep, setCustomSleep] = useState(latestMetric?.sleepQuality || 'Good');
  const [customRunGoal, setCustomRunGoal] = useState(latestMetric?.runDistanceGoalKm || 15.0);
  const [goalFeedback, setGoalFeedback] = useState(false);

  useEffect(() => {
    if (latestMetric) {
      setCustomHydration(latestMetric.hydrationGoalMls || 3000);
      setCustomSleep(latestMetric.sleepQuality || 'Good');
      setCustomRunGoal(latestMetric.runDistanceGoalKm || 15.0);
    }
  }, [latestMetric]);

  const handleApplyPersonalGoals = () => {
    if (!onUpdatePlayerGoal) return;
    onUpdatePlayerGoal(player.id, {
      hydrationGoalMls: customHydration,
      sleepQuality: customSleep as 'Poor' | 'Fair' | 'Good' | 'Excellent',
      runDistanceGoalKm: customRunGoal,
    });
    setGoalFeedback(true);
    setTimeout(() => setGoalFeedback(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-5 outline-none transition-colors hover:bg-slate-850/30"
      >
        <div className="flex items-center gap-3 select-none">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-sans font-bold text-slate-100">{player.name}</h2>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-slate-800 bg-slate-950/60 text-slate-400">
                Performance Overview
              </span>
            </div>
            {/* ID alignment tag removed */}
          </div>
        </div>

        <div className="flex items-center gap-2.5 select-none self-end sm:self-auto">
          <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg font-mono">
            🔥 Active Streak: 5 Days
          </span>
          <div className={`p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-6 pt-2 border-t border-slate-850 space-y-6">
          {/* Stats Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Aerobic Load */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Weekly Aerobic Load</div>
              <div className="text-2xl font-mono font-bold text-slate-100 mt-1">
                {currentStats.distance.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal ml-1">km</span>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-450 flex items-center justify-between">
                <span>Target: {(latestMetric?.runDistanceGoalKm || 15.0).toFixed(1)}k</span>
                <span className="text-emerald-400">
                  {currentStats.distance ? Math.min(100, Math.floor((currentStats.distance / (latestMetric?.runDistanceGoalKm || 15.0)) * 105)) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-850 h-1 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (currentStats.distance / (latestMetric?.runDistanceGoalKm || 15.0)) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Hydration Log Status */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-8-30">
              <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                Hydration Log Status
              </div>
              <div className="text-2xl font-mono font-bold text-slate-100 mt-1">
                {latestMetric?.hydrationMls || 2100}
                <span className="text-xs text-slate-400 font-normal ml-1">ml</span>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-450 w-full flex items-center justify-between">
                <span>Goal: {latestMetric?.hydrationGoalMls || 3000} ml</span>
                <span className="text-sky-400">
                  {Math.min(100, Math.floor(((latestMetric?.hydrationMls || 2100) / (latestMetric?.hydrationGoalMls || 3000)) * 100))}%
                </span>
              </div>
              <div className="w-full bg-slate-850 h-1 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-sky-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (((latestMetric?.hydrationMls || 2100) / (latestMetric?.hydrationGoalMls || 3000)) * 100))}%` }} 
                />
              </div>
            </div>

            {/* Sleep Quality Rating */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Sleep Quality Rating</div>
              <div className="text-xl font-sans font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                {latestMetric?.sleepQuality || 'Good'}
              </div>
              <p className="mt-2.5 text-[10px] font-mono text-slate-400">
                Rest hours logged: <b className="text-slate-150">{latestMetric?.sleepHours || 8}h</b>
              </p>
            </div>
          </div>

          {/* Personalize Goals Panel */}
          {onUpdatePlayerGoal && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-850/80 space-y-3.5">
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Echelon Target Customizer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-450 mb-1">SET HYDRATION TARGET (ML)</label>
                  <input
                    type="number"
                    step={250}
                    value={customHydration}
                    onChange={(e) => setCustomHydration(parseInt(e.target.value) || 3000)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-350 rounded-lg p-2 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-450 mb-1">SET RUN DISTANCE GOAL (KM)</label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={100}
                    value={customRunGoal}
                    onChange={(e) => setCustomRunGoal(parseFloat(e.target.value) || 15.0)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-350 rounded-lg p-2 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-450 mb-1">REQUIRED MIN SLEEP RATING</label>
                  <select
                    value={customSleep}
                    onChange={(e) => setCustomSleep(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-350 rounded-lg p-2 font-mono outline-none"
                  >
                    <option value="Poor">Poor</option>
                    <option value="Fair">Fair</option>
                    <option value="Good">Good</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
              </div>

              {goalFeedback && (
                <div className="text-xs font-semibold text-emerald-400 font-mono text-center pt-1">
                  ✓ Goals updated and synced successfully inside the player dashboard!
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleApplyPersonalGoals}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  Update Player Personal Goals
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CoachesDashboardProps {
  currentProfile: UserProfile;
  players: UserProfile[];
  runLogs: RunLog[];
  metrics: Record<string, DailyMetrics[]>; // Raw calendar records keyed by playerId
  assignments: Assignment[];
  modules: EducationalModule[];
  onAddAssignment: (assignment: Omit<Assignment, 'id' | 'completedByPlayerIds'>) => void;
  onUpdatePlayerGoal?: (playerId: string, updatedGoals: Partial<DailyMetrics>) => void;
}

export default function CoachesDashboard({
  currentProfile,
  players,
  runLogs,
  metrics,
  assignments,
  modules,
  onAddAssignment,
  onUpdatePlayerGoal
}: CoachesDashboardProps) {
  // Navigation drilldown for hierarchy
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentProfile.teamId || '');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  // Accordion open/close states
  const [expandedPlayerIds, setExpandedPlayerIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedPlayerId) {
      setExpandedPlayerIds(prev => ({
        ...prev,
        [selectedPlayerId]: true
      }));
    }
  }, [selectedPlayerId]);
  
  // Assignment dispatcher
  const [assignType, setAssignType] = useState<'run' | 'module'>('run');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDistance, setAssignDistance] = useState(5.0);
  const [assignModuleId, setAssignModuleId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('2026-05-30');
  const [successMsg, setSuccessMsg] = useState(false);

  // Personalized training target states
  const [customHydration, setCustomHydration] = useState(3000);
  const [customSleep, setCustomSleep] = useState('Good');
  const [customRunGoal, setCustomRunGoal] = useState(15.0);
  const [goalFeedback, setGoalFeedback] = useState(false);

  // Attendance simulator State
  const [attendanceDate, setAttendanceDate] = useState('2026-05-21');
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});

  // 1. Role boundaries for data access filtering
  // Admins see everything. Associations see clubs within their ID. Clubs see teams within their ID. Teams see Coaches/Players.
  const associationFilteredPlayers = players.filter(player => {
    if (currentProfile.role === 'association') {
      return player.associationId === currentProfile.associationId;
    }
    if (currentProfile.role === 'club') {
      return player.clubId === currentProfile.clubId;
    }
    if (currentProfile.role === 'team') {
      return player.teamId === currentProfile.teamId;
    }
    if (currentProfile.role === 'coach') {
      return player.coachId === currentProfile.coachId || player.teamId === currentProfile.teamId;
    }
    // Admin has total access
    return true;
  });

  // Filter based on active team select box if drilling down
  const activeTeamId = selectedTeamId || currentProfile.teamId || '';
  const teamMatchesPlayers = associationFilteredPlayers.filter(p => !activeTeamId || p.teamId === activeTeamId);

  // Selected active player focus
  const focusedPlayer = teamMatchesPlayers.find(p => p.id === selectedPlayerId) || teamMatchesPlayers[0];

  // Helper stats gatherer
  const getPlayerRunSummaries = (playerId: string) => {
    const logs = runLogs.filter(r => r.playerId === playerId);
    const totalDistance = logs.reduce((sum, r) => sum + r.distanceKm, 0);
    const totalSeconds = logs.reduce((sum, r) => sum + r.durationSeconds, 0);
    const avgSpeed = logs.length > 0 ? logs.reduce((sum, r) => sum + r.avgSpeedKmH, 0) / logs.length : 0;
    return {
      count: logs.length,
      distance: totalDistance,
      duration: totalSeconds,
      avgSpeed: avgSpeed
    };
  };

  const currentFocusedStats = focusedPlayer ? getPlayerRunSummaries(focusedPlayer.id) : null;
  const currentFocusedMetrics = focusedPlayer ? (metrics[focusedPlayer.id] || []) : [];
  const latestMetric = currentFocusedMetrics.length > 0 ? currentFocusedMetrics[currentFocusedMetrics.length - 1] : null;

  useEffect(() => {
    if (latestMetric) {
      setCustomHydration(latestMetric.hydrationGoalMls || 3000);
      setCustomSleep(latestMetric.sleepQuality || 'Good');
      setCustomRunGoal(latestMetric.runDistanceGoalKm || 15.0);
    } else {
      setCustomHydration(3000);
      setCustomSleep('Good');
      setCustomRunGoal(15.0);
    }
  }, [focusedPlayer?.id, latestMetric?.date]);

  const handlePostAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamId) return;

    const matchedModule = modules.find(m => m.id === assignModuleId);
    const titleVal = assignType === 'module' 
      ? `Required Session: ${matchedModule?.title || 'Learning Module'}`
      : assignTitle || `Required ${assignDistance}K Fitness Log`;

    onAddAssignment({
      coachId: currentProfile.coachId || 'coach-system',
      teamId: activeTeamId,
      type: assignType,
      title: titleVal,
      dueDate: assignDueDate,
      runDistanceKm: assignType === 'run' ? assignDistance : undefined,
      moduleId: assignType === 'module' ? assignModuleId : undefined,
    });

    setSuccessMsg(true);
    setAssignTitle('');
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleApplyPersonalGoals = () => {
    if (!focusedPlayer || !onUpdatePlayerGoal) return;
    onUpdatePlayerGoal(focusedPlayer.id, {
      hydrationGoalMls: customHydration,
      sleepQuality: customSleep as 'Poor' | 'Fair' | 'Good' | 'Excellent',
      runDistanceGoalKm: customRunGoal,
    });
    setGoalFeedback(true);
    setTimeout(() => setGoalFeedback(false), 2500);
  };

  const handleToggleAttendance = (playerId: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header and Organizational Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h1 className="text-2xl font-sans font-bold text-slate-100">
          Team Performance Hub
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Roster Listing */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Team Roster ({teamMatchesPlayers.length})
            </h2>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Click to Select Player</span>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {teamMatchesPlayers.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs font-mono">
                No players linked to this specific echelons level.
              </div>
            ) : (
              teamMatchesPlayers.map((player) => {
                const isActive = focusedPlayer?.id === player.id;
                const speedStats = getPlayerRunSummaries(player.id);
                return (
                  <div
                    key={player.id}
                    onClick={() => {
                      setSelectedPlayerId(player.id);
                      setCustomHydration(latestMetric?.hydrationGoalMls || 3000);
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-left relative overflow-hidden flex justify-between items-center ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-slate-950/60 hover:bg-slate-950 border-slate-850'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shrink-0" />
                        <span className="text-sm font-sans font-semibold text-slate-100">{player.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-450">
                        {player.email}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-200">
                        {speedStats.distance.toFixed(1)} km
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400">
                        {speedStats.count} runs logged
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Player Metric Insights & Assignment Control */}
        {teamMatchesPlayers.length > 0 ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Player's Performance Metrics Cards mapped in individual accordion style */}
            <div className="space-y-4">
              {teamMatchesPlayers.map((player) => (
                <PlayerPerformanceAccordion
                  key={player.id}
                  player={player}
                  isExpanded={!!expandedPlayerIds[player.id]}
                  onToggle={() => {
                    setExpandedPlayerIds(prev => ({
                      ...prev,
                      [player.id]: !prev[player.id]
                    }));
                  }}
                  runLogs={runLogs}
                  playerMetrics={metrics[player.id] || []}
                  onUpdatePlayerGoal={onUpdatePlayerGoal}
                />
              ))}
            </div>

            {/* Practice Session Log Card */}
            {teamMatchesPlayers.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Practice Session Log
                  </h2>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 font-mono outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {teamMatchesPlayers.map((player) => (
                    <div key={player.id} className="flex justify-between items-center text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                      <span className="text-slate-300 font-medium">{player.name}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(player.id)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-mono transition font-semibold ${
                          attendanceState[player.id]
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-900 text-slate-450 border border-transparent hover:bg-slate-850'
                        }`}
                      >
                        {attendanceState[player.id] ? 'PRESENT' : 'MARKED ABSENT'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment Deployment Dispatcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Dispatch Calendar Assignment to Team
              </h3>
              
              <form onSubmit={handlePostAssignment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5 uppercase">Assignment Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignType('run')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                          assignType === 'run'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-950 border-slate-850 text-slate-450 hover:bg-slate-900'
                        }`}
                      >
                        GPS Track Running dist
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignType('module')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                          assignType === 'module'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-950 border-slate-850 text-slate-450 hover:bg-slate-900'
                        }`}
                      >
                        Classroom Academy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5 uppercase">Due Date</label>
                    <input
                      type="date"
                      required
                      value={assignDueDate}
                      onChange={(e) => setAssignDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 text-slate-350 text-xs rounded-lg p-2.5 font-mono pointer-events-auto"
                    />
                  </div>
                </div>

                {assignType === 'run' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1.5">ASSIGNMENT TITLE</label>
                      <input
                        type="text"
                        placeholder="e.g. Mandatory 5K Aerobic Endurance"
                        value={assignTitle}
                        onChange={(e) => setAssignTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-xs text-slate-300 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1.5">REQUIRED RUN DISTANCE (KM)</label>
                      <input
                        type="number"
                        step={0.5}
                        min={1}
                        max={42}
                        value={assignDistance}
                        onChange={(e) => setAssignDistance(parseFloat(e.target.value) || 5.0)}
                        className="w-full bg-slate-950 border border-slate-850 text-xs text-slate-305 rounded-lg p-2.5 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5">SELECT ACADEMY MODULE TO ASSIGN</label>
                    <select
                      value={assignModuleId}
                      required
                      onChange={(e) => setAssignModuleId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 text-xs text-slate-305 rounded-lg p-2.5 font-mono"
                    >
                      <option value="">-- Choose Module --</option>
                      {modules.map(m => (
                        <option key={m.id} value={m.id}>
                          [{m.category}] {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {successMsg && (
                  <div className="text-xs font-mono text-emerald-400 text-center font-bold bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    Assignment queued and synchronized automatically with players training schedules!
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-assign-workout"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold p-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Dispatch Required Training Assignment
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
            <p className="text-sm font-medium">Select a player from the roster to inspect individual metrics and dispatch localized assignments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
