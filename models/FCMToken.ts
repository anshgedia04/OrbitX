import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFCMToken extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    createdAt: Date;
    updatedAt: Date;
}

const FCMTokenSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        token: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

// One user can have multiple tokens (multiple devices/browsers)
// But each token is globally unique
FCMTokenSchema.index({ userId: 1 });

if (process.env.NODE_ENV === "development") {
    delete mongoose.models.FCMToken;
}

const FCMToken: Model<IFCMToken> =
    mongoose.models.FCMToken || mongoose.model<IFCMToken>("FCMToken", FCMTokenSchema);

export default FCMToken;
