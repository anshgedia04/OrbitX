import 'dotenv/config';
import dbConnect from './lib/mongodb';
import User from './models/User';
import { hashPassword, comparePassword, generateToken, verifyToken } from './lib/auth';

async function testAuth() {
    console.log('Testing authentication...');
    try {
        await dbConnect();

        // Test Hashing
        const password = 'password123';
        const hash = await hashPassword(password);
        console.log('Password hashed:', hash);

        const isMatch = await comparePassword(password, hash);
        console.log('Password match:', isMatch);

        const isNotMatch = await comparePassword('wrongpassword', hash);
        console.log('Password mismatch check:', !isNotMatch);

        // Test Token
        const payload = { userId: '123', email: 'test@example.com' };
        const token = generateToken(payload);
        console.log('Token generated:', token);

        const decoded = verifyToken(token);
        console.log('Token verified:', decoded.email === payload.email);

        console.log('Auth checks passed!');
        process.exit(0);
    } catch (error) {
        console.error('Auth test failed:', error);
        process.exit(1);
    }
}

testAuth();
