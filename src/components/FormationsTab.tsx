/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Save, 
  Trash2, 
  Plus, 
  Calendar, 
  Tag, 
  FileText, 
  Info, 
  Star, 
  Sparkles, 
  Check, 
  UserPlus, 
  X,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, TeamFormation, FormationAssignment } from '../types';
import TacticalAnimator from './TacticalAnimator';

interface FormationsTabProps {
  currentProfile: UserProfile;
  players: UserProfile[]; // All players
  formations: TeamFormation[];
  onSaveFormation: (formation: Omit<TeamFormation, 'updatedAt'>) => Promise<void>;
  onDeleteFormation: (formationId: string) => Promise<void>;
  initialSelectedFormationId?: string | null;
}

// Preset systems and formations configurations with static field coordinates (0-100 grid scale)
// X: Left-to-right (0 to 100), Y: Bottom-to-top (0 to 100).
// In soccer field perspective: 10 is near Goalkeeper, 90 is near Forward/Opponent Goal.
export const PRESET_FORMATIONS: Record<string, { name: string; assignments: Omit<FormationAssignment, 'playerId'>[] }[]> = {
  '5v5': [
    {
      name: '1-2-1 (Diamond)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'DEF', positionName: 'Central Defender', x: 50, y: 35 },
        { positionId: 'LM', positionName: 'Left Midfielder', x: 20, y: 60 },
        { positionId: 'RM', positionName: 'Right Midfielder', x: 80, y: 60 },
        { positionId: 'FWD', positionName: 'Forward/Striker', x: 50, y: 82 }
      ]
    },
    {
      name: '2-1-1 (Pyramid)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LD', positionName: 'Left Defender', x: 30, y: 35 },
        { positionId: 'RD', positionName: 'Right Defender', x: 70, y: 35 },
        { positionId: 'MID', positionName: 'Central Midfielder', x: 50, y: 60 },
        { positionId: 'FWD', positionName: 'Forward/Striker', x: 50, y: 82 }
      ]
    },
    {
      name: '1-1-2 (Y-Formation)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'DEF', positionName: 'Defender', x: 50, y: 34 },
        { positionId: 'MID', positionName: 'Central Midfielder', x: 50, y: 58 },
        { positionId: 'LF', positionName: 'Left Forward', x: 30, y: 82 },
        { positionId: 'RF', positionName: 'Right Forward', x: 70, y: 82 }
      ]
    }
  ],
  '6v6': [
    {
      name: '2-1-2 (Balanced)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LD', positionName: 'Left Defender', x: 30, y: 32 },
        { positionId: 'RD', positionName: 'Right Defender', x: 70, y: 32 },
        { positionId: 'MID', positionName: 'Central Midfielder', x: 50, y: 56 },
        { positionId: 'LF', positionName: 'Left Forward', x: 28, y: 80 },
        { positionId: 'RF', positionName: 'Right Forward', x: 72, y: 80 }
      ]
    },
    {
      name: '2-2-1',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LD', positionName: 'Left Defender', x: 30, y: 32 },
        { positionId: 'RD', positionName: 'Right Defender', x: 70, y: 32 },
        { positionId: 'LM', positionName: 'Left midfielder', x: 25, y: 56 },
        { positionId: 'RM', positionName: 'Right midfielder', x: 75, y: 56 },
        { positionId: 'ST', positionName: 'Striker', x: 50, y: 82 }
      ]
    },
    {
      name: '1-3-1 (Central focus)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'DEF', positionName: 'Defender', x: 50, y: 32 },
        { positionId: 'LM', positionName: 'Left Mid', x: 20, y: 56 },
        { positionId: 'CM', positionName: 'Center Mid', x: 50, y: 56 },
        { positionId: 'RM', positionName: 'Right Mid', x: 80, y: 56 },
        { positionId: 'ST', positionName: 'Forward', x: 50, y: 82 }
      ]
    }
  ],
  '7v7': [
    {
      name: '2-3-1 (Samba)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LD', positionName: 'Left Defender', x: 30, y: 30 },
        { positionId: 'RD', positionName: 'Right Defender', x: 70, y: 30 },
        { positionId: 'LM', positionName: 'Left midfielder', x: 18, y: 55 },
        { positionId: 'CM', positionName: 'Central midfielder', x: 50, y: 55 },
        { positionId: 'RM', positionName: 'Right midfielder', x: 82, y: 55 },
        { positionId: 'ST', positionName: 'Striker', x: 50, y: 82 }
      ]
    },
    {
      name: '3-2-1 (Christmas Tree)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LD', positionName: 'Left Back', x: 24, y: 30 },
        { positionId: 'CD', positionName: 'Center Back', x: 50, y: 30 },
        { positionId: 'RD', positionName: 'Right Back', x: 76, y: 30 },
        { positionId: 'LCM', positionName: 'Left Mid', x: 34, y: 55 },
        { positionId: 'RCM', positionName: 'Right Mid', x: 66, y: 55 },
        { positionId: 'ST', positionName: 'Striker', x: 50, y: 82 }
      ]
    },
    {
      name: '2-2-2 (Double Diamond)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LD', positionName: 'Left Defender', x: 30, y: 30 },
        { positionId: 'RD', positionName: 'Right Defender', x: 70, y: 30 },
        { positionId: 'LCM', positionName: 'Left Midfielder', x: 33, y: 55 },
        { positionId: 'RCM', positionName: 'Right Midfielder', x: 67, y: 55 },
        { positionId: 'LF', positionName: 'Left Forward', x: 30, y: 80 },
        { positionId: 'RF', positionName: 'Right Forward', x: 70, y: 80 }
      ]
    }
  ],
  '9v9': [
    {
      name: '3-3-2 (Classic Wide)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LD', positionName: 'Left Back', x: 25, y: 28 },
        { positionId: 'CD', positionName: 'Center Back', x: 50, y: 28 },
        { positionId: 'RD', positionName: 'Right Back', x: 75, y: 28 },
        { positionId: 'LM', positionName: 'Left Midfielder', x: 18, y: 52 },
        { positionId: 'CM', positionName: 'Central Midfielder', x: 50, y: 52 },
        { positionId: 'RM', positionName: 'Right Midfielder', x: 82, y: 52 },
        { positionId: 'LF', positionName: 'Left Forward', x: 33, y: 80 },
        { positionId: 'RF', positionName: 'Right Forward', x: 67, y: 80 }
      ]
    },
    {
      name: '4-3-1 (Solid Defense)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LB', positionName: 'Left Back', x: 16, y: 28 },
        { positionId: 'LCB', positionName: 'Left Center Back', x: 38, y: 28 },
        { positionId: 'RCB', positionName: 'Right Center Back', x: 62, y: 28 },
        { positionId: 'RB', positionName: 'Right Back', x: 84, y: 28 },
        { positionId: 'LM', positionName: 'Left midfielder', x: 24, y: 54 },
        { positionId: 'CM', positionName: 'Center midfielder', x: 50, y: 54 },
        { positionId: 'RM', positionName: 'Right midfielder', x: 76, y: 54 },
        { positionId: 'ST', positionName: 'Striker', x: 50, y: 82 }
      ]
    },
    {
      name: '3-4-1 (Attacking Wingers)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LD', positionName: 'Left Def', x: 25, y: 28 },
        { positionId: 'CD', positionName: 'Center Def', x: 50, y: 28 },
        { positionId: 'RD', positionName: 'Right Def', x: 75, y: 28 },
        { positionId: 'LM', positionName: 'Left Wing Mid', x: 15, y: 52 },
        { positionId: 'LCM', positionName: 'Center Mid L', x: 38, y: 52 },
        { positionId: 'RCM', positionName: 'Center Mid R', x: 62, y: 52 },
        { positionId: 'RM', positionName: 'Right Wing Mid', x: 85, y: 52 },
        { positionId: 'ST', positionName: 'Striker', x: 50, y: 82 }
      ]
    }
  ],
  '11v11': [
    {
      name: '4-4-2 (Classic Flat)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LB', positionName: 'Left Back', x: 15, y: 25 },
        { positionId: 'LCB', positionName: 'Left Center Back', x: 38, y: 25 },
        { positionId: 'RCB', positionName: 'Right Center Back', x: 62, y: 25 },
        { positionId: 'RB', positionName: 'Right Back', x: 85, y: 25 },
        { positionId: 'LM', positionName: 'Left Midfielder', x: 15, y: 54 },
        { positionId: 'LCM', positionName: 'Left Center Mid', x: 38, y: 54 },
        { positionId: 'RCM', positionName: 'Right Center Mid', x: 62, y: 54 },
        { positionId: 'RM', positionName: 'Right Midfielder', x: 85, y: 54 },
        { positionId: 'LF', positionName: 'Left Forward', x: 33, y: 80 },
        { positionId: 'RF', positionName: 'Right Forward', x: 67, y: 80 }
      ]
    },
    {
      name: '4-3-3 (Modern Pivot)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LB', positionName: 'Left Back', x: 15, y: 25 },
        { positionId: 'LCB', positionName: 'Left Center Back', x: 38, y: 25 },
        { positionId: 'RCB', positionName: 'Right Center Back', x: 62, y: 25 },
        { positionId: 'RB', positionName: 'Right Back', x: 85, y: 25 },
        { positionId: 'LCM', positionName: 'Left Midfielder', x: 26, y: 52 },
        { positionId: 'CM', positionName: 'Holding Midfielder', x: 50, y: 48 },
        { positionId: 'RCM', positionName: 'Right Midfielder', x: 74, y: 52 },
        { positionId: 'LW', positionName: 'Left Winger', x: 18, y: 78 },
        { positionId: 'ST', positionName: 'Striker', x: 50, y: 82 },
        { positionId: 'RW', positionName: 'Right Winger', x: 82, y: 78 }
      ]
    },
    {
      name: '4-2-3-1 (Strategic Depth)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LB', positionName: 'Left Back', x: 15, y: 25 },
        { positionId: 'LCB', positionName: 'Left Center Back', x: 38, y: 25 },
        { positionId: 'RCB', positionName: 'Right Center Back', x: 62, y: 25 },
        { positionId: 'RB', positionName: 'Right Back', x: 85, y: 25 },
        { positionId: 'LDM', positionName: 'Left Defensive Mid', x: 34, y: 44 },
        { positionId: 'RDM', positionName: 'Right Defensive Mid', x: 66, y: 44 },
        { positionId: 'LAM', positionName: 'Left Attacking Mid', x: 24, y: 66 },
        { positionId: 'CAM', positionName: 'Central Attacking Mid', x: 50, y: 66 },
        { positionId: 'RAM', positionName: 'Right Attacking Mid', x: 76, y: 66 },
        { positionId: 'ST', positionName: 'Striker', x: 50, y: 82 }
      ]
    },
    {
      name: '3-5-2 (Wingbacks)',
      assignments: [
        { positionId: 'GK', positionName: 'Goalkeeper', x: 50, y: 12 },
        { positionId: 'LCB', positionName: 'Left Defender', x: 26, y: 25 },
        { positionId: 'CB', positionName: 'Central Defender', x: 50, y: 25 },
        { positionId: 'RCB', positionName: 'Right Defender', x: 74, y: 25 },
        { positionId: 'LWB', positionName: 'Left Wingback', x: 14, y: 52 },
        { positionId: 'LCM', positionName: 'Left Center Mid', x: 34, y: 52 },
        { positionId: 'CM', positionName: 'Holding Mid', x: 50, y: 48 },
        { positionId: 'RCM', positionName: 'Right Center Mid', x: 66, y: 52 },
        { positionId: 'RWB', positionName: 'Right Wingback', x: 86, y: 52 },
        { positionId: 'LF', positionName: 'Left Forward', x: 33, y: 80 },
        { positionId: 'RF', positionName: 'Right Forward', x: 67, y: 80 }
      ]
    }
  ]
};

