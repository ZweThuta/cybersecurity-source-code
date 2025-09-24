import nodemailer from "nodemailer";

export default class EmailService {
  private transporter;
  private sender: string;

  constructor() {
    this.sender = process.env.SENDER_EMAIL || "";
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
      },
    });
  }

  async sendOtp(to: string, code: string) {
    const info = await this.transporter.sendMail({
      from: this.sender,
      to,
      subject: "🔐 Verify Your Account – One-Time Passcode",
      text: `Hello,
      
  Your one-time verification code is: ${code}
  
  This code will expire in 5 minutes.  
  If you did not request this, please ignore this email.
  
  Thank you,  
  The Security Team`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
          <div style="max-width:500px; margin:auto; background:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1); overflow:hidden;">
            <div style="background:#2A2633; color:white; padding:16px; text-align:center; font-size:18px; font-weight:bold;">
               Verification Code
            </div>
            <div style="padding:24px; color:#2A2633; line-height:1.6;">
              <p>Hello,</p>
              <p>Your one-time verification code is:</p>
              <div style="text-align:center; margin:24px 0;">
                <span style="display:inline-block; font-size:28px; letter-spacing:4px; font-weight:bold; background:#f0f4ff; padding:12px 20px; border:1px solid #d0d7e2; border-radius:6px; color:#9C6CFE;">
                  ${code}
                </span>
              </div>
              <p>This code will expire in <b>5 minutes</b>.</p>
              <p>If you did not request this code, you can safely ignore this email.</p>
              <p style="margin-top:30px;">Thank you,<br/>The Security Team</p>
            </div>
            <div style="background:#f1f1f1; text-align:center; padding:12px; font-size:12px; color:#777;">
              © ${new Date().getFullYear()} AccessHub. All rights reserved.
            </div>
          </div>
        </div>
      `,
    });
  
    return info.messageId;
  }
  
}


