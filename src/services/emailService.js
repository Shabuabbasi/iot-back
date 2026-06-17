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

  try {
    const RESEND_API_KEY = "re_D7VzAmGk_3DcNcbBRY8tucbdsYqLuWQXz";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Smart Waste System <onboarding@resend.dev>",
        to: [adminEmail],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Resend API alert sent for bin ${binId} → ${adminEmail} (ID: ${data.id})`);
    } else {
      console.error(`❌ Failed to send Resend API alert:`, data);
    }
  } catch (err) {
    console.error(`❌ Error in emailService:`, err.message);
  }
};
