import { supabase } from '../lib/supabase';

const professions = [
  {
    name: 'Office Worker',
    category: 'Desk Work',
    health_risks: ['lower back pain', 'eye strain', 'carpal tunnel']
  },
  {
    name: 'Nurse',
    category: 'Healthcare',
    health_risks: ['varicose veins', 'back strain', 'foot pain']
  },
  {
    name: 'Chef',
    category: 'Food Service',
    health_risks: ['foot pain', 'back strain', 'burns']
  }
];

const exercises = [
  {
    name: 'Desk Stretches',
    description: 'Simple stretches you can do at your desk',
    duration: '5 minutes',
    difficulty_level: 'beginner',
    target_areas: ['back', 'neck', 'shoulders'],
    is_micro_workout: true
  },
  {
    name: 'Standing Calf Raises',
    description: 'Raise heels off ground while standing',
    duration: '2 minutes',
    difficulty_level: 'beginner',
    target_areas: ['calves', 'ankles'],
    is_micro_workout: true
  }
];

export async function seedDatabase() {
  // Insert professions
  const { error: professionsError } = await supabase
    .from('professions')
    .insert(professions);

  if (professionsError) {
    console.error('Error seeding professions:', professionsError);
    return;
  }

  // Insert exercises
  const { error: exercisesError } = await supabase
    .from('exercises')
    .insert(exercises);

  if (exercisesError) {
    console.error('Error seeding exercises:', exercisesError);
    return;
  }

  console.log('Database seeded successfully!');
} 