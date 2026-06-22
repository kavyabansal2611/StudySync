import jwt from "jsonwebtoken";

import { User } from "../models/User.js";


async function generateTokens(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save();

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error("Error generating tokens: " + error.message);
    }
}

export const verifyJWT = async (req, res, next) => {

    const accessToken = req.headers["authorization"]?.split(" ")[1] || req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
        return res.status(401).json({ message: "Access denied, login required" });
    }

    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

            const user = await User.findById(decoded.id)
                .select("-password -refreshToken");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;
            return next();
        } catch (err) {
            if (err.name !== "TokenExpiredError") {
                return res.status(401).json({ message: "Invalid access token" });
            }
        }
    }

    if (!refreshToken) {
        return res.status(401).json({ message: "Session expired, login again" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const foundUser = await User.findById(decoded.id)
            .select("-password -refreshToken");

        if (!foundUser) return res.status(401).json({ message: "User not found" });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(decoded.id);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.SECURE_COOKIES === 'production',
            sameSite='strict',
            maxAge=7*24*60*60*1000

        });

        res.setHeader("Authorization", "Bearer " + newAccessToken);
        req.user = foundUser;

        return next();
    } catch (err) {
        console.error("Error verifying refresh token:", err);
        return res.status(401).json({ message: "Refresh token expired, login again" });
    }
}