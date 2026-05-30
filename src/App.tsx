/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Shield, BookOpen, User, Users, Landmark, Award, Database, Settings, HelpCircle, Flame, Droplet, Star, Calendar, RefreshCw, CloudLightning, Wifi, DatabaseZap, LogOut, Menu, X } from 'lucide-react';
import {
  UserProfile,
  Association,
  Club,
  Team,
  Coach,
  Player,
  RunLog,
  DailyMetrics,
  EducationalModule,
  ModuleCompletion,
  Assignment,
  OrgProfileRequest,
  UserRole,
  TeamFormation
} from './types';
import {
  INITIAL_ASSOCIATIONS,
  INITIAL_CLUBS,
  INITIAL_TEAMS,
  INITIAL_COACHES,
  CLIENT_DEMO_USERS,
  INITIAL_MODULES,
  INITIAL_REQUESTS,
  INITIAL_ASSIGNMENTS
} from './data';

import PlayerDashboard from './components/PlayerDashboard';
import ClassroomTab from './components/ClassroomTab';
import CoachesDashboard from './components/CoachesDashboard';
import AdminDashboard from './components/AdminDashboard';
import AssociationDashboard from './components/AssociationDashboard';
import AuthScreen from './components/AuthScreen';
import CoachOnboarding from './components/CoachOnboarding';
import LeaderboardTab from './components/LeaderboardTab';
import FormationsTab from './components/FormationsTab';
import ParentDashboard from './components/ParentDashboard';

// Firebase Client Imports
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  writeBatch, 
  getDocFromServer,
  deleteDoc
} from 'firebase/firestore';

// Helper for initial player metrics seed
const INITIAL_PLAYER_METRICS: Record<string, DailyMetrics> = {};

const INITIAL_RUN_LOGS: RunLog[] = [];

