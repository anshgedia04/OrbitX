import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INoteEmbedding extends Document {
    noteId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    text: string;
    embedding: number[];
    chunkIndex: number;
    createdAt: Date;
}

const NoteEmbeddingSchema: Schema = new Schema({
    noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    chunkIndex: { type: Number, required: true },
}, {
    timestamps: true,
});

// Regular index for quickly deleting chunks when a note is deleted, or filtering by note
NoteEmbeddingSchema.index({ noteId: 1 });
NoteEmbeddingSchema.index({ userId: 1 });

const NoteEmbedding: Model<INoteEmbedding> = mongoose.models.NoteEmbedding || mongoose.model<INoteEmbedding>('NoteEmbedding', NoteEmbeddingSchema);

export default NoteEmbedding;
