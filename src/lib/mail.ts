import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/new-verification?token=${token}`;

  const html = `
    <body style="background-color: #000; color: #0f0; font-family: 'Courier New', Courier, monospace; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #0f0; padding: 20px; box-shadow: 0 0 10px #0f0;">
        <h1 style="text-align: center; border-bottom: 1px solid #0f0; padding-bottom: 10px;">CONFIRM IDENTITY // TRADE CENTER</h1>
        <p style="font-size: 16px;">SYSTEM ALERT: NEW USER REGISTRATION DETECTED.</p>
        <p>INITIATING VERIFICATION PROTOCOL...</p>
        <p>TARGET: ${email}</p>
        <p>ACTION REQUIRED: CLICK THE LINK BELOW TO VERIFY YOUR ENCRYPTION KEY.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="background-color: #000; color: #0f0; border: 1px solid #0f0; padding: 15px 30px; text-decoration: none; font-weight: bold; display: inline-block; transition: all 0.3s;">VERIFY IDENTITY</a>
        </div>
        <p style="font-size: 12px; opacity: 0.7;">SECURE CONNECTION ESTABLISHED. END OF TRANSMISSION.</p>
      </div>
    </body>
  `;

  await transporter.sendMail({
    from: '"Trade Center Security" <security@tradecenter.com>',
    to: email,
    subject: "CONFIRM IDENTITY // TRADE CENTER",
    html,
  });
};
