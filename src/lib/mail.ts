import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import VerifyEmail from "@/components/emails/VerifyEmail";
import MarketNotificationEmail from "@/components/emails/MarketNotificationEmail";

const createTransporter = (type: 'verification' | 'info') => {
  const user = type === 'verification' ? process.env.SMTP_USER_VERIFICATION : process.env.SMTP_USER_INFO;
  const pass = type === 'verification' ? process.env.SMTP_PASS_VERIFICATION : process.env.SMTP_PASS_INFO;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  });
};

export const sendVerificationEmail = async (email: string, token: string, securityCode?: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/new-verification?token=${token}`;
  const code = securityCode || Math.random().toString(36).substring(2, 8).toUpperCase();
  const emailHtml = await render(VerifyEmail({ confirmLink, email, securityCode: code }));

  await createTransporter('verification').sendMail({
    from: `"Trade Center Security" <${process.env.SMTP_USER_VERIFICATION}>`,
    to: email,
    subject: "CONFIRM IDENTITY // TRADE CENTER",
    html: emailHtml,
  });
};

export const sendMarketNotificationEmail = async (
  toEmail: string,
  playerName: string,
  leagueName: string,
  playerPoints: number,
  playerProfileUrl: string
) => {
  const emailHtml = await render(MarketNotificationEmail({
    playerName,
    leagueName,
    playerPoints,
    playerProfileUrl
  }));

  await createTransporter('info').sendMail({
    from: `"Trade Center Intelligence" <${process.env.SMTP_USER_INFO}>`,
    to: toEmail,
    subject: `MARKET ALERT: ${playerName} Available in ${leagueName}`,
    html: emailHtml,
  });
};
