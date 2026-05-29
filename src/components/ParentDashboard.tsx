/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Droplet, 
  Coffee, 
  Flame, 
  Calendar, 
  Heart, 
  Award, 
  ShieldCheck, 
  ChevronRight, 
  Compass, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  ChevronDown, 
  Smartphone,
  Save,
  MessageSquareHeart,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Play,
  Activity,
  Eye,
  LayoutGrid
} from 'lucide-react';
import { UserProfile, RunLog, DailyMetrics, Assignment, EducationalModule, ModuleCompletion, Coach, Team, TeamFormation } from '../types';
import TacticalAnimator from './TacticalAnimator';

interface ParentDashboardProps {
  parentProfile: UserProfile;
  allPlayers: UserProfile[];
  allRunLogs: RunLog[];
  allMetrics: Record<string, DailyMetrics[]>;
  allCompletions: ModuleCompletion[];
  modules: EducationalModule[];
  assignments: Assignment[];
  coaches: Coach[];
  teams: Team[];
  formations: TeamFormation[];
  onUpdatePlayerMetrics: (playerId: string, metrics: Partial<DailyMetrics>) => void;
}

export default function ParentDashboard({
  parentProfile,
  allPlayers,
  allRunLogs,
  allMetrics,
  allCompletions,
  modules,
  assignments,
  coaches,
  teams,
  formations,
  onUpdatePlayerMetrics
}: ParentDashboardProps) {
  const [hydrationScoop, setHydrationScoop] = useState<250 | 500 | 750>(250);
  const [successMsg, setSuccessMsg] = useState('');

  // Manual configuration and target-setting state overrides
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [editHydration, setEditHydration] = useState(1500);
  const [editHydrationGoal, setEditHydrationGoal] = useState(3000);
  const [editSleepHours, setEditSleepHours] = useState(8);
  const [editSleepQuality, setEditSleepQuality] = useState<'Poor' | 'Fair' | 'Good' | 'Excellent'>('Good');
  const [editCalories, setEditCalories] = useState(2000);
  const [editProtein, setEditProtein] = useState(60);
  const [editCarbs, setEditCarbs] = useState(120);
  const [editFat, setEditFat] = useState(35);
  const [editRunGoal, setEditRunGoal] = useState(15.0);
  
   // Dynamic additional children and switcher resolution
  const myChildren = useMemo(() => {
    const childIds = new Set<string>();
    if (parentProfile.childPlayerId) {
      childIds.add(parentProfile.childPlayerId);
    }
    if (parentProfile.childPlayerIds) {
      parentProfile.childPlayerIds.forEach(id => childIds.add(id));
    }
    // Also scan allPlayers in case any players have parentUserId set to this parent's ID
    allPlayers.forEach(p => {
      if (p.parentUserId === parentProfile.id) {
        childIds.add(p.id);
      }
    });
    return allPlayers.filter(p => childIds.has(p.id));
  }, [allPlayers, parentProfile.childPlayerId, parentProfile.childPlayerIds, parentProfile.id]);

  const [selectedChildId, setSelectedChildId] = useState<string>(() => {
    if (parentProfile.childPlayerId) return parentProfile.childPlayerId;
    if (parentProfile.childPlayerIds && parentProfile.childPlayerIds.length > 0) return parentProfile.childPlayerIds[0];
    // fallback scan
    const found = allPlayers.find(p => p.parentUserId === parentProfile.id);
    return found ? found.id : '';
  });

  // Look up Child profile
  const childPlayer = useMemo(() => {
    if (!selectedChildId) return null;
    return allPlayers.find(p => p.id === selectedChildId);
  }, [allPlayers, selectedChildId]);

  // Find coach and team details for the child player
  const childCoach = useMemo(() => {
    if (!childPlayer || !childPlayer.coachId) return null;
    return coaches.find(c => c.id === childPlayer.coachId);
  }, [coaches, childPlayer]);

  const childTeam = useMemo(() => {
    if (!childPlayer || !childPlayer.teamId) return null;
    return teams.find(t => t.id === childPlayer.teamId);
  }, [teams, childPlayer]);

  const [formationActiveTab, setFormationActiveTab] = useState<'lineup' | 'drills'>('lineup');

  // Formations data processing
  const teamFormations = useMemo(() => {
    if (!formations || !childPlayer?.teamId) return [];
    return formations.filter(f => f.teamId === childPlayer.teamId);
  }, [formations, childPlayer?.teamId]);

  const lastFormation = useMemo(() => {
    if (teamFormations.length === 0) return null;
    return [...teamFormations].sort((a, b) => {
      const aTime = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : 0;
      const bTime = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : 0;
      return bTime - aTime;
    })[0];
  }, [teamFormations]);

  const myAssignment = useMemo(() => {
    if (!lastFormation || !childPlayer) return null;
    return lastFormation.assignments.find(as => as.playerId === childPlayer.id);
  }, [lastFormation, childPlayer]);

  const formationAssignmentsWithNames = useMemo(() => {
    if (!lastFormation || !childPlayer) return [];
    return lastFormation.assignments.map(as => {
      const pObj = allPlayers.find(p => p.id === as.playerId);
      return {
        ...as,
        playerName: pObj ? pObj.name : 'Unassigned Position',
        isMe: as.playerId === childPlayer.id
      };
    }).sort((a, b) => (a.playerId ? 0 : 1) - (b.playerId ? 0 : 1));
  }, [lastFormation, allPlayers, childPlayer]);

  // Find position coordination
  const positionDisplay = useMemo(() => {
    if (myAssignment) {
      return myAssignment.positionId;
    }
    return 'Reserves Pool';
  }, [myAssignment]);

  // Find the child's daily metrics for the timeline date '2026-05-21'
  const targetDate = '2026-05-21';
  const childMetrics = useMemo(() => {
    if (!childPlayer) return null;
    const records = allMetrics[childPlayer.id] || [];
    return records.find(r => r.date === targetDate) || {
      playerId: childPlayer.id,
      date: targetDate,
      hydrationMls: 1500,
      hydrationGoalMls: 3000,
      sleepHours: 8,
      sleepQuality: 'Good' as const,
      nutritionCalories: 2000,
      nutritionProteinG: 60,
      nutritionCarbsG: 120,
      nutritionFatG: 35
    };
  }, [allMetrics, childPlayer]);

  // Encouragement note local state (persisted to localStorage)
  const [encouragementNote, setEncouragementNote] = useState(() => {
    if (!childPlayer) return '';
    return localStorage.getItem(`parent_gameday_note_${childPlayer.id}`) || 'Keep pushing hard, stay focused and remember to hydrate! I am very proud of you!';
  });

  const handleSaveEncouragement = () => {
    if (childPlayer) {
      localStorage.setItem(`parent_gameday_note_${childPlayer.id}`, encouragementNote);
      setSuccessMsg('Motivational message saved successfully! Your child will see this on their dashboard.');
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  const handleOpenEdit = () => {
    if (childPlayer && childMetrics) {
      setEditHydration(childMetrics.hydrationMls);
      setEditHydrationGoal(childMetrics.hydrationGoalMls);
      setEditSleepHours(childMetrics.sleepHours);
      setEditSleepQuality(childMetrics.sleepQuality);
      setEditCalories(childMetrics.nutritionCalories);
      setEditProtein(childMetrics.nutritionProteinG ?? 60);
      setEditCarbs(childMetrics.nutritionCarbsG ?? 120);
      setEditFat(childMetrics.nutritionFatG ?? 35);
      setEditRunGoal(childMetrics.runDistanceGoalKm ?? 15.0);
    }
    setIsEditingMetrics(true);
  };

  const handleSaveMetrics = () => {
    if (!childPlayer) return;
    onUpdatePlayerMetrics(childPlayer.id, {
      hydrationMls: editHydration,
      hydrationGoalMls: editHydrationGoal,
      sleepHours: editSleepHours,
      sleepQuality: editSleepQuality,
      nutritionCalories: editCalories,
      nutritionProteinG: editProtein,
      nutritionCarbsG: editCarbs,
      nutritionFatG: editFat,
      runDistanceGoalKm: editRunGoal
    });
    setIsEditingMetrics(false);
    setSuccessMsg('Athlete vitality parameters updated and uploaded successfully!');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Run statistics for the child
  const childRuns = useMemo(() => {
    if (!childPlayer) return [];
    return allRunLogs.filter(log => log.playerId === childPlayer.id);
  }, [allRunLogs, childPlayer]);

  const childCompletions = useMemo(() => {
    if (!childPlayer) return [];
    return allCompletions.filter(comp => comp.playerId === childPlayer.id);
  }, [allCompletions, childPlayer]);

  const totalKmRunThisWeek = useMemo(() => {
    return childRuns.reduce((sum, r) => sum + r.distanceKm, 0);
  }, [childRuns]);

  const runningGoalKm = childMetrics?.runDistanceGoalKm || 15.0;

  const hydrationPct = childMetrics
    ? Math.min(100, Math.round((childMetrics.hydrationMls / childMetrics.hydrationGoalMls) * 100))
    : 0;

  // Meal increment helper values
  const [mealCalories, setMealCalories] = useState(400);

  const handleAddHydration = () => {
    if (!childPlayer || !childMetrics) return;
    const nextVal = childMetrics.hydrationMls + hydrationScoop;
    onUpdatePlayerMetrics(childPlayer.id, {
      hydrationMls: nextVal
    });
  };

  const handleAddCalories = () => {
    if (!childPlayer || !childMetrics) return;
    const nextVal = childMetrics.nutritionCalories + mealCalories;
    onUpdatePlayerMetrics(childPlayer.id, {
      nutritionCalories: nextVal
    });
  };

  const handleSleepChange = (hours: number) => {
    if (!childPlayer) return;
    onUpdatePlayerMetrics(childPlayer.id, {
      sleepHours: hours
    });
  };

  const handleSleepQualityChange = (quality: 'Poor' | 'Fair' | 'Good' | 'Excellent') => {
    if (!childPlayer) return;
    onUpdatePlayerMetrics(childPlayer.id, {
      sleepQuality: quality
    });
  };

  if (!childPlayer) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-lg mx-auto my-12">
        <Users className="w-12 h-12 text-[#00bbff] mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-100">Connecting Connected Athletes</h3>
        <p className="text-slate-400 text-xs mt-2 leading-relaxed">
          We could not find your connected child player profile. Please ensure they are registered or link their user ID dynamically with administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* 1. Parent Banner Welcome Area */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 rounded-3xl border border-slate-850 p-6 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono rounded-full uppercase tracking-wider font-semibold">
                Authorized Guardian Portal
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 font-mono">Sync Online</span>
            </div>
            <h1 className="text-2xl font-black font-sans text-slate-100">Welcome, {parentProfile.name}</h1>
            <p className="text-xs text-slate-400 font-medium">
              Monitoring performance of your youth athlete <b className="text-[#00bbff]">{childPlayer.name}</b>
            </p>
          </div>

          {/* Connected Coach & Crew Info Container */}
          <div className="flex items-center gap-3 bg-slate-950/90 border border-slate-850 p-3 rounded-2xl max-w-xs md:w-64">
            <div className="bg-gradient-to-r from-indigo-505 to-sky-505 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">
              Coach
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-500 font-mono uppercase leading-none">
                {childCoach?.coachRole === 'assistant' ? 'Assistant Coach' : 'Head Coach'}
              </p>
              <p className="text-xs font-bold text-slate-250 truncate mt-1">
                {childCoach ? childCoach.name : 'Unassigned/Independent'}
              </p>
              <p className="text-[9px] text-[#00bbff] font-medium truncate mt-0.5">
                {childTeam ? childTeam.name : 'PDP Squad Group'}
              </p>
            </div>
          </div>
        </div>

        {/* Child Selector Row if multiple children are registered */}
        {myChildren.length > 1 && (
          <div className="pt-4 border-t border-slate-855 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Select Athlete:</span>
            <div className="flex flex-wrap gap-2">
              {myChildren.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-2 ${
                    selectedChildId === child.id
                      ? 'bg-[#00BBFF]/15 text-[#00BBFF] border border-[#00BBFF]/30'
                      : 'bg-slate-950/60 border border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedChildId === child.id ? 'bg-[#00BBFF]' : 'bg-slate-600'}`} />
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Notification Bar */}
      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-555/10 border border-emerald-555/25 text-emerald-400 rounded-xl text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* Dynamic Squad Formation & Drill Simulator Portal */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-550/20 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-semibold">
                Live Tactical Intelligence
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-semibold">
                PDP Squad Roster Setup
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-100 font-sans tracking-tight flex items-center gap-2 mt-1">
              <Compass className="w-5 h-5 text-[#00bbff]" />
              Squad Formation, Postings & Drills
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive review of {childPlayer.name}'s assigned lineup, field postings, and tactical animation plays
            </p>
          </div>

          {/* Sub-tab selection hooks */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0 select-none">
            <button
              onClick={() => setFormationActiveTab('lineup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                formationActiveTab === 'lineup'
                  ? 'bg-[#00bbff] text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-slate-205'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Lineup & Board</span>
            </button>
            <button
              onClick={() => setFormationActiveTab('drills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                formationActiveTab === 'drills'
                  ? 'bg-[#00bbff] text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-slate-205'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Review Drills & Plays</span>
            </button>
          </div>
        </div>

        {formationActiveTab === 'lineup' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Tactical Field Visualizer */}
            <div className="md:col-span-5 flex flex-col justify-between bg-emerald-950/40 rounded-2xl border border-emerald-500/20 p-4 min-h-[380px] relative overflow-hidden">
              {/* Grass Field stripe details */}
              <div className="absolute inset-0 flex flex-col opacity-[0.08] pointer-events-none z-0">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className={`flex-1 w-full ${idx % 2 === 0 ? 'bg-emerald-900' : 'bg-[#0a1e0d]'}`} />
                ))}
              </div>

              {/* Crisp pitch outlines */}
              <div className="absolute inset-2 pointer-events-none border border-white/20 rounded z-0">
                <div className="absolute top-0 left-1/4 right-1/4 h-1/6 border-b border-x border-white/15" />
                <div className="absolute bottom-0 left-1/4 right-1/4 h-1/6 border-t border-x border-white/15" />
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/20 rounded-full" />
              </div>

              {/* Player Positions */}
              <div className="relative z-10 w-full h-full min-h-[280px]">
                {lastFormation ? (
                  lastFormation.assignments.map((as) => {
                    const isChildPlayer = as.playerId === childPlayer.id;
                    const pObj = allPlayers.find(p => p.id === as.playerId);
                    
                    return (
                      <div 
                        key={as.positionId} 
                        className="absolute transition-all duration-305"
                        style={{ left: `${as.x}%`, top: `${as.y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        <div className="relative group flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[9px] border transition shadow-lg ${
                            isChildPlayer 
                              ? 'bg-[#00bbff] border-white text-slate-950 scale-125 ring-4 ring-sky-400/30 font-black animate-pulse' 
                              : pObj 
                                ? 'bg-slate-950 text-slate-205 border-slate-700' 
                                : 'bg-emerald-800/80 text-emerald-100 border-white/20 border-dashed'
                          }`}>
                            {as.positionId}
                          </div>
                          
                          <div className={`absolute top-full mt-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-sans truncate max-w-[90px] pointer-events-none text-center shadow-md ${
                            isChildPlayer 
                              ? 'bg-amber-400 text-slate-950 font-black border border-amber-500' 
                              : pObj 
                                ? 'bg-slate-950/90 text-slate-202 border border-slate-800' 
                                : 'bg-emerald-900/90 text-[#00bbff] border border-emerald-850'
                          }`}>
                            {pObj ? pObj.name : as.positionId}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-slate-500 text-xs italic">
                    No active team lineup deployed by the Coach yet. Let's look up team assignments!
                  </div>
                )}
              </div>

            </div>

            {/* Position details and strategic briefing notes column */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-850 space-y-4">
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block font-bold">Athlete Team Deployment Overview</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Position Assignment</span>
                    {myAssignment ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <b className="text-slate-100 text-sm font-mono tracking-tight text-[#00bbff] bg-[#00bbff]/10 border border-[#00bbff]/20 px-2.5 py-1 rounded">
                          {myAssignment.positionId}
                        </b>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-450 italic font-mono block mt-1">Reserves / Bench Pool</span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Squad System Details</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-black border border-indigo-500/20 px-2 py-0.5 rounded">
                        {lastFormation ? lastFormation.system : '7v7 Scheme'}
                      </span>
                      <b className="text-slate-205 text-xs font-sans tracking-tight">{lastFormation ? lastFormation.lineupName : 'Tactical Scheme'}</b>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3.5 space-y-2">
                  <span className="text-[9px] font-mono uppercase text-[#00bbff] tracking-wide block">Child Athlete Focus Profile</span>
                  <div className="p-3 bg-slate-900/60 border border-slate-850/60 rounded-xl text-xs space-y-1.5">
                    <p className="text-slate-300 font-medium">
                      Athlete: <span className="text-white font-bold">{childPlayer.name}</span>
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      {myAssignment ? (
                        <span>Currently deployed as a starting <b className="text-[#00bbff] font-mono bg-[#00bbff]/10 border border-[#00bbff]/25 px-1.5 py-0.5 rounded text-[11px]">{myAssignment.positionId}</b> inside the {lastFormation?.system ?? '7v7'} {lastFormation?.lineupName ?? 'squad template'}. Parent participation: review this board setup and guide your athlete.</span>
                      ) : (
                        <span>Currently positioned in the active squad reserves/substitution pool. They represent key structural depth for tactical plays this weekend!</span>
                      )}
                    </p>
                  </div>
                </div>

                {lastFormation?.notes && (
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850/60 text-xs space-y-1.5">
                    <span className="text-[9px] font-mono uppercase text-[#00bbff] tracking-wider block font-bold">Coach Gameplay Directives</span>
                    <p className="text-slate-350 italic leading-relaxed text-[11px]">
                      "{lastFormation.notes}"
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            {/* Embed TacticalAnimator directly! */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-850 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Tactical Animator Sandbox</span>
                  <p className="text-[11.5px] text-slate-400">Step through frame recordings list, play interactive drills, and check pitch dynamics mapped by coaches</p>
                </div>
              </div>
              
              {/* Load Tactical Animator with parentProfile */}
              <div className="p-1 px-1 py-1 bg-slate-950 rounded-2xl overflow-hidden">
                <TacticalAnimator currentProfile={parentProfile} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Grid Compartments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Health stats and hydration logging */}
        <div className="lg:col-span-7 space-y-6">
          
           {/* Hydration Logging & Health Co-Management Console */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-start border-b border-slate-850/60 pb-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100 tracking-tight font-sans flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-[#00bbff] fill-[#00bbff]/10" />
                  Health & Vitality Co-Management
                </h3>
                <p className="text-[11px] text-slate-450">Log and configure vital metrics on behalf of your youth athlete</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isEditingMetrics ? () => setIsEditingMetrics(false) : handleOpenEdit}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1.5 border transition cursor-pointer select-none ${
                    isEditingMetrics 
                      ? 'bg-rose-950/40 text-rose-400 border-rose-900 hover:bg-rose-900/40' 
                      : 'bg-[#00bbff]/10 text-[#00bbff] border-[#00bbff]/20 hover:bg-[#00bbff]/20'
                  }`}
                >
                  {isEditingMetrics ? 'Close Edit' : 'Edit All Metrics & Goals'}
                </button>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono text-[#00bbff] bg-slate-950 px-2.5 py-1 rounded-md border border-[#00bbff]/10">
                  Today's Log
                </span>
              </div>
            </div>

            {isEditingMetrics ? (
              <div className="space-y-4 pt-1 animate-fadeIn">
                <div className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-bold mb-3 border-b border-slate-800 pb-1.5">
                  Manual Adjustments & High-Fidelity Override Controls
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Hydration Value and Hydration Goal */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <span className="text-[10px] font-mono uppercase text-[#00bbff] block font-bold">1. Hydration Settings</span>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-mono text-left block">Current Intake (ml)</label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setEditHydration(prev => Math.max(0, prev - 250))}
                            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold transition flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={editHydration}
                            onChange={e => setEditHydration(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-805 text-slate-200 text-xs text-center rounded-lg p-1.5 flex-1 min-w-0 font-mono outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setEditHydration(prev => prev + 250)}
                            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold transition flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-mono text-left block">Intake Target Goal (ml)</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="range"
                            min="1000"
                            max="6000"
                            step="250"
                            value={editHydrationGoal}
                            onChange={e => setEditHydrationGoal(Number(e.target.value))}
                            className="w-full accent-[#00bbff] bg-slate-900 rounded-lg h-1.5 cursor-pointer"
                          />
                          <span className="text-[11px] text-slate-300 font-mono shrink-0 w-16 text-right">
                            {editHydrationGoal}ml
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sleep and Recovery */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <span className="text-[10px] font-mono uppercase text-amber-400 block font-bold">2. Recovery & Sleep Log</span>
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[10px] text-slate-500 font-mono text-left block">Actual Duration (Hours)</label>
                        <select
                          value={editSleepHours}
                          onChange={e => setEditSleepHours(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-205 rounded-lg p-2 outline-none mt-1 font-sans cursor-pointer"
                        >
                          {Array.from({ length: 15 }, (_, i) => i + 3).map(h => (
                            <option key={h} value={h}>{h} Hours</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-mono text-left block">Sleep Quality Index</label>
                        <select
                          value={editSleepQuality}
                          onChange={e => setEditSleepQuality(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-205 rounded-lg p-2 outline-none mt-1 font-sans cursor-pointer"
                        >
                          <option value="Poor">Poor Quality (Restless)</option>
                          <option value="Fair">Fair Quality (Interrupted)</option>
                          <option value="Good">Good Quality (Normal Rest)</option>
                          <option value="Excellent">Excellent Quality (Deep Recovery)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nutrition Calories and Macronutrients Breakdown */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                  <span className="text-[10px] font-mono uppercase text-rose-400 block font-bold">3. Nutrition Intake & Macronutrient Ratios</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono text-left block">Daily Calories (kcal)</label>
                      <input
                        type="number"
                        value={editCalories}
                        onChange={e => setEditCalories(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-205 text-xs rounded-lg p-2 font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono text-left block">Protein (grams)</label>
                      <input
                        type="number"
                        value={editProtein}
                        onChange={e => setEditProtein(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-205 text-xs rounded-lg p-2 font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono text-left block">Carbohydrates (g)</label>
                      <input
                        type="number"
                        value={editCarbs}
                        onChange={e => setEditCarbs(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-205 text-xs rounded-lg p-2 font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono text-left block">Fats (g)</label>
                      <input
                        type="number"
                        value={editFat}
                        onChange={e => setEditFat(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-205 text-xs rounded-lg p-2 font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Training run homework goal setting */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold">4. Weekly Endurance Goal</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-mono text-left block">Target Training Volume (KM)</label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        value={editRunGoal}
                        onChange={e => setEditRunGoal(Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-900 rounded-lg h-1.5 mt-1.5 cursor-pointer"
                      />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-emerald-400">{editRunGoal}</span>
                      <span className="text-[9px] font-mono text-slate-500 ml-1">KM</span>
                    </div>
                  </div>
                </div>

                {/* Form CTA Buttons */}
                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsEditingMetrics(false)}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer select-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMetrics}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-555 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-600/10 flex items-center gap-1.5 select-none"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Save Vitality Parameters</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Core Metrics Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Daily Hydration Progress gauge */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-[#00bbff]/15 flex flex-col justify-between space-y-3 shadow-md shadow-[#00bbff]/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase text-slate-400">Hydration Progress</span>
                      <Droplet className="w-3.5 h-3.5 text-[#00bbff]" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-100">{childMetrics ? `${childMetrics.hydrationMls} ml` : '1500 ml'}</div>
                      <div className="text-[10px] text-slate-550 font-sans mt-0.5">Target: {childMetrics ? childMetrics.hydrationGoalMls : 3000} ml</div>
                    </div>
                    {/* Visual meter bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-400 to-[#00bbff] transition-all duration-500" 
                          style={{ width: `${hydrationPct}%` }}
                        />
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 text-right">{hydrationPct}% Completed</div>
                    </div>
                  </div>

                  {/* Sleep Hours and Quality Logged */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/15 flex flex-col justify-between space-y-3 shadow-md shadow-amber-500/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase text-slate-400">Sleep Logged</span>
                      <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-100">{childMetrics ? `${childMetrics.sleepHours} hrs` : '8 hrs'}</div>
                      <div className="text-[10px] text-slate-550 font-sans mt-0.5">Quality: <b className="text-slate-200">{childMetrics?.sleepQuality || 'Good'}</b></div>
                    </div>
                    <div className="text-[9px] text-[#00bbff] font-medium italic">Essential for athletic recovery</div>
                  </div>

                  {/* nutrition calories logged */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/15 flex flex-col justify-between space-y-3 shadow-md shadow-rose-500/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase text-slate-400">Daily Calories</span>
                      <Flame className="w-3.5 h-3.5 text-rose-450" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-100">{childMetrics ? `${childMetrics.nutritionCalories} kcal` : '2000 kcal'}</div>
                      <div className="text-[10px] text-slate-550 font-sans mt-0.5">Active sports load budget</div>
                    </div>
                    <div className="text-[9px] text-emerald-400 font-mono">Nutrients balanced</div>
                  </div>

                </div>

                {/* Micro nutrition macros detail */}
                {childMetrics && (
                  <div className="grid grid-cols-3 gap-3 bg-slate-955 border border-slate-850/60 p-3.5 rounded-2xl text-center">
                    <div>
                      <div className="text-[9px] font-mono uppercase text-slate-500">Protein Target</div>
                      <div className="text-sm font-bold font-mono text-red-400 mt-0.5">{childMetrics.nutritionProteinG ?? 60}g</div>
                      <div className="text-[8px] font-mono text-slate-600 mt-0.5">({(childMetrics.nutritionProteinG ?? 60) * 4} kcal)</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono uppercase text-slate-500">Carbohydrates</div>
                      <div className="text-sm font-bold font-mono text-amber-500 mt-0.5">{childMetrics.nutritionCarbsG ?? 120}g</div>
                      <div className="text-[8px] font-mono text-slate-600 mt-0.5">({(childMetrics.nutritionCarbsG ?? 120) * 4} kcal)</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono uppercase text-slate-500">Healthy Fats</div>
                      <div className="text-sm font-bold font-mono text-[#00bbff] mt-0.5">{childMetrics.nutritionFatG ?? 35}g</div>
                      <div className="text-[8px] font-mono text-slate-600 mt-0.5">({(childMetrics.nutritionFatG ?? 35) * 9} kcal)</div>
                    </div>
                  </div>
                )}

                {/* Parent Co-Management Controls Section */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850/60 space-y-4">
                  <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block font-bold">Input Daily Logs For Athlete</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Action A: Hydration Logging scoop */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-slate-500 uppercase">1. Log Water Intake</label>
                      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button 
                          onClick={() => setHydrationScoop(250)}
                          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition ${hydrationScoop === 250 ? 'bg-[#00bbff] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          250ml
                        </button>
                        <button 
                          onClick={() => setHydrationScoop(500)}
                          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition ${hydrationScoop === 500 ? 'bg-[#00bbff] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          500ml
                        </button>
                        <button 
                          onClick={() => setHydrationScoop(750)}
                          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition ${hydrationScoop === 750 ? 'bg-[#00bbff] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          750ml
                        </button>
                      </div>
                      <button
                        onClick={handleAddHydration}
                        className="w-full bg-[#00bbff]/15 hover:bg-[#00bbff]/25 text-[#00bbff] border border-[#00bbff]/30 text-[10px] font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Droplet className="w-3.5 h-3.5 shrink-0" />
                        <span>Hydrate +{hydrationScoop} ml</span>
                      </button>
                    </div>

                    {/* Action B: Nutrition Intake logging */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase">2. Log Calories</label>
                      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button 
                          onClick={() => setMealCalories(200)}
                          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition ${mealCalories === 200 ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-205'}`}
                        >
                          +200
                        </button>
                        <button 
                          onClick={() => setMealCalories(400)}
                          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition ${mealCalories === 400 ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-205'}`}
                        >
                          +400
                        </button>
                        <button 
                          onClick={() => setMealCalories(700)}
                          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition ${mealCalories === 700 ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-205'}`}
                        >
                          +700
                        </button>
                      </div>
                      <button
                        onClick={handleAddCalories}
                        className="w-full bg-indigo-555/15 hover:bg-indigo-555/25 text-indigo-400 border border-indigo-505/30 text-[10px] font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                        <span>Log Meal +{mealCalories} kcal</span>
                      </button>
                    </div>
                  </div>

                  {/* Action C: Sleep inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5 border-t border-slate-900">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-500 uppercase">3. Set Sleep Duration</label>
                      <select
                        value={childMetrics?.sleepHours || 8}
                        onChange={(e) => handleSleepChange(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-2 outline-none font-sans cursor-pointer"
                      >
                        {Array.from({ length: 9 }, (_, i) => i + 4).map(h => (
                          <option key={h} value={h}>{h} Hours</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-500 uppercase">4. Set Sleep Quality</label>
                      <select
                        value={childMetrics?.sleepQuality || 'Good'}
                        onChange={(e) => handleSleepQualityChange(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg p-2 outline-none font-sans cursor-pointer"
                      >
                        <option value="Poor">Poor Quality</option>
                        <option value="Fair">Fair Quality</option>
                        <option value="Good">Good Quality</option>
                        <option value="Excellent">Excellent Quality</option>
                      </select>
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>

          {/* Encouragement message formulation editor */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-100 tracking-tight font-sans flex items-center gap-2">
              <MessageSquareHeart className="w-4 h-4 text-emerald-400" />
              Gameday Motivational Bulletin
            </h3>
            <p className="text-[11px] text-slate-400">
              Transmit custom support. This note shows as a banner on your kid's athlete dashboard to spur them forward on practice day!
            </p>
            
            <div className="space-y-2 pt-1">
              <textarea
                value={encouragementNote}
                onChange={(e) => setEncouragementNote(e.target.value)}
                maxLength={180}
                placeholder="Proud of your effort this week! Keep hydrating and give 100% on gameday."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-700 min-h-[80px]"
              />
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>{180 - encouragementNote.length} characters remaining</span>
                <button
                  type="button"
                  onClick={handleSaveEncouragement}
                  className="bg-emerald-505/10 hover:bg-emerald-505/20 text-emerald-400 border border-emerald-505/30 px-3 py-1 rounded-lg text-[10px] font-bold font-sans flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>Transmit to Dashboard</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Running progress & Classroom homework completion */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Running Homework Dashboard Indicator */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide">
                Weekly Running Practice
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {childRuns.length} runs recorded
              </span>
            </div>

            {/* Running distance gauge against goal */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850/60">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-black text-slate-100">{totalKmRunThisWeek.toFixed(1)} <sub className="text-xs font-normal text-slate-450">KM</sub></span>
                <span className="text-xs font-mono text-slate-400">Goal: {runningGoalKm.toFixed(1)} KM</span>
              </div>
              
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#00bbff] transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalKmRunThisWeek / runningGoalKm) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-[9px] text-[#00bbff] font-mono">
                  {totalKmRunThisWeek >= runningGoalKm ? '✓ Running homework target MET!' : 'Practice load in progress'}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {Math.round((totalKmRunThisWeek / runningGoalKm) * 100)}%
                </span>
              </div>
            </div>

            {/* Run logs listing */}
            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
              {childRuns.length === 0 ? (
                <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-center text-xs text-slate-500 italic">
                  No running exercises logged yet this week
                </div>
              ) : (
                [...childRuns].sort((a,b) => b.date.localeCompare(a.date)).map(run => (
                  <div key={run.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850/50 text-xs flex justify-between items-center hover:border-slate-800 transition">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-250 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-550 shrink-0" />
                        <span>{new Date(run.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {Math.floor(run.durationSeconds / 60)} mins · Avg Pace: {run.avgSpeedKmH.toFixed(1)} km/h
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-emerald-400">+{run.distanceKm.toFixed(2)} KM</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Education homework syllabus progress */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide">
              Classroom & Education Homework
            </h3>
            
            <div className="space-y-2">
              <div className="text-[10.5px] text-slate-400">
                Tracking completed mental, nutritional, and physical education syllabus tutorials requested by Coach:
              </div>

              {/* Completion micro analytics */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-850 text-center">
                <div>
                  <div className="text-lg font-bold text-[#00bbff]">
                    {childCompletions.length}
                  </div>
                  <div className="text-[9px] uppercase font-mono text-slate-500">Modules Completed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-400">
                    {modules.length - childCompletions.length > 0 ? modules.length - childCompletions.length : 0}
                  </div>
                  <div className="text-[9px] uppercase font-mono text-slate-500">Modules Pending</div>
                </div>
              </div>

              {/* Staggered lists of completions */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 pt-1">
                {modules.map(mod => {
                  const hasDone = childCompletions.some(c => c.moduleId === mod.id);
                  return (
                    <div 
                      key={mod.id} 
                      className={`p-2.5 rounded-xl border text-xs flex justify-between items-center transition ${hasDone ? 'bg-emerald-555/5 border-emerald-555/15 text-slate-300' : 'bg-slate-955/60 border-slate-850 text-slate-400'}`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold truncate text-[11px] text-slate-200">{mod.title}</p>
                        <p className="text-[9px] font-mono text-slate-550 lowercase">{mod.category} · {mod.durationMinutes} mins</p>
                      </div>
                      <div className="shrink-0">
                        {hasDone ? (
                          <span className="text-[9px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            ✓ Done
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-950 border border-slate-855 px-1.5 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coach's General Squad Homework Guidelines & Due Dates */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Roster Homework Planner
            </h3>
            <div className="space-y-2">
              {assignments.filter(a => a.teamId === childPlayer.teamId || a.teamId === '').length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-2">No active roster homework due</p>
              ) : (
                assignments.filter(a => a.teamId === childPlayer.teamId || a.teamId === '').map(asItem => {
                  const accomplished = asItem.completedByPlayerIds.includes(childPlayer.id);
                  return (
                    <div key={asItem.id} className="bg-slate-955 p-3 rounded-2xl border border-slate-855 flex items-center justify-between text-xs gap-3">
                      <div>
                        <div className="font-bold text-slate-200">{asItem.title}</div>
                        <div className="text-[9px] text-[#00bbff] font-mono uppercase mt-0.5 flex items-center gap-1">
                          <span>DUE: {asItem.dueDate}</span>
                          <span>·</span>
                          <span>{asItem.type.toUpperCase()} WORK</span>
                        </div>
                      </div>
                      <div>
                        {accomplished ? (
                          <span className="text-[8px] font-mono uppercase font-black text-emerald-400 px-2.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            COMPLETED
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono uppercase font-black text-amber-500 px-2.5 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                            INCOMPLETE
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
