import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Ziel-E-Mail-Adresse (wo die PDFs ankommen sollen) ──────────────
const EMPFAENGER_EMAIL = process.env.EMPFAENGER_EMAIL || 'kundenservice@notebook-pro.de';
const ABSENDER_EMAIL   = process.env.ABSENDER_EMAIL   || 'beleg@notebook-pro.de'; // muss verifizierte Resend-Domain sein

export default async function handler(req, res) {
  // CORS-Header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfBase64, filename, kundenName, kundenMail, datum } = req.body;

    if (!pdfBase64 || !filename) {
      return res.status(400).json({ error: 'PDF-Daten fehlen' });
    }

    // E-Mail mit PDF-Anhang senden
    const { data, error } = await resend.emails.send({
      from: `Notebook-Pro <${ABSENDER_EMAIL}>`,
      to: [EMPFAENGER_EMAIL],
      // Optional: Kopie auch an den Kunden schicken
      // cc: kundenMail ? [kundenMail] : [],
      subject: `Neuer Kaufbeleg – ${kundenName} – ${datum}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #56b5b5; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 1.5rem;">Notebook-Pro NPH GmbH</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0;">Neuer Kaufbeleg eingegangen</p>
          </div>
          <div style="background: #f8fafa; border: 1px solid #c8dede; border-top: none; padding: 28px 32px; border-radius: 0 0 12px 12px;">
            <p style="color: #1a1a2e; font-size: 1rem; margin: 0 0 16px;">
              Ein neuer Kaufbeleg wurde erstellt:
            </p>
            <table style="border-collapse: collapse; width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #4a4a6a; font-weight: 600; width: 140px;">Kunde:</td>
                <td style="padding: 8px 0; color: #1a1a2e;">${kundenName}</td>
              </tr>
              ${kundenMail ? `<tr>
                <td style="padding: 8px 0; color: #4a4a6a; font-weight: 600;">E-Mail:</td>
                <td style="padding: 8px 0; color: #1a1a2e;">${kundenMail}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 8px 0; color: #4a4a6a; font-weight: 600;">Datum:</td>
                <td style="padding: 8px 0; color: #1a1a2e;">${datum}</td>
              </tr>
            </table>
            <p style="color: #4a4a6a; font-size: 0.9rem; margin: 20px 0 0;">
              Der Kaufbeleg ist als PDF-Anhang beigefügt.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBase64, // Base64-String
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden', details: error });
    }

    return res.status(200).json({ success: true, id: data?.id });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Serverfehler', details: err.message });
  }
}
