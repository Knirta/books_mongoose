import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const { SENDGRID_API_KEY } = process.env;
sgMail.setApiKey(SENDGRID_API_KEY);

//data = { to, subject, html }

const sendEmail = async (data) => {
  const email = { ...data, from: "korolchuk.kate.work@gmail.com" };
  await sgMail.send(email);
  return true;
};

export default sendEmail;

// const email = {
//   from: "korolchuk.kate.work@gmail.com",
//   to: "yolev71071@akixpres.com",
//   subject: "Test email using SendGrid",
//   html: "<h2>Welcome to SendGrid email testing</h2><p>This is a test email sent using SendGrid </p>",
// };

// sgMail
//   .send(email)
//   .then(() => console.log("Email sent successfully"))
//   .catch((error) => console.log("Error sending email:", error.message));
