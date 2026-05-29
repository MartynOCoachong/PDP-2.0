/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, Shield, Plus, Check, Mail, Users, Award, ChevronDown, ChevronRight, User, Database, Building2 } from 'lucide-react';
import { Association, Club, Team, Coach, UserProfile } from '../types';

interface AdminDashboardProps {
  associations: Association[];
  clubs: Club[];
  teams: Team[];
  coaches: Coach[];
  players: UserProfile[];
  onAddAssociation: (assoc: Omit<Association, 'id' | 'approved'>) => void;
  onAddClub: (club: Omit<Club, 'id' | 'approved'>) => void;
  onAddTeam: (team: Omit<Team, 'id' | 'approved'>) => void;
}

export default function AdminDashboard({
  associations,
  clubs,
  teams,
  coaches,
  players,
  onAddAssociation,
  onAddClub,
  onAddTeam
}: AdminDashboardProps) {
  // State for creating Associations
  const [assocName, setAssocName] = useState('');
  const [assocEmail, setAssocEmail] = useState('');
  const [assocSuccessMsg, setAssocSuccessMsg] = useState('');

  // State for creating Clubs
  const [clubName, setClubName] = useState('');
  const [clubEmail, setClubEmail] = useState('');
  const [selectedAssocId, setSelectedAssocId] = useState('');
  const [clubSuccessMsg, setClubSuccessMsg] = useState('');

  // State for creating Teams
  const [teamName, setTeamName] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [teamSuccessMsg, setTeamSuccessMsg] = useState('');

  // Interactive Tree Expansion state (tracks collapsed node IDs)
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle node collapse/expand
  const toggleNode = (nodeId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Submit handers
  const handleCreateAssociation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocName || !assocEmail) return;

    onAddAssociation({
      name: assocName,
      contactEmail: assocEmail
    });

    setAssocSuccessMsg(`Association "${assocName}" created successfully!`);
    setAssocName('');
    setAssocEmail('');
    
    setTimeout(() => setAssocSuccessMsg(''), 4000);
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAssocId = selectedAssocId || (associations[0]?.id || '');
    if (!clubName || !clubEmail || !finalAssocId) return;

    onAddClub({
      name: clubName,
      contactEmail: clubEmail,
      associationId: finalAssocId
    });

    const targetAssoc = associations.find(a => a.id === finalAssocId);
    setClubSuccessMsg(`Club "${clubName}" created and linked to ${targetAssoc?.name || 'Association'}!`);
    setClubName('');
    setClubEmail('');

    setTimeout(() => setClubSuccessMsg(''), 4000);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClubId = selectedClubId || (clubs[0]?.id || '');
    if (!teamName || !teamEmail || !finalClubId) return;

    onAddTeam({
      name: teamName,
      contactEmail: teamEmail,
      clubId: finalClubId
    });

    const targetClub = clubs.find(c => c.id === finalClubId);
    setTeamSuccessMsg(`Team "${teamName}" created and assigned to ${targetClub?.name || 'Club'}!`);
    setTeamName('');
    setTeamEmail('');

    setTimeout(() => setTeamSuccessMsg(''), 4000);
  };

  // Filter Associations (and recursively their children if query matches)
  const filteredAssociations = associations.filter((assoc) => {
    if (!searchQuery) return true;
    const matchAssoc = assoc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchEmail = assoc.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if any child club, team, or roster matches the query
    const relatedClubs = clubs.filter(c => c.associationId === assoc.id);
    const matchClub = relatedClubs.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const relatedClubIds = relatedClubs.map(c => c.id);
    const relatedTeams = teams.filter(t => relatedClubIds.includes(t.clubId));
    const matchTeam = relatedTeams.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const relatedTeamIds = relatedTeams.map(t => t.id);
    const relatedCoaches = coaches.filter(co => relatedTeamIds.includes(co.teamId));
    const matchCoach = relatedCoaches.some(co => co.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const relatedPlayers = players.filter(pl => pl.role === 'player' && relatedTeamIds.includes(pl.teamId || ''));
    const matchPlayer = relatedPlayers.some(pl => pl.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchAssoc || matchEmail || matchClub || matchTeam || matchCoach || matchPlayer;
  });

  return (
    <div className="space-y-8 animate-fade-in" id="admin-super-portal">
      
      {/* 👑 Section Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 relative">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 px-2.5 rounded-full bg-rose-500/10 text-rose-405 text-xs font-mono font-medium flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                SYSTEM SUPER-ADMIN PORTAL
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight mt-2">
              Sports Directory Hierarchy Management
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
              Build and monitor your complete athletic federation model. Register associations, clubs, and competitive teams recursively, and visualize coaches with their active player rosters in real-time.
            </p>
          </div>
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs gap-3 flex flex-wrap md:flex-nowrap font-mono">
            <div className="space-y-1">
              <div className="text-slate-500">Total Associations:</div>
              <div className="text-slate-100 font-bold">{associations.length}</div>
            </div>
            <div className="border-l border-slate-800 pl-3 space-y-1">
              <div className="text-slate-500">Clubs:</div>
              <div className="text-indigo-400 font-bold">{clubs.length}</div>
            </div>
            <div className="border-l border-slate-800 pl-3 space-y-1">
              <div className="text-slate-500">Teams:</div>
              <div className="text-emerald-400 font-bold">{teams.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🛠️ Organization Creation Handlers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="admin-creation-tools">
        
        {/* Form 1: Create Association */}
        <div className="bg-slate-900 border border-slate-805/85 rounded-2xl p-5 shadow-lg flex flex-col justify-between" id="form-admin-create-assoc">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">New Association</h3>
                <p className="text-[10px] text-slate-400">Register a national sports governing body</p>
              </div>
            </div>

            <form onSubmit={handleCreateAssociation} className="space-y-3 pt-1">
              <div>
                <label className="block text-[9px] font-mono text-slate-400 mb-1">ASSOCIATION NAME</label>
                <input
                  type="text"
                  required
                  value={assocName}
                  onChange={(e) => setAssocName(e.target.value)}
                  placeholder="e.g. National Soccer Federation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-705 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-400 mb-1">CONTACT EMAIL</label>
                <input
                  type="email"
                  required
                  value={assocEmail}
                  onChange={(e) => setAssocEmail(e.target.value)}
                  placeholder="e.g. governance@nsf.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-705 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {assocSuccessMsg && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>{assocSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-1 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-2 rounded-lg transition shadow-md shadow-indigo-605/10 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Association
              </button>
            </form>
          </div>
        </div>

        {/* Form 2: Create Club */}
        <div className="bg-slate-900 border border-slate-805/85 rounded-2xl p-5 shadow-lg flex flex-col justify-between" id="form-admin-create-club">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-450">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">New Club Entity</h3>
                <p className="text-[10px] text-slate-400">Add sports club under an association</p>
              </div>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-3 pt-1">
              <div>
                <label className="block text-[9px] font-mono text-slate-400 mb-1">SELECT PARENT ASSOCIATION</label>
                <select
                  value={selectedAssocId}
                  onChange={(e) => setSelectedAssocId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:border-emerald-500 outline-none transition"
                >
                  {associations.length === 0 ? (
                    <option value="">-- No Associations --</option>
                  ) : (
                    associations.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-400 mb-1">CLUB NAME</label>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="e.g. Pacific Sound SC"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-705 focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-400 mb-1">CONTACT EMAIL</label>
                <input
                  type="email"
                  required
                  value={clubEmail}
                  onChange={(e) => setClubEmail(e.target.value)}
                  placeholder="e.g. registrations@pacificsound.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-705 focus:border-emerald-500 outline-none transition"
                />
              </div>

              {clubSuccessMsg && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>{clubSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={associations.length === 0}
                className="w-full mt-1 bg-emerald-600 hover:bg-emerald-505 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold text-xs py-2 rounded-lg transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950" />
                Create Club
              </button>
            </form>
          </div>
        </div>

        {/* Form 3: Create Team */}
        <div className="bg-slate-900 border border-slate-805/85 rounded-2xl p-5 shadow-lg flex flex-col justify-between" id="form-admin-create-team">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">New Athletic Team</h3>
                <p className="text-[10px] text-slate-400">Add competitive roster within an existing club</p>
              </div>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-3 pt-1">
              <div>
                <label className="block text-[9px] font-mono text-slate-400 mb-1">SELECT PARENT CLUB</label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:border-indigo-500 outline-none transition"
                >
                  {clubs.length === 0 ? (
                    <option value="">-- Create a Club first --</option>
                  ) : (
                    clubs.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-400 mb-1">TEAM NAME</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Sound SC Academy U18"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-705 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-400 mb-1">TEAM CONTACT EMAIL</label>
                <input
                  type="email"
                  required
                  value={teamEmail}
                  onChange={(e) => setTeamEmail(e.target.value)}
                  placeholder="e.g. u18academy@soundsc.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-705 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {teamSuccessMsg && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>{teamSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={clubs.length === 0}
                className="w-full mt-1 bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs py-2 rounded-lg transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Team
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* 📋 Unified Hierarchical Multi-Level Directory View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-200 font-sans flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Unified Federation Taxonomy Tree
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Traverse organizational connections in real-time. Unroll nodes to audit parent-child bindings instantly.
            </p>
          </div>

          <div className="w-full sm:w-64 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people or orgs..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 outline-none transition font-mono"
            />
          </div>
        </div>

        {filteredAssociations.length === 0 ? (
          <div className="p-10 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800 space-y-2">
            <Database className="w-8 h-8 text-slate-700 mx-auto" />
            <div className="text-xs font-semibold text-slate-400">No organizations found matching search filters.</div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">Try clearing search inputs or register active athletic units using the registration tables above.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {filteredAssociations.map((assoc) => {
              const assocClubs = clubs.filter(c => c.associationId === assoc.id);
              const isAssocCollapsed = collapsedNodes[assoc.id];

              return (
                <div key={assoc.id} className="bg-slate-950 rounded-xl border border-slate-850 overflow-hidden">
                  
                  {/* Association Header */}
                  <div 
                    onClick={() => toggleNode(assoc.id)}
                    className="p-4 bg-slate-900/40 hover:bg-slate-900/70 border-b border-slate-900 flex justify-between items-center cursor-pointer transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-405 shrink-0">
                        {isAssocCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div className="h-9 w-9 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-100 font-sans">{assoc.name}</h4>
                          <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400/90 py-0.5 px-2 rounded-full font-bold">ASSOCIATION</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {assoc.contactEmail}
                          </span>
                          <span className="text-slate-700">|</span>
                          <span className="text-indigo-400 font-semibold">{assocClubs.length} Clubs Enrolled</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500">ID: {assoc.id}</div>
                  </div>

                  {/* Association Child Clubs Container */}
                  {!isAssocCollapsed && (
                    <div className="p-4 bg-slate-950 relative border-l border-indigo-500/20 ml-8 pl-6 space-y-4">
                      {assocClubs.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic py-1">No clubs registered under this association. Register one above to begin nested nesting.</div>
                      ) : (
                        assocClubs.map((club) => {
                          const clubTeams = teams.filter(t => t.clubId === club.id);
                          const isClubCollapsed = collapsedNodes[club.id];

                          return (
                            <div key={club.id} className="bg-slate-900/20 rounded-xl border border-slate-900/60 overflow-hidden">
                              
                              {/* Club Header */}
                              <div
                                onClick={() => toggleNode(club.id)}
                                className="p-3 bg-slate-900/30 hover:bg-slate-900/50 border-b border-slate-900 flex justify-between items-center cursor-pointer transition select-none"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="text-slate-500 shrink-0">
                                    {isClubCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-450 flex items-center justify-center font-bold text-xs shrink-0">
                                    <Building2 className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-xs font-bold text-slate-200 font-sans">{club.name}</h5>
                                      <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 py-0.2 px-1.5 rounded">CLUB</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3 text-slate-605" />
                                        {club.contactEmail}
                                      </span>
                                      <span className="text-slate-800">|</span>
                                      <span className="text-emerald-400 font-semibold">{clubTeams.length} Teams</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[10px] font-mono text-slate-600">ID: {club.id}</div>
                              </div>

                              {/* Club Child Teams Container */}
                              {!isClubCollapsed && (
                                <div className="p-3 bg-slate-950/40 relative border-l border-emerald-500/20 ml-6 pl-4 space-y-3">
                                  {clubTeams.length === 0 ? (
                                    <div className="text-[10px] text-slate-500 italic py-1">No active teams created. Add a team specifying this club above.</div>
                                  ) : (
                                    clubTeams.map((team) => {
                                      const teamCoaches = coaches.filter(co => co.teamId === team.id);
                                      const teamPlayers = players.filter(pl => pl.role === 'player' && pl.teamId === team.id);
                                      const isTeamCollapsed = collapsedNodes[team.id];

                                      return (
                                        <div key={team.id} className="bg-slate-950 rounded-lg border border-slate-850/80 overflow-hidden">
                                          
                                          {/* Team Header */}
                                          <div
                                            onClick={() => toggleNode(team.id)}
                                            className="p-2.5 bg-slate-900/20 hover:bg-slate-900/40 border-b border-slate-900/60 flex justify-between items-center cursor-pointer transition select-none"
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="text-slate-500 shrink-0">
                                                {isTeamCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                              </div>
                                              <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                              <div>
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-xs font-semibold text-slate-350">{team.name}</span>
                                                  <span className="text-[8px] font-mono bg-indigo-500/5 text-indigo-300 py-0.2 px-1 rounded">TEAM</span>
                                                </div>
                                                <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                                  <span>Contact: {team.contactEmail}</span>
                                                  <span className="text-slate-800">•</span>
                                                  <span className="text-amber-400 font-semibold">{teamCoaches.length} Coaches</span>
                                                  <span className="text-slate-800">•</span>
                                                  <span className="text-emerald-400 font-semibold">{teamPlayers.length} Players</span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="text-[9px] font-mono text-slate-600">ID: {team.id}</div>
                                          </div>

                                          {/* Team Child Coaches & Players Container */}
                                          {!isTeamCollapsed && (
                                            <div className="p-3 bg-slate-950/80 border-l border-indigo-500/10 ml-4 pl-3 space-y-3.5">
                                              
                                              {/* 1. Team Coaches */}
                                              <div className="space-y-1">
                                                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Assigned Coaches ({teamCoaches.length})</div>
                                                {teamCoaches.length === 0 ? (
                                                  <p className="text-[10px] text-slate-500 italic pl-1.5">No coaches assigned to this team yet.</p>
                                                ) : (
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                                                    {teamCoaches.map((co) => (
                                                      <div key={co.id} className="p-2 bg-slate-900 border border-slate-850 rounded flex items-center gap-2">
                                                        <Award className="w-3.5 h-3.5 text-emerald-455 shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                          <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                                                            <span className="truncate">{co.name}</span>
                                                            <span className={`px-1 py-0.2 rounded text-[7.5px] font-mono font-bold uppercase shrink-0 ${
                                                              co.coachRole === 'assistant'
                                                                ? 'bg-[#00BBFF]/15 text-[#00BBFF]'
                                                                : 'bg-indigo-505/15 text-indigo-405'
                                                            }`}>
                                                              {co.coachRole === 'assistant' ? 'Asst' : 'Head'}
                                                            </span>
                                                          </div>
                                                          <div className="text-[9.5px] text-slate-500 font-mono truncate">{co.email}</div>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>

                                              {/* 2. Team Players */}
                                              <div className="space-y-1">
                                                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Registered Players ({teamPlayers.length})</div>
                                                {teamPlayers.length === 0 ? (
                                                  <p className="text-[10px] text-slate-500 italic pl-1.5 font-mono">No athlete profiles linked of this team level.</p>
                                                ) : (
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-1">
                                                    {teamPlayers.map((pl) => {
                                                      const assignedCoach = teamCoaches.find(co => pl.coachId === co.id);
                                                      return (
                                                        <div key={pl.id} className="p-2 bg-slate-900 border border-slate-850/80 hover:border-slate-800 transition rounded flex flex-col justify-between">
                                                          <div>
                                                            <div className="flex items-center justify-between">
                                                              <span className="font-sans font-semibold text-[11px] text-slate-300">{pl.name}</span>
                                                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                            </div>
                                                            <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">{pl.email}</p>
                                                          </div>
                                                          {assignedCoach && (
                                                            <div className="mt-1.5 pt-1.5 border-t border-slate-950 text-[8.5px] text-slate-450 font-mono flex items-center gap-1 truncate">
                                                              <span className="text-slate-500">Coach:</span>
                                                              <span className="text-emerald-400 font-semibold">{assignedCoach.name}</span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>

                                            </div>
                                          )}

                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}

                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
      
    </div>
  );
}
