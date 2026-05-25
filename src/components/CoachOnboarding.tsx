/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  HelpCircle, 
  Landmark, 
  Users, 
  Award, 
  CheckCircle, 
  Mail, 
  Building 
} from 'lucide-react';
import { Association, Club, Team } from '../types';

interface CoachOnboardingProps {
  associations: Association[];
  clubs: Club[];
  onCompleteOnboarding: (data: {
    teamName: string;
    clubId?: string;
    newClubName?: string;
    newClubEmail?: string;
    associationId?: string;
    newAssociationName?: string;
    newAssociationEmail?: string;
  }) => void;
  onLogout: () => void;
}

export default function CoachOnboarding({
  associations,
  clubs,
  onCompleteOnboarding,
  onLogout
}: CoachOnboardingProps) {
  const [teamName, setTeamName] = useState('');
  
  // Club selector & new registration
  const [selectedClubId, setSelectedClubId] = useState('');
  const [newClubName, setNewClubName] = useState('');
  const [newClubEmail, setNewClubEmail] = useState('');

  // Association selector & new registration
  const [selectedAssociationId, setSelectedAssociationId] = useState('');
  const [newAssociationName, setNewAssociationName] = useState('');
  const [newAssociationEmail, setNewAssociationEmail] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!teamName.trim()) {
      setErrorMsg('Please specify your competitive Team name.');
      return;
    }

    // Association validation
    const isNewAssoc = selectedAssociationId === '';
    if (isNewAssoc && !newAssociationName.trim()) {
      setErrorMsg('Please select an existing Association OR name a brand new Association governing body.');
      return;
    }

    // Club validation
    const isNewClub = selectedClubId === '';
    if (isNewClub && !newClubName.trim()) {
      setErrorMsg('Please select an existing Club OR input details to formulate a brand new Club.');
      return;
    }

    onCompleteOnboarding({
      teamName: teamName.trim(),
      clubId: isNewClub ? undefined : selectedClubId,
      newClubName: isNewClub ? newClubName.trim() : undefined,
      newClubEmail: isNewClub ? (newClubEmail.trim() || `director@${newClubName.toLowerCase().replace(/\s+/g, '')}.com`) : undefined,
      associationId: isNewAssoc ? undefined : selectedAssociationId,
      newAssociationName: isNewAssoc ? newAssociationName.trim() : undefined,
      newAssociationEmail: isNewAssoc ? (newAssociationEmail.trim() || `gov@${newAssociationName.toLowerCase().replace(/\s+/g, '')}.org`) : undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto my-12 p-6 sm:p-10 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500" />
      
      <div className="space-y-6 pb-6 border-b border-slate-800">
        <div className="flex justify-between items-start">
          <span className="p-1 px-2.5 rounded-full bg-indigo-505/10 text-indigo-400 text-[10px] font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5 border border-indigo-550/20">
            <Award className="w-3.5 h-3.5" />
            Coach Setup Wizard
          </span>
          <button
            onClick={onLogout}
            className="text-xs text-slate-400 hover:text-rose-400 transition font-mono font-medium"
          >
            Log Out Session
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 font-sans tracking-tight">
            Configure Your Coaching Ecosystem
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-2xl">
            Welcome to Echelon, Coach! Since you signed up without an assigned team, please take a moment to formulate your team, select/create its parent sports Club, and establish its Governing Association.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pt-6 font-sans">
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-mono">
            ⚠ {errorMsg}
          </div>
        )}

        {/* SECTION 1: Creating Team */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-805">
            <span className="font-mono text-emerald-400 text-xs font-bold">01/</span>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Configure your Competitive Roster (Team)</h3>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">TEAM NAME</label>
            <input
              type="text"
              required
              placeholder="e.g. Metro Stars Girls U15 Elite"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-705 outline-none focus:border-indigo-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500 font-mono mt-1">This defines the player roster dashboard where your assigned players sync runs.</p>
          </div>
        </div>

        {/* SECTION 2: Selecting / Registering Club */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-805">
            <span className="font-mono text-indigo-400 text-xs font-bold">02/</span>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Select or Formulate Club</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">CHOOSE PARENT CLUB</label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-3 outline-none focus:border-indigo-550 transition-colors"
              >
                <option value="">-- + Register a Brand New Club --</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {selectedClubId === '' && (
              <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-dashed border-slate-800 animate-fade-in md:col-span-2">
                <div className="text-[10px] text-indigo-400 font-mono font-bold flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  NEW CLUB DETAILS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-405 mb-1">CLUB FULL NAME</label>
                    <input
                      type="text"
                      required={selectedClubId === ''}
                      placeholder="e.g. Seattle Athletic Club"
                      value={newClubName}
                      onChange={(e) => setNewClubName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-slate-405 mb-1">OFFICIAL CONTACT EMAIL</label>
                    <input
                      type="email"
                      placeholder="e.g. info@seattleac.org"
                      value={newClubEmail}
                      onChange={(e) => setNewClubEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Selecting / Registering Association */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-805">
            <span className="font-mono text-rose-400 text-xs font-bold">03/</span>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Select or Create Association</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">CHOOSE GOVERNING ASSOCIATION</label>
              <select
                value={selectedAssociationId}
                onChange={(e) => setSelectedAssociationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-3 outline-none focus:border-indigo-550 transition-colors"
              >
                <option value="">-- + Register a Brand New Association --</option>
                {associations.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {selectedAssociationId === '' && (
              <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-dashed border-slate-800 animate-fade-in md:col-span-2">
                <div className="text-[10px] text-rose-400 font-mono font-bold flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5" />
                  NEW ATHLETIC ASSOCIATION / FEDERATION DETAILS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-405 mb-1">ASSOCIATION LEAGUE NAME</label>
                    <input
                      type="text"
                      required={selectedAssociationId === ''}
                      placeholder="e.g. National Premier Soccer League"
                      value={newAssociationName}
                      onChange={(e) => setNewAssociationName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-slate-405 mb-1">FEDERATION PRIMARY CONTACT EMAIL</label>
                    <input
                      type="email"
                      placeholder="e.g. registrar@npsl.org"
                      value={newAssociationEmail}
                      onChange={(e) => setNewAssociationEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs py-3.5 rounded-xl transition duration-205 flex items-center justify-center gap-2 shadow"
        >
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Activate Coaching Profile & Save Roster
        </button>
      </form>
    </div>
  );
}
