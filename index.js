const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const nodemailer = require('nodemailer');

const NOTIFY_EMAIL = 'kenndanield@gmail.com';

// Stored via: firebase functions:secrets:set GMAIL_APP_PASSWORD
// (a Gmail App Password, NOT your normal Gmail password — see setup steps)
const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD');

exports.notifyOnNewMessage = onDocumentCreated(
  {
    document: 'messages/{messageId}',
    secrets: [gmailAppPassword],
    region: 'asia-southeast1' // closest Firebase region to the Philippines
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.warn('No snapshot data on event, skipping.');
      return;
    }

    const data = snap.data();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: NOTIFY_EMAIL,
        pass: gmailAppPassword.value()
      }
    });

    const mailOptions = {
      from: `"KennDev Portfolio" <${NOTIFY_EMAIL}>`,
      to: NOTIFY_EMAIL,
      replyTo: data.email,
      subject: `[Portfolio] ${data.subject || 'New message from ' + data.name}`,
      text:
        `New message from your portfolio contact form:\n\n` +
        `Name: ${data.name}\n` +
        `Email: ${data.email}\n` +
        `Subject: ${data.subject}\n\n` +
        `Message:\n${data.message}\n`,
      html:
        `<h2 style="margin:0 0 12px;">New portfolio contact message</h2>` +
        `<p><strong>Name:</strong> ${escapeHtml(data.name)}</p>` +
        `<p><strong>Email:</strong> ${escapeHtml(data.email)}</p>` +
        `<p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>` +
        `<p><strong>Message:</strong><br>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
      // Admin SDK bypasses Firestore security rules, so this update is allowed
      // even though clients themselves cannot update messages.
      await snap.ref.update({ status: 'notified' });
      logger.info(`Notification email sent for message ${event.params.messageId}`);
    } catch (err) {
      logger.error('Failed to send notification email:', err);
      await snap.ref.update({ status: 'notify_failed' });
    }
  }
);

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
