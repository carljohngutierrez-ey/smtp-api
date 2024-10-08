import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import path, { dirname } from "path";
import { fileURLToPath } from 'url';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(cors());
app.use(express.json());

let transporter = nodemailer.createTransport({
  host: process.env.GMAIL_SMTP_HOST,
  port: process.env.GMAIL_SMTP_PORT,
  auth: {
    user: process.env.GMAIL_SMTP_USER,
    pass: process.env.GMAIL_SMTP_PASS,
  },
});

// API endpoint to receive messages
app.get("/send-email", async (req, res) => {
  const { organizer, responder, message } = req.query;
  const { representative, position, repreEmail } = req.body;

  const userAgent = req.headers["user-agent"];
  console.log(userAgent);
  // For not triggering SMTP in Outlook's URL checks
  if (
    (userAgent && userAgent.includes("Outlook")) ||
    userAgent.includes("SafeLinks")
  ) {
    res.status(204).end();
  }

  if (!organizer || !message || !responder) {
    return res
      .status(400)
      .json({ error: "Organizer, responder and message are required." });
  }

  if (
    message == "No, but will send a representative" &&
    (!representative || !position || !repreEmail)
  ) {
    return res
      .status(400)
      .json({ error: "Representative information are required." });
  }

  // Email options
  const mailOptions = {
    from: process.env.GMAIL_SMTP_USER,
    to: organizer,
    subject: "Event response",
    text: `
    responder: ${responder}
    message: ${message}
    submitted at: ${new Date().toLocaleString()}
    `,
  };

  try {
    // Send email
    console.log("sending email", new Date().toLocaleString());
    await transporter.sendMail(mailOptions);
    console.log("email sent successfully", new Date().toLocaleString());
    // res.redirect(process.env.URL_REDIRECT); // for dev redirectr
    res.sendFile(path.join(__dirname, 'success.html')); // for localhost redirect
  } catch (error) {
    console.error(error);
    // res.redirect(`${process.env.URL_REDIRECT}/failed`); // for dev redirectr
    res.sendFile(path.join(__dirname, 'failed.html')); // for localhost redirect
  }
});

app.post("/representative-info", async (req, res) => {
  const {
    organizer,
    responder,
    message,
    representative,
    position,
    repreEmail,
  } = req.body;

  if (!organizer || !message || !responder) {
    return res
      .status(400)
      .json({ error: "Required informations are missing from the link." });
  }

  if (
    message == "No, but will send a representative" &&
    (!representative || !position || !repreEmail)
  ) {
    return res
      .status(400)
      .json({ error: "Representative information are required." });
  }

  // Email options
  const mailOptions = {
    from: process.env.GMAIL_SMTP_USER,
    to: organizer,
    subject: "Event response",
    text: `
    responder: ${responder}
    message: ${message}
    representative: ${representative}
    position: ${position}
    email: ${repreEmail}
    submitted at: ${new Date().toLocaleString()}
    `,
  };

  try {
    // Send email
    console.log("sending email", new Date().toLocaleString());
    await transporter.sendMail(mailOptions);
    console.log("email sent successfully", new Date().toLocaleString());
    res.status(200).json({ message: "Your response has been recorded!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Your response has failed please try again." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
