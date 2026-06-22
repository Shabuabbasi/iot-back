import { Resend } from 'resend';

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Debug: log the first 10 chars of the key so we can verify Railway is injecting it
    console.log("RESEND_API_KEY starts with:", process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) : "UNDEFINED");

    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY in environment variables");
    }
    
    // Initialize inside the function to prevent crashing the whole server on startup
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      // IMPORTANT: Unless you verify a custom domain on Resend, 
      // you MUST use 'onboarding@resend.dev' as the sender.
      from: 'Smart Waste Management <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      text: text,
      html: html,
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw error;
    }

    console.log("Email sent successfully via Resend:", data);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendEmail;
