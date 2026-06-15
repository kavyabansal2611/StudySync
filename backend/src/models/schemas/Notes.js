import mongoose,{ Schema,model } from 'mongoose';

const NotesSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    user:{type:Schema.Types.ObjectId, ref:'User', required:true}
},{timestamps: true});

export const Notes = model('Note', NotesSchema);