export default function App() {
  // Auto-wipe old mock data caches if they exist to prevent state pollution
  useState(() => {
    const isWiped = localStorage.getItem('echelon_fresh_v6') === 'true';
    if (!isWiped) {
      localStorage.clear();
      localStorage.setItem('echelon_use_firestore', 'true');
      localStorage.setItem('echelon_fresh_v6', 'true');
    }
  });

  // Load persistent configurations or defaults
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'classroom' | 'coaches' | 'admin' | 'leaderboard' | 'formation'>('dashboard');
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Cloud Sync Connection Configuration States
  const [useFirestore, setUseFirestore] = useState<boolean>(() => localStorage.getItem('echelon_use_firestore') !== 'false');
  const [fireConnection, setFireConnection] = useState<'connected' | 'error' | 'testing'>('testing');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [seeding, setSeeding] = useState<boolean>(false);
  const [seedError, setSeedError] = useState<string>('');
  const [confirmWipeInput, setConfirmWipeInput] = useState<string>('');

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const cached = localStorage.getItem('echelon_users');
    return cached ? JSON.parse(cached) : CLIENT_DEMO_USERS;
  });

  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('echelon_current_profile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) return parsed;
      } catch (err) {
        console.error("Failed to parse cached profile session", err);
      }
    }
    return null;
  });

  const [associations, setAssociations] = useState<Association[]>(() => {
    const cached = localStorage.getItem('echelon_associations');
    return cached ? JSON.parse(cached) : INITIAL_ASSOCIATIONS;
  });

  const [clubs, setClubs] = useState<Club[]>(() => {
    const cached = localStorage.getItem('echelon_clubs');
    return cached ? JSON.parse(cached) : INITIAL_CLUBS;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    const cached = localStorage.getItem('echelon_teams');
    return cached ? JSON.parse(cached) : INITIAL_TEAMS;
  });

  const [coaches, setCoaches] = useState<Coach[]>(() => {
    const cached = localStorage.getItem('echelon_coaches');
    return cached ? JSON.parse(cached) : INITIAL_COACHES;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const cached = localStorage.getItem('echelon_players');
    return cached ? JSON.parse(cached) : [];
  });

  const [runLogs, setRunLogs] = useState<RunLog[]>(() => {
    const cached = localStorage.getItem('echelon_run_logs');
    return cached ? JSON.parse(cached) : INITIAL_RUN_LOGS;
  });

  const [allMetrics, setAllMetrics] = useState<Record<string, DailyMetrics[]>>(() => {
    const cached = localStorage.getItem('echelon_all_metrics');
    if (cached) return JSON.parse(cached);
    return {};
  });

  const [modules, setModules] = useState<EducationalModule[]>(INITIAL_MODULES);

  const [completions, setCompletions] = useState<ModuleCompletion[]>(() => {
    const cached = localStorage.getItem('echelon_completions');
    return cached ? JSON.parse(cached) : [];
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const cached = localStorage.getItem('echelon_assignments');
    return cached ? JSON.parse(cached) : INITIAL_ASSIGNMENTS;
  });

  const [requests, setRequests] = useState<OrgProfileRequest[]>(() => {
    const cached = localStorage.getItem('echelon_requests');
    return cached ? JSON.parse(cached) : INITIAL_REQUESTS;
  });

  const [formations, setFormations] = useState<TeamFormation[]>(() => {
    const cached = localStorage.getItem('echelon_formations');
    return cached ? JSON.parse(cached) : [];
  });

  // --- Firestore Real-Time Subscriptions & Connection Logic ---
  useEffect(() => {
    localStorage.setItem('echelon_use_firestore', String(useFirestore));
    
    if (!useFirestore) {
      setFireConnection('testing');
      return;
    }

    setFireConnection('testing');

    let isSubscribed = false;
    const unsubscribers: (() => void)[] = [];

    const handleSubError = (err: any, path: string) => {
      console.error(`Subscription error on ${path}:`, err);
      setFireConnection('error');
    };

    const setupSubscriptions = () => {
      if (isSubscribed) return;
      isSubscribed = true;

      unsubscribers.push(
        onSnapshot(collection(db, 'users'), (snap) => {
          const list: UserProfile[] = [];
          snap.forEach(d => list.push(d.data() as UserProfile));
          setUsers(list);
        }, (err) => handleSubError(err, 'users'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'associations'), (snap) => {
          const list: Association[] = [];
          snap.forEach(d => list.push(d.data() as Association));
          setAssociations(list);
        }, (err) => handleSubError(err, 'associations'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'clubs'), (snap) => {
          const list: Club[] = [];
          snap.forEach(d => list.push(d.data() as Club));
          setClubs(list);
        }, (err) => handleSubError(err, 'clubs'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'teams'), (snap) => {
          const list: Team[] = [];
          snap.forEach(d => list.push(d.data() as Team));
          setTeams(list);
        }, (err) => handleSubError(err, 'teams'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'coaches'), (snap) => {
          const list: Coach[] = [];
          snap.forEach(d => list.push(d.data() as Coach));
          setCoaches(list);
        }, (err) => handleSubError(err, 'coaches'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'players'), (snap) => {
          const list: Player[] = [];
          snap.forEach(d => list.push(d.data() as Player));
          setPlayers(list);
        }, (err) => handleSubError(err, 'players'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'runLogs'), (snap) => {
          const list: RunLog[] = [];
          snap.forEach(d => list.push(d.data() as RunLog));
          setRunLogs(list);
        }, (err) => handleSubError(err, 'runLogs'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'dailyMetrics'), (snap) => {
          const metricsMap: Record<string, DailyMetrics[]> = {};
          snap.forEach(d => {
            const m = d.data() as DailyMetrics;
            if (!metricsMap[m.playerId]) {
              metricsMap[m.playerId] = [];
            }
            metricsMap[m.playerId].push(m);
          });
          setAllMetrics(metricsMap);
        }, (err) => handleSubError(err, 'dailyMetrics'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'assignments'), (snap) => {
          const list: Assignment[] = [];
          snap.forEach(d => list.push(d.data() as Assignment));
          setAssignments(list);
        }, (err) => handleSubError(err, 'assignments'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'moduleCompletions'), (snap) => {
          const list: ModuleCompletion[] = [];
          snap.forEach(d => list.push(d.data() as ModuleCompletion));
          setCompletions(list);
        }, (err) => handleSubError(err, 'moduleCompletions'))
      );

      unsubscribers.push(
        onSnapshot(collection(db, 'teamFormations'), (snap) => {
          const list: TeamFormation[] = [];
          snap.forEach(d => list.push(d.data() as TeamFormation));
          setFormations(list);
        }, (err) => handleSubError(err, 'teamFormations'))
      );
    };

    // Listen to Auth State Changes
    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Authenticated! Update connection health & subscribe on snap
        getDocFromServer(doc(db, 'test', 'connection'))
          .then(() => setFireConnection('connected'))
          .catch(() => setFireConnection('connected'));

        setupSubscriptions();

        if (!firebaseUser.isAnonymous) {
          try {
            const uDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (uDoc.exists()) {
              const loadedProf = uDoc.data() as UserProfile;
              setCurrentProfile(loadedProf);
              localStorage.setItem('echelon_current_profile', JSON.stringify(loadedProf));
            }
          } catch (err) {
            console.error("Auth sync profile load failed:", err);
          }
        }
      } else {
        // Automatically request active anonymous session if no active session is loaded
        signInAnonymously(auth)
          .catch((err) => {
            console.warn("Could not activate anonymous session fallback:", err);
            setFireConnection('error');
          });
      }
    });

    return () => {
      authUnsub();
      unsubscribers.forEach(unsub => unsub());
    };
  }, [useFirestore]);

  // Background Scanner: Scan 'users' list to auto-populate the 'associations' collection
  useEffect(() => {
    if (!useFirestore || users.length === 0) return;

    const scanAndSelfHealAssociations = async () => {
      const associationUsers = users.filter(u => u.role === 'association');
      if (associationUsers.length === 0) return;

      for (const u of associationUsers) {
        // Find or derive the correct association ID
        const assocId = u.associationId || `assoc-${u.id}`;
        
        // Check if we already have it tracked in local associations state
        const existsLocally = associations.some(a => a.id === assocId || (a.contactEmail?.toLowerCase() === u.email.toLowerCase()));
        
        if (!existsLocally) {
          try {
            // Check directly from Firebase firestore to confirm if it is missing
            const assocDocRef = doc(db, 'associations', assocId);
            const assocDocSnap = await getDoc(assocDocRef);
            
            if (!assocDocSnap.exists()) {
              console.log(`Auto-healing scanner: Missing association document for role 'association' user [${u.name}]`);
              
              const newAssociation: Association = {
                id: assocId,
                name: u.name || 'Governing Body Association',
                contactEmail: u.email,
                approved: true,
                UUID: assocId,
                association_name: u.name || 'Governing Body Association',
                association_email: u.email,
                create_at: new Date().toISOString()
              };

              // Put the document cleanly in Firestore associations collection
              await setDoc(assocDocRef, newAssociation);
              
              // If the user's document was missing the associationId link reference, update the user entry as well safely
              if (!u.associationId) {
                const userDocRef = doc(db, 'users', u.id);
                await setDoc(userDocRef, {
                  ...u,
                  associationId: assocId
                });
              }
            }
          } catch (err) {
            console.warn("Background auto-healing scanner warning:", err);
          }
        }
      }
    };

    const timer = setTimeout(() => {
      scanAndSelfHealAssociations();
    }, 1200);

    return () => clearTimeout(timer);
  }, [users, associations, useFirestore]);

  // Background Scanner: Scan 'users' list to auto-populate the 'coaches' collection
  useEffect(() => {
    if (!useFirestore || users.length === 0) return;

    const scanAndSelfHealCoaches = async () => {
      const coachUsers = users.filter(u => u.role === 'coach');
      if (coachUsers.length === 0) return;

      for (const u of coachUsers) {
        // Find or derive the correct coach ID
        const coachId = u.coachId || `coach-${u.id}`;
        
        // Check if we already have it tracked in local coaches state
        const existsLocally = coaches.some(c => c.id === coachId || (c.email?.toLowerCase() === u.email.toLowerCase()));
        
        if (!existsLocally) {
          try {
            // Check directly from Firebase firestore to confirm if it is missing
            const coachDocRef = doc(db, 'coaches', coachId);
            const coachDocSnap = await getDoc(coachDocRef);
            
            if (!coachDocSnap.exists()) {
              console.log(`Auto-healing coach scanner: Missing coach document for role 'coach' user [${u.name}]`);
              
              const matchingTeam = teams.find(t => t.id === (u.teamId || ''));
              const teamName = matchingTeam ? matchingTeam.name : (u.teamId || '');

              const newCoach: Coach = {
                id: coachId,
                name: u.name || 'Head Coach',
                email: u.email,
                teamId: u.teamId || '',
                approved: true,
                UUID: coachId,
                coach: u.name || 'Head Coach',
                coach_email: u.email,
                team: teamName,
                create_at: new Date().toISOString()
              };

              // Put the document cleanly in Firestore coaches collection
              await setDoc(coachDocRef, newCoach);

              // Update local state right away
              setCoaches(prev => {
                if (prev.some(c => c.id === coachId)) {
                  return prev.map(c => c.id === coachId ? newCoach : c);
                }
                return [...prev, newCoach];
              });
              
              // If the user's document was missing the coachId link reference, update the user entry as well safely
              if (!u.coachId) {
                const userDocRef = doc(db, 'users', u.id);
                await setDoc(userDocRef, {
                  ...u,
                  coachId: coachId
                });
              }
            }
          } catch (err) {
            console.warn("Background coach auto-healing scanner warning:", err);
          }
        }
      }
    };

    const timer = setTimeout(() => {
      scanAndSelfHealCoaches();
    }, 1500);

    return () => clearTimeout(timer);
  }, [users, coaches, teams, useFirestore]);

  // Background Scanner: Scan 'users' list to auto-populate the 'players' collection
  useEffect(() => {
    if (!useFirestore || users.length === 0) return;

    const scanAndSelfHealPlayers = async () => {
      const playerUsers = users.filter(u => u.role === 'player');
      if (playerUsers.length === 0) return;

      for (const u of playerUsers) {
        const playerId = u.id;
        
        // Check if we already have it tracked in local players state
        const existsLocally = players.some(p => p.id === playerId || (p.email?.toLowerCase() === u.email.toLowerCase()));
        
        if (!existsLocally) {
          try {
            // Check directly from Firebase firestore to confirm if it is missing
            const playerDocRef = doc(db, 'players', playerId);
            const playerDocSnap = await getDoc(playerDocRef);
            
            if (!playerDocSnap.exists()) {
              console.log(`Auto-healing player scanner: Missing player document for role 'player' user [${u.name}]`);
              
              const newPlayer: Player = {
                id: playerId,
                name: u.name || 'Student Player',
                email: u.email,
                coachId: u.coachId || '',
                approved: true,
                UUID: playerId,
                player_name: u.name || 'Student Player',
                player_email: u.email,
                create_at: new Date().toISOString()
              };

              // Put the document cleanly in Firestore players collection
              await setDoc(playerDocRef, newPlayer);

              // Update local state right away
              setPlayers(prev => {
                if (prev.some(p => p.id === playerId)) {
                  return prev.map(p => p.id === playerId ? newPlayer : p);
                }
                return [...prev, newPlayer];
              });
            }
          } catch (err) {
            console.warn("Background player auto-healing scanner warning:", err);
          }
        }
      }
    };

    const timer = setTimeout(() => {
      scanAndSelfHealPlayers();
    }, 1800);

    return () => clearTimeout(timer);
  }, [users, players, useFirestore]);



  // Seeding local states directly down to Firestore
  const handleSeedFirestoreData = async () => {
    if (!useFirestore) return;
    setSeeding(true);
    setSeedError('');
    try {
      const batch = writeBatch(db);

      // Write users
      users.forEach(u => {
        batch.set(doc(db, 'users', u.id), u);
      });
      // Write associations
      associations.forEach(a => {
        batch.set(doc(db, 'associations', a.id), a);
      });
      // Write clubs
      clubs.forEach(c => {
        batch.set(doc(db, 'clubs', c.id), c);
      });
      // Write teams
      teams.forEach(t => {
        batch.set(doc(db, 'teams', t.id), t);
      });
      // Write coaches
      coaches.forEach(co => {
        batch.set(doc(db, 'coaches', co.id), co);
      });
      // Write players
      players.forEach(pl => {
        batch.set(doc(db, 'players', pl.id), pl);
      });
      // Write run logs
      runLogs.forEach(r => {
        batch.set(doc(db, 'runLogs', r.id), r);
      });
      // Write assignments
      assignments.forEach(a => {
        batch.set(doc(db, 'assignments', a.id), a);
      });
      // Write educational modules
      modules.forEach(m => {
        batch.set(doc(db, 'educationalModules', m.id), m);
      });
      // Write daily metrics
      Object.keys(allMetrics).forEach(playerId => {
        allMetrics[playerId].forEach(metric => {
          const metricId = `${playerId}_${metric.date}`;
          batch.set(doc(db, 'dailyMetrics', metricId), metric);
        });
      });
      // Write completions
      completions.forEach(c => {
        batch.set(doc(db, 'moduleCompletions', c.id), c);
      });

      await batch.commit();
      setSyncStatusMsg("Successfully uploaded local seed data to Cloud Firestore instances!");
      setTimeout(() => setSyncStatusMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setSeedError(err instanceof Error ? err.message : String(err));
    } finally {
      setSeeding(false);
    }
  };

  // Masters System Reset / Nuke Data State
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<string>('');
  const [resetProgress, setResetProgress] = useState<string>('');

  const handleCompleteSystemReset = async () => {
    setResetting(true);
    setResetError('');
    setResetSuccess('');
    setResetProgress('Starting system-wide wipe operation...');

    try {
      // 1. Wipe local storage and local variables
      setResetProgress('Wiping local browsers cache storage blocks...');
      localStorage.clear();
      
      localStorage.setItem('echelon_use_firestore', 'true');
      localStorage.setItem('echelon_fresh_v6', 'true');

      // Reset all state collections in-memory instantly
      setUsers([]);
      setAssociations([]);
      setClubs([]);
      setTeams([]);
      setCoaches([]);
      setPlayers([]);
      setRunLogs([]);
      setAllMetrics({});
      setCompletions([]);
      setAssignments([]);
      setRequests([]);

      // 2. Clear collections in Google Cloud Firestore database
      if (useFirestore) {
        const collectionsToWipe = [
          'associations',
          'clubs',
          'teams',
          'coaches',
          'players',
          'runLogs',
          'assignments',
          'moduleCompletions',
          'dailyMetrics',
          'requests',
          'users'
        ];

        for (const colName of collectionsToWipe) {
          setResetProgress(`Purging remote Cloud Firestore collection: '${colName}'...`);
          try {
            const colRef = collection(db, colName);
            const snap = await getDocs(colRef);
            if (!snap.empty) {
              const batch = writeBatch(db);
              snap.forEach(docSnap => {
                batch.delete(doc(db, colName, docSnap.id));
              });
              await batch.commit();
            }
          } catch (err) {
            console.warn(`Could not clear collection '${colName}':`, err);
          }
        }
      }

      // 3. Log out Auth state
      setResetProgress('De-authenticating session credential scopes...');
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Signout during system purge failed:", e);
      }
      
      setCurrentProfile(null);
      localStorage.removeItem('echelon_current_profile');

      setResetProgress('Finalizing clean state structures...');
      setResetSuccess('All local storage and Firestore database tables successfully cleared. Starting afresh!');
    } catch (err) {
      console.error(err);
      setResetError(err instanceof Error ? err.message : String(err));
    } finally {
      setResetting(false);
      setResetProgress('');
    }
  };

  // Persist storage whenever collections change
  useEffect(() => {
    localStorage.setItem('echelon_users', JSON.stringify(users));
  }, [users]);


  useEffect(() => {
    localStorage.setItem('echelon_associations', JSON.stringify(associations));
  }, [associations]);

  useEffect(() => {
    localStorage.setItem('echelon_clubs', JSON.stringify(clubs));
  }, [clubs]);

  useEffect(() => {
    localStorage.setItem('echelon_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('echelon_coaches', JSON.stringify(coaches));
  }, [coaches]);

  useEffect(() => {
    localStorage.setItem('echelon_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('echelon_run_logs', JSON.stringify(runLogs));
  }, [runLogs]);

  useEffect(() => {
    localStorage.setItem('echelon_all_metrics', JSON.stringify(allMetrics));
  }, [allMetrics]);

  useEffect(() => {
    localStorage.setItem('echelon_completions', JSON.stringify(completions));
  }, [completions]);

  useEffect(() => {
    localStorage.setItem('echelon_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('echelon_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('echelon_formations', JSON.stringify(formations));
  }, [formations]);

  const handleSaveFormation = async (formPayload: Omit<TeamFormation, 'updatedAt'>) => {
    const updatedAt = new Date().toISOString();
    const saved: TeamFormation = {
      ...formPayload,
      updatedAt
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'teamFormations', saved.id), saved);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `teamFormations/${saved.id}`);
      }
    } else {
      setFormations((prev) => {
        const filtered = prev.filter((f) => f.id !== saved.id);
        return [saved, ...filtered];
      });
    }
  };

  const handleDeleteFormation = async (formationId: string) => {
    if (useFirestore) {
      try {
        await deleteDoc(doc(db, 'teamFormations', formationId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `teamFormations/${formationId}`);
      }
    } else {
      setFormations((prev) => prev.filter((f) => f.id !== formationId));
    }
  };

  // Handler helpers
  const handleSaveRun = async (newRunFields: Omit<RunLog, 'id' | 'playerId' | 'date'>) => {
    const runId = `run-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const saved: RunLog = {
      ...newRunFields,
      id: runId,
      playerId: currentProfile.id,
      date: today
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'runLogs', runId), saved);
        // Check if run completed an assignment
        if (newRunFields.fromAssignmentId) {
          const matchedAssign = assignments.find(a => a.id === newRunFields.fromAssignmentId);
          if (matchedAssign) {
            const updatedAssign: Assignment = {
              ...matchedAssign,
              completedByPlayerIds: [...(matchedAssign.completedByPlayerIds || []), currentProfile.id]
            };
            await setDoc(doc(db, 'assignments', newRunFields.fromAssignmentId), updatedAssign);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `runLogs/${runId}`);
      }
    } else {
      setRunLogs((prev) => [saved, ...prev]);
      if (newRunFields.fromAssignmentId) {
        setAssignments((prev) =>
          prev.map((assign) => {
            if (assign.id === newRunFields.fromAssignmentId) {
              return {
                ...assign,
                completedByPlayerIds: [...assign.completedByPlayerIds, currentProfile.id]
              };
            }
            return assign;
          })
        );
      }
    }
  };

  // Profile switches
  const handleChangeProfile = (profile: UserProfile) => {
    setCurrentProfile(profile);
    setActiveTab('dashboard'); // Default
  };

  // Log active nutrition details and hydration
  const handleUpdateDailyMetrics = async (fields: Partial<DailyMetrics>) => {
    const studentIdx = currentProfile.id;
    const today = '2026-05-21'; // Sim local timeline
    
    // Compute updated state
    const records = allMetrics[studentIdx] || [];
    const matchIdx = records.findIndex(r => r.date === today);
    let targetRecord: DailyMetrics;

    if (matchIdx >= 0) {
      targetRecord = {
        ...records[matchIdx],
        ...fields
      };
    } else {
      const defaultRecord: DailyMetrics = {
        playerId: studentIdx,
        date: today,
        hydrationMls: 1500,
        hydrationGoalMls: 3000,
        sleepHours: 8,
        sleepQuality: 'Good',
        nutritionCalories: 1000,
        nutritionProteinG: 60,
        nutritionCarbsG: 120,
        nutritionFatG: 35
      };
      targetRecord = {
        ...defaultRecord,
        ...fields
      };
    }

    if (useFirestore) {
      const docId = `${studentIdx}_${today}`;
      try {
        await setDoc(doc(db, 'dailyMetrics', docId), targetRecord);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `dailyMetrics/${docId}`);
      }
    } else {
      setAllMetrics((prev) => {
        const localRecords = prev[studentIdx] || [];
        const idx = localRecords.findIndex(r => r.date === today);
        if (idx >= 0) {
          const updated = [...localRecords];
          updated[idx] = targetRecord;
          return { ...prev, [studentIdx]: updated };
        } else {
          return { ...prev, [studentIdx]: [...localRecords, targetRecord] };
        }
      });
    }
  };

  // Quizzes completed
  const handleCompleteModule = async (moduleId: string, quizScore?: { score: number; total: number }) => {
    const compId = `comp-${Date.now()}`;
    const completion: ModuleCompletion = {
      id: compId,
      playerId: currentProfile.id,
      moduleId,
      dateCompleted: new Date().toLocaleDateString(),
      quizScore
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'moduleCompletions', compId), completion);
        // Scan for matching course assignments
        const matches = assignments.filter(a => a.type === 'module' && a.moduleId === moduleId);
        for (const a of matches) {
          if (!a.completedByPlayerIds.includes(currentProfile.id)) {
            const updated: Assignment = {
              ...a,
              completedByPlayerIds: [...a.completedByPlayerIds, currentProfile.id]
            };
            await setDoc(doc(db, 'assignments', a.id), updated);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `moduleCompletions/${compId}`);
      }
    } else {
      setCompletions(prev => {
        const filtered = prev.filter(c => !(c.playerId === currentProfile.id && c.moduleId === moduleId));
        return [...filtered, completion];
      });

      setAssignments((prev) =>
        prev.map((a) => {
          if (a.type === 'module' && a.moduleId === moduleId) {
            if (!a.completedByPlayerIds.includes(currentProfile.id)) {
              return {
                ...a,
                completedByPlayerIds: [...a.completedByPlayerIds, currentProfile.id]
              };
            }
          }
          return a;
        })
      );
    }
  };

  // Assign dispatcher
  const handleAddAssignment = async (newAssign: Omit<Assignment, 'id' | 'completedByPlayerIds'>) => {
    const id = `assign-${Date.now()}`;
    const item: Assignment = {
      ...newAssign,
      id,
      completedByPlayerIds: []
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'assignments', id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `assignments/${id}`);
      }
    } else {
      setAssignments(prev => [...prev, item]);
    }
  };

  // Coaching goal update
  const handleUpdatePlayerGoal = async (playerId: string, updatedGoals: Partial<DailyMetrics>) => {
    const today = '2026-05-21';
    const records = allMetrics[playerId] || [];
    const matchIdx = records.findIndex(r => r.date === today);
    let target: DailyMetrics;

    if (matchIdx >= 0) {
      target = { ...records[matchIdx], ...updatedGoals };
    } else {
      target = {
        playerId,
        date: today,
        hydrationMls: 1500,
        hydrationGoalMls: 3000,
        sleepHours: 8,
        sleepQuality: 'Good',
        nutritionCalories: 1000,
        nutritionProteinG: 60,
        nutritionCarbsG: 120,
        nutritionFatG: 35,
        ...updatedGoals
      };
    }

    if (useFirestore) {
      const docId = `${playerId}_${today}`;
      try {
        await setDoc(doc(db, 'dailyMetrics', docId), target);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `dailyMetrics/${docId}`);
      }
    } else {
      setAllMetrics((prev) => {
        const localRecords = prev[playerId] || [];
        const idx = localRecords.findIndex(r => r.date === today);
        if (idx >= 0) {
          const updated = [...localRecords];
          updated[idx] = target;
          return { ...prev, [playerId]: updated };
        } else {
          return { ...prev, [playerId]: [...localRecords, target] };
        }
      });
    }
  };

  // Admin Request Approvals workflow
  const handleApproveRequest = async (reqId: string, type: 'association' | 'club' | 'team' | 'coach') => {
    const matchedReq = requests.find(r => r.id === reqId);
    if (!matchedReq) return;

    const targetId = `sim-${type}-${Date.now().toString().slice(-4)}`;

    if (useFirestore) {
      try {
        const batch = writeBatch(db);

        // Update request status
        batch.set(doc(db, 'requests', reqId), {
          ...matchedReq,
          status: 'approved'
        });

        if (type === 'association') {
          const instance: Association = { 
            id: targetId, 
            name: matchedReq.name, 
            contactEmail: matchedReq.contactEmail, 
            approved: true,
            UUID: targetId,
            association_name: matchedReq.name,
            association_email: matchedReq.contactEmail,
            create_at: new Date().toISOString()
          };
          batch.set(doc(db, 'associations', targetId), instance);
        } else if (type === 'club') {
          const timestamp = new Date().toISOString();
          const instance: Club = { 
            id: targetId, 
            name: matchedReq.name, 
            associationId: matchedReq.parentOrgId || 'assoc-1', 
            contactEmail: matchedReq.contactEmail, 
            approved: true,
            UUID: targetId,
            club_name: matchedReq.name,
            club_email: matchedReq.contactEmail,
            association_id: matchedReq.parentOrgId || 'assoc-1',
            create_at: timestamp
          };
          batch.set(doc(db, 'clubs', targetId), instance);
        } else if (type === 'team') {
          const instance: Team = { id: targetId, name: matchedReq.name, clubId: matchedReq.parentOrgId || 'club-1', contactEmail: matchedReq.contactEmail, approved: true };
          batch.set(doc(db, 'teams', targetId), instance);
        } else if (type === 'coach') {
          const instance: Coach = { id: targetId, name: matchedReq.name, email: matchedReq.contactEmail, teamId: matchedReq.parentOrgId || 'team-1', approved: true };
          batch.set(doc(db, 'coaches', targetId), instance);
          
          const userProf: UserProfile = {
            id: `user-coach-${targetId}`,
            name: matchedReq.name,
            email: matchedReq.contactEmail,
            role: 'coach',
            associationId: 'assoc-1',
            clubId: 'club-1',
            teamId: matchedReq.parentOrgId || 'team-1',
            coachId: targetId,
            approved: true
          };
          batch.set(doc(db, 'users', `user-coach-${targetId}`), userProf);
        }

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `requests/${reqId}`);
      }
    } else {
      // 1. Move statuses in approvals state
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'approved' } : r));

      // 2. Synthesize to matching database taxonomic lists
      if (type === 'association') {
        const instance: Association = { id: targetId, name: matchedReq.name, contactEmail: matchedReq.contactEmail, approved: true };
        setAssociations(prev => [...prev, instance]);
      } else if (type === 'club') {
        const timestamp = new Date().toISOString();
        const instance: Club = { 
          id: targetId, 
          name: matchedReq.name, 
          associationId: matchedReq.parentOrgId || 'assoc-1', 
          contactEmail: matchedReq.contactEmail, 
          approved: true,
          UUID: targetId,
          club_name: matchedReq.name,
          club_email: matchedReq.contactEmail,
          association_id: matchedReq.parentOrgId || 'assoc-1',
          create_at: timestamp
        };
        setClubs(prev => [...prev, instance]);
      } else if (type === 'team') {
        const instance: Team = { id: targetId, name: matchedReq.name, clubId: matchedReq.parentOrgId || 'club-1', contactEmail: matchedReq.contactEmail, approved: true };
        setTeams(prev => [...prev, instance]);
      } else if (type === 'coach') {
        const instance: Coach = { id: targetId, name: matchedReq.name, email: matchedReq.contactEmail, teamId: matchedReq.parentOrgId || 'team-1', approved: true };
        setCoaches(prev => [...prev, instance]);
        
        const userProf: UserProfile = {
          id: `user-coach-${targetId}`,
          name: matchedReq.name,
          email: matchedReq.contactEmail,
          role: 'coach',
          associationId: 'assoc-1',
          clubId: 'club-1',
          teamId: matchedReq.parentOrgId || 'team-1',
          coachId: targetId,
          approved: true
        };
        setUsers(prev => [...prev, userProf]);
      }
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    const matchedReq = requests.find(r => r.id === reqId);
    if (useFirestore && matchedReq) {
      try {
        await setDoc(doc(db, 'requests', reqId), {
          ...matchedReq,
          status: 'rejected'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `requests/${reqId}`);
      }
    } else {
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'rejected' } : r));
    }
  };

  const handleRequestJoin = async (newReq: Omit<OrgProfileRequest, 'id' | 'createdAt' | 'status'>) => {
    const reqId = `req-${Date.now()}`;
    const item: OrgProfileRequest = {
      ...newReq,
      id: reqId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'requests', reqId), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `requests/${reqId}`);
      }
    } else {
      setRequests(prev => [...prev, item]);
    }
  };

  const handleQuickRegisterPlayer = async (newPl: Omit<UserProfile, 'id' | 'approved'>) => {
    const plId = `user-player-${Date.now()}`;
    const user: UserProfile = {
      ...newPl,
      id: plId,
      approved: true
    };

    const newPlayer: Player = {
      id: plId,
      name: user.name,
      email: user.email,
      coachId: user.coachId || '',
      approved: true,
      UUID: plId,
      player_name: user.name,
      player_email: user.email,
      create_at: new Date().toISOString()
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'users', plId), user);
        await setDoc(doc(db, 'players', plId), newPlayer);
        setCurrentProfile(user); // Sign in immediately
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${plId}`);
      }
    } else {
      setUsers(prev => [...prev, user]);
      setPlayers(prev => [...prev, newPlayer]);
      setCurrentProfile(user); // Sign in immediately
    }
  };

  const handleAddAssociationDirect = async (newAssoc: Omit<Association, 'id' | 'approved'>) => {
    const id = `assoc-${Date.now()}`;
    const assoc: Association = {
      ...newAssoc,
      id,
      approved: true,
      UUID: id,
      association_name: newAssoc.name,
      association_email: newAssoc.contactEmail,
      create_at: new Date().toISOString()
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'associations', id), assoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `associations/${id}`);
      }
    }
    
    setAssociations(prev => {
      if (prev.some(a => a.id === id)) return prev;
      return [...prev, assoc];
    });
  };

  const handleAddClubDirect = async (newClub: Omit<Club, 'id' | 'approved'>) => {
    // Obtain a pre-generated secure unique identifier/UUID from Firebase
    const clubDocRef = doc(collection(db, 'clubs'));
    const id = useFirestore ? clubDocRef.id : `club-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const club: Club = {
      ...newClub,
      id,
      approved: true,
      UUID: id,
      club: newClub.name,
      club_name: newClub.name,
      club_email: newClub.contactEmail,
      association_id: newClub.associationId,
      create_at: timestamp
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'clubs', id), club);
        
        // Also update the associated Association row in the database
        const assocId = newClub.associationId;
        if (assocId) {
          const assocDocRef = doc(db, 'associations', assocId);
          const assocDocSnap = await getDoc(assocDocRef);
          if (assocDocSnap.exists()) {
            const assocData = assocDocSnap.data();
            await setDoc(assocDocRef, {
              ...assocData,
              club: newClub.name,
              club_name: newClub.name,
              club_email: newClub.contactEmail
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `clubs/${id}`);
      }
    }
    
    // Local memory updates
    setClubs(prev => {
      if (prev.some(c => c.id === id)) return prev;
      return [...prev, club];
    });

    const assocId = newClub.associationId;
    if (assocId) {
      setAssociations(prev => prev.map(a => a.id === assocId ? {
        ...a,
        club: newClub.name,
        club_name: newClub.name,
        club_email: newClub.contactEmail
      } : a));
    }
  };

  const handleAddTeamDirect = async (newTeam: Omit<Team, 'id' | 'approved'>) => {
    const id = `team-${Date.now()}`;
    const team: Team = {
      ...newTeam,
      id,
      approved: true
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'teams', id), team);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `teams/${id}`);
      }
    }
    
    setTeams(prev => {
      if (prev.some(t => t.id === id)) return prev;
      return [...prev, team];
    });
  };

  const handleAddCoachDirect = async (coachData: { name: string; email: string; teamId: string }) => {
    const coachId = `coach-${Date.now()}`;

    const matchingTeam = teams.find(t => t.id === coachData.teamId);
    const teamName = matchingTeam ? matchingTeam.name : coachData.teamId;

    const coach: Coach = {
      id: coachId,
      name: coachData.name,
      email: coachData.email,
      teamId: coachData.teamId,
      approved: true,
      UUID: coachId,
      coach: coachData.name,
      coach_email: coachData.email,
      team: teamName,
      create_at: new Date().toISOString()
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'coaches', coachId), coach);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `coaches/${coachId}`);
      }
    }
    
    setCoaches(prev => {
      if (prev.some(c => c.id === coachId)) return prev;
      return [...prev, coach];
    });
  };

  const handleCompleteCoachOnboarding = async (data: {
    teamName: string;
    clubId?: string;
    newClubName?: string;
    newClubEmail?: string;
    associationId?: string;
    newAssociationName?: string;
    newAssociationEmail?: string;
  }) => {
    if (!currentProfile) return;

    let targetAssocId = data.associationId;
    let targetClubId = data.clubId;
    const targetTeamId = `team-${Date.now()}`;

    const batch = useFirestore ? writeBatch(db) : null;

    // 1. Resolve Association
    let newAssoc: Association | null = null;
    if (!targetAssocId && data.newAssociationName) {
      targetAssocId = `assoc-${Date.now()}`;
      newAssoc = {
        id: targetAssocId,
        name: data.newAssociationName,
        contactEmail: data.newAssociationEmail || '',
        approved: true,
        UUID: targetAssocId,
        association_name: data.newAssociationName,
        association_email: data.newAssociationEmail || '',
        create_at: new Date().toISOString()
      };
      if (batch) {
        batch.set(doc(db, 'associations', targetAssocId), newAssoc);
      }
      setAssociations(prev => [...prev, newAssoc!]);
    }

    // 2. Resolve Club
    let newClub: Club | null = null;
    if (!targetClubId && data.newClubName && targetAssocId) {
      targetClubId = `club-${Date.now()}`;
      const timestamp = new Date().toISOString();
      newClub = {
        id: targetClubId,
        name: data.newClubName,
        contactEmail: data.newClubEmail || '',
        associationId: targetAssocId,
        approved: true,
        UUID: targetClubId,
        club_name: data.newClubName,
        club_email: data.newClubEmail || '',
        association_id: targetAssocId,
        create_at: timestamp
      };
      if (batch) {
        batch.set(doc(db, 'clubs', targetClubId), newClub);
      }
      setClubs(prev => [...prev, newClub!]);
    }

    // 3. Create Team
    let newTeam: Team | null = null;
    if (targetClubId) {
      newTeam = {
        id: targetTeamId,
        name: data.teamName,
        contactEmail: currentProfile.email,
        clubId: targetClubId,
        approved: true
      };
      if (batch) {
        batch.set(doc(db, 'teams', targetTeamId), newTeam);
      }
      setTeams(prev => [...prev, newTeam!]);
    }

    // 4. Update Coach entity
    const existingCoachId = currentProfile.coachId || `coach-${Date.now()}`;
    const updatedCoachEntity: Coach = {
      id: existingCoachId,
      name: currentProfile.name,
      email: currentProfile.email,
      teamId: targetTeamId,
      teamIds: [targetTeamId],
      approved: true,
      UUID: existingCoachId,
      coach: currentProfile.name,
      coach_email: currentProfile.email,
      team: data.teamName,
      create_at: new Date().toISOString()
    };

    if (batch) {
      batch.set(doc(db, 'coaches', existingCoachId), updatedCoachEntity);
    }
    setCoaches(prev => {
      const filtered = prev.filter(c => c.id !== existingCoachId);
      return [...filtered, updatedCoachEntity];
    });

    // 5. Update user profile
    const updatedProfile: UserProfile = {
      ...currentProfile,
      coachId: existingCoachId,
      teamId: targetTeamId,
      teamIds: [targetTeamId],
      clubId: targetClubId,
      associationId: targetAssocId
    };

    if (batch) {
      batch.set(doc(db, 'users', currentProfile.id), updatedProfile);
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `onboarding/${currentProfile.id}`);
      }
    }
    
    setUsers(prev => prev.map(u => u.id === currentProfile.id ? updatedProfile : u));

    setCurrentProfile(updatedProfile);
    // Keep cached if session says so
    if (localStorage.getItem('echelon_current_profile')) {
      localStorage.setItem('echelon_current_profile', JSON.stringify(updatedProfile));
    }
  };

  const handleSwitchActiveTeam = async (newTeamId: string) => {
    if (!currentProfile || currentProfile.role !== 'coach') return;
    
    const updatedProfile: UserProfile = {
      ...currentProfile,
      teamId: newTeamId
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'users', currentProfile.id), updatedProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentProfile.id}`);
      }
    } else {
      setUsers(prev => prev.map(u => u.id === currentProfile.id ? updatedProfile : u));
    }

    setCurrentProfile(updatedProfile);
    if (localStorage.getItem('echelon_current_profile')) {
      localStorage.setItem('echelon_current_profile', JSON.stringify(updatedProfile));
    }
  };

  const handlePlayerSignup = async (fields: { 
    name: string; 
    email: string; 
    password?: string;
    coachId?: string; 
    teamId?: string;
    staySignedIn: boolean; 
  }) => {
    let plId = `user-player-${Date.now()}`;
    
    if (useFirestore && fields.password) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, fields.email, fields.password);
        plId = userCred.user.uid;
      } catch (err: any) {
        console.error("Firebase Auth signup error:", err);
        if (err.code === 'auth/email-already-in-use') {
          throw new Error("This email is already registered on Echelon's security firewall.");
        }
        if (err.code === 'auth/operation-not-allowed') {
          throw new Error("Email/Password Authentication is not enabled in your Firebase Console. Please go to the Firebase Console -> Authentication -> Sign-in Method, enable the 'Email/Password' provider, and then try signing up again!");
        }
        throw err;
      }
    }

    let matchCoach = undefined;
    if (fields.coachId) {
      matchCoach = coaches.find(c => c.id === fields.coachId);
    }

    let resolvedTeamId = fields.teamId;
    let resolvedClubId = undefined;
    let resolvedAssocId = undefined;

    if (!resolvedTeamId && matchCoach) {
      resolvedTeamId = matchCoach.teamId;
    }

    if (resolvedTeamId) {
      const matchTeam = teams.find(t => t.id === resolvedTeamId);
      if (matchTeam) {
        resolvedClubId = matchTeam.clubId;
        const matchClub = clubs.find(c => c.id === matchTeam.clubId);
        if (matchClub) {
          resolvedAssocId = matchClub.associationId;
        }
      }
    }

    const newProfile: UserProfile = {
      id: plId,
      name: fields.name,
      email: fields.email,
      role: 'player',
      coachId: fields.coachId || undefined,
      teamId: resolvedTeamId,
      clubId: resolvedClubId,
      associationId: resolvedAssocId,
      approved: true
    };

    const newPlayer: Player = {
      id: plId,
      name: fields.name,
      email: fields.email,
      coachId: fields.coachId || '',
      approved: true,
      UUID: plId,
      player_name: fields.name,
      player_email: fields.email,
      create_at: new Date().toISOString()
    };

    if (useFirestore) {
      try {
        await setDoc(doc(db, 'users', plId), newProfile);
        await setDoc(doc(db, 'players', plId), newPlayer);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${plId}`);
      }
    } else {
      setUsers(prev => [...prev, newProfile]);
      setPlayers(prev => [...prev, newPlayer]);
    }

    setCurrentProfile(newProfile);
    if (fields.staySignedIn) {
      localStorage.setItem('echelon_current_profile', JSON.stringify(newProfile));
    }
  };

  const handleParentSignup = async (fields: { 
    parentName: string; 
    parentEmail: string; 
    parentPassword?: string;
    playerName: string;
    playerEmail: string; 
    coachId?: string; 
    teamId?: string;
    additionalChildren?: Array<{
      playerName: string;
      playerEmail: string;
      coachId?: string;
      teamId?: string;
    }>;
    staySignedIn: boolean; 
  }) => {
    let parentId = `user-parent-${Date.now()}`;
    let playerId = `user-player-${Date.now()}`;
    
    if (useFirestore && fields.parentPassword) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, fields.parentEmail, fields.parentPassword);
        parentId = userCred.user.uid;
      } catch (err: any) {
        console.error("Firebase Auth parent signup error:", err);
        if (err.code === 'auth/email-already-in-use') {
          throw new Error("This email is already registered on Echelon's security firewall.");
        }
        if (err.code === 'auth/operation-not-allowed') {
          throw new Error("Email/Password Authentication is not enabled in your Firebase Console. Please go to the Firebase Console -> Authentication -> Sign-in Method, enable the 'Email/Password' provider, and then try signing up again!");
        }
        throw err;
      }
    }

    const resolveTeamHierarchy = (coachId?: string, teamId?: string) => {
      let resolvedTeamId = teamId || undefined;
      if (!resolvedTeamId && coachId) {
        const mc = coaches.find(c => c.id === coachId);
        if (mc) {
          resolvedTeamId = mc.teamId;
        }
      }

      let resolvedClubId = undefined;
      let resolvedAssocId = undefined;

      if (resolvedTeamId) {
        const matchTeam = teams.find(t => t.id === resolvedTeamId);
        if (matchTeam) {
          resolvedClubId = matchTeam.clubId;
          const matchClub = clubs.find(c => c.id === matchTeam.clubId);
          if (matchClub) {
            resolvedAssocId = matchClub.associationId;
          }
        }
      }

      return { teamId: resolvedTeamId, clubId: resolvedClubId, associationId: resolvedAssocId };
    };

    const primaryHierarchy = resolveTeamHierarchy(fields.coachId, fields.teamId);

    const playerProfile: UserProfile = {
      id: playerId,
      name: fields.playerName,
      email: fields.playerEmail,
      role: 'player',
      coachId: fields.coachId || undefined,
      teamId: primaryHierarchy.teamId,
      clubId: primaryHierarchy.clubId,
      associationId: primaryHierarchy.associationId,
      approved: true,
      parentUserId: parentId
    };

    const newPlayer: Player = {
      id: playerId,
      name: fields.playerName,
      email: fields.playerEmail,
      coachId: fields.coachId || '',
      approved: true,
      UUID: playerId,
      player_name: fields.playerName,
      player_email: fields.playerEmail,
      create_at: new Date().toISOString()
    };

    // Prepare arrays of profiles & entities to save
    const playerProfilesToSave: UserProfile[] = [playerProfile];
    const playersToSave: Player[] = [newPlayer];
    const childPlayerIdsList: string[] = [playerId];

    if (fields.additionalChildren && fields.additionalChildren.length > 0) {
      fields.additionalChildren.forEach((ac, index) => {
        const acId = `user-player-${Date.now()}-add-${index}`;
        const acHierarchy = resolveTeamHierarchy(ac.coachId, ac.teamId);
        
        const acProfile: UserProfile = {
          id: acId,
          name: ac.playerName,
          email: ac.playerEmail,
          role: 'player',
          coachId: ac.coachId || undefined,
          teamId: acHierarchy.teamId,
          clubId: acHierarchy.clubId,
          associationId: acHierarchy.associationId,
          approved: true,
          parentUserId: parentId
        };

        const acPlayer: Player = {
          id: acId,
          name: ac.playerName,
          email: ac.playerEmail,
          coachId: ac.coachId || '',
          approved: true,
          UUID: acId,
          player_name: ac.playerName,
          player_email: ac.playerEmail,
          create_at: new Date().toISOString()
        };

        playerProfilesToSave.push(acProfile);
        playersToSave.push(acPlayer);
        childPlayerIdsList.push(acId);
      });
    }

    const parentProfile: UserProfile = {
      id: parentId,
      name: fields.parentName,
      email: fields.parentEmail,
      role: 'parent',
      coachId: fields.coachId || undefined,
      teamId: primaryHierarchy.teamId,
      clubId: primaryHierarchy.clubId,
      associationId: primaryHierarchy.associationId,
      approved: true,
      childPlayerId: playerId,
      childPlayerIds: childPlayerIdsList
    };

    if (useFirestore) {
      try {
        // Save additional children docs, primary doc, and parent doc
        for (const pProf of playerProfilesToSave) {
          await setDoc(doc(db, 'users', pProf.id), pProf);
        }
        for (const pl of playersToSave) {
          await setDoc(doc(db, 'players', pl.id), pl);
        }
        await setDoc(doc(db, 'users', parentId), parentProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${parentId}`);
      }
    } else {
      setUsers(prev => [...prev, ...playerProfilesToSave, parentProfile]);
      setPlayers(prev => [...prev, ...playersToSave]);
    }

    setCurrentProfile(parentProfile);
    if (fields.staySignedIn) {
      localStorage.setItem('echelon_current_profile', JSON.stringify(parentProfile));
    }
  };

  const handleParentUpdatePlayerMetrics = async (playerId: string, fields: Partial<DailyMetrics>) => {
    const today = '2026-05-21'; // Sim local timeline
    
    const records = allMetrics[playerId] || [];
    const matchIdx = records.findIndex(r => r.date === today);
    let targetRecord: DailyMetrics;

    if (matchIdx >= 0) {
      targetRecord = {
        ...records[matchIdx],
        ...fields
      };
    } else {
      const defaultRecord: DailyMetrics = {
        playerId: playerId,
        date: today,
        hydrationMls: 1500,
        hydrationGoalMls: 3000,
        sleepHours: 8,
        sleepQuality: 'Good',
        nutritionCalories: 1000,
        nutritionProteinG: 60,
        nutritionCarbsG: 120,
        nutritionFatG: 35
      };
      targetRecord = {
        ...defaultRecord,
        ...fields
      };
    }

    if (useFirestore) {
      const docId = `${playerId}_${today}`;
      try {
        await setDoc(doc(db, 'dailyMetrics', docId), targetRecord);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `dailyMetrics/${docId}`);
      }
    }

    setAllMetrics(prev => {
      const existing = prev[playerId] || [];
      const index = existing.findIndex(m => m.date === today);
      const updatedList = [...existing];
      if (index >= 0) {
        updatedList[index] = targetRecord;
      } else {
        updatedList.push(targetRecord);
      }
      return {
        ...prev,
        [playerId]: updatedList
      };
    });
  };

  const handleCoachSignup = async (fields: { 
    name: string; 
    email: string; 
    password?: string;
    teamId?: string; 
    teamIds?: string[];
    coachRole: 'head' | 'assistant';
    staySignedIn: boolean; 
  }) => {
    let clId = `user-coach-${Date.now()}`;
    
    if (useFirestore && fields.password) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, fields.email, fields.password);
        clId = userCred.user.uid;
      } catch (err: any) {
        console.error("Firebase Auth coach signup error:", err);
        if (err.code === 'auth/email-already-in-use') {
          throw new Error("This email has already been validated on our network.");
        }
        if (err.code === 'auth/operation-not-allowed') {
          throw new Error("Email/Password Authentication is not enabled in your Firebase Console. Please go to the Firebase Console -> Authentication -> Sign-in Method, enable the 'Email/Password' provider, and then try signing up again!");
        }
        throw err;
      }
    }

    const normalizedEmail = fields.email.toLowerCase().trim();
    const existingCoach = coaches.find(c => c.email.toLowerCase().trim() === normalizedEmail);

    const coachId = existingCoach ? existingCoach.id : `coach-${Date.now()}`;
    const coachTeamIdsSaved = fields.teamIds || (fields.teamId ? [fields.teamId] : []);
    const finalTeamIds = existingCoach 
      ? (existingCoach.teamIds || (existingCoach.teamId ? [existingCoach.teamId] : [])) 
      : coachTeamIdsSaved;

    const firstTeamId = finalTeamIds[0] || '';

    let resolvedClubId = undefined;
    let resolvedAssocId = undefined;

    if (firstTeamId) {
      const matchTeam = teams.find(t => t.id === firstTeamId);
      if (matchTeam) {
        resolvedClubId = matchTeam.clubId;
        const matchClub = clubs.find(c => c.id === matchTeam.clubId);
        if (matchClub) {
          resolvedAssocId = matchClub.associationId;
        }
      }
    }

    const newProfile: UserProfile = {
      id: clId,
      name: fields.name,
      email: fields.email,
      role: 'coach',
      coachId: coachId,
      teamId: firstTeamId || undefined,
      teamIds: finalTeamIds,
      coachRole: fields.coachRole,
      clubId: resolvedClubId,
      associationId: resolvedAssocId,
      approved: true
    };

    const matchingTeam = teams.find(t => t.id === firstTeamId);
    const teamName = matchingTeam ? matchingTeam.name : firstTeamId;

    const coachEntity: Coach = {
      id: coachId,
      name: fields.name,
      email: fields.email,
      teamId: firstTeamId,
      teamIds: finalTeamIds,
      coachRole: fields.coachRole,
      approved: true,
      UUID: coachId,
      coach: fields.name,
      coach_email: fields.email,
      team: teamName,
      create_at: new Date().toISOString()
    };

    if (useFirestore) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', clId), newProfile);
        batch.set(doc(db, 'coaches', coachId), coachEntity);
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${clId}`);
      }
    } else {
      setUsers(prev => [...prev, newProfile]);
      if (existingCoach) {
        setCoaches(prev => prev.map(c => c.id === coachId ? coachEntity : c));
      } else {
        setCoaches(prev => [...prev, coachEntity]);
      }
    }

    setCurrentProfile(newProfile);
    if (fields.staySignedIn) {
      localStorage.setItem('echelon_current_profile', JSON.stringify(newProfile));
    }
  };

  const handleAssociationSignup = async (fields: { 
    name: string; 
    email: string; 
    password?: string;
    associationName: string; 
    staySignedIn: boolean; 
  }) => {
    let userProfileId = `user-assoc-${Date.now()}`;
    
    if (useFirestore && fields.password) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, fields.email, fields.password);
        userProfileId = userCred.user.uid;
      } catch (err: any) {
        console.error("Firebase Auth assoc signup error:", err);
        if (err.code === 'auth/email-already-in-use') {
          throw new Error("Association email is already registered on Echelon.");
        }
        if (err.code === 'auth/operation-not-allowed') {
          throw new Error("Email/Password Authentication is not enabled in your Firebase Console. Please go to the Firebase Console -> Authentication -> Sign-in Method, enable the 'Email/Password' provider, and then try signing up again!");
        }
        throw err;
      }
    }

    const assocId = `assoc-${Date.now()}`;
    const newAssociation: Association = {
      id: assocId,
      name: fields.associationName,
      contactEmail: fields.email,
      approved: true,
      UUID: assocId,
      association_name: fields.associationName,
      association_email: fields.email,
      create_at: new Date().toISOString()
    };

    const newProfile: UserProfile = {
      id: userProfileId,
      name: fields.name,
      email: fields.email,
      role: 'association',
      associationId: assocId,
      approved: true
    };

    if (useFirestore) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', userProfileId), newProfile);
        batch.set(doc(db, 'associations', assocId), newAssociation);
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userProfileId}`);
      }
    } else {
      setUsers(prev => [...prev, newProfile]);
      setAssociations(prev => [...prev, newAssociation]);
    }

    setCurrentProfile(newProfile);
    if (fields.staySignedIn) {
      localStorage.setItem('echelon_current_profile', JSON.stringify(newProfile));
    }
  };

  const handleLoginCredentials = async (email: string, password: string, staySignedIn: boolean) => {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (useFirestore) {
      try {
        // 1. Authenticate with real Firebase Auth credentials
        const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const uid = userCred.user.uid;
        
        // 2. Load the authenticated UserProfile document
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const profile = userDocSnap.data() as UserProfile;
          setCurrentProfile(profile);
          if (staySignedIn) {
            localStorage.setItem('echelon_current_profile', JSON.stringify(profile));
          }
        } else {
          // If the Auth user exists but Firestore metadata document is missing,
          // automatically construct a safe matching profile document.
          const fallbackProfile: UserProfile = {
            id: uid,
            name: email.split('@')[0],
            email: normalizedEmail,
            role: 'player', // default safe role
            approved: true
          };
          await setDoc(userDocRef, fallbackProfile);
          setCurrentProfile(fallbackProfile);
          if (staySignedIn) {
            localStorage.setItem('echelon_current_profile', JSON.stringify(fallbackProfile));
          }
        }
      } catch (err: any) {
        console.warn("Auth credentials login failed. Running pre-registered account diagnostics:", err);
        
        // If account credentials do not exist in Firebase Auth but they are pre-registered on Echelon (virtual list)
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          const preRegistered = users.find(u => u.email.toLowerCase() === normalizedEmail);
          if (preRegistered) {
            // Activate account! Create their actual Firebase Auth credentials so they can login safely.
            try {
              const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
              const uid = userCred.user.uid;
              
              const activatedProfile: UserProfile = {
                ...preRegistered,
                id: uid // link with new valid Firebase Auth uid
              };
              
              await setDoc(doc(db, 'users', uid), activatedProfile);
              setCurrentProfile(activatedProfile);
              if (staySignedIn) {
                localStorage.setItem('echelon_current_profile', JSON.stringify(activatedProfile));
              }
              return;
            } catch (createErr: any) {
              console.error("Diagnostic account auto-activation failed:", createErr);
            }
          }
        }
        
        // Present correct readable feedback messages to the UI
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          throw new Error("Invalid password credentials. Please verify your entries.");
        } else if (err.code === 'auth/invalid-email') {
          throw new Error("Email format is invalid. Ensure name@domain.com syntax.");
        } else if (err.code === 'auth/user-disabled') {
          throw new Error("This registered profile has been disabled by security administrators.");
        }
        throw err;
      }
    } else {
      // Local offline emulation
      const match = users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (match) {
        setCurrentProfile(match);
        if (staySignedIn) {
          localStorage.setItem('echelon_current_profile', JSON.stringify(match));
        }
      } else {
        throw new Error(`Local offline mode: No account listed or matched for email "${email}"`);
      }
    }
  };

  const handleGoogleSignIn = async (
    role?: UserRole, 
    customName?: string, 
    payload?: { coachId?: string; teamId?: string; teamIds?: string[]; associationName?: string }
  ) => {
    if (!useFirestore) {
      throw new Error("Unable to run Google Auth on offline storage emulation mode.");
    }
    
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const uid = userCred.user.uid;
      const normalizedEmail = userCred.user.email?.toLowerCase().trim() || '';

      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const profile = userDocSnap.data() as UserProfile;
        setCurrentProfile(profile);
        localStorage.setItem('echelon_current_profile', JSON.stringify(profile));
      } else {
        // Formulate a new profile if they are registering or need fallback
        const finalRole = role || 'player';
        const finalName = customName || userCred.user.displayName || normalizedEmail.split('@')[0] || 'Athlete';

        let newProfile: UserProfile = {
          id: uid,
          name: finalName,
          email: normalizedEmail,
          role: finalRole,
          approved: true
        };

        if (finalRole === 'player') {
          let resolvedTeamId = payload?.teamId;
          let resolvedClubId = undefined;
          let resolvedAssocId = undefined;

          if (!resolvedTeamId && payload?.coachId) {
            const matchCoach = coaches.find(c => c.id === payload.coachId);
            if (matchCoach) {
              resolvedTeamId = matchCoach.teamId;
            }
          }

          if (resolvedTeamId) {
            const matchTeam = teams.find(t => t.id === resolvedTeamId);
            if (matchTeam) {
              resolvedClubId = matchTeam.clubId;
              const matchClub = clubs.find(c => c.id === matchTeam.clubId);
              if (matchClub) {
                resolvedAssocId = matchClub.associationId;
              }
            }
          }

          newProfile = {
            ...newProfile,
            coachId: payload?.coachId || undefined,
            teamId: resolvedTeamId,
            clubId: resolvedClubId,
            associationId: resolvedAssocId
          };

          await setDoc(userDocRef, newProfile);
        } else if (finalRole === 'coach') {
          const coachId = `coach-${Date.now()}`;
          let resolvedClubId = undefined;
          let resolvedAssocId = undefined;

          const coachTeamIdsSaved = payload?.teamIds || (payload?.teamId ? [payload.teamId] : []);
          const firstTeamId = coachTeamIdsSaved[0] || '';

          if (firstTeamId) {
            const matchTeam = teams.find(t => t.id === firstTeamId);
            if (matchTeam) {
              resolvedClubId = matchTeam.clubId;
              const matchClub = clubs.find(c => c.id === matchTeam.clubId);
              if (matchClub) {
                resolvedAssocId = matchClub.associationId;
              }
            }
          }

          newProfile = {
            ...newProfile,
            coachId: coachId,
            teamId: firstTeamId || undefined,
            teamIds: coachTeamIdsSaved,
            clubId: resolvedClubId,
            associationId: resolvedAssocId
          };

          const coachEntity: Coach = {
            id: coachId,
            name: finalName,
            email: normalizedEmail,
            teamId: firstTeamId,
            teamIds: coachTeamIdsSaved,
            approved: true,
            UUID: coachId,
            coach: finalName,
            coach_email: normalizedEmail,
            team: firstTeamId ? (teams.find(t => t.id === firstTeamId)?.name || firstTeamId) : '',
            create_at: new Date().toISOString()
          };

          const batch = writeBatch(db);
          batch.set(userDocRef, newProfile);
          batch.set(doc(db, 'coaches', coachId), coachEntity);
          await batch.commit();
        } else if (finalRole === 'association') {
          const assocId = `assoc-${Date.now()}`;
          const newAssociation: Association = {
            id: assocId,
            name: payload?.associationName || 'Athletic Association',
            contactEmail: normalizedEmail,
            approved: true,
            UUID: assocId,
            association_name: payload?.associationName || 'Athletic Association',
            association_email: normalizedEmail,
            create_at: new Date().toISOString()
          };

          newProfile = {
            ...newProfile,
            associationId: assocId
          };

          const batch = writeBatch(db);
          batch.set(userDocRef, newProfile);
          batch.set(doc(db, 'associations', assocId), newAssociation);
          await batch.commit();
        } else {
          await setDoc(userDocRef, newProfile);
        }

        setCurrentProfile(newProfile);
        localStorage.setItem('echelon_current_profile', JSON.stringify(newProfile));
      }
    } catch (err: any) {
      console.error("Firebase Google Auth exception:", err);
      if (err.code === 'auth/popup-blocked') {
        throw new Error("Login helper popup was blocked. Please permit popups for AI Studio and try again!");
      }
      throw err;
    }
  };

  // Helper selectors
  const activeMetricsList = currentProfile ? (allMetrics[currentProfile.id] || []) : [];
  const currentDailyMetric: DailyMetrics = activeMetricsList.find(r => r.date === '2026-05-21') || {
    playerId: currentProfile?.id || '',
    date: '2026-05-21',
    hydrationMls: 1500,
    hydrationGoalMls: 3000,
    sleepHours: 8,
    sleepQuality: 'Good',
    nutritionCalories: 1000,
    nutritionProteinG: 60,
    nutritionCarbsG: 120,
    nutritionFatG: 35
  };

  const isCoachingEchelon = currentProfile ? ['admin', 'association', 'club', 'team', 'coach'].includes(currentProfile.role) : false;

  if (!currentProfile) {
    return (
      <AuthScreen
        users={users}
        coaches={coaches}
        teams={teams}
        useFirestore={useFirestore}
        onToggleFirestore={(val: boolean) => {
          setUseFirestore(val);
          localStorage.setItem('echelon_use_firestore', String(val));
        }}
        onLogin={(profile, stay) => {
          setCurrentProfile(profile);
          if (stay) {
            localStorage.setItem('echelon_current_profile', JSON.stringify(profile));
          }
        }}
        onLoginCredentials={handleLoginCredentials}
        onGoogleSignIn={handleGoogleSignIn}
        onPlayerSignup={handlePlayerSignup}
        onCoachSignup={handleCoachSignup}
        onAssociationSignup={handleAssociationSignup}
        onParentSignup={handleParentSignup}
      />
    );
  }

  if (currentProfile.role === 'coach' && !currentProfile.teamId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center">
        <CoachOnboarding
          associations={associations}
          clubs={clubs}
          onCompleteOnboarding={handleCompleteCoachOnboarding}
          onLogout={() => {
            localStorage.removeItem('echelon_current_profile');
            setCurrentProfile(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Brand Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img 
              src="https://i.ibb.co/gb9535YK/Untitled-design-6.png" 
              alt="Echelon Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-xl shadow-lg shadow-emerald-500/10"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col text-left">
              <h1 className="text-sm sm:text-base md:text-lg font-bold font-sans tracking-tight text-slate-100">
                Player Development Portal
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
            {currentProfile.role === 'association' ? (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  id="nav-dashboard"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-800 text-indigo-400 font-bold border border-slate-700'
                      : 'text-slate-405 hover:bg-slate-850'
                  }`}
                >
                  Association Dashboard
                </button>

                <button
                  onClick={() => setActiveTab('leaderboard')}
                  id="nav-leaderboard"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition ${
                    activeTab === 'leaderboard'
                      ? 'bg-slate-800 text-[#00bbff] font-bold border border-slate-700'
                      : 'text-slate-405 hover:bg-slate-850'
                  }`}
                >
                  Leaderboards
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  id="nav-dashboard"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                      : 'text-slate-405 hover:bg-slate-850'
                  }`}
                >
                  Dashboard
                </button>

                {(currentProfile.role === 'player' || currentProfile.role === 'coach') && (
                  <button
                    onClick={() => setActiveTab('classroom')}
                    id="nav-classroom"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition ${
                      activeTab === 'classroom'
                        ? 'bg-slate-800 text-[#00bbff] font-bold border border-slate-700'
                        : 'text-slate-405 hover:bg-slate-855'
                    }`}
                  >
                    Classroom
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('leaderboard')}
                  id="nav-leaderboard"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition ${
                    activeTab === 'leaderboard'
                      ? 'bg-slate-800 text-[#00bbff] font-bold border border-slate-700'
                      : 'text-slate-405 hover:bg-slate-850'
                  }`}
                >
                  Leaderboard
                </button>

                {(currentProfile.role === 'player' || currentProfile.role === 'coach') && (
                  <button
                    onClick={() => setActiveTab('formation')}
                    id="nav-formation"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition ${
                      activeTab === 'formation'
                        ? 'bg-slate-800 text-[#00bbff] font-bold border border-slate-700'
                        : 'text-slate-405 hover:bg-slate-850'
                    }`}
                  >
                    Formation
                  </button>
                )}
              </>
            )}

            {currentProfile.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                id="nav-admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition flex items-center gap-1 ${
                  activeTab === 'admin'
                    ? 'bg-slate-800 text-rose-500 font-bold border border-slate-700'
                    : 'text-slate-405 hover:bg-slate-850'
                }`}
              >
                Verification approvals
                {requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            )}

            <button
              onClick={async () => {
                if (useFirestore) {
                  try {
                    await signOut(auth);
                  } catch (err) {
                    console.error("Firebase Auth signOut failed:", err);
                  }
                }
                localStorage.removeItem('echelon_current_profile');
                setCurrentProfile(null);
              }}
              id="nav-logout"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition text-slate-400 hover:bg-slate-850 hover:text-rose-400 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-400 hover:text-slate-200 transition focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-2">
            {currentProfile.role === 'association' ? (
              <>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-850 text-indigo-400 border border-slate-750'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  Association Dashboard
                </button>

                <button
                  onClick={() => {
                    setActiveTab('leaderboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'leaderboard'
                      ? 'bg-slate-850 text-[#00bbff] border border-slate-750'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  Leaderboards
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-850 text-emerald-400 border border-slate-750'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  Dashboard
                </button>

                {(currentProfile.role === 'player' || currentProfile.role === 'coach') && (
                  <button
                    onClick={() => {
                      setActiveTab('classroom');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      activeTab === 'classroom'
                        ? 'bg-slate-850 text-[#00bbff] border border-slate-750'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    Classroom
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveTab('leaderboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'leaderboard'
                      ? 'bg-slate-850 text-[#00bbff] border border-slate-750'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  Leaderboard
                </button>

                {(currentProfile.role === 'player' || currentProfile.role === 'coach') && (
                  <button
                    onClick={() => {
                      setActiveTab('formation');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      activeTab === 'formation'
                        ? 'bg-slate-850 text-[#00bbff] border border-slate-750'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    Formation
                  </button>
                )}
              </>
            )}

            {currentProfile.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                  activeTab === 'admin'
                    ? 'bg-slate-850 text-rose-500 border border-slate-750'
                    : 'text-slate-404 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span className="flex items-center gap-1.5">Verification approvals</span>
                {requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            )}

            <button
              onClick={async () => {
                setIsMobileMenuOpen(false);
                if (useFirestore) {
                  try {
                    await signOut(auth);
                  } catch (err) {
                    console.error("Firebase Auth signOut failed:", err);
                  }
                }
                localStorage.removeItem('echelon_current_profile');
                setCurrentProfile(null);
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-rose-450 hover:bg-slate-850 hover:text-rose-400 transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        )}
      </header>

      {/* Switching context banner indicator */}
      <div className="bg-slate-950 border-b border-slate-900 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs font-mono w-full">
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Logged profile: <b className="text-slate-200">{currentProfile.name}</b></span>
            <span className="text-slate-700">|</span>
            <span>Role: <b className="text-slate-200 uppercase">{currentProfile.role}</b></span>
            {currentProfile.role === 'coach' && currentProfile.teamIds && currentProfile.teamIds.length > 0 && (
              <>
                <span className="text-slate-700">|</span>
                <span>Active Squad: <b className="text-slate-200 font-sans">{teams.find(t => t.id === currentProfile.teamId)?.name || currentProfile.teamId || 'None'}</b></span>
              </>
            )}
          </div>
          {currentProfile.role === 'coach' && currentProfile.teamIds && currentProfile.teamIds.length >= 2 && (
            <div className="flex items-center gap-2 mt-1 md:mt-0">
              <span className="text-slate-400 uppercase tracking-widest text-[9px] font-mono">Focus Team:</span>
              <select
                value={currentProfile.teamId || ''}
                onChange={(e) => handleSwitchActiveTeam(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1 font-sans outline-none focus:border-indigo-500 transition"
              >
                {currentProfile.teamIds.map(tid => {
                  const matchingT = teams.find(t => t.id === tid);
                  return (
                    <option key={tid} value={tid}>
                      {matchingT ? matchingT.name : tid}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-8 space-y-6 sm:space-y-8">
        
        {/* Tab view controllers */}
        {activeTab === 'dashboard' && (
          currentProfile.role === 'association' ? (
            <AssociationDashboard
              currentProfile={currentProfile}
              clubs={clubs}
              teams={teams}
              coaches={coaches}
              players={users}
              onAddClub={handleAddClubDirect}
              onAddTeam={handleAddTeamDirect}
              onAddCoach={handleAddCoachDirect}
            />
          ) : currentProfile.role === 'parent' ? (
            <ParentDashboard
              parentProfile={currentProfile}
              allPlayers={users}
              allRunLogs={runLogs}
              allMetrics={allMetrics}
              allCompletions={completions}
              modules={modules}
              assignments={assignments}
              coaches={coaches}
              teams={teams}
              formations={formations}
              onUpdatePlayerMetrics={handleParentUpdatePlayerMetrics}
            />
          ) : isCoachingEchelon ? (
            <CoachesDashboard
              currentProfile={currentProfile}
              players={users.filter(u => u.role === 'player')}
              runLogs={runLogs}
              metrics={allMetrics}
              assignments={assignments}
              modules={modules}
              teams={teams}
              onChangeActiveTeam={handleSwitchActiveTeam}
              onAddAssignment={handleAddAssignment}
              onUpdatePlayerGoal={handleUpdatePlayerGoal}
            />
          ) : (
            <PlayerDashboard
              playerProfile={currentProfile}
              runLogs={runLogs.filter(r => r.playerId === currentProfile.id)}
              metrics={currentDailyMetric}
              assignments={assignments.filter(a => a.teamId === currentProfile.teamId || a.teamId === '' || a.playerId === currentProfile.id)}
              modules={modules}
              completions={completions.filter(c => c.playerId === currentProfile.id)}
              onSaveRun={handleSaveRun}
              onUpdateDailyMetrics={handleUpdateDailyMetrics}
              onSelectTab={(tab, formationId) => {
                if (tab === 'classroom') {
                  setActiveTab('classroom');
                } else if (tab === 'formation') {
                  if (formationId) {
                    setSelectedFormationId(formationId);
                  }
                  setActiveTab('formation');
                }
              }}
              allPlayers={users}
              allRunLogs={runLogs}
              allMetrics={allMetrics}
              allCompletions={completions}
              formations={formations}
            />
          )
        )}

        {activeTab === 'classroom' && (
          <ClassroomTab
            modules={modules}
            completions={completions.filter(c => c.playerId === currentProfile.id)}
            onCompleteModule={handleCompleteModule}
            currentProfile={currentProfile}
            onAddAssignment={handleAddAssignment}
            assignments={assignments.filter(a => a.teamId === currentProfile.teamId || a.teamId === '' || a.playerId === currentProfile.id)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            currentProfile={currentProfile}
            players={users}
            runLogs={runLogs}
            allMetrics={allMetrics}
            completions={completions}
          />
        )}

        {activeTab === 'admin' && currentProfile.role === 'admin' && (
          <AdminDashboard
            associations={associations}
            clubs={clubs}
            teams={teams}
            coaches={coaches}
            players={users}
            onAddAssociation={handleAddAssociationDirect}
            onAddClub={handleAddClubDirect}
            onAddTeam={handleAddTeamDirect}
          />
        )}

        {activeTab === 'formation' && (
          <FormationsTab
            currentProfile={currentProfile}
            players={users}
            formations={formations}
            onSaveFormation={handleSaveFormation}
            onDeleteFormation={handleDeleteFormation}
            initialSelectedFormationId={selectedFormationId}
          />
        )}

      </main>

      <footer className="bg-slate-900 border-t border-slate-800/80 py-6 text-center text-xs font-mono text-slate-500 mt-12">
        <p>© 2026 PDP Sports Network. All rights reserved.</p>
        <p>Secured platform · Role-based access · Athlete data protected.</p>
      </footer>

    </div>
  );
}
