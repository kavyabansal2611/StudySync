import mongoose, { Schema, model } from 'mongoose';

const TaskSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    priority: { type: Number, required: true, min: 1, max: 10 },
}, { timestamps: true });

export const Task = mongoose.models.Task || model('Task', TaskSchema);