export default function FormationsTab({
  currentProfile,
  players,
  formations,
  onSaveFormation,
  onDeleteFormation,
  initialSelectedFormationId
}: FormationsTabProps) {
  const isCoach = currentProfile.role === 'coach';
  
  // Filter players that belong to this coach's team and ensure their role is exactly 'player'
  const teamIdToFilter = currentProfile.teamId || '';
  const myTeamPlayers = players.filter(p => p.role === 'player' && p.teamId === teamIdToFilter);

  // States
  const [selectedSystem, setSelectedSystem] = useState<'5v5' | '6v6' | '7v7' | '9v9' | '11v11'>('11v11');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [formationName, setFormationName] = useState('Tactical Lineup');
  const [notes, setNotes] = useState('');
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  // Live editable assignments copy mapping positionId -> playerId | null
  const [liveAssignments, setLiveAssignments] = useState<Record<string, string | null>>({});
  
  // Active selected slot on the football field for player assignment dropdowns
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  
  // Save Feedback state
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // List search or selected filters
  const [loadedFormationId, setLoadedFormationId] = useState<string | null>(null);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sync state with standard preset configurations
  const presetsAvailable = PRESET_FORMATIONS[selectedSystem] || [];
  const currentPreset = presetsAvailable[selectedPresetIndex] || presetsAvailable[0] || { name: '', assignments: [] };

  // Initialize or reset layout to selected preset template
  const applyPresetTemplate = (system: '5v5' | '6v6' | '7v7' | '9v9' | '11v11', idx: number) => {
    setSelectedSystem(system);
    setSelectedPresetIndex(idx);
    const targetPreset = PRESET_FORMATIONS[system]?.[idx];
    if (targetPreset) {
      setFormationName(`Match Setup (${targetPreset.name.split(' ')[0]})`);
      const defaultMap: Record<string, string | null> = {};
      targetPreset.assignments.forEach(as => {
        defaultMap[as.positionId] = null;
      });
      setLiveAssignments(defaultMap);
      setLoadedFormationId(null);
    }
    setActiveSlotId(null);
  };

  // Populate loaded lineup configurations
  const loadSavedFormation = (f: TeamFormation, skipToast = false) => {
    setLoadedFormationId(f.id);
    setSelectedSystem(f.system);
    setFormationName(f.name);
    setNotes(f.notes || '');
    
    // Find preset index that matches this configuration name
    const presetIndex = (PRESET_FORMATIONS[f.system] || []).findIndex(p => p.name === f.lineupName);
    if (presetIndex !== -1) {
      setSelectedPresetIndex(presetIndex);
    }

    const loadedMap: Record<string, string | null> = {};
    f.assignments.forEach(as => {
      loadedMap[as.positionId] = as.playerId;
    });
    setLiveAssignments(loadedMap);
    setActiveSlotId(null);

    // Show indicator
    if (!skipToast) {
      setSuccessMsg(`Loaded saved formation: "${f.name}"`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Assign player to active slot
  const assignPlayerToPosition = (positionId: string, playerId: string | null) => {
    setLiveAssignments(prev => {
      const next = { ...prev };
      // If player is already assigned somewhere else, clear that slot first
      if (playerId) {
        Object.keys(next).forEach(posK => {
          if (next[posK] === playerId) {
            next[posK] = null;
          }
        });
      }
      next[positionId] = playerId;
      return next;
    });
    setActiveSlotId(null);
  };

  // Save changes to database collection
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formationName.trim()) {
      setErrorMsg('Please specify a title name for your setup.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Build final schema compliant elements
      const finalAssignmentsList: FormationAssignment[] = currentPreset.assignments.map(as => {
        return {
          positionId: as.positionId,
          positionName: as.positionName,
          x: as.x,
          y: as.y,
          playerId: liveAssignments[as.positionId] || null
        };
      });

      const formationPayload: Omit<TeamFormation, 'updatedAt'> = {
        id: loadedFormationId || `form-${Date.now()}`,
        coachId: currentProfile.id,
        teamId: currentProfile.teamId || 'unknown-team',
        name: formationName,
        system: selectedSystem,
        lineupName: currentPreset.name,
        assignments: finalAssignmentsList,
        notes: notes.trim()
      };

      await onSaveFormation(formationPayload);
      
      // Upgrade ID if new creation
      if (!loadedFormationId) {
        setLoadedFormationId(formationPayload.id);
      }

      setSuccessMsg('Tactical lineup successfully persisted! Ready for game day.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save formation record to database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter formations belonging to current team
  const activeTeamFormations = React.useMemo(() => {
    return formations.filter(f => f.teamId === currentProfile.teamId);
  }, [formations, currentProfile.teamId]);

  // Auto-load last saved team formation on mount or when formations list loads
  React.useEffect(() => {
    if (!hasAutoLoaded && activeTeamFormations.length > 0) {
      const sorted = [...activeTeamFormations].sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      const latest = sorted[0];
      if (latest) {
        loadSavedFormation(latest, true);
        setHasAutoLoaded(true);
      }
    }
  }, [activeTeamFormations, hasAutoLoaded]);

  // Load specific formation if loaded on request from the dashboard
  React.useEffect(() => {
    if (initialSelectedFormationId && activeTeamFormations.length > 0 && !hasLoadedInitial) {
      const match = activeTeamFormations.find(f => f.id === initialSelectedFormationId);
      if (match) {
        loadSavedFormation(match, true);
        setHasLoadedInitial(true);
        setHasAutoLoaded(true);
      }
    }
  }, [initialSelectedFormationId, activeTeamFormations, hasLoadedInitial]);

  // Check if player is assigned to any position in the loaded/active lineup
  const playerAssignmentDetails = () => {
    if (currentProfile.role !== 'player' || activeTeamFormations.length === 0) return null;
    
    // Choose active/loaded formation or search for latest updated one
    const activeF = loadedFormationId 
      ? activeTeamFormations.find(f => f.id === loadedFormationId)
      : [...activeTeamFormations].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      
    if (!activeF) return null;

    const matchedPos = activeF.assignments.find(as => as.playerId === currentProfile.id);
    return matchedPos ? { position: matchedPos, formation: activeF } : { position: null, formation: activeF };
  };

  const plDetails = playerAssignmentDetails();

  // Helper dictionary mapping playerId to PlayerProfile object
  const playersLookup = players.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, UserProfile>);

  // List of players currently placement status in the template configuration
  const placedPlayerIds = Object.values(liveAssignments).filter((id): id is string => id !== null);
  const unplacedPlayers = myTeamPlayers.filter(p => !placedPlayerIds.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none select-none">
          <Users className="w-64 h-64 text-sky-400" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-sky-500/10 text-[#00bbff] border border-sky-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold">
                Tactics & Strategy
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold">
                Field Matcher
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Team Formations & Squad Layout</h1>
          </div>
          
          {isCoach && (
            <button
              onClick={() => {
                applyPresetTemplate('11v11', 0);
                setNotes('');
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-xs transition shadow-md shadow-emerald-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              New Lineup
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-start gap-3.5 text-xs font-medium"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-rose-950/40 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-start gap-3.5 text-xs font-medium"
          >
            <X className="w-4 h-4 text-rose-450 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player starting alignment focus state card */}
      {!isCoach && plDetails && (
        <div className="bg-[#020617] border border-[#00bbff]/20 rounded-2xl p-4.5 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-5 translate-x-4 translate-y-4">
            <Sparkles className="w-40 h-40 text-[#00bbff]" />
          </div>
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-[#00bbff]/20 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-[#00bbff] fill-[#00bbff]/10" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider font-semibold">Active Lineup Placement</p>
              <h3 className="text-slate-100 font-bold text-sm mt-0.5">
                {plDetails.position 
                  ? `You are placed in the starting line-up as: ${plDetails.position.positionName} (${plDetails.position.positionId})` 
                  : 'You have been added to the game squad but are not placed on the starting sheet today.'}
              </h3>
              <p className="text-slate-450 text-xs mt-1 leading-relaxed">
                Formation: <span className="text-[#00bbff] font-medium">{plDetails.formation.name}</span> ({plDetails.formation.system} - {plDetails.formation.lineupName}). 
                {plDetails.formation.notes && ` Strategy note: "${plDetails.formation.notes.slice(0, 100)}${plDetails.formation.notes.length > 100 ? '...' : ''}"`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dynamic Layout Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Lineups Selector Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Saved Formations List Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2.5xl p-5 shadow-lg">
            <h2 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              Saved Team Formations
            </h2>
            
            {activeTeamFormations.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-950/40 rounded-xl border border-slate-850">
                <Info className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
                <p className="text-slate-400 text-xs font-semibold">No Formations Created</p>
                <p className="text-slate-450 text-[11px] mt-1">
                  {isCoach ? 'Use the builder on the right to set up and save your team\'s first lineup.' : 'Check back later when coach designs a tactical layout.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {activeTeamFormations.map((f) => {
                  const isCurrent = loadedFormationId === f.id;
                  const dateStr = new Date(f.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={f.id}
                      onClick={() => loadSavedFormation(f)}
                      className={`group p-3.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-sky-500/10 border-[#00bbff]/30 shadow-md shadow-sky-500/5' 
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-850/50 hover:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-100 font-bold text-xs truncate max-w-[150px]">{f.name}</span>
                          <span className="bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium">
                            {f.system}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-450 flex items-center gap-1">
                          <span>{f.lineupName}</span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </div>
                        {f.notes && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {f.notes}
                          </p>
                        )}
                      </div>
                      
                      {confirmDeleteId === f.id ? (
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[9px] font-mono text-rose-400 font-bold uppercase tracking-wider">Delete?</span>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await onDeleteFormation(f.id);
                                if (loadedFormationId === f.id) {
                                  setLoadedFormationId(null);
                                  setNotes('');
                                  applyPresetTemplate('11v11', 0);
                                }
                                setSuccessMsg('Tactical lineup deleted successfully.');
                                setTimeout(() => setSuccessMsg(null), 3000);
                              } catch (err: any) {
                                setErrorMsg(err.message || 'Could not delete formation.');
                              } finally {
                                setConfirmDeleteId(null);
                              }
                            }}
                            className="bg-rose-550/90 hover:bg-rose-600 text-slate-100 font-bold px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCoach && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(f.id);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition"
                              title="Delete Formation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Builder Options Form - Only editable for Coach */}
          {isCoach && (
            <div className="bg-slate-900 border border-slate-800 rounded-2.5xl shadow-lg overflow-hidden">
              {/* Accordion Toggle Header */}
              <button
                type="button"
                onClick={() => setIsFormExpanded(!isFormExpanded)}
                className="w-full flex items-center justify-between p-5 text-left text-xs font-bold text-slate-350 uppercase tracking-widest hover:bg-slate-850/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#00bbff]" />
                  <span>Tactical Setup</span>
                </div>
                {isFormExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isFormExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleSave} className="p-5 pt-0 border-t border-slate-850/40 space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono text-[#00bbff] uppercase mb-1.5">Formation Title Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 4-3-3 Attacking, Cup Final Group"
                          value={formationName}
                          onChange={(e) => setFormationName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-[#00bbff]/50 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-[#00bbff] uppercase mb-1.5">Preset Game System</label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {(['5v5', '6v6', '7v7', '9v9', '11v11'] as const).map((sys) => (
                            <button
                              key={sys}
                              type="button"
                              onClick={() => applyPresetTemplate(sys, 0)}
                              className={`text-[10px] font-mono py-2 rounded-lg border text-center transition ${
                                selectedSystem === sys 
                                  ? 'bg-[#00bbff]/10 text-[#00bbff] border-[#00bbff]/30 font-bold' 
                                  : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-850'
                              }`}
                            >
                              {sys}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-[#00bbff] uppercase mb-1.5">Lineup Shape Configuration</label>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {presetsAvailable.map((preset, idx) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => applyPresetTemplate(selectedSystem, idx)}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                                selectedPresetIndex === idx 
                                  ? 'bg-[#00bbff]/5 text-slate-100 border-[#00bbff]/20 font-bold' 
                                  : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-850'
                              }`}
                            >
                              <span>{preset.name}</span>
                              <span className="text-[10px] text-slate-450 font-normal">
                                {preset.assignments.length} positions
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-[#00bbff] uppercase mb-1.5">Squad Strategy Notes</label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Build out from back, press high on corners, coordinate striker passes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-[#020617] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-[#00bbff]/50 leading-relaxed transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-[#00bbff] hover:bg-[#009be0] text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs shadow-md shadow-sky-500/10"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving Lineup...' : loadedFormationId ? 'Update Formation Plan' : 'Save Formation Plan'}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quick Help Guide removed here */}

        </div>

        {/* RIGHT COLUMN: Football Field & Position Assignments */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center">
          
          <div className="w-full flex justify-between items-center mb-4.5">
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-tight">
                {formationName}
              </h2>
              <p className="text-[10px] font-mono text-slate-450 uppercase mt-0.5">
                Cohort Format: {selectedSystem} • System Config: <span className="text-[#00bbff] font-bold">{currentPreset.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {notes && (
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-xl shrink-0 max-w-[200px] sm:max-w-sm">
                  <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[10px] text-slate-400 truncate tracking-wide" title={notes}>
                    {notes}
                  </span>
                </div>
              )}
              {/* Info Button */}
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                title="Strategic Guide Help"
              >
                <Info className="w-4 h-4 text-rose-450" />
              </button>
            </div>
          </div>

          {/* DRAG-AND-POSITION FIELD CANVAS CONTAINER */}
          <div className="w-full aspect-[4/5] max-w-[550px] bg-[#143d1a] border-4 border-slate-800/80 rounded-2xl relative overflow-hidden shadow-2xl p-4 flex flex-col justify-between">
            {/* Field Grass Visual Overlay with alternating mowing stripes */}
            <div className="absolute inset-0 flex flex-col opacity-[0.16] pointer-events-none select-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 w-full ${i % 2 === 0 ? 'bg-emerald-900' : 'bg-[#0f2913]'}`} 
                />
              ))}
            </div>

            {/* Soccer Pitch Markings (SVG overlay for crisp lines) */}
            <div className="absolute inset-x-0 inset-y-0 pointer-events-none select-none z-0 p-3 opacity-60">
              <svg className="w-full h-full text-white/50" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="0.5">
                {/* Outer Field Line */}
                <rect x="1" y="1" width="98" height="118" />
                
                {/* Halfway Line */}
                <line x1="1" y1="60" x2="99" y2="60" />
                
                {/* Center Circle */}
                <circle cx="50" cy="60" r="14" />
                <circle cx="50" cy="60" r="0.8" fill="currentColor" />

                {/* Top Goal Box (Attacking Zone) */}
                <rect x="25" y="1" width="50" height="18" />
                <rect x="37" y="1" width="26" height="6" />
                <circle cx="50" cy="13" r="0.8" fill="currentColor" />
                <path d="M 40 19 A 10 10 0 0 0 60 19" />
                <rect x="44" y="-1" width="12" height="2" opacity="0.3" />

                {/* Bottom Goal Box (Defensive / GK Area) - Symmetrical & Centered */}
                <rect x="25" y="101" width="50" height="18" />
                <rect x="37" y="113" width="26" height="6" />
                <circle cx="50" cy="107" r="0.8" fill="currentColor" />
                <path d="M 40 101 A 10 10 0 0 1 60 101" />
                <rect x="44" y="119" width="12" height="2" opacity="0.3" />

                {/* Corner kicks arcs */}
                <path d="M 1 5 A 4 4 0 0 0 5 1" />
                <path d="M 95 1 A 4 4 0 0 0 99 5" />
                <path d="M 1 115 A 4 4 0 0 0 5 119" />
                <path d="M 95 119 A 4 4 0 0 0 99 115" />
              </svg>
            </div>

            {/* DYNAMIC POSITION NODES LAYER */}
            <div className="absolute inset-x-0 inset-y-0 z-10 p-3">
              {/* Render position nodes based on chosen format template */}
              {currentPreset.assignments.map((as) => {
                const assignedPlayerId = liveAssignments[as.positionId];
                const playerObj = assignedPlayerId ? playersLookup[assignedPlayerId] : null;
                const isSelectedSlot = activeSlotId === as.positionId;
                const isProfilePlayer = assignedPlayerId === currentProfile.id;

                return (
                  <div
                    key={as.positionId}
                    style={{
                      left: `${as.x}%`,
                      bottom: `${as.y}%`,
                      transform: 'translate(-50%, 50%)'
                    }}
                    className="absolute"
                  >
                    <div className="relative flex flex-col items-center">
                      
                      {/* Interactive Field Button */}
                      <button
                        type="button"
                        disabled={!isCoach}
                        onClick={() => setActiveSlotId(isSelectedSlot ? null : as.positionId)}
                        className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full flex flex-col items-center justify-center transition border-2 shadow-xl ${
                          isProfilePlayer 
                            ? 'bg-[#00bbff] border-white text-slate-950 scale-110 ring-4 ring-sky-400/30' 
                            : playerObj 
                              ? 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-[#00bbff]/80' 
                              : 'bg-emerald-650 hover:bg-emerald-500 text-emerald-100 border-white/60 border-dashed'
                        }`}
                      >
                        {/* Short Role label or user Initials representation */}
                        <span className="text-[10px] sm:text-xs font-bold leading-none tracking-tight">
                          {as.positionId}
                        </span>
                        
                        {/* Visual placement shirt status badge */}
                        <span className="text-[7.5px] font-mono opacity-80 uppercase leading-none mt-0.5">
                          {playerObj ? 'ON' : 'OPEN'}
                        </span>
                      </button>

                      {/* Display Tag with Player Name */}
                      <div className="absolute top-[88%] w-[100px] flex justify-center pt-1 pointers-events-none select-none">
                        <span className={`text-[9px] sm:text-[10.5px] px-2 py-0.5 rounded-full font-bold truncate tracking-wide text-center uppercase border block w-full shadow-md ${
                          isProfilePlayer
                            ? 'bg-amber-400 text-slate-950 border-amber-500'
                            : playerObj 
                              ? 'bg-slate-950 text-slate-200 border-slate-800' 
                              : 'bg-emerald-900/90 text-emerald-300 border-emerald-800'
                        }`}>
                          {playerObj ? playerObj.name : as.positionName}
                        </span>
                      </div>

                      {/* INDIVIDUAL DROPDOWN SELECTION POPUP MENU */}
                      <AnimatePresence>
                        {isSelectedSlot && isCoach && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-[115%] bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-2.5xl w-[220px] max-h-[220px] overflow-y-auto z-40 space-y-1 scrollbar-thin scrollbar-thumb-slate-800"
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-450 uppercase pb-1 border-b border-slate-900 px-1">
                              <span>Place a Player</span>
                              <span>({as.positionId})</span>
                            </div>

                            {/* Option to clear current spot */}
                            {playerObj && (
                              <button
                                type="button"
                                onClick={() => assignPlayerToPosition(as.positionId, null)}
                                className="w-full text-left p-1.5 hover:bg-slate-900 text-rose-450 font-bold text-[10.5px] rounded transition flex items-center justify-between group"
                              >
                                <span>Remove Placed Player</span>
                                <X className="w-3.5 h-3.5 text-rose-500 group-hover:block" />
                              </button>
                            )}

                            {/* Group List of all team athletes */}
                            {unplacedPlayers.length === 0 ? (
                              <p className="text-[10px] text-slate-450 italic p-2 text-center">
                                All roster players are placed on the pitch grid templates.
                              </p>
                            ) : (
                              unplacedPlayers.map((pl) => (
                                <button
                                  key={pl.id}
                                  type="button"
                                  onClick={() => assignPlayerToPosition(as.positionId, pl.id)}
                                  className="w-full text-left p-1.5 hover:bg-[#00bbff]/10 hover:text-slate-100 text-[#00bbff] text-[10.5px] rounded transition flex items-center justify-between group"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    <span className="truncate text-slate-200">{pl.name}</span>
                                  </div>
                                  <UserPlus className="w-3.5 h-3.5 text-[#00bbff] shrink-0 opacity-0 group-hover:opacity-100" />
                                </button>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Roster Match View Section */}
          <div className="w-full mt-6 bg-slate-950/40 border border-slate-850 rounded-2xl p-4.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-450" />
              Squad Starting Record ({placedPlayerIds.length} / {currentPreset.assignments.length})
            </h3>
            
            {myTeamPlayers.length === 0 ? (
              <p className="text-slate-450 text-xs italic">
                No verified players are assigned to your team roster yet. Players can link on onboarding screens.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {myTeamPlayers.map(p => {
                  // Find if they are placed
                  const positionKey = Object.keys(liveAssignments).find(k => liveAssignments[k] === p.id);
                  const isPlaced = !!positionKey;
                  return (
                    <div 
                      key={p.id}
                      className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${
                        isPlaced 
                          ? 'bg-[#00bbff]/5 text-sky-300 border-sky-500/20 shadow-sm' 
                          : 'bg-slate-900 text-slate-400 border-slate-850'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isPlaced ? 'bg-[#00bbff]' : 'bg-slate-600'}`} />
                      <span className="font-medium text-slate-200">{p.name}</span>
                      {isPlaced && (
                        <span className="text-[9.5px] bg-[#00bbff]/15 text-[#00bbff] px-1.5 py-0.2 rounded uppercase font-bold font-mono">
                          {positionKey}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Action Save/Update Button at the bottom of Right Column */}
          {isCoach && (
            <div className="w-full mt-6">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave()}
                className="w-full bg-[#00bbff] hover:bg-[#009be0] text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs shadow-md shadow-sky-500/10 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving Lineup...' : loadedFormationId ? 'Update Formation Plan' : 'Save Formation Plan'}
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Tactical Animation Playbook & Drill Simulator Widget */}
      <TacticalAnimator currentProfile={currentProfile} />

      {/* Strategic Guide Modal */}
      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuideOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-250 p-2 hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-850/60">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Info className="w-4 h-4 text-rose-450" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm tracking-wide">
                    Strategic Guide Setup
                  </h3>
                  <p className="text-[10px] font-mono text-slate-450 uppercase">
                    Tactical Help & Directives
                  </p>
                </div>
              </div>

              <div className="text-xs leading-relaxed text-slate-350 space-y-3.5 pt-1">
                <p>
                  By laying out your team on a physical field model, players can view their assigned starting spot and tactical focus in advance of competition.
                </p>
                <ul className="list-disc pl-4 space-y-2 text-[11px] text-slate-400">
                  <li>Choose a cohort format (from <b className="text-slate-200">5v5</b> small-sided to <b className="text-slate-200">11v11</b> full-court).</li>
                  <li>{isCoach ? 'Tap position spots on the grass to pick and lock a player.' : 'Position tags display player name and assigned role details.'}</li>
                  <li>Read strategy annotations listed to match targeted directives.</li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-300 font-bold py-2 px-5 rounded-xl text-xs border border-slate-800 transition cursor-pointer"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
