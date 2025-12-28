import 'dotenv/config';
import dbConnect from './lib/mongodb';
import User from './models/User';
import Folder from './models/Folder';
import Note from './models/Note';
import Tag from './models/Tag';

async function testConnection() {
    console.log('Testing database connection...');
    try {
        await dbConnect();
        console.log('Database connected successfully!');

        // Basic model check (not saving to DB to avoid pollution, just checking instantiation)
        const user = new User({ email: 'test@example.com', passwordHash: 'hash', name: 'Test User' });
        console.log('User model instantiated:', user.name);

        const folder = new Folder({ name: 'Test Folder', owner: user._id, path: '/test' });
        console.log('Folder model instantiated:', folder.name);

        const note = new Note({ title: 'Test Note', owner: user._id });
        console.log('Note model instantiated:', note.title);

        const tag = new Tag({ name: 'Test Tag', owner: user._id });
        console.log('Tag model instantiated:', tag.name);

        console.log('All checks passed!');
        process.exit(0);
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

testConnection();
