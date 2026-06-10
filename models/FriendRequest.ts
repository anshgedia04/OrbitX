import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFriendRequest extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const FriendRequestSchema: Schema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
}, {
    timestamps: true
});

// Advanced DSA / Database management: Prevent duplicate friend requests between two users
FriendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Prevent mongoose from using cached schema in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.FriendRequest;
}

const FriendRequest: Model<IFriendRequest> = mongoose.models.FriendRequest || mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);

export default FriendRequest;
