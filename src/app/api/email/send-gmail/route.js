import axios from "axios";
import { NextResponse } from "next/server";

function formatRecipientList(val) {
  if (!val) return "";
  if (Array.isArray(val)) {
    return val.filter(Boolean).map((e) => String(e).trim()).join(", ");
  }
  return String(val).trim();
}

function createRawEmail({ to, cc, bcc, from, subject, body, attachments = [] }) {
  const formattedTo = formatRecipientList(to);
  const formattedCc = formatRecipientList(cc);
  const formattedBcc = formatRecipientList(bcc);

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;

  const headers = [
    from ? `From: ${from}` : "",
    `To: ${formattedTo}`,
    formattedCc ? `Cc: ${formattedCc}` : "",
    formattedBcc ? `Bcc: ${formattedBcc}` : "",
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
  ].filter(Boolean);

  if (!attachments || attachments.length === 0) {
    headers.push('Content-Type: text/plain; charset="UTF-8"');
    headers.push("Content-Transfer-Encoding: 7bit");
    const fullMessage = `${headers.join("\r\n")}\r\n\r\n${body}`;
    return Buffer.from(fullMessage, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

  let message = headers.join("\r\n") + "\r\n\r\n";

  // Plain text body part
  message += `--${boundary}\r\n`;
  message += 'Content-Type: text/plain; charset="UTF-8"\r\n';
  message += "Content-Transfer-Encoding: 7bit\r\n\r\n";
  message += body + "\r\n\r\n";

  // Attachment parts
  for (const att of attachments) {
    if (!att.content) continue;
    const filename = att.filename || "attachment";
    const mimeType = att.mimeType || "application/octet-stream";
    const base64Data = att.content.replace(/^data:[^;]+;base64,/, "");

    message += `--${boundary}\r\n`;
    message += `Content-Type: ${mimeType}; name="${filename}"\r\n`;
    message += `Content-Disposition: attachment; filename="${filename}"\r\n`;
    message += `Content-Transfer-Encoding: base64\r\n\r\n`;
    message += `${base64Data}\r\n\r\n`;
  }

  message += `--${boundary}--`;

  return Buffer.from(message, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function POST(req) {
  try {
    const { accessToken, to, cc, bcc, subject, body, from, attachments = [] } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Google OAuth access token is required." },
        { status: 401 }
      );
    }

    const formattedTo = formatRecipientList(to);
    if (!formattedTo || !subject || !body) {
      return NextResponse.json(
        { success: false, message: "At least one recipient (to), subject, and email body are required." },
        { status: 400 }
      );
    }

    const raw = createRawEmail({ to, cc, bcc, from, subject, body, attachments });

    const gmailResponse = await axios.post(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      { raw },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: gmailResponse.data,
      message: "Email sent successfully via Gmail!",
    });
  } catch (error) {
    console.error("Failed to send email via Gmail API:", error.response?.data || error.message);
    const apiError = error.response?.data?.error?.message || error.message || "Failed to send email via Gmail";
    const status = error.response?.status || 500;

    return NextResponse.json(
      {
        success: false,
        message: apiError,
      },
      { status }
    );
  }
}
