import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
    title: string;
    content: string;
    type: 'text' | 'markdown' | 'code';
    folder?: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
    tags: string[];
    isFavorite: boolean;
    language?: string;
    versions: any[]; // Define a more specific type if needed
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
    isShared: boolean;
    shareToken?: string;
    shareExpiresAt?: Date;
    sharePermissions: 'read' | 'edit';
}

const NoteSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['text', 'markdown', 'code'], default: 'markdown' },
    folder: { type: Schema.Types.ObjectId, ref: 'Folder' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
    isFavorite: { type: Boolean, default: false },
    language: { type: String },
    versions: [{ type: Schema.Types.Mixed }], // Placeholder for versioning logic
    viewCount: { type: Number, default: 0 },
    isTrashed: { type: Boolean, default: false },
    isShared: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
    shareExpiresAt: { type: Date },
    sharePermissions: { type: String, enum: ['read', 'edit'], default: 'read' },
}, {
    timestamps: true,
});

// Indexes
NoteSchema.index({ owner: 1, createdAt: -1 }); // For "Recent Notes"
NoteSchema.index({ owner: 1, folder: 1 }); // For "Notes in Folder"
NoteSchema.index({ owner: 1, isFavorite: 1 }); // For "Favorites"
NoteSchema.index({ owner: 1, isTrashed: 1 }); // For "Trash"
NoteSchema.index({ tags: 1 });
NoteSchema.index({ title: 'text', content: 'text' }); // Text search

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);

export default Note;
