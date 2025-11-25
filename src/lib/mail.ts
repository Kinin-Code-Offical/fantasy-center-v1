import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import VerifyEmail from "@/components/emails/VerifyEmail";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string, securityCode?: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/new-verification?token=${token}`;

  // Use provided security code or generate a random one if not provided
  const code = securityCode || Math.random().toString(36).substring(2, 8).toUpperCase();

  const emailHtml = await render(VerifyEmail({ confirmLink, email, securityCode: code }));

  await transporter.sendMail({
    from: '"Trade Center Security" <security@tradecenter.com>',
    to: email,
    subject: "CONFIRM IDENTITY // TRADE CENTER",
    html: emailHtml,
  });
};
