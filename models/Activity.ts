import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IActivity extends Document {
    user: mongoose.Types.ObjectId;
    type: "create" | "edit" | "delete" | "restore" | "move";
    targetId: mongoose.Types.ObjectId;
    targetTitle: string;
    targetType: "note" | "folder";
    createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["create", "edit", "delete", "restore", "move"], required: true },
        targetId: { type: Schema.Types.ObjectId, required: true },
        targetTitle: { type: String, required: true },
        targetType: { type: String, enum: ["note", "folder"], required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

const Activity = models.Activity || model<IActivity>("Activity", ActivitySchema);

export default Activity;
