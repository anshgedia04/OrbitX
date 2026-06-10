import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserName extends Document {
    username: string;
    email: string;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const UserNameSchema: Schema = new Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true, // Stores the lowercase version for case-insensitive unique checks
        index: true
    },
    email: { 
        type: String, 
        required: true 
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true // A user can only have one username record
    }
}, {
    timestamps: true,
});

const UserName: Model<IUserName> = mongoose.models.UserName || mongoose.model<IUserName>('UserName', UserNameSchema);

export default UserName;
