/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'association' | 'club' | 'team' | 'coach' | 'player' | 'parent';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  associationId?: string; // Linked association
  clubId?: string;        // Linked club
  teamId?: string;        // Linked team
  teamIds?: string[];      // Multiple teams
  coachId?: string;       // Linked coach ID (if coach is registered)
  manualCoachName?: string; // If player inputs coach that is not on the app
  manualCoachEmail?: string; // email of manual coach
  approved: boolean;      // Admins approve new associations, clubs, teams, coaches profiles
  childPlayerId?: string; // If parent, links to their child player's user ID
  childPlayerIds?: string[]; // If parent, links to multiple children user IDs
  parentUserId?: string;  // If player, links to their parent's user ID
}

export interface Association {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone?: string;
  approved: boolean;
  
  // Custom schema fields required by user/associated with the sync model
  UUID?: string;
  association_name?: string;
  association_email?: string;
  club?: string;
  club_name?: string;
  club_email?: string;
  create_at?: string;
}

export interface Club {
  id: string;
  name: string;
  associationId: string; // Belongs to association
  contactEmail: string;
  approved: boolean;

  // Custom schema fields required by user/associated with the sync model
  UUID?: string;
  club?: string;
  club_name?: string;
  club_email?: string;
  association_id?: string;
  create_at?: string;
}

export interface Team {
  id: string;
  name: string;
  clubId: string;        // Belongs to club
  contactEmail: string;
  approved: boolean;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  teamId: string;       // Coach is linked to team
  teamIds?: string[];    // Coach can be linked to multiple teams
  approved: boolean;

  // Custom schema fields required by user/associated with the sync model
  UUID?: string;
  coach?: string;
  coach_email?: string;
  team?: string;
  create_at?: string;
}

export interface Player {
  id: string;
  name: string;
  email: string;
  coachId: string;
  approved: boolean;

  // Custom schema fields required by user/associated with the sync model
  UUID?: string;
  player_name?: string;
  player_email?: string;
  create_at?: string;
}

export interface GPSTrackPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number; // m/s
}

export interface RunLog {
  id: string;
  playerId: string;
  date: string; // ISO string or YYYY-MM-DD
  durationSeconds: number;
  distanceKm: number;
  avgSpeedKmH: number;
  maxSpeedKmH: number;
  minSpeedKmH: number;
  gpsTrackPoints: GPSTrackPoint[];
  fromAssignmentId?: string; // If this run completed an assignment
}

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  playerId: string;
  hydrationMls: number;
  hydrationGoalMls: number;
  sleepHours: number;
  sleepQuality: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  nutritionCalories: number;
  nutritionProteinG: number;
  nutritionCarbsG: number;
  nutritionFatG: number;
  runDistanceGoalKm?: number; // Customized target run distance set by coach
}

export type ModuleType = 'youtube' | 'document' | 'pdf' | 'quiz';
export type ClassroomCategory = 'Nutrition & Cooking' | 'Strength & Conditioning' | 'Mental Health' | 'Stretching & Yoga' | 'Injury Prevention';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface EducationalModule {
  id: string;
  title: string;
  type: ModuleType;
  category: ClassroomCategory;
  content: string; // URL, YouTube embed ID, or Markdown article text
  durationMinutes: number;
  quizQuestions?: QuizQuestion[];
}

export interface ModuleCompletion {
  id: string;
  playerId: string;
  moduleId: string;
  dateCompleted: string;
  quizScore?: {
    score: number;
    total: number;
  };
}

export interface Assignment {
  id: string;
  coachId: string;
  teamId: string;
  type: 'run' | 'module';
  title: string;
  dueDate: string; // YYYY-MM-DD
  // For 'run'
  runDistanceKm?: number;
  // For 'module'
  moduleId?: string;
  completedByPlayerIds: string[]; // List of players who have finished this
  playerId?: string; // Optional: for player-only self-scheduled or assigned tasks
}

export interface OrgProfileRequest {
  id: string;
  name: string;
  type: 'association' | 'club' | 'team' | 'coach';
  contactEmail: string;
  parentOrgId?: string; // Linked parent associationId for clubs, clubId for teams, teamId for coaches
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FormationAssignment {
  positionId: string; // e.g. "GK", "LD"
  positionName: string; // e.g. "Goalkeeper", "Left Defender"
  playerId: string | null; // ID of the player assigned, or null
  x: number; // 0 to 100 percentage layout
  y: number; // 0 to 100 percentage layout
}

export interface TeamFormation {
  id: string;
  coachId: string;
  teamId: string;
  name: string; // e.g. "Weekly Match lineup"
  system: '5v5' | '6v6' | '7v7' | '9v9' | '11v11';
  lineupName: string; // e.g. "4-4-2", "2-3-1"
  assignments: FormationAssignment[];
  notes?: string;
  updatedAt: string; // ISO string 
}
