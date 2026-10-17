import nodemailer from "nodemailer";
import env from "./env.js";

const hasSmtpConfiguration = Boolean(env.smtp.host && env.smtp.user && env.smtp.password);

const mailTransporter = env.isTest
  ? nodemailer.createTransport({ jsonTransport: true })
  : hasSmtpConfiguration
    ? nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,
        auth: {
          user: env.smtp.user,
          pass: env.smtp.password,
        },
        disableFileAccess: true,
        disableUrlAccess: true,
      })
    : null;

export const isMailConfigured = () => mailTransporter !== null;
export default mailTransporter;
