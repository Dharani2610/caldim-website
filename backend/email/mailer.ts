import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "@/backend/env";

export interface RfqMailData {
  name: string;
  company: string;
  email: string;
  role?: string;
  projectType?: string;
  tonnage?: string;
  timeline?: string;
  message?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}

/**
 * Checks whether all required SMTP configuration variables are present.
 * Used for graceful degradation when SMTP is unset.
 */
export function isEmailConfigured(): boolean {
  return Boolean(
    env.smtpHost &&
    env.smtpPort &&
    env.smtpUser &&
    env.smtpPassword &&
    env.smtpFromEmail
  );
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure || env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPassword,
      },
    });
  }
  return cachedTransporter;
}

/**
 * Validates the SMTP connection with the provider using `transporter.verify()`.
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return {
      success: false,
      error: "SMTP is not fully configured (missing host, port, user, password, or from email).",
    };
  }

  try {
    await getTransporter().verify();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * Escapes HTML characters to prevent rendering issues and injection in email bodies.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sends internal RFQ notification email to the engineering/sales team.
 */
export async function sendRfqNotification(rfq: RfqMailData): Promise<void> {
  if (!isEmailConfigured()) return;

  const transporter = getTransporter();
  const fromAddress = `"${env.smtpFromName}" <${env.smtpFromEmail}>`;
  const toAddress = env.contactNotifyEmail;
  const companyLabel = rfq.company || "Direct Website Enquiry";
  const projectLabel = rfq.projectType || "General Structural Detailing";

  const subject = `New RFQ: ${companyLabel} — ${projectLabel}`;

  const textLines = [
    "==================================================",
    "  NEW RFQ SUBMISSION — CALDIM ENGINEERING",
    "==================================================",
    "",
    "SUBMITTER DETAILS:",
    `• Name:         ${rfq.name}`,
    `• Company:      ${rfq.company}`,
    `• Email:        ${rfq.email}`,
    `• Role:         ${rfq.role || "Not specified"}`,
    "",
    "PROJECT SCOPE:",
    `• Project Type: ${rfq.projectType || "Not specified"}`,
    `• Est. Tonnage: ${rfq.tonnage || "Not specified"}`,
    `• Timeline:     ${rfq.timeline || "Not specified"}`,
    "",
    "MESSAGE / SCOPE NOTES:",
    rfq.message ? rfq.message : "(No additional message provided)",
    "",
    "ATTACHMENT:",
    rfq.attachmentUrl
      ? `• File: ${rfq.attachmentName || "Attachment"}\n• Download: ${rfq.attachmentUrl}`
      : "• None provided",
    "",
    "--------------------------------------------------",
    `Replying to this email will respond directly to ${rfq.email}`,
  ];

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 24px; border-bottom: 3px solid #f97316; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
    .content { padding: 28px 24px; }
    .section-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin: 20px 0 10px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    .grid { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .grid td { padding: 8px 0; font-size: 14px; vertical-align: top; }
    .grid td.label { width: 140px; color: #64748b; font-weight: 500; }
    .grid td.value { color: #0f172a; font-weight: 600; }
    .message-box { background: #f8fafc; border-left: 3px solid #0284c7; padding: 14px 16px; border-radius: 4px; font-size: 14px; color: #334155; white-space: pre-wrap; margin: 12px 0; }
    .attachment-btn { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; margin-top: 8px; }
    .footer { padding: 16px 24px; background: #f1f5f9; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>New Request for Quote</h1>
      <p>Caldim Engineering Services — RFQ Notification</p>
    </div>
    <div class="content">
      <div class="section-title">Submitter Information</div>
      <table class="grid">
        <tr><td class="label">Name:</td><td class="value">${escapeHtml(rfq.name)}</td></tr>
        <tr><td class="label">Company:</td><td class="value">${escapeHtml(rfq.company)}</td></tr>
        <tr><td class="label">Email:</td><td class="value"><a href="mailto:${escapeHtml(rfq.email)}" style="color:#0284c7;">${escapeHtml(rfq.email)}</a></td></tr>
        ${rfq.role ? `<tr><td class="label">Role:</td><td class="value">${escapeHtml(rfq.role)}</td></tr>` : ""}
      </table>

      <div class="section-title">Project Details</div>
      <table class="grid">
        <tr><td class="label">Project Type:</td><td class="value">${escapeHtml(rfq.projectType || "Not specified")}</td></tr>
        <tr><td class="label">Est. Tonnage:</td><td class="value">${escapeHtml(rfq.tonnage || "Not specified")}</td></tr>
        <tr><td class="label">Target Timeline:</td><td class="value">${escapeHtml(rfq.timeline || "Not specified")}</td></tr>
      </table>

      <div class="section-title">Message / Project Scope</div>
      <div class="message-box">${rfq.message ? escapeHtml(rfq.message) : "<em>No additional notes provided.</em>"}</div>

      ${
        rfq.attachmentUrl
          ? `
      <div class="section-title">Uploaded Document</div>
      <p style="margin: 6px 0; font-size: 13px; color: #475569;">
        File: <strong>${escapeHtml(rfq.attachmentName || "Attachment")}</strong>
      </p>
      <a href="${escapeHtml(rfq.attachmentUrl)}" target="_blank" rel="noopener noreferrer" class="attachment-btn">
        View / Download Drawing Attachment ↗
      </a>
      `
          : ""
      }
    </div>
    <div class="footer">
      Direct reply goes to <strong>${escapeHtml(rfq.email)}</strong>
    </div>
  </div>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: fromAddress,
    to: toAddress,
    replyTo: rfq.email,
    subject,
    text: textLines.join("\n"),
    html: htmlContent,
  });
}

/**
 * Sends automated confirmation email to the submitter acknowledging their RFQ.
 */
export async function sendRfqAutoConfirmation(rfq: RfqMailData): Promise<void> {
  if (!isEmailConfigured()) return;

  const transporter = getTransporter();
  const fromAddress = `"${env.smtpFromName}" <${env.smtpFromEmail}>`;
  const toAddress = rfq.email;
  const replyToAddress = env.contactNotifyEmail;

  const subject = `We've received your request — Caldim Engineering Services`;

  const textLines = [
    `Hello ${rfq.name},`,
    "",
    "Thank you for contacting Caldim Engineering Services. We have received your Request for Quote (RFQ) and project details.",
    "",
    "SUBMISSION SUMMARY:",
    `• Company:      ${rfq.company}`,
    `• Project Type: ${rfq.projectType || "Structural Steel Detailing"}`,
    rfq.tonnage ? `• Est. Tonnage: ${rfq.tonnage}` : "",
    rfq.timeline ? `• Timeline:     ${rfq.timeline}` : "",
    "",
    "WHAT HAPPENS NEXT:",
    "Our engineering detailing team is reviewing your project scope, drawing requirements, and timeline. A senior project engineer will reach out to you shortly with initial estimations or any clarifying questions.",
    "",
    "If you have urgent revisions or additional structural drawing sets to submit, simply reply directly to this email or reach us at quotes@caldimengg.com.",
    "",
    "Best regards,",
    "Caldim Engineering Services Team",
    "https://www.caldimengg.com",
  ].filter(Boolean);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 28px 24px; border-bottom: 3px solid #f97316; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
    .content { padding: 28px 24px; font-size: 14px; color: #334155; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .summary-card h2 { margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
    .summary-grid { width: 100%; border-collapse: collapse; }
    .summary-grid td { padding: 6px 0; font-size: 13px; }
    .summary-grid td.label { width: 120px; color: #64748b; font-weight: 500; }
    .summary-grid td.value { color: #0f172a; font-weight: 600; }
    .footer { padding: 20px 24px; background: #f1f5f9; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Caldim Engineering Services</h1>
      <p>RFQ Confirmation & Acknowledgement</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 0;">Hello ${escapeHtml(rfq.name)},</p>
      <p>Thank you for requesting a quote with Caldim Engineering. We have received your submission and our structural detailing team is reviewing your project details.</p>

      <div class="summary-card">
        <h2>Submitted Project Details</h2>
        <table class="summary-grid">
          <tr><td class="label">Company:</td><td class="value">${escapeHtml(rfq.company)}</td></tr>
          <tr><td class="label">Project Type:</td><td class="value">${escapeHtml(rfq.projectType || "Structural Steel Detailing")}</td></tr>
          ${rfq.tonnage ? `<tr><td class="label">Est. Tonnage:</td><td class="value">${escapeHtml(rfq.tonnage)}</td></tr>` : ""}
          ${rfq.timeline ? `<tr><td class="label">Timeline:</td><td class="value">${escapeHtml(rfq.timeline)}</td></tr>` : ""}
        </table>
      </div>

      <p><strong>Next Steps:</strong> A project engineer will review your scope, standard compliance requirements (AISC/CISC), and timeline, and will follow up with you promptly.</p>
      <p>If you have urgent updates or additional drawing sets to attach, you can reply directly to this email or contact us at <a href="mailto:quotes@caldimengg.com" style="color: #0284c7;">quotes@caldimengg.com</a>.</p>

      <p style="margin-top: 24px; color: #64748b; font-size: 13px;">
        Warm regards,<br />
        <strong style="color: #0f172a;">Caldim Engineering Services Team</strong><br />
        <a href="https://www.caldimengg.com" style="color: #64748b; text-decoration: none;">www.caldimengg.com</a>
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Caldim Engineering Pvt Ltd. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: fromAddress,
    to: toAddress,
    replyTo: replyToAddress,
    subject,
    text: textLines.join("\n"),
    html: htmlContent,
  });
}
