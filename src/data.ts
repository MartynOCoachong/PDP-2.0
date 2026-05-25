/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Association, Club, Team, Coach, EducationalModule, OrgProfileRequest, UserProfile, Assignment } from './types';

export const INITIAL_ASSOCIATIONS: Association[] = [];

export const INITIAL_CLUBS: Club[] = [];

export const INITIAL_TEAMS: Team[] = [];

export const INITIAL_COACHES: Coach[] = [];

export const CLIENT_DEMO_USERS: UserProfile[] = [];

export const INITIAL_MODULES: EducationalModule[] = [
  {
    id: 'mod-1',
    title: 'Fueling Your Engine: High-Performance Nutrition & Cooking',
    type: 'document',
    category: 'Nutrition & Cooking',
    durationMinutes: 15,
    content: `
# Fueling Your Engine: Athlete Nutrition Handbook

To perform at your maximum potential, your nutrition must be deliberate. Carbohydrates are your glycogen fuel, protein rebuilds muscle fibers, and healthy fats regulate clean cellular repair.

### 🍱 Ideal Training Day Breakfast (Power Oatmeal)
- **Base**: 1 cup rolled oats cooked in almond or regular milk.
- **Protein Boost**: Stir in 1 scoop of clean whey or plant-based protein isolate, or 3 egg whites cooked scrambled on the side.
- **Micronutrients & Power**: Handful of blueberries (antioxidants) and 1 tablespoon of chia seeds (anti-inflammatory omega-3 fats).
- **Sweetener**: Drizzle of natural honey or maple syrup.

### 🥑 Pre-Game Lunch (Chicken, Quinoa, & Roasted Greens)
- **1/3 Plate Carbs**: Golden quinoa or brown rice (sustained energy delivery).
- **1/3 Plate Lean Protein**: Grilled lemon-herb chicken breast or baked salmon fillet.
- **1/3 Plate Digestible Micronutrients**: Steamed asparagus or sautéed baby spinach (low bloating, high nitrate oxygen utilization).

### 🥦 Recover & Restore Dinner (The Post-Load Plate)
- **Structure**: Lean sirloin steak or whole tofu cubes, sweet potato mash with cinnamon, and steam-roasted broccoli heads.
- **Hydration Sync**: Drink at least 350-500ml of clean water with mineral electrolytes immediately following this meal.
    `
  },
  {
    id: 'mod-2',
    title: 'Speed & Mobility: Advanced Plyometrics Routine',
    type: 'youtube',
    category: 'Strength & Conditioning',
    durationMinutes: 12,
    content: 'https://www.youtube.com/embed/3B58mHeJuE8' // Real training drill reference
  },
  {
    id: 'mod-3',
    title: 'The Mental Sandbox: Pre-Game Focus and Stress Management',
    type: 'pdf',
    category: 'Mental Health',
    durationMinutes: 20,
    content: `
# THE MENTAL SANDBOX: STRESS FLOW FOR ELITE ATHLETES

Performance anxiety is a physiological response that can be channeled into hyper-focus. Understanding emotional flow optimizes cortisol levels before kick-off.

### 🎯 1. Tactical Visualization Loops (TVLs)
- Close your eyes 20 minutes before warmup.
- Play a 3-minute mental movie of your perfect pass, save, run, or shot.
- Visualize responding of errors: if a ball slips, see yourself immediately regaining stance and intercepting the transition.

### 💨 2. Controlled Diaphragmatic Breath Cycles (4-7-8 Technique)
1. **Inhale** slowly through your nose for **4 seconds**, swelling your lower core.
2. **Hold** that oxygen in your lungs for **7 seconds**, calming cardiac rhythm.
3. **Exhale** completely through parted lips for **8 seconds** with a soft 'whoosh' sound.
4. *Do 6 cycles to reset the parasympathetic nervous system and suppress adrenaline jitters.*

### 🛡️ 3. Cognitive Reframing
- Say: "I am feeling high adrenaline because my body is equipping my muscles with extra blood flow to dominate," rather than "I am nervous because I might fail."
    `
  },
  {
    id: 'mod-4',
    title: 'Yoga for Hip Flextion & Lower Lumbar Balance',
    type: 'youtube',
    category: 'Stretching & Yoga',
    durationMinutes: 18,
    content: 'https://www.youtube.com/embed/Nnd5Slo02us' // Recovery yoga reference
  },
  {
    id: 'mod-5',
    title: 'Hamstring & Calf Injury Avoidance: Eccentric Protocols',
    type: 'document',
    category: 'Injury Prevention',
    durationMinutes: 10,
    content: `
# Hamstring Injury Prevention: The Nordic Protocol

Stellar functional symmetry and eccentric capacity reduces the risk of muscle pulls by over 60%. Here's the core protocol to prevent hamstring loads:

### 🦵 The Nordic Hamstring Curl (NHC)
- **Setup**: Kneel on a soft padded surface. Have a team member or secure bar anchor your ankles firmly to the floor.
- **Execution**: Keep a stiff modern straight line from your ears, hips, to knees. Slowly lower your chest towards the turf strictly using hamstring deceleration.
- **Catch**: Keep hands ready to cushion yourself when gravity takes over. Push back up to starting space dynamically.
- **Progression**:
  - Week 1: 2 sets of 5 reps (Focus entirely on the 5-second lowering phase).
  - Week 2: 3 sets of 6 reps.
  - Week 3: 3 sets of 8 reps.

### 🦶 Active Ankle & Arch Stability Checks
- Stand bare-foot on one leg. Lift your opposite toes up.
- Maintain single limb balance for 60 seconds. Repeat twice per ankle daily to construct elastic stability rings.
    `
  },
  {
    id: 'quiz-hydration',
    title: 'Supercharged Performance Hydration Quiz',
    type: 'quiz',
    category: 'Nutrition & Cooking',
    durationMinutes: 5,
    content: 'Test your understanding of hydration biochemistry and liquid timings during match conditions.',
    quizQuestions: [
      {
        id: 'q1',
        question: 'What is the recommended amount of fluid to consume 2 to 3 hours before an intense practice session?',
        options: [
          '50-100 ml (a tiny sip)',
          '500-600 ml (about one standard sports bottle)',
          '2 Liters (maximum water load)',
          'None, drinking fluids close to performance induces gastric cramps'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 'q2',
        question: 'Which of these is the earliest sign of dehydration during training?',
        options: [
          'Extreme severe cramps',
          'Feeling faint and dizzy',
          'Loss of coordination and cognitive delay',
          'A dark amber urine color or dry mouth'
        ],
        correctAnswerIndex: 3
      },
      {
        id: 'q3',
        question: 'Why are electrolytes (specifically sodium) included in premium performance sports drinks?',
        options: [
          'Just to improve the sweet taste profile',
          'To replace salt lost in sweat and maintain cellular fluid pressure',
          'To supply fast-twitch explosive fats',
          'To suppress appetite'
        ],
        correctAnswerIndex: 1
      }
    ]
  },
  {
    id: 'quiz-injury',
    title: 'Injury Recovery Timeline Protocol Quiz',
    type: 'quiz',
    category: 'Injury Prevention',
    durationMinutes: 5,
    content: 'Understand appropriate active load versus complete immobilization parameters in athlete recovery.',
    quizQuestions: [
      {
        id: 'q4',
        question: 'What modern protocol replaced the traditional R.I.C.E. methodology for managing acute soft tissue injuries?',
        options: [
          'P.E.A.C.E. & L.O.V.E. (Protect, Elevate, Avoid anti-inflammatory, Compress, Educate & Load, Optimism, Vascularisation, Exercise)',
          'S.T.O.P. & L.O.O.K. (Stop, Transition, Observe, Passive rest)',
          'H.E.A.T. (Heat-packs, Exertion, Action, Therapy)',
          'N.O.R.T.H. (Nordic resistance, Oligo-elements, Recovery, Timber, Handholds)'
        ],
        correctAnswerIndex: 0
      },
      {
        id: 'q5',
        question: 'Should you take Ibuprofen or similar NSAID anti-inflammatory pills in the first 48 hours of a soft tissue strain?',
        options: [
          'Yes, take as much as possible to stop any swelling',
          'No, initial inflammation is a critical biological phase that triggers healing; suppressing it slows long term tissue strength',
          'Only before running logs but never before sleeping'
        ],
        correctAnswerIndex: 1
      }
    ]
  }
];

export const INITIAL_REQUESTS: OrgProfileRequest[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
