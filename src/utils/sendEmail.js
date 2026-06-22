import { Resend } from 'resend';

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Use env variable, with hardcoded fallback since Railway is not injecting it
    const apiKey = process.env.RESEND_API_KEY || "re_CU37kqU1_7vsThbMH6n4uCYH5cM7guKNj";
    console.log("RESEND_API_KEY starts with:", apiKey ? apiKey.substring(0, 10) : "UNDEFINED");

    // Initialize inside the function to prevent crashing the whole server on startup
    const resend = new Resend(apiKey);
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
