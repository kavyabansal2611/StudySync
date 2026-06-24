import mongoose,{ Schema,model } from 'mongoose';

const EventSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: false },
    event_start: { type: Date, required: true },
    event_end: { type: Date, required: false },
    location: { type: String, required: false },
}, { timestamps: true });

export const Event = mongoose.models.Event||model('Event', EventSchema);