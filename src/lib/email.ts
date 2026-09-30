// src/lib/email.ts
// cred - https://rogasper.com/blog/how-to-setup-email-verification-1766808520412
import "dotenv/config";
import nodemailer from "nodemailer";

const {
  SITE_MAIL_PORT,
  SITE_MAIL_HOST,
  SITE_MAIL_AUTH_USER,
  SITE_MAIL_AUTH_PASS,
  SITE_MAIL_ALIAS_EMAIL,
  SITE_TITLE,
  DOMAIN_URL,
} = process.env;

// 1. Setup Transporter
const smtpPort = Number(SITE_MAIL_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: SITE_MAIL_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: SITE_MAIL_AUTH_USER,
    pass: SITE_MAIL_AUTH_PASS,
  },
});

// 2. OTP Verification Template
type VerificationProps = {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
};

export const verificationEmailTemplate = ({
  email,
  otp,
  type,
}: VerificationProps) => {
  return {
    from: `${SITE_TITLE} <${SITE_MAIL_ALIAS_EMAIL}>`,
    to: email,
    subject: "Your Verification Code",
    html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Verification Code from ${SITE_TITLE}</h2>
              <p>Use the following code to complete your ${type} (This code expires in 5 minutes. <a href="${DOMAIN_URL + `/login?msg=Enter your one-time-password&otp=${otp}&type=${type}&email=${encodeURIComponent(email)}`}">One-Click Login</a>)</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
                ${otp}
              </div>
            </div>
        `,
  };
};

// 3. Organization Invitation Template
type InvitationProps = {
  email: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteLink: string;
  role: string;
};

export const invitationEmailTemplate = (data: InvitationProps) => {
  return {
    from: `${SITE_TITLE} <${SITE_MAIL_ALIAS_EMAIL}>`,
    to: data.email,
    subject: `You've been invited to ${data.organizationName}`,
    html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>You're Invited!</h2>
              <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong>.</p>
              <br />
              <a href="${data.inviteLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Accept Invitation
              </a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">Or copy this link: ${data.inviteLink}</p>
            </div>
        `,
  };
};

export default transporter;
