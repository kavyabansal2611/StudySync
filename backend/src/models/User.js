import mongoose, { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema = new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: false },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'] },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    year_of_study: { type: Number, required: false },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String, required: false },
    /* We can store the hashed version of the token in the database for security reasons. When a user logs out, we can simply remove the refresh token from the database, making it invalid for future use. */

    // refreshTokenExpires: { type: Date, required: false },
    // isEmailVerified: { type: Boolean, default: false },
    // emailVerificationToken: { type: String,required: true}, 
    // emailVerificationTokenExpires: { type: Date },

    /* We dont actually need to store the email verification token and its expiry in the database if we are using JWTs for email verification. The token itself contains the necessary information (like user ID and expiration time) and can be verified using the secret key without needing to reference the database. This approach simplifies the implementation and reduces the amount of data we need to store. */
}, { timestamps: true }
);

// Make sure to explicitly change this if any new field is added to the User schema that should be included in the safe object returned by toSafeObject method.
UserSchema.methods.toSafeObject = function () {
    return {
        id: this._id,
        first_name: this.first_name,
        last_name: this.last_name,
        username: this.username,
        email: this.email,
        year_of_study: this.year_of_study,
        isVerified: this.isVerified,
    };
};

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }

    );
};

UserSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }

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

/* We already have emailVerifyToken method that generates a JWT for email verification, so we don't need to implement a separate method that generates a random token and stores its hash in the database. The JWT itself can be used for email verification without needing to reference the database, simplifying our implementation and improving security. */
// UserSchema.methods.emailVerificationToken = function () {
//     const token = crypto.randomBytes(32).toString("hex");

//     this.emailVerificationToken = crypto
//         .createHash("sha256")
//         .update(token)
//         .digest("hex");
//     this.emailVerificationTokenExpires = Date.now() + 15 * 60 * 1000;
//     return token;
// };


export const User = mongoose.models.User || model('User', UserSchema);
























