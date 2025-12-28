import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash?: string;
    googleId?: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    preferences: {
        theme: string;
        autoSave: boolean;
        autoSaveInterval: number;
        defaultView: 'grid' | 'list';
        defaultFolder?: string | null;
    };
    studyStreak: number;
    tokenVersion: number;
    twoFactorEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String }, // Made optional for Google Auth users
    googleId: { type: String, unique: true, sparse: true }, // Added for Google Auth
    name: { type: String, required: true },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    preferences: {
        theme: { type: String, default: 'system' },
        autoSave: { type: Boolean, default: true },
        autoSaveInterval: { type: Number, default: 30 }, // seconds
        defaultView: { type: String, enum: ['grid', 'list'], default: 'grid' },
        defaultFolder: { type: String, default: null },
    },
    studyStreak: { type: Number, default: 0 },
    tokenVersion: { type: Number, default: 0 },
    twoFactorEnabled: { type: Boolean, default: false },
}, {
    timestamps: true,
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
