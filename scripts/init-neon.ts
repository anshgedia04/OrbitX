import 'dotenv/config';
import { initNeonDB } from '../lib/neon';

async function main() {
  console.log('Initializing Neon Database...');
  try {
    await initNeonDB();
    console.log('Successfully initialized messages table and indexes.');
  } catch (err) {
    console.error('Error initializing Neon DB:', err);
    process.exit(1);
  }
}

main();
