import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFolder extends Document {
    name: string;
    parentFolder?: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    path: string;
    color?: string;
    icon?: string;
    isTrashed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FolderSchema: Schema = new Schema({
    name: { type: String, required: true },
    parentFolder: { type: Schema.Types.ObjectId, ref: 'Folder' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    path: { type: String, required: true },
    color: { type: String },
    icon: { type: String },
    isTrashed: { type: Boolean, default: false },
}, {
    timestamps: true,
});

// Indexes
FolderSchema.index({ owner: 1 });
FolderSchema.index({ parentFolder: 1 });
FolderSchema.index({ createdAt: 1 });

const Folder: Model<IFolder> = mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);

export default Folder;
