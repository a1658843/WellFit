import { seedDatabase } from '../db/seed-data';

seedDatabase()
  .then(() => console.log('Seeding complete'))
  .catch(console.error); 