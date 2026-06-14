export default function PasswordResetTemplate(resetLink) {
    return `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333333;">Reset Your Password</h2>
            <p style="color: #555555;">We received a request to reset your password. Please click the button below to reset your password.</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin-top: 20px; background-color: #007BFF; color: #ffffff; text-decoration: none; border-radius: 4px;">Reset
    Password</a>
            <p style="color: #555555; margin-top: 20px;">If you did not request a password reset, no further action is required.</p>
            <p style="color: #555555; margin-top: 20px;">Best regards,<br/>The StudySync Team</p>
        </div>
    </div>
    `;
}