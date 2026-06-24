import { User } from '../models/User.js';

import { updateUserSchema } from '../validators/user.validator.js';

import { sendEmailVerification as sendEmailVerificationMail, sendPasswordResetEmail as sendPasswordResetEmailMail } from '../services/email.js';


export const register = async (req, res) => {
    try {
        const { first_name, last_name, email, password, username, year_of_study } = req.body;
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Invalid input' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });   // req.body.email should be asserted as string before it touches any query

        if (existingUser) {
            return res.status(400).json({ error: 'Registration failed' });
        }

        const newUser = new User(
            { first_name, last_name, email, username, password, year_of_study }
        )

        const accessToken = newUser.generateAccessToken();
        const refreshToken = newUser.generateRefreshToken();

        newUser.refreshToken = refreshToken;

        await newUser.save();

        const emailToken = newUser.emailVerifyToken();
        try {
            await sendEmailVerificationMail(newUser.email, emailToken);
        } catch (err) {
            console.error('Failed to send verification email:', err);
        }

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.SECURE_COOKIES === 'production',
            sameSite='strict',
            maxAge=7*24*60*60*1000 //7days
        });

        return res.status(201).json({
            accessToken,
            user: newUser.toSafeObject(),
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Registration failed' });
        }
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Input email and password" });
        }
        const user = await User.findOne({ email })

        if (
            !user || !(await user.comparePassword(password))
        ) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.SECURE_COOKIES === 'production',
            sameSite='strict',
            maxAge=7*24*60*60*1000 //7days
        });

        return res.json({ accessToken, user: user.toSafeObject() });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/* We will directly regenerate the access token if expired in middleware, so no need to refresh access token here. */
// export const refreshAccessToken = async (req, res) => {
//     try {
//         const refreshToken = req.cookies?.refreshToken;

//         if (!refreshToken) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         const user = await User.findOne({
//             refreshToken: refreshToken,
//         });

//         if (!user) {
//             return res.status(401).json({ error: 'Invalid' });
//         }
//         user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
//         await user.save();

//         const accessToken = user.generateAccessToken();

//         return res.json({ accessToken });

//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };

export const getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Invalid' });
        }
        return res.json({
            user: user.toSafeObject(),
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const UpdateUserInfo = async (req, res) => {

    try {

        const result = updateUserSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ error: result.error.flatten() });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (Object.keys(result.data).length === 0) {
            return res.status(400).json({ error: 'No fields provided to update' });
        }

        const { first_name, last_name, year_of_study } = result.data;

        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;
        if (year_of_study !== undefined) user.year_of_study = year_of_study;
        await user.save();

        return res.json({ user: user.toSafeObject() });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendEmailVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Invalid' });
        }
        const emailToken = user.emailVerifyToken();

        try {
            await sendEmailVerificationMail(user.email, emailToken);
        } catch (err) {
            console.error('Failed to send verification email:', err);
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        return res.json({ message: 'Verification email sent' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
        if (!decoded || !decoded.id) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'Invalid' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        user.isVerified = true;
        await user.save();

        return res.status(200).json({ message: 'Email verified successfully' });
    } catch (err) {
        console.error(err);
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ error: 'Token expired' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }

};

export const sendPasswordResetEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'Invalid' });
        }

        const resetToken = user.passwordResetToken();

        try {
            await sendPasswordResetEmailMail(user.email, resetToken);
        } catch (err) {
            console.error('Failed to send password reset email:', err);
            return res.status(500).json({ error: 'Failed to send password reset email' });
        }

        return res.status(200).json({ message: 'Password reset email sent' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }

};

export const resetPassword = async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_PASSWORD_RESET_SECRET);
        if (!decoded || !decoded.id) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'Invalid' });
        }

        const { new_password } = req.body;
        if (!new_password) {
            return res.status(400).json({ error: 'New password is required' });
        }

        user.password = new_password;
        await user.save();

        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.SECURE_COOKIES === 'true',
            });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ error: 'User not authenticated' });
        }

        const user = await User.findById(userId);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



