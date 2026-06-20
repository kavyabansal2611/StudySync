import mongoose,{ Schema,model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import {z} from 'zod';

const UserSchema=new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: false },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'] },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    year_of_study: { type: Number, required: false },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String, required: false },
    refreshTokenExpires: { type: Date, required: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String,required: true},
    emailVerificationTokenExpires: { type: Date },
},{timestamps: true}
);

userSchema.methods.toSafeObject = function () {
    return {
        id: this._id,
        first_name: this.first_name,
        last_name: this.last_name,
        username: this.username,
        email: this.email,
        year_of_study: this.year_of_study,
        isEmailVerified: this.isEmailVerified,
    };
};

UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

UserSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {id:this._id,role:this.role},
        process.env.JWT_ACCESS_SECRET,
        {expiresIn:process.env.JWT_EXPIRES_IN||'15m'}

    );
};

UserSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {id:this._id},
        process.env.JWT_REFRESH_SECRET,
        {expiresIn:process.env.JWT_REFRESH_EXPIRES_IN||'7d'}

    );
};

UserSchema.methods.emailVerifyToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_EMAIL_SECRET,
        { expiresIn: process.env.JWT_EMAIL_EXPIRES_IN || '5m' }
    );
};

UserSchema.methods.passwordResetToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_PASSWORD_RESET_SECRET,
        { expiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || '15m' }
    );
}
UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        return ret;
    },
});
UserSchema.methods.emailVerificationToken = function () {
    const token = crypto.randomBytes(32).toString("hex");

    this.emailVerificationToken=crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    this.emailVerificationTokenExpires=Date.now()+15*60*1000;
    return token;
    };


export const User = mongoose.models.User||model('User', UserSchema);
























