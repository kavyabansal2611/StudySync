import '../config/env.js';

import { Resend } from 'resend';
const resend = new Resend(process.env.EMAIL_RESEND_API_KEY);

import EmailVerifyTemplate from '../utils/emailTemplates/verifyEmail.template.js'
import PasswordResetTemplate from '../utils/emailTemplates/resetPassword.template.js';

export const sendEmailVerification = async (email, token) => {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const htmlContent = EmailVerifyTemplate(verificationLink);
    try {
        await sendEmail(email, "Email Verification", htmlContent);
    } catch (error) {
        console.error('Error sending email verification email:', error);
        throw new Error('Failed to send email verification email');
    }
}

export const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const htmlContent = PasswordResetTemplate(resetLink);
    try {
        await sendEmail(email, "Password Reset", htmlContent);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
}


const sendEmail = async (to, subject, html) => {
    try {
        const { data, error } = await resend.emails.send({
            from: `StudySync <${process.env.EMAIL_FROM}>`,
            to: to,
            subject: subject,
            html: html,
        });
        if (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send verification email');
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        throw new Error('An unexpected error occurred');
    }
}