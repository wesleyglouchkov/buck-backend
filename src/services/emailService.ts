
import { Resend } from 'resend';
import { ResetPasswordEmail } from '../emails/ResetPasswordEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetPasswordEmail = async (email: string, name: string, token: string) => {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing');
        return;
    }

    // Frontend URL for password reset
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    try {
        const data = await resend.emails.send({
            from: 'BuckV1 <onboarding@resend.dev>', // Use resend.dev for testing unless domain is verified
            to: 'tchetan308@gmail.com',
            subject: 'Reset your password',
            react: React.createElement(ResetPasswordEmail, {
                userFirstname: name,
                resetPasswordLink: resetLink,
            }),
        });

        return data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
