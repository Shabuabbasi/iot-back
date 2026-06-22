import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, text, html }) => {
  try {
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
