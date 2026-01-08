import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const { META_PASSWORD } = process.env;

const nodemailerConfig = {
  host: "smtp.meta.ua",
  port: 465, //25, 465, 2525
  secure: true,
  auth: {
    user: "knirta@meta.ua",
    pass: META_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(nodemailerConfig);

//data = { to, subject, html }

const sendEmail = async (data) => {
  const email = { ...data, from: "knirta@meta.ua" };
  await transporter.sendMail(email);
  return true;
};

export default sendEmail;

// const email = {
//   from: "knirta@meta.ua",
//   to: "yolev71071@akixpres.com",
//   subject: "Test email using Nodemailer",
//   html: "<h2>Welcome to Nodemailer email testing</h2><p>This is a test email sent using Nodemailer with SMTP configuration.</p>",
// };

// transporter
//   .sendMail(email)
//   .then(() => console.log("Email sent successfully"))
//   .catch((error) => console.log("Error sending email:", error.message));
