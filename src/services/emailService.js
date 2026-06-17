import nodemailer from "nodemailer";
import dns from "dns";

// Force Node.js to prefer IPv4 for all DNS lookups to avoid Railway IPv6 ENETUNREACH
dns.setDefaultResultOrder("ipv4first");

// Create reusable transporter using SMTP credentials from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Force IPv4 because Railway sometimes blocks outgoing IPv6 SMTP connections
  tls: {
    rejectUnauthorized: false
  },
  family: 4 // Force IPv4
});

/**
 * Send an email alert to the admin when a bin is detected as FULL.
 * @param {Object} binData - { binId, location, wasteLevel }
 */
export const sendBinFullAlert = async ({ binId, location, wasteLevel }) => {
  const adminEmail = process.env.NOTIFICATION_EMAIL;

  if (!adminEmail) {
    console.warn("⚠️  NOTIFICATION_EMAIL not set in .env — skipping email alert.");
    return;
  }

  const subject = `🚨 Alert: Bin ${binId} is FULL (${wasteLevel}%)`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #e53e3e, #c53030); padding: 24px 32px;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">🚨 Bin Full Alert</h1>
        <p style="color: #fed7d7; margin: 6px 0 0; font-size: 14px;">IoT Smart Waste Management System</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px; background: #fff;">
        <p style="color: #2d3748; font-size: 16px; margin-top: 0;">
          A waste bin has reached <strong>full capacity</strong> and requires immediate collection.
        </p>

        <!-- Info Table -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;">
          <tr style="background: #fff5f5;">
            <td style="padding: 12px 16px; color: #718096; font-weight: bold; width: 40%; border: 1px solid #fed7d7; border-radius: 4px;">Bin ID</td>
            <td style="padding: 12px 16px; color: #2d3748; border: 1px solid #fed7d7;">${binId}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; color: #718096; font-weight: bold; border: 1px solid #e2e8f0;">Location</td>
            <td style="padding: 12px 16px; color: #2d3748; border: 1px solid #e2e8f0;">📍 ${location}</td>
          </tr>
          <tr style="background: #fff5f5;">
            <td style="padding: 12px 16px; color: #718096; font-weight: bold; border: 1px solid #fed7d7;">Fill Level</td>
            <td style="padding: 12px 16px; color: #e53e3e; font-weight: bold; border: 1px solid #fed7d7;">🗑️ ${wasteLevel}% — FULL</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; color: #718096; font-weight: bold; border: 1px solid #e2e8f0;">Time</td>
            <td style="padding: 12px 16px; color: #2d3748; border: 1px solid #e2e8f0;">🕒 ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</td>
          </tr>
        </table>

        <!-- Fill Level Bar -->
        <div style="margin: 24px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #718096;">Fill Level</p>
          <div style="background: #e2e8f0; border-radius: 99px; height: 14px; overflow: hidden;">
            <div style="width: ${wasteLevel}%; background: linear-gradient(90deg, #f6ad55, #e53e3e); height: 100%; border-radius: 99px;"></div>
          </div>
          <p style="text-align: right; font-size: 13px; color: #e53e3e; margin: 4px 0 0;">${wasteLevel}%</p>
        </div>

        <p style="color: #4a5568; font-size: 14px;">
          Please assign a collector to empty this bin as soon as possible.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f7fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
        <p style="color: #a0aec0; font-size: 12px; margin: 0; text-align: center;">
          This is an automated alert from your IoT Smart Waste Management System.<br/>
          Do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Smart Waste System 🗑️" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email alert sent for bin ${binId} → ${adminEmail} (ID: ${info.messageId})`);
  } catch (err) {
    console.error(`❌ Failed to send email alert for bin ${binId}:`, err.message);
  }
};
