/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Flame, Droplet, Coffee, Star, Trophy, CheckSquare, Calendar, ChevronRight, Moon, Utensils, Award, BookOpen, AlertCircle } from 'lucide-react';
import { UserProfile, RunLog, DailyMetrics, Assignment, EducationalModule, ModuleCompletion } from '../types';
import GPSRunTracker from './GPSRunTracker';

interface PlayerDashboardProps {
  playerProfile: UserProfile;
  runLogs: RunLog[];
  metrics: DailyMetrics; // player's current metrics
  assignments: Assignment[];
  modules: EducationalModule[];
  completions: ModuleCompletion[];
  onSaveRun: (newRun: Omit<RunLog, 'id' | 'playerId' | 'date'>) => void;
  onUpdateDailyMetrics: (metrics: Partial<DailyMetrics>) => void;
  onSelectTab: (tab: 'classroom') => void;
}

export default function PlayerDashboard({
  playerProfile,
  runLogs,
  metrics,
  assignments,
  modules,
  completions,
  onSaveRun,
  onUpdateDailyMetrics,
  onSelectTab
}: PlayerDashboardProps) {
  // Calendar date view
  const [activeCalendarDate, setActiveCalendarDate] = useState('2026-05-21');
  const [selectedCalendarAssignment, setSelectedCalendarAssignment] = useState<Assignment | null>(null);

  // Nutritional logging state helper
  const [mealCalories, setMealCalories] = useState(600);
  const [mealProtein, setMealProtein] = useState(30);
  const [mealCarbs, setMealCarbs] = useState(70);
  const [mealFat, setMealFat] = useState(15);
  const [showMealLogger, setShowMealLogger] = useState(false);

  // Active run log assignment target selectors
  const [trackAssignmentId, setTrackAssignmentId] = useState<string>('');
  const [trackAssignedDistance, setTrackAssignedDistance] = useState<number | undefined>(undefined);

  // Stats gathers
  const totalKmRunThisWeek = runLogs.reduce((sum, r) => sum + r.distanceKm, 0);
  const weeklyRunningGoal = metrics.runDistanceGoalKm || 15.0; // Dynamic goal updated by Coach, default 15 KM

  const hydrationPct = Math.min(100, Math.round((metrics.hydrationMls / metrics.hydrationGoalMls) * 100));
  const caloriePct = Math.min(100, Math.round((metrics.nutritionCalories / 2800) * 100)); // Daily average cap target 2800 kcal

  const totalPossibleModules = modules.length;
  const completedModulesCount = completions.length;

  const handleIncrementHydration = () => {
    onUpdateDailyMetrics({
      hydrationMls: metrics.hydrationMls + 250 // Add a glass (250ml)
    });
  };

  const handleLogMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDailyMetrics({
      nutritionCalories: metrics.nutritionCalories + mealCalories,
      nutritionProteinG: metrics.nutritionProteinG + mealProtein,
      nutritionCarbsG: metrics.nutritionCarbsG + mealCarbs,
      nutritionFatG: metrics.nutritionFatG + mealFat
    });
    setShowMealLogger(false);
  };

  const startTrackingAssignment = (assign: Assignment) => {
    setTrackAssignmentId(assign.id);
    setTrackAssignedDistance(assign.runDistanceKm);
    
    // Smooth scroll down to tracker panel
    const trackerEl = document.getElementById('gps-run-tracker-widget-section');
    if (trackerEl) {
      trackerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCalendarStatusForDate = (dateString: string) => {
    const dailyAssigns = assignments.filter(a => a.dueDate === dateString);
    const completedRuns = runLogs.filter(r => r.date === dateString);
    return {
      assignments: dailyAssigns,
      runs: completedRuns
    };
  };

  // Simplified calendar week (May 21st to May 27th 2026)
  const calendarWeekDays = [
    { day: 'Thu', num: '21', dateStr: '2026-05-21' },
    { day: 'Fri', num: '22', dateStr: '2026-05-22' },
    { day: 'Sat', num: '23', dateStr: '2026-05-23' },
    { day: 'Sun', num: '24', dateStr: '2026-05-24' },
    { day: 'Mon', num: '25', dateStr: '2026-05-25' },
    { day: 'Tue', num: '26', dateStr: '2026-05-26' },
    { day: 'Wed', num: '27', dateStr: '2026-05-27' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Main Widgets, Logs, Nutrition Goals */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main welcome & Coach feedback snippet */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-emerald-400 font-mono text-xs font-bold px-2.5 py-1 bg-emerald-500/10 rounded-full">
                👑 ATHLETE REPORT READY
              </span>
              <h2 className="text-xl font-sans font-bold text-slate-100 mt-2.5">
                Welcome, {playerProfile.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Your profile is synchronized with Coach <b className="text-slate-300">{playerProfile.manualCoachName || 'Martyn ODonnell'}</b>. 
                Keep logging workouts to optimize your biometric rankings.
              </p>
            </div>
            
            <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-850 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-[10px] font-mono text-slate-450 uppercase">Weekly Rank</div>
                <div className="text-xs font-sans font-bold text-slate-200">#3 Squad Leader</div>
              </div>
            </div>
          </div>

          {/* Running Track GPS Widget Embedded Directly */}
          <div id="gps-run-tracker-widget-section">
            <GPSRunTracker
              playerId={playerProfile.id}
              onSaveRun={onSaveRun}
              activeAssignmentId={trackAssignmentId || undefined}
              requiredDistanceKm={trackAssignedDistance}
            />
          </div>

          {/* Metrics & Biometric Dashboard Slider Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Widget 1: Weekly Running Goals */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">Weekly Aerobic Goals</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{Math.round((totalKmRunThisWeek / weeklyRunningGoal) * 100)}%</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0">
                  {/* Circle SVG */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500"
                      strokeWidth="3.5"
                      strokeDasharray={`${Math.min(100, Math.round((totalKmRunThisWeek / weeklyRunningGoal) * 100))}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-slate-200">
                    {totalKmRunThisWeek.toFixed(1)}k
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-slate-450">Distance completed:</div>
                  <div className="text-sm font-bold text-slate-200">{totalKmRunThisWeek.toFixed(2)} km</div>
                  <div className="text-[10px] text-slate-400 font-mono">Setup Weekly Goal: {weeklyRunningGoal} km</div>
                </div>
              </div>
            </div>

            {/* Widget 2: Hydration intake goals */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Droplet className="w-4 h-4 text-sky-400 shrink-0" />
                  Hydration Level
                </span>
                <span className="text-xs font-mono font-bold text-sky-400">{hydrationPct}%</span>
              </div>
              <p className="text-[10px] text-slate-450 font-mono mb-4">Assigned by coach: {metrics.hydrationGoalMls} ml</p>

              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex justify-between items-center">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">LOGGED VALUE</div>
                    <div className="text-base font-bold font-mono text-slate-100">{metrics.hydrationMls} ml</div>
                  </div>
                  <button
                    onClick={handleIncrementHydration}
                    className="p-1 px-3 bg-sky-500 hover:bg-sky-600 active:scale-95 text-slate-950 font-bold text-xs rounded-lg transition"
                    title="Logs a standard 250ml water scoop"
                  >
                    + 250ml
                  </button>
                </div>
              </div>
            </div>

            {/* Widget 3: Sleep quality tracker */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-350 uppercase mb-4">
                <Moon className="w-4 h-4 text-amber-300 shrink-0" />
                Sleep Optimization Rating
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs">
                <div>
                  <div className="text-[10px] font-mono text-slate-450 uppercase">Sleep Hours</div>
                  <div className="text-base font-mono font-bold text-slate-200 mt-0.5">{metrics.sleepHours} hrs</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-455 uppercase">Rating</div>
                  <div className="text-base font-sans font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-300 border-none" />
                    {metrics.sleepQuality}
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 4: Nutrition intake widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-slate-350 uppercase flex items-center gap-1">
                  <Utensils className="w-4 h-4 text-emerald-450 shrink-0" />
                  Nutrition Intake Target
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">{caloriePct}%</span>
              </div>
              <p className="text-[10px] text-slate-450 font-mono mb-4">Logged: {metrics.nutritionCalories} / 2800 kcal</p>

              <div className="space-y-3">
                {/* Micro Protein/Carbs/Fat indicators */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-1 bg-rose-500/10 border border-rose-500/20 text-[10px] rounded">
                    <label className="block text-slate-450">PROTEIN</label>
                    <b className="font-mono text-slate-100">{metrics.nutritionProteinG}g</b>
                  </div>
                  <div className="p-1 bg-amber-500/10 border border-amber-500/20 text-[10px] rounded">
                    <label className="block text-slate-455">CARBS</label>
                    <b className="font-mono text-slate-100">{metrics.nutritionCarbsG}g</b>
                  </div>
                  <div className="p-1 bg-violet-500/10 border border-violet-500/20 text-[10px] rounded">
                    <label className="block text-slate-450">FAT</label>
                    <b className="font-mono text-slate-100">{metrics.nutritionFatG}g</b>
                  </div>
                </div>

                {!showMealLogger ? (
                  <button
                    onClick={() => setShowMealLogger(true)}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition"
                  >
                    Log Active Meal Calories
                  </button>
                ) : (
                  <form onSubmit={handleLogMealSubmit} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-400">CALORIES (KCAL)</label>
                        <input
                          type="number"
                          value={mealCalories}
                          onChange={(e) => setMealCalories(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 text-slate-100 p-1 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-400">PROTEIN (G)</label>
                        <input
                          type="number"
                          value={mealProtein}
                          onChange={(e) => setMealProtein(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 text-slate-100 p-1 rounded font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowMealLogger(false)}
                        className="text-[10px] text-slate-450"
                      >
                        Dismiss
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-3 py-1 rounded"
                      >
                        Apply Intake Log
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>

          {/* Historical Running Log Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold font-sans text-slate-200">Historical GPS Run Logs ({runLogs.length})</h3>
            
            {runLogs.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-850 text-center text-xs font-mono text-slate-500">
                No GPS run history logged in this profile session yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {runLogs.map((run) => (
                  <div key={run.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-850/80 grid grid-cols-2 sm:grid-cols-4 items-center gap-3 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-450 font-mono">DATE / PERIOD</div>
                      <div className="font-semibold text-slate-200">{new Date(run.date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-450 font-mono">DISTANCE LOGGED</div>
                      <div className="font-bold text-slate-150 font-mono">{run.distanceKm.toFixed(2)} km</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-450 font-mono">AVG SPEED (FASTEST)</div>
                      <div className="font-mono text-slate-200">
                        {run.avgSpeedKmH} km/h <span className="text-[10px] text-emerald-400">({run.maxSpeedKmH})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {run.fromAssignmentId ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-505">
                          ASSIGNMENT OK
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">Practice Run</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Calendar View & Educational Completion Status */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Completed Modules Widget Track */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative">
            <span className="text-[10px] font-mono text-indigo-450 tracking-wide font-bold block mb-1">
              EDUCATIONAL STATS
            </span>
            <h3 className="text-sm font-semibold text-slate-200">Academy Modules Verified</h3>
            
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-mono font-bold text-indigo-400">
                  {completedModulesCount} / {totalPossibleModules}
                </div>
                <div className="text-[11px] text-slate-450 mt-0.5 leading-relaxed">Completed & Tested</div>
              </div>
              
              <button
                onClick={() => onSelectTab('classroom')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-indigo-400 border border-slate-850 flex items-center gap-1.5 transition text-xs font-semibold"
              >
                Go to Classroom
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Micro completed listing */}
            <div className="mt-4 space-y-1.5">
              {completions.map((comp) => {
                const mod = modules.find(m => m.id === comp.moduleId);
                return (
                  <div key={comp.id} className="p-2 bg-slate-950 rounded border border-slate-855 text-[10px] font-mono text-slate-400 flex justify-between items-center">
                    <span className="truncate max-w-[150px] text-slate-300 font-semibold">{mod?.title}</span>
                    <span>
                      {comp.quizScore ? `Score: ${comp.quizScore.score}/${comp.quizScore.total}` : 'READ'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Training Calendar Sync View */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Training Calendar
              </h3>
              <span className="text-[10px] font-mono text-slate-400">May 2026</span>
            </div>

            {/* Sync Status Info */}
            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[11px] text-emerald-400 leading-relaxed">
              Assignments dispatched by coach automatically synchronize within this schedule.
            </div>

            {/* Calendar Week view */}
            <div className="grid grid-cols-7 gap-1 bg-slate-950 p-2 rounded-xl border border-slate-850">
              {calendarWeekDays.map((day) => {
                const { assignments: assigns, runs } = getCalendarStatusForDate(day.dateStr);
                const hasAssign = assigns.length > 0;
                const hasCompletedRun = runs.length > 0;
                const dateMatches = activeCalendarDate === day.dateStr;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setActiveCalendarDate(day.dateStr)}
                    className={`py-2 rounded-lg text-center cursor-pointer flex flex-col justify-between items-center h-16 relative transition ${
                      dateMatches
                        ? 'bg-emerald-500/15 border border-emerald-555'
                        : 'hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="text-[9px] uppercase text-slate-500 font-mono">{day.day}</div>
                    <div className={`text-xs font-mono font-bold ${dateMatches ? 'text-emerald-350' : 'text-slate-200'}`}>
                      {day.num}
                    </div>

                    <div className="flex gap-1 mt-1 justify-center">
                      {hasAssign && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Classroom assignment dued" />}
                      {hasCompletedRun && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="GPS Run Log entry logged" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Date Assignments Detailed */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block tracking-wider">
                Schedule Target: {new Date(activeCalendarDate).toLocaleDateString()}
              </span>

              {getCalendarStatusForDate(activeCalendarDate).assignments.length === 0 && 
               getCalendarStatusForDate(activeCalendarDate).runs.length === 0 && (
                <p className="text-xs text-slate-500 font-mono italic">No workout tasks programmed for this day.</p>
              )}

              {getCalendarStatusForDate(activeCalendarDate).assignments.map((assign) => {
                const compl = completions.some(c => c.moduleId === assign.moduleId) || 
                              runLogs.some(r => r.fromAssignmentId === assign.id);

                return (
                  <div key={assign.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-slate-200">{assign.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                        compl ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-300'
                      }`}>
                        {compl ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>

                    {assign.type === 'run' && assign.runDistanceKm && (
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-900 text-[11px] text-slate-400 font-mono">
                        <span>Distance: {assign.runDistanceKm.toFixed(1)} km</span>
                        {!compl && (
                          <button
                            onClick={() => startTrackingAssignment(assign)}
                            className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1 leading-none"
                          >
                            <Play className="w-3.5 h-3.5 fill-emerald-400 inline" />
                            Launch Tracker
                          </button>
                        )}
                      </div>
                    )}

                    {assign.type === 'module' && (
                      <div className="flex justify-between pt-1 text-[11px] text-slate-400">
                        <span>Classroom Task</span>
                        {!compl && (
                          <button
                            onClick={() => onSelectTab('classroom')}
                            className="text-indigo-400 font-bold underline"
                          >
                            Study Module
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {getCalendarStatusForDate(activeCalendarDate).runs.map((run) => (
                <div key={run.id} className="p-3 bg-slate-950/40 border border-slate-850/50 rounded-xl text-xs font-mono text-emerald-400">
                  ⚡ GPS Workout Logged: {run.distanceKm.toFixed(2)} km in {Math.floor(run.durationSeconds / 60)}m {run.durationSeconds % 60}s
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
