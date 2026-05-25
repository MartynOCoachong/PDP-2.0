/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, Users, Award, Plus, Check, Mail, User, ShieldCheck, HelpCircle, ArrowRight, Star } from 'lucide-react';
import { UserProfile, Club, Team, Coach } from '../types';

interface AssociationDashboardProps {
  currentProfile: UserProfile;
  clubs: Club[];
  teams: Team[];
  coaches: Coach[];
  players: UserProfile[];
  onAddClub: (club: Omit<Club, 'id' | 'approved'>) => void;
  onAddTeam: (team: Omit<Team, 'id' | 'approved'>) => void;
  onAddCoach: (coach: { name: string; email: string; teamId: string }) => void;
}

export default function AssociationDashboard({
  currentProfile,
  clubs,
  teams,
  coaches,
  players,
  onAddClub,
  onAddTeam,
  onAddCoach
}: AssociationDashboardProps) {
  // Local state for adding clubs
  const [clubName, setClubName] = useState('');
  const [clubEmail, setClubEmail] = useState('');
  const [clubSuccessMsg, setClubSuccessMsg] = useState('');

  // Local state for adding teams
  const [teamName, setTeamName] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [teamSuccessMsg, setTeamSuccessMsg] = useState('');

  // Local state for adding coaches
  const [coachName, setCoachName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [coachSuccessMsg, setCoachSuccessMsg] = useState('');

  // Resolve Association scope
  const assocId = currentProfile.associationId || 'assoc-1';

  // 1. Filter clubs belonging to this association
  const associationClubs = clubs.filter(c => c.associationId === assocId && c.approved);

  // 2. Filter teams belonging to these clubs
  const clubIds = associationClubs.map(c => c.id);
  const associationTeams = teams.filter(t => clubIds.includes(t.clubId) && t.approved);

  // 3. Filter coaches belonging to these teams
  const teamIds = associationTeams.map(t => t.id);
  const associationCoaches = coaches.filter(c => teamIds.includes(c.teamId) && c.approved);

  // Form submit handlers
  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName || !clubEmail) return;

    onAddClub({
      name: clubName,
      contactEmail: clubEmail,
      associationId: assocId
    });

    setClubSuccessMsg(`Club "${clubName}" created successfully!`);
    setClubName('');
    setClubEmail('');
    
    setTimeout(() => {
      setClubSuccessMsg('');
    }, 4000);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    // Default to first club if not selected and clubs exist
    const finalClubId = selectedClubId || (associationClubs[0]?.id || '');
    if (!teamName || !teamEmail || !finalClubId) return;

    onAddTeam({
      name: teamName,
      contactEmail: teamEmail,
      clubId: finalClubId
    });

    const targetClub = associationClubs.find(c => c.id === finalClubId);
    setTeamSuccessMsg(`Team "${teamName}" created and assigned to ${targetClub?.name || 'Club'}!`);
    setTeamName('');
    setTeamEmail('');
    
    setTimeout(() => {
      setTeamSuccessMsg('');
    }, 4005);
  };

  const handleCreateCoach = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTeamId = selectedTeamId || (associationTeams[0]?.id || '');
    if (!coachName || !coachEmail || !finalTeamId) return;

    onAddCoach({
      name: coachName,
      email: coachEmail,
      teamId: finalTeamId
    });

    const targetTeam = associationTeams.find(t => t.id === finalTeamId);
    setCoachSuccessMsg(`Coach "${coachName}" provisioned and linked to ${targetTeam?.name || 'Team'}!`);
    setCoachName('');
    setCoachEmail('');
    
    setTimeout(() => {
      setCoachSuccessMsg('');
    }, 4005);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="association-dashboard-panel">
      
      {/* 🚀 Segment header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 relative">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 px-2.5 rounded-full bg-indigo-505/10 text-indigo-400 text-xs font-mono font-medium flex items-center gap-1">
                <Landmark className="w-3 h-3" />
                ASSOCIATION CONTROL CENTRAL
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight mt-2">
              Corporate Governance & Structure Panel
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              Deploy, inspect, and approve athletic organizations. As coaches and athletes enroll in Echelon structure, their credentials will resolve in your real-time staff directories.
            </p>
          </div>
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
            <div className="text-slate-500">Corporate Association Roster:</div>
            <div className="text-indigo-400 font-bold">{associationClubs.length} Active Clubs</div>
            <div className="text-emerald-400 font-bold">{associationTeams.length} Active Teams</div>
          </div>
        </div>
      </div>

      {/* 🛠️ Dynamic Forms layout to Create Clubs, Teams & Coaches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Forms 1: Create Clubs */}
        <div className="bg-slate-900 border border-slate-805/85 rounded-2xl p-6 shadow-lg space-y-4" id="form-create-club">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Register New Club</h3>
              <p className="text-[11px] text-slate-400">Add an approved athletic club under your association</p>
            </div>
          </div>

          <form onSubmit={handleCreateClub} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">CLUB NAME</label>
              <input
                type="text"
                required
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g. Oakridge United"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-700 outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">CONTACT EMAIL</label>
              <input
                type="email"
                required
                value={clubEmail}
                onChange={(e) => setClubEmail(e.target.value)}
                placeholder="e.g. admin@oakridgeunited.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-700 outline-none focus:border-indigo-500 transition"
              />
            </div>

            {clubSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-xs animate-fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{clubSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg transition shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Provision Active Club
            </button>
          </form>
        </div>

        {/* Forms 2: Create Teams */}
        <div className="bg-slate-900 border border-slate-805/85 rounded-2xl p-6 shadow-lg space-y-4" id="form-create-team">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Register New Team</h3>
              <p className="text-[11px] text-slate-400">Add a competitive roster inside an existing club</p>
            </div>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">TEAM NAME</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Westside Sparks U16"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-700 outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">SELECT CLUB</label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 outline-none focus:border-emerald-500 transition font-sans pointer-events-auto"
                >
                  {associationClubs.length === 0 ? (
                    <option value="">-- No clubs created yet --</option>
                  ) : (
                    associationClubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">TEAM EMAIL</label>
                <input
                  type="email"
                  required
                  value={teamEmail}
                  onChange={(e) => setTeamEmail(e.target.value)}
                  placeholder="e.g. u16coaches@sparks.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-700 outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {teamSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-xs animate-fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{teamSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={associationClubs.length === 0}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-505 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold text-xs py-2.5 rounded-lg transition shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              Provision Active Team
            </button>
            {associationClubs.length === 0 && (
              <p className="text-[10px] text-rose-450 italic text-center font-mono mt-1">Please create a Club first.</p>
            )}
          </form>
        </div>

        {/* Forms 3: Create Coaches (New request requirement) */}
        <div className="bg-slate-900 border border-slate-805/85 rounded-2xl p-6 shadow-lg space-y-4" id="form-create-coach">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Register New Coach</h3>
              <p className="text-[11px] text-slate-400">Add an approved Coach linked directly to an active team</p>
            </div>
          </div>

          <form onSubmit={handleCreateCoach} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">COACH FULL NAME</label>
              <input
                type="text"
                required
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                placeholder="e.g. Coach Sarah Jenkins"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-700 outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">ASSIGNED TEAM</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 outline-none focus:border-rose-505 transition font-sans pointer-events-auto"
                >
                  {associationTeams.length === 0 ? (
                    <option value="">-- No teams created yet --</option>
                  ) : (
                    associationTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">COACH EMAIL</label>
                <input
                  type="email"
                  required
                  value={coachEmail}
                  onChange={(e) => setCoachEmail(e.target.value)}
                  placeholder="e.g. mjenkins@coaches.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-700 outline-none focus:border-rose-500 transition"
                />
              </div>
            </div>

            {coachSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-xs animate-fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{coachSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={associationTeams.length === 0}
              className="w-full mt-2 bg-rose-650 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs py-2.5 rounded-lg transition shadow-md shadow-rose-505/10 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Provision Active Coach
            </button>
            {associationTeams.length === 0 && (
              <p className="text-[10px] text-rose-455 italic text-center font-mono mt-1 font-semibold">Please create a Team first.</p>
            )}
          </form>
        </div>

      </div>

      {/* 📋 Visual Taxonomy: Existing Clubs and Teams nested view */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-200 font-sans flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-400" />
            Hierarchical Governance Overview
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Listed below are all verified Clubs and nested Teams recognized in your federation:
          </p>
        </div>

        {associationClubs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800 space-y-2">
            <Landmark className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs font-semibold text-slate-400">No organizational structures registered.</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Use the forms above to formulate your Association's clubs and competitive cohorts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {associationClubs.map(club => {
              const clubTeams = associationTeams.filter(t => t.clubId === club.id);
              return (
                <div key={club.id} className="bg-slate-950 rounded-xl border border-slate-850 p-4 hover:border-slate-800 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-400 font-semibold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">Club Unit</span>
                        <h4 className="text-sm font-bold text-slate-100 font-sans mt-1.5">{club.name}</h4>
                      </div>
                      <Landmark className="w-4 h-4 text-slate-600" />
                    </div>

                    <div className="mt-2.5 text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-600" />
                      <span>{club.contactEmail}</span>
                    </div>

                    {/* Nested Teams */}
                    <div className="mt-4 pt-4 border-t border-slate-900 space-y-2">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Active Teams ({clubTeams.length})</div>
                      {clubTeams.length === 0 ? (
                        <p className="text-[10.5px] italic text-slate-600">No teams created in this club.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {clubTeams.map(team => (
                            <div key={team.id} className="p-2 bg-slate-900 rounded border border-slate-800/80 flex justify-between items-center text-xs">
                              <span className="font-sans font-medium text-slate-300">{team.name}</span>
                              <span className="text-[9px] font-mono text-slate-500">{team.id}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-900 text-[10px] text-slate-500 font-mono flex justify-between items-center">
                    <span>ID: {club.id}</span>
                    <span>Approved Status: <b className="text-emerald-400 font-bold">Active</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 👥 Coaches and Assigned Players Directory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6" id="roster-directory-section">
        <div>
          <h3 className="text-base font-bold text-slate-200 font-sans flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Enrolled Coaches & Athlete Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Audit registered Coaches belonging to and operating within your Association, alongside the real-time active rosters of Players assigned to each.
          </p>
        </div>

        {associationCoaches.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800 space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <div className="text-xs font-semibold text-slate-400">No active coaches or players have signed up yet.</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Coaches and athletes can access the portal to sign up and request association linkage to sync activity logs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {associationCoaches.map(coach => {
              // Get team details
              const coachTeamObj = associationTeams.find(t => t.id === coach.teamId);
              // Get players whose coachId matches this coach
              // Or if registered under the coach's team
              const assignedPlayers = players.filter(p => p.role === 'player' && (p.coachId === coach.id || p.teamId === coach.teamId));

              return (
                <div key={coach.id} className="bg-slate-950 rounded-xl border border-slate-850 p-5 hover:border-slate-800/80 transition space-y-4">
                  
                  {/* Coach summary card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-850">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                        {coach.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100 font-sans">{coach.name}</h4>
                          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 py-0.5 px-2 rounded border border-emerald-500/20 uppercase font-semibold">Verified Coach</span>
                        </div>
                        <div className="text-xs text-slate-400 font-sans mt-0.5 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{coach.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-sans text-right sm:border-l sm:border-slate-800 sm:pl-4 space-y-1">
                      <div className="text-slate-500 font-mono">ASSIGNED COMPETITIVE COHORT</div>
                      <div className="font-bold text-indigo-400 flex items-center gap-1.5 justify-end">
                        <Award className="w-3.5 h-3.5" />
                        <span>{coachTeamObj?.name || 'Unassigned Cohort'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned players details */}
                  <div className="space-y-2 pl-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <span>Assigned Players ({assignedPlayers.length})</span>
                      </span>
                    </div>

                    {assignedPlayers.length === 0 ? (
                      <div className="py-5 text-center bg-slate-900/15 border border-dashed border-slate-900 rounded-lg text-slate-600 text-xs">
                        No athlete profiles linked or assigned to this coach yet. Click "Join / Register Profile" in the Security Panel to add a player.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {assignedPlayers.map(player => (
                          <div key={player.id} className="p-3 bg-slate-900 border border-slate-850/80 rounded-lg space-y-2 flex flex-col justify-between hover:border-slate-800 transition">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-sans font-semibold text-xs text-slate-200">{player.name}</span>
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              </div>
                              <p className="text-[10.5px] text-slate-450 font-mono mt-1 pr-1 truncate">{player.email}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-950 text-[9px] font-mono text-slate-500 flex justify-between items-center">
                              <span>ID: {player.id.replace('user-player-', '')}</span>
                              <span className="text-indigo-400 font-semibold uppercase">Enrolled</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
