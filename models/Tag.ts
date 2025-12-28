import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITag extends Document {
    name: string;
    owner: mongoose.Types.ObjectId;
    color?: string;
    usageCount: number;
}

const TagSchema: Schema = new Schema({
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    color: { type: String },
    usageCount: { type: Number, default: 0 },
});

// Indexes
TagSchema.index({ owner: 1 });
TagSchema.index({ name: 1 });

const Tag: Model<ITag> = mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);

export default Tag;
