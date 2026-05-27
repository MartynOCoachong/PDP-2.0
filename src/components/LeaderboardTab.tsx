/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Trophy, Droplet, Moon, Award, Calendar, Users, Target, BookOpen, Clock, Activity, Star, Milestone } from 'lucide-react';
import { UserProfile, RunLog, DailyMetrics, ModuleCompletion, EducationalModule } from '../types';

interface LeaderboardTabProps {
  currentProfile: UserProfile;
  players: UserProfile[]; // all players/users across system
  runLogs: RunLog[];
  allMetrics: Record<string, DailyMetrics[]>;
  completions: ModuleCompletion[];
}

export default function LeaderboardTab({
  currentProfile,
  players,
  runLogs,
  allMetrics,
  completions
}: LeaderboardTabProps) {
  const [timeScope, setTimeScope] = useState<'week' | 'all'>('week');
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'running' | 'wellness' | 'classroom'>('running');
  
  // In case of association or admin logged in, let them filter the active coach leaderboard.
  // For players, we filter by their coachId.
  // For coaches, we filter by their own coachId.
  const allCoaches = useMemo(() => {
    // Get unique coaches from players' properties or simple lookup
    const coachIds = new Set<string>();
    const coachesList: { id: string; name: string }[] = [];
    
    players.forEach(p => {
      if (p.coachId) {
        if (!coachIds.has(p.coachId)) {
          coachIds.add(p.coachId);
          // look for coach name or build a default label
          coachesList.push({
            id: p.coachId,
            name: p.manualCoachName || `Coach (${p.coachId.replace('coach-', '').substring(0, 5)})`
          });
        }
      }
    });
    return coachesList;
  }, [players]);

  // Determine base coach to filter
  const initialCoachId = useMemo(() => {
    if (currentProfile.role === 'coach') {
      return currentProfile.id || currentProfile.coachId || '';
    }
    if (currentProfile.role === 'player') {
      return currentProfile.coachId || '';
    }
    return allCoaches[0]?.id || '';
  }, [currentProfile, allCoaches]);

  const [selectedCoachId, setSelectedCoachId] = useState<string>(initialCoachId || 'all');

  // Filter players to rank
  const filteredPlayersList = useMemo(() => {
    let list = players.filter(p => p.role === 'player');
    
    // If we have a specific coach filter active (or locked for player/coach)
    const activeCoachId = (currentProfile.role === 'player' || currentProfile.role === 'coach')
      ? initialCoachId
      : selectedCoachId;

    if (activeCoachId && activeCoachId !== 'all') {
      list = list.filter(p => p.coachId === activeCoachId);
    }
    return list;
  }, [players, currentProfile, initialCoachId, selectedCoachId]);

  // Helper date parsing (safely timezone-consistent)
  const isDateInWeek = useMemo(() => {
    const today = new Date('2026-05-26'); 
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7); // Previous 7 days rolling window
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setHours(23, 59, 59, 999);

    return (dateStr: string) => {
      if (!dateStr) return false;
      const cleanDate = new Date(dateStr.substring(0, 10));
      return cleanDate >= startOfWeek && cleanDate <= endOfWeek;
    };
  }, []);

  // Format pace helper (seconds/km -> e.g. "4:15")
  const formatPace = (secondsPerKm: number) => {
    if (!isFinite(secondsPerKm) || secondsPerKm <= 0) return '--:--';
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} /km`;
  };

  // --- COMPUTE RANKINGS FOR EACH metric ---
  
  const rankings = useMemo(() => {
    const todayStr = '2026-05-26';

    return filteredPlayersList.map(player => {
      const pId = player.id;
      
      // 1. Get logs and metrics for this player
      const playerLogs = runLogs.filter(log => {
        const matchesPlayer = log.playerId === pId;
        if (!matchesPlayer) return false;
        return timeScope === 'all' || isDateInWeek(log.date);
      });

      const playerMetricsList = (allMetrics[pId] || []).filter(met => {
        return timeScope === 'all' || isDateInWeek(met.date);
      });

      const playerCompletions = completions.filter(comp => {
        const matchesPlayer = comp.playerId === pId;
        if (!matchesPlayer) return false;
        return timeScope === 'all' || isDateInWeek(comp.dateCompleted);
      });

      // ---- Metric A: Distance Run ----
      const totalKm = playerLogs.reduce((acc, log) => acc + log.distanceKm, 0);

      // ---- Metric B: Fastest 3km Pace ----
      const eligible3kRuns = playerLogs.filter(log => log.distanceKm >= 3.0);
      let best3kPace = Infinity; // lowest seconds per km is fastest
      let best3kSpeed = 0;
      eligible3kRuns.forEach(run => {
        const pace = run.durationSeconds / run.distanceKm;
        if (pace < best3kPace) {
          best3kPace = pace;
          best3kSpeed = run.avgSpeedKmH;
        }
      });

      // ---- Metric C: Fastest 5km Pace ----
      const eligible5kRuns = playerLogs.filter(log => log.distanceKm >= 5.0);
      let best5kPace = Infinity;
      let best5kSpeed = 0;
      eligible5kRuns.forEach(run => {
        const pace = run.durationSeconds / run.distanceKm;
        if (pace < best5kPace) {
          best5kPace = pace;
          best5kSpeed = run.avgSpeedKmH;
        }
      });

      // ---- Metric D: Water in a Day ----
      let maxWaterDay = 0;
      playerMetricsList.forEach(met => {
        if (met.hydrationMls > maxWaterDay) {
          maxWaterDay = met.hydrationMls;
        }
      });

      // ---- Metric E: Total Water Week / Scope ----
      const totalWater = playerMetricsList.reduce((acc, met) => acc + met.hydrationMls, 0);

      // ---- Metric F: Sleep in a Day ----
      let maxSleepDay = 0;
      playerMetricsList.forEach(met => {
        if (met.sleepHours > maxSleepDay) {
          maxSleepDay = met.sleepHours;
        }
      });

      // ---- Metric G: Total Sleep ----
      const totalSleep = playerMetricsList.reduce((acc, met) => acc + met.sleepHours, 0);

      // ---- Metric H: Classroom completions ----
      const completionsCount = playerCompletions.length;

      return {
        id: player.id,
        name: player.name,
        email: player.email,
        totalKm,
        best3kPace,
        best3kSpeed,
        best5kPace,
        best5kSpeed,
        maxWaterDay,
        totalWater,
        maxSleepDay,
        totalSleep,
        completionsCount
      };
    });
  }, [filteredPlayersList, runLogs, allMetrics, completions, timeScope, isDateInWeek]);

  // Sorters for rankings lists
  const sortedDistance = useMemo(() => {
    return [...rankings].filter(r => r.totalKm > 0).sort((a, b) => b.totalKm - a.totalKm);
  }, [rankings]);

  const sorted3k = useMemo(() => {
    return [...rankings].filter(r => r.best3kPace !== Infinity).sort((a, b) => a.best3kPace - b.best3kPace);
  }, [rankings]);

  const sorted5k = useMemo(() => {
    return [...rankings].filter(r => r.best5kPace !== Infinity).sort((a, b) => a.best5kPace - b.best5kPace);
  }, [rankings]);

  const sortedMaxWater = useMemo(() => {
    return [...rankings].filter(r => r.maxWaterDay > 0).sort((a, b) => b.maxWaterDay - a.maxWaterDay);
  }, [rankings]);

  const sortedTotalWater = useMemo(() => {
    return [...rankings].filter(r => r.totalWater > 0).sort((a, b) => b.totalWater - a.totalWater);
  }, [rankings]);

  const sortedMaxSleep = useMemo(() => {
    return [...rankings].filter(r => r.maxSleepDay > 0).sort((a, b) => b.maxSleepDay - a.maxSleepDay);
  }, [rankings]);

  const sortedTotalSleep = useMemo(() => {
    return [...rankings].filter(r => r.totalSleep > 0).sort((a, b) => b.totalSleep - a.totalSleep);
  }, [rankings]);

  const sortedCompletions = useMemo(() => {
    return [...rankings].filter(r => r.completionsCount > 0).sort((a, b) => b.completionsCount - a.completionsCount);
  }, [rankings]);

  // Helper to render Leaderboard rows
  const renderRankingList = (
    list: typeof rankings, 
    valueExtractor: (item: typeof rankings[0]) => string | React.ReactNode,
    metricUnit: string,
    emptyMsg = "No records logged yet in this category"
  ) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <Award className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs text-slate-400 font-mono">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 bg-slate-950 border border-slate-850 p-3.5 rounded-2xl">
        {list.map((item, idx) => {
          const rank = idx + 1;
          const isCurrentUser = item.id === currentProfile.id;
          
          let medalEmoji = '';
          if (rank === 1) medalEmoji = '🥇';
          else if (rank === 2) medalEmoji = '🥈';
          else if (rank === 3) medalEmoji = '🥉';

          return (
            <div 
              key={item.id} 
              className={`flex items-center justify-between p-3 rounded-xl transition ${
                isCurrentUser 
                  ? 'bg-slate-900 border border-[#00bbff]/30 shadow-indigo-950/20 shadow-md ring-1 ring-[#00bbff]/20' 
                  : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-850'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Ranking Position */}
                <div className="w-7 font-mono font-bold text-xs text-center shrink-0">
                  {medalEmoji ? (
                    <span className="text-base leading-none">{medalEmoji}</span>
                  ) : (
                    <span className="text-slate-500 font-bold">#{rank}</span>
                  )}
                </div>

                {/* Avatar Initial Circle */}
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 select-none text-slate-200">
                  {item.name.substring(0, 2).toUpperCase()}
                </div>

                {/* Player details */}
                <div className="min-w-0">
                  <div className="font-sans font-bold text-slate-150 text-xs truncate flex items-center gap-1.5">
                    <span className="truncate">{item.name}</span>
                    {isCurrentUser && (
                      <span className="text-[9px] uppercase font-mono font-bold bg-[#00bbff]/10 text-[#00bbff] px-1.5 py-0.2 rounded border border-[#00bbff]/20">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{item.email}</div>
                </div>
              </div>

              {/* Stat Score display */}
              <div className="text-right shrink-0 pl-3">
                <div className="text-xs font-bold font-mono text-[#00bbff]">{valueExtractor(item)}</div>
                <div className="text-[9px] font-mono uppercase text-slate-500">{metricUnit}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00bbff]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#00bbff]/10 border border-[#00bbff]/20 rounded-xl">
              <Trophy className="w-6 h-6 text-[#00bbff] animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-sans font-bold text-slate-100 flex items-center gap-2">
                Unified Team Leaderboard
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Competing with peer athletes in performance, hydration frequency, restful sleep, and classroom module completion.
              </p>
            </div>
          </div>

          {/* Time Filter switch */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-850 gap-1.5 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setTimeScope('week')}
              className={`px-3 py-1 text-xs font-sans font-semibold rounded-lg transition-all ${
                timeScope === 'week'
                  ? 'bg-slate-800 text-[#00bbff] border border-slate-700/80'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setTimeScope('all')}
              className={`px-3 py-1 text-xs font-sans font-semibold rounded-lg transition-all ${
                timeScope === 'all'
                  ? 'bg-slate-800 text-[#00bbff] border border-slate-700/80'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              All-Time Records
            </button>
          </div>
        </div>


      </div>

      {/* Leaderboard Section Tabs switcher */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => setActiveLeaderboardTab('running')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition flex items-center gap-2 ${
            activeLeaderboardTab === 'running'
              ? 'bg-[#00bbff] text-slate-950 shadow-md shadow-[#00bbff]/10'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Running Leaderboards
        </button>

        <button
          type="button"
          onClick={() => setActiveLeaderboardTab('wellness')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition flex items-center gap-2 ${
            activeLeaderboardTab === 'wellness'
              ? 'bg-[#00bbff] text-slate-950 shadow-md shadow-[#00bbff]/10'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Droplet className="w-3.5 h-3.5" />
          Hydration & Sleep (Wellness)
        </button>

        <button
          type="button"
          onClick={() => setActiveLeaderboardTab('classroom')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition flex items-center gap-2 ${
            activeLeaderboardTab === 'classroom'
              ? 'bg-[#00bbff] text-slate-950 shadow-md shadow-[#00bbff]/10'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Classroom Learning
        </button>
      </div>

      {/* GRID LAYOUT FOR RANKINGS */}
      {activeLeaderboardTab === 'running' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Most km Run */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold font-sans text-slate-200 uppercase tracking-wider">
                  Total Distance
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Cumulative distance logged using continuous GPS run monitoring.
              </p>
            </div>
            {renderRankingList(
              sortedDistance,
              (v) => v.totalKm.toFixed(2),
              "kilometers",
              "No runs logged yet in this scope"
            )}
          </div>

          {/* Card 2: Fastest 3km Pace */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Milestone className="w-4 h-4 text-[#00bbff]" />
                <h3 className="text-xs font-bold font-sans text-slate-200 uppercase tracking-wider">
                  Fastest 3KM Pace
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Fastest average minutes per kilometer among drills of 3 km or more.
              </p>
            </div>
            {renderRankingList(
              sorted3k,
              (v) => formatPace(v.best3kPace),
              "min / km",
              "No matching runs of size >= 3.0 km"
            )}
          </div>

          {/* Card 3: Fastest 5km Pace */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Star className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-sans text-slate-200 uppercase tracking-wider">
                  Fastest 5KM Pace
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Fastest average minutes per kilometer among drills of 5 km or more.
              </p>
            </div>
            {renderRankingList(
              sorted5k,
              (v) => formatPace(v.best5kPace),
              "min / km",
              "No matching runs of size >= 5.0 km"
            )}
          </div>
        </div>
      )}

      {activeLeaderboardTab === 'wellness' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Hydration Day Record */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Droplet className="w-4 h-4 text-sky-400 font-bold" />
                <h3 className="text-xs font-bold font-sans text-slate-200 uppercase tracking-wider">
                  Single Day Hydration
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Maximum hydration volume logged in any single training calendar day.
              </p>
            </div>
            {renderRankingList(
              sortedMaxWater,
              (v) => v.maxWaterDay.toLocaleString(),
              "milliliters",
              "No water logs entered yet"
            )}
          </div>

          {/* Card 2: Hydration Cumulative */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <WaterBottleIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <h3 className="text-xs font-bold font-sans text-slate-200 uppercase tracking-wider">
                  Total Hydration
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Cumulative liquid intake across all logged days in current timeframe.
              </p>
            </div>
            {renderRankingList(
              sortedTotalWater,
              (v) => v.totalWater.toLocaleString(),
              "milliliters",
              "No water logs entered yet"
            )}
          </div>

          {/* Card 3: Single Sleep Max */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Moon className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold font-sans text-slate-200 uppercase tracking-wider">
                  Single Night Sleep
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Highest registered hours of sleep in a single restorative interval.
              </p>
            </div>
            {renderRankingList(
              sortedMaxSleep,
              (v) => `${v.maxSleepDay} hrs`,
              "sleep time",
              "No sleep hours logged yet"
            )}
          </div>

          {/* Card 4: Cumulative Sleep */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold font-sans text-slate-200 uppercase tracking-wider">
                  Cumulative Rest
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Total hours of logged sleep during the current active scope.
              </p>
            </div>
            {renderRankingList(
              sortedTotalSleep,
              (v) => `${v.totalSleep} hrs`,
              "sleep time",
              "No sleep hours logged yet"
            )}
          </div>
        </div>
      )}

      {activeLeaderboardTab === 'classroom' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Completed Lectures & Quizzes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <BookOpen className="w-4 h-4 text-[#00bbff]" />
                <h3 className="text-xs font-bold font-sans text-slate-200 uppercase tracking-wider">
                  Classroom Completions
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Number of educational modules completed (and quizzes submitted) in the current timeframe.
              </p>
            </div>
            {renderRankingList(
              sortedCompletions,
              (v) => `${v.completionsCount} completed`,
              "modules",
              "No classroom modules completed this week"
            )}
          </div>

          {/* Informational Widget panel to encourage learning */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold text-[#00bbff] uppercase">Tip for Athletes</div>
              <h4 className="text-base font-sans font-bold text-slate-100">Unlock Theoretical Excellence</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Elite physical output is only 50% of high athletic success. Players who finish active Classroom Quizzes and study modules twice a week improve key decisions and recover 30% faster on average.
              </p>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-xs">
                <div className="text-[#00bbff] font-mono leading-relaxed font-bold">Classroom leaderboard rules:</div>
                <div className="text-slate-400 font-mono text-[10px] leading-relaxed">
                  • 1 Completing standard lecture = +1 Completed Module. <br />
                  • Submit the accompanying quiz to officially sync progress rankings.
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Dynamic Ranks Seeding</span>
              <span>v2.4 Core Client</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple custom component for Cup hydration bottle illustration
function WaterBottleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2v3" />
      <path d="M6 10h12v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1Z" />
      <path d="M9 5h6v5H9Z" />
    </svg>
  );
}
