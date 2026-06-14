export default function EmailVerifyTemplate(verificationLink) {
    return `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333333;">Verify Your Email Address</h2>
            <p style="color: #555555;">Thank you for registering! Please click the button below to verify your email address and complete your registration.</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; margin-top: 20px; background-color: #007BFF; color: #ffffff; text-decoration: none; border-radius: 4px;">Verify Email</a>
            <p style="color: #555555; margin-top: 20px;">If you did not create an account, no further action is required.</p>
            <p style="color: #555555; margin-top: 20px;">Best regards,<br/>The StudySync Team</p>
        </div>
    </div>
    `;
}