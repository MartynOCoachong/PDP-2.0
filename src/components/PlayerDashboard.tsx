/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Flame, Droplet, Coffee, Star, Trophy, CheckSquare, Calendar, ChevronRight, Moon, Utensils, Award, BookOpen, AlertCircle, Eye, Compass, MapPin, Users, FileText, Layers, Heart } from 'lucide-react';
import { UserProfile, RunLog, DailyMetrics, Assignment, EducationalModule, ModuleCompletion, TeamFormation } from '../types';
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
  onSelectTab: (tab: 'classroom' | 'formation', formationId?: string) => void;
  allPlayers?: UserProfile[];
  allRunLogs?: RunLog[];
  allMetrics?: Record<string, DailyMetrics[]>;
  allCompletions?: ModuleCompletion[];
  formations?: TeamFormation[];
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
  onSelectTab,
  allPlayers = [],
  allRunLogs = [],
  allMetrics = {},
  allCompletions = [],
  formations = []
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
  const [hydrationScoop, setHydrationScoop] = useState<250 | 500 | 750>(250);

  // Active run log assignment target selectors
  const [trackAssignmentId, setTrackAssignmentId] = useState<string>('');
  const [trackAssignedDistance, setTrackAssignedDistance] = useState<number | undefined>(undefined);
  const [isTacticalOpen, setIsTacticalOpen] = useState(true);
  const [isLineupAccordionExpanded, setIsLineupAccordionExpanded] = useState(false);

  // Stats gathers
  const totalKmRunThisWeek = runLogs.reduce((sum, r) => sum + r.distanceKm, 0);
  const weeklyRunningGoal = metrics.runDistanceGoalKm || 15.0; // Dynamic goal updated by Coach, default 15 KM

  const hydrationPct = Math.min(100, Math.round((metrics.hydrationMls / metrics.hydrationGoalMls) * 100));
  const caloriePct = Math.min(100, Math.round((metrics.nutritionCalories / 2800) * 100)); // Daily average cap target 2800 kcal

  // Educational stats linked to assigned classroom education sessions
  const assignedModules = assignments.filter(a => a.type === 'module');
  const assignedModulesCount = assignedModules.length;
  const completedAssignedModulesCount = assignedModules.filter(a => {
    return a.completedByPlayerIds.includes(playerProfile.id) || completions.some(comp => comp.moduleId === a.moduleId);
  }).length;

  // Formations data processing
  const teamFormations = useMemo(() => {
    if (!formations) return [];
    return formations.filter(f => f.teamId === playerProfile.teamId);
  }, [formations, playerProfile.teamId]);

  const lastFormation = useMemo(() => {
    if (teamFormations.length === 0) return null;
    return [...teamFormations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  }, [teamFormations]);

  const myAssignment = useMemo(() => {
    if (!lastFormation) return null;
    return lastFormation.assignments.find(as => as.playerId === playerProfile.id);
  }, [lastFormation, playerProfile.id]);

  const formationAssignmentsWithNames = useMemo(() => {
    if (!lastFormation) return [];
    return lastFormation.assignments.map(as => {
      const pObj = allPlayers.find(p => p.id === as.playerId);
      return {
        ...as,
        playerName: pObj ? pObj.name : 'Unassigned Position',
        isMe: as.playerId === playerProfile.id
      };
    }).sort((a,b) => (a.playerId ? 0 : 1) - (b.playerId ? 0 : 1)); // Show active assignments first
  }, [lastFormation, allPlayers, playerProfile.id]);

  // Composite Team / Squad Ranking Engine
  const overallRankingInfo = useMemo(() => {
    // We look for players assigned to the same coach first to calculate team ranking.
    // If not enough peers, fall back to global players for broad competitiveness.
    let list = (allPlayers || []).filter(p => p.role === 'player' && p.coachId === playerProfile.coachId);
    if (list.length <= 1) {
      list = (allPlayers || []).filter(p => p.role === 'player');
    }

    if (list.length === 0) {
      return { rank: 1, totalPlayers: 1, title: 'Squad Leader' };
    }

    // Previous 7 days rolling window (same as leaderboard) aligned with current dates
    const today = new Date('2026-05-26'); 
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const isDateInWeek = (dateStr: string) => {
      if (!dateStr) return false;
      const cleanDate = new Date(dateStr.substring(0, 10));
      return cleanDate >= startOfWeek;
    };

    // Calculate performance indicators for each athlete
    const playerSummaries = list.map(player => {
      const pId = player.id;
      
      // A. Running distance total
      const pRuns = (allRunLogs || []).filter(log => log.playerId === pId && isDateInWeek(log.date));
      const distance = pRuns.reduce((sum, run) => sum + run.distanceKm, 0);

      // B. Best 3K pace
      const eligible3k = pRuns.filter(r => r.distanceKm >= 3.0);
      let best3kPace = Infinity;
      eligible3k.forEach(run => {
        const pace = run.durationSeconds / run.distanceKm;
        if (pace < best3kPace) best3kPace = pace;
      });

      // C. Hydration cumulative mls
      const pMetrics = (allMetrics && allMetrics[pId] || []).filter(met => isDateInWeek(met.date));
      const hydrationTotal = pMetrics.reduce((sum, met) => sum + met.hydrationMls, 0);

      // D. Sleep cumulative hours
      const sleepTotal = pMetrics.reduce((sum, met) => sum + met.sleepHours, 0);

      // E. Educational Classroom Module completion count
      const pCompletions = (allCompletions || []).filter(comp => comp.playerId === pId && isDateInWeek(comp.dateCompleted));
      const completionsCount = pCompletions.length;

      return {
        id: pId,
        distance,
        best3kPace,
        hydrationTotal,
        sleepTotal,
        completionsCount
      };
    });

    // Rank helper generator
    const getAttrRank = (pId: string, attr: keyof typeof playerSummaries[0], ascending = false) => {
      const sorted = [...playerSummaries].sort((a, b) => {
        const valA = a[attr] as number;
        const valB = b[attr] as number;
        if (valA === valB) return 0;
        if (ascending) {
          return valA - valB;
        } else {
          return valB - valA;
        }
      });
      return sorted.findIndex(s => s.id === pId) + 1;
    };

    // Score all peer athletes dynamically
    const compositeScores = list.map(player => {
      const pId = player.id;
      const rankDist = getAttrRank(pId, 'distance', false);
      const rankPace = getAttrRank(pId, 'best3kPace', true); // lower is better
      const rankWater = getAttrRank(pId, 'hydrationTotal', false);
      const rankSleep = getAttrRank(pId, 'sleepTotal', false);
      const rankClass = getAttrRank(pId, 'completionsCount', false);

      const rankSum = rankDist + rankPace + rankWater + rankSleep + rankClass;
      return {
        id: pId,
        rankSum
      };
    });

    const sortedComposite = [...compositeScores].sort((a, b) => a.rankSum - b.rankSum);
    const myIndex = sortedComposite.findIndex(s => s.id === playerProfile.id);
    const myRank = myIndex !== -1 ? myIndex + 1 : list.length;

    let title = 'Active Competitor';
    if (myRank === 1) title = 'Squad Leader';
    else if (myRank === 2) title = 'Elite Captain';
    else if (myRank === 3) title = 'Pace Setter';
    else if (myRank === 4) title = 'Elite Contender';
    else if (myRank === 5) title = 'Rising Star';

    return {
      rank: myRank,
      totalPlayers: list.length,
      title
    };
  }, [allPlayers, allRunLogs, allMetrics, allCompletions, playerProfile.id, playerProfile.coachId]);

  const handleIncrementHydration = () => {
    onUpdateDailyMetrics({
      hydrationMls: metrics.hydrationMls + hydrationScoop
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
                Your profile is synced with Coach <b className="text-slate-300">{playerProfile.manualCoachName || 'Martyn ODonnell'}</b>. 
              </p>
            </div>
            
            <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-850 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-[10px] font-mono text-slate-450 uppercase">Weekly Rank</div>
                <div className="text-xs font-sans font-bold text-slate-200">
                  #{overallRankingInfo.rank} {overallRankingInfo.title}
                </div>
              </div>
            </div>
          </div>

          {/* Parent Gameday Encouraging Note if Present */}
          {(() => {
            const parentNoteVal = localStorage.getItem(`parent_gameday_note_${playerProfile.id}`);
            if (!parentNoteVal) return null;
            return (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                  <Heart className="w-5 h-5 text-indigo-450 fill-indigo-400/20" />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                    Message from Parent (Support Bulletin)
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic font-medium">
                    "{parentNoteVal}"
                  </p>
                  <div className="text-[9px] font-mono text-slate-500">
                    Received via Parent Registry
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* Coach-Created Team Formation Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#00bbff]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight font-sans">Team Lineup & Player Position</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="bg-[#00bbff]/10 text-[#00bbff] border border-[#00bbff]/20 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold animate-pulse">
                  Gameday Prep
                </span>
              </div>
            </div>

            {!lastFormation ? (
              <div className="p-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center space-y-1">
                <p className="text-xs text-slate-350 font-medium">No published lineups yet</p>
                <p className="text-[10px] text-slate-500 font-mono">Your coach has not set up game day layouts for your team yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Meta details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1 text-center sm:text-left flex flex-col justify-center">
                    <div className="text-[9px] font-mono text-slate-500 uppercase">Active Scheme Configuration</div>
                    <div className="text-xs font-bold text-slate-200 truncate">{lastFormation.name}</div>
                    <div className="text-[10.5px] font-mono text-[#00bbff]">{lastFormation.system} · {lastFormation.lineupName}</div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-center text-center sm:text-left">
                    <div className="text-[9px] font-mono text-slate-500 uppercase">Your Field Assignment</div>
                    {myAssignment ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
                          {myAssignment.positionId} ({myAssignment.positionName})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Reserves / Squad Pool</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTab('formation', lastFormation.id)}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col items-center justify-between text-center transition group cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500/30 min-h-[72px]"
                  >
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Team Formation</div>
                    
                    {/* Tactical chalkboard play custom image */}
                    <div className="relative w-12 h-12 rounded-lg border border-slate-800 bg-slate-900 overflow-hidden transition group-hover:border-[#00bbff]/40 duration-300 my-1 flex items-center justify-center shadow-inner">
                      <img
                        src="https://i.ibb.co/677t1dGJ/Untitled-design-7.png"
                        alt="Tactical whiteboard blueprint play"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="text-[9px] text-slate-400 group-hover:text-emerald-400 transition font-medium flex items-center gap-1 font-mono tracking-tight leading-none">
                      <span>View whiteboard</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                </div>



                {/* TEAM TACTICS & ANIMATIONS row */}
                <div className="bg-slate-950 rounded-xl border border-slate-850 hover:border-sky-500/30 transition duration-150 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('scroll_to_tactical_playbook', 'true');
                      onSelectTab('formation', lastFormation.id);
                    }}
                    className="w-full text-left p-3.5 flex justify-between items-center bg-slate-950 hover:bg-slate-900/40 transition cursor-pointer select-none"
                  >
                    <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider flex items-center gap-1.5 font-bold">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      Team Tactics & Animations
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold animate-pulse">
                        <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                        High Importance
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>
                </div>
              </div>
            )}
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative flex flex-col justify-between overflow-hidden">
              {/* Translucent water and bubble vector background (inspired by reference image) */}
              <div className="absolute inset-0 opacity-[0.14] pointer-events-none select-none z-0">
                <svg className="w-full h-full text-sky-400" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#0284c7" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.6" />
                    </linearGradient>
                    <radialGradient id="bubbleGrad" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
                      <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.3" />
                    </radialGradient>
                  </defs>

                  {/* Elegant flowing wave paths */}
                  <path d="M-50,150 C50,90 100,220 250,140 L250,250 L-50,250 Z" fill="url(#waveGrad)" />
                  <path d="M-50,190 C60,110 130,240 250,180 L250,250 L-50,250 Z" fill="url(#waveGrad)" opacity="0.8" />
                  <path d="M-50,80 C80,40 120,180 250,100 L250,250 L-50,250 Z" fill="url(#waveGrad)" opacity="0.5" />

                  {/* Composition of overlapping bubbles / liquid elements matching the aesthetics of reference */}
                  <circle cx="35" cy="50" r="28" stroke="#38bdf8" strokeWidth="1.5" fill="url(#bubbleGrad)" />
                  <circle cx="95" cy="110" r="34" stroke="#38bdf8" strokeWidth="1.2" fill="url(#bubbleGrad)" />
                  <circle cx="155" cy="40" r="24" stroke="#38bdf8" strokeWidth="1" fill="url(#bubbleGrad)" />
                  <circle cx="170" cy="140" r="18" stroke="#38bdf8" strokeWidth="1" fill="url(#bubbleGrad)" />
                  <circle cx="25" cy="160" r="20" stroke="#38bdf8" strokeWidth="1.2" fill="url(#bubbleGrad)" />
                  <circle cx="110" cy="195" r="30" stroke="#38bdf8" strokeWidth="1.5" fill="url(#bubbleGrad)" />
                  <circle cx="45" cy="225" r="15" stroke="#38bdf8" strokeWidth="1" fill="url(#bubbleGrad)" />
                  <circle cx="180" cy="220" r="22" stroke="#38bdf8" strokeWidth="1" fill="url(#bubbleGrad)" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Droplet className="w-4 h-4 text-sky-400 shrink-0" />
                    Hydration Level
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-400">{hydrationPct}%</span>
                </div>
                <p className="text-[10px] text-slate-450 font-mono mb-4">Assigned by coach: {metrics.hydrationGoalMls} ml</p>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs mb-4">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">LOGGED VALUE</div>
                  <div className="text-lg font-bold font-mono text-slate-100">{metrics.hydrationMls} ml</div>
                </div>
              </div>

              {/* Slider for scoop selection */}
              <div className="space-y-3 relative z-10">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-1.5">Selected Scoop Size:</div>
                  <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1 relative overflow-hidden" style={{ minHeight: '36px' }}>
                    {([250, 500, 750] as const).map((size) => {
                      const isSelected = hydrationScoop === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setHydrationScoop(size)}
                          className={`relative z-10 py-1.5 text-center text-[10px] font-sans font-bold transition-all uppercase rounded-lg ${
                            isSelected ? 'text-slate-950' : 'text-slate-450 hover:text-slate-200'
                          }`}
                          style={{ outline: 'none' }}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="activeHydrationScoopIndicator"
                              className="absolute inset-0 bg-[#00bbff] rounded-lg -z-10"
                              transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            />
                          )}
                          {size} ml
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleIncrementHydration}
                  className="w-full py-2 bg-[#00bbff] hover:bg-[#009be0] active:scale-95 text-slate-950 font-sans font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Droplet className="w-3.5 h-3.5 text-slate-950" />
                  + Log {hydrationScoop}ml Intake
                </button>
              </div>
            </div>

            {/* Widget 3: Sleep quality tracker */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-350 uppercase mb-4">
                  <Moon className="w-4 h-4 text-emerald-400 shrink-0" />
                  Sleep Optimization Rating
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs mb-4">
                  <div>
                    <div className="text-[10px] font-mono text-slate-450 uppercase mb-1">Sleep Hours</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateDailyMetrics({ sleepHours: Math.max(0, metrics.sleepHours - 0.5) })}
                        className="w-6 h-6 rounded-full bg-[#00bbff] hover:bg-[#009be0] text-slate-950 font-bold flex items-center justify-center transition-transform active:scale-90"
                        title="Decrease sleep hours"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-slate-100 text-sm">{metrics.sleepHours}h</span>
                      <button
                        type="button"
                        onClick={() => onUpdateDailyMetrics({ sleepHours: Math.min(24, metrics.sleepHours + 0.5) })}
                        className="w-6 h-6 rounded-full bg-[#00bbff] hover:bg-[#009be0] text-slate-950 font-bold flex items-center justify-center transition-transform active:scale-90"
                        title="Increase sleep hours"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-455 uppercase mb-1">Rating</div>
                    <div className="text-sm font-sans font-bold text-emerald-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-emerald-400 border-none shrink-0" />
                      <span className="text-xs uppercase tracking-wider">{metrics.sleepQuality}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider Toggles for rating */}
              <div className="space-y-1.5 relative z-10">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Adjust Quality Rating Slider:</div>
                <div className="grid grid-cols-4 bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1 relative overflow-hidden" style={{ minHeight: '36px' }}>
                  {(['Poor', 'Fair', 'Good', 'Excellent'] as const).map((opt) => {
                    const isSelected = metrics.sleepQuality === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onUpdateDailyMetrics({ sleepQuality: opt })}
                        className={`relative z-10 py-1.5 text-center text-[10px] font-sans font-bold transition-all uppercase rounded-lg ${
                          isSelected ? 'text-slate-950' : 'text-slate-450 hover:text-slate-200'
                        }`}
                        style={{ outline: 'none' }}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="activeSleepQualityIndicator"
                            className="absolute inset-0 bg-[#00bbff] rounded-lg -z-10"
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          />
                        )}
                        {opt}
                      </button>
                    );
                  })}
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
                    type="button"
                    onClick={() => setShowMealLogger(true)}
                    className="w-full py-2 bg-[#00bbff] hover:bg-[#009be0] text-slate-950 text-xs font-bold rounded-xl transition active:scale-95"
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
                        className="text-[10px] text-slate-400 hover:text-slate-100 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        type="submit"
                        className="bg-[#00bbff] hover:bg-[#009be0] text-slate-950 text-[10px] font-bold px-3.5 py-1.5 rounded-lg active:scale-95 transition"
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
            <span className="text-[10px] font-mono text-[#00bbff] tracking-wide font-bold block mb-1">
              EDUCATIONAL STATS
            </span>
            <h3 className="text-sm font-semibold text-slate-200">Academy Modules Verified</h3>
            
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-mono font-bold text-[#00bbff]">
                  {completedAssignedModulesCount} / {assignedModulesCount}
                </div>
                <div className="text-[11px] text-slate-450 mt-0.5 leading-relaxed">Assigned Modules Logged</div>
              </div>
              
              <button
                onClick={() => onSelectTab('classroom')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-[#00bbff] border border-slate-850 flex items-center gap-1.5 transition text-xs font-semibold hover:opacity-90"
              >
                Go to Classroom
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Micro completed listing to reflect all assigned modules and their exact state */}
            <div className="mt-4 space-y-1.5">
              {assignedModules.length === 0 ? (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-center text-[10px] font-mono text-slate-500">
                  No classroom sessions assigned by coach.
                </div>
              ) : (
                assignedModules.map((assign) => {
                  const mod = modules.find(m => m.id === assign.moduleId);
                  const completionRecord = completions.find(comp => comp.moduleId === assign.moduleId);
                  const isCompleted = assign.completedByPlayerIds.includes(playerProfile.id) || !!completionRecord;
                  
                  return (
                    <div key={assign.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 text-[10px] font-mono flex justify-between items-center">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate max-w-[150px] text-slate-300 font-semibold">{mod?.title || assign.title || 'Learning Module'}</span>
                        <span className="text-[8px] text-slate-500">Due: {assign.dueDate}</span>
                      </div>
                      <div>
                        {isCompleted ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase text-[8px]">
                            {completionRecord?.quizScore 
                              ? `Score: ${completionRecord.quizScore.score}/${completionRecord.quizScore.total}` 
                              : 'DONE'}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase text-[8px]">
                            REQUIRED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
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
