import mongoose,{ Schema,model } from 'mongoose';

const SubjectSchema = new Schema({
    name: { type: String, required: true },
   
    user:{type:Schema.Types.ObjectId, ref:'User', required:true}
},{timestamps: true});

export const Subject = mongoose.models.Subject||model('Subject', SubjectSchema);


