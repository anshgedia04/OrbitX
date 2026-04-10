import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash?: string): Promise<boolean> {
    if (!hash) return false;
    return await bcrypt.compare(password, hash);
}

export function generateToken(payload: object): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function generateRefreshToken(payload: object): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export function verifyRefreshToken(token: string): any {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
}

import nodemailer from 'nodemailer';

// ... (previous functions: hashPassword, comparePassword, generateToken, generateRefreshToken, verifyToken, verifyRefreshToken)

// Email sender using nodemailer
export async function sendEmail(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL,
            pass: process.env.APP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `OrbitX Notes <${process.env.MAIL}>`,
        to,
        subject,
        html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] To: ${to}, Subject: ${subject}`);
    } catch (error) {
        console.error('[Email Error]:', error);
        throw new Error('Failed to send email');
    }
}
