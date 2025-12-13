
import { Resend } from 'resend';
import { ResetPasswordEmail } from '../emails/ResetPasswordEmail';
import { AccountWarningEmail } from '../emails/AccountWarningEmail';
import { AccountSuspensionEmail } from '../emails/AccountSuspensionEmail';
import { WelcomeEmail } from '../emails/WelcomeEmail';
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
            from: 'Buck <onboarding@resend.dev>', // Use resend.dev for testing unless domain is verified
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

export const sendAccountWarningEmail = async (email: string, username: string, warningMessage: string, warningCount: number, 
    violatingContent: string) => {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing');
        return;
    }

    try {
        const data = await resend.emails.send({
            from: 'Buck <onboarding@resend.dev>',
            to: email,
            subject: `Account Warning (${warningCount})`,
            react: React.createElement(AccountWarningEmail, {
                username,
                warningMessage,
                warningCount,
                violatingContent
            }),
        });

        return data;
    } catch (error) {
        console.error('Error sending warning email:', error);
        throw error;
    }
};

export const sendAccountSuspensionEmail = async (email: string, username: string) => {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing');
        return;
    }

    try {
        const data = await resend.emails.send({
            from: 'Buck <onboarding@resend.dev>',
            to: email,
            subject: 'Account Suspension',
            react: React.createElement(AccountSuspensionEmail, {
                username,
            }),
        });

        return data;
    } catch (error) {
        console.error('Error sending suspension email:', error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing');
        return;
    }

    try {
        const data = await resend.emails.send({
            from: 'Buck <onboarding@resend.dev>',
            to: email,
            subject: 'Welcome to Buck!',
            react: React.createElement(WelcomeEmail, {
                userFirstname: name,
            }),
        });

        return data;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
};
