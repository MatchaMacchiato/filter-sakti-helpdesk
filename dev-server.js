/**
 * Local API dev server — mimics Vercel serverless function locally.
 * Runs on port 3001 and serves /api/sheets endpoint.
 * Vite dev server proxies /api requests here.
 */
import 'dotenv/config';
import express from 'express';
import { google } from 'googleapis';

const app = express();
const PORT = 3001;

const SPREADSHEET_NAME = 'Salinan dari NEW GDOC WSA FULFILLMENT';

const SHEET_NAME_MAP = {
  WSA: null,
  WAPPR: null,
  MODOROSO: 'MODOROSO_JAKTIMSEL',
};

const CHECK_COL_MAP = {
  WSA: 'SC Order No/Track ID/CSRM No',
  WAPPR: 'Workorder',
  MODOROSO: 'Workorder',
};

app.get('/api/sheets', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { mode } = req.query;
  if (!mode || typeof mode !== 'string') {
    return res.status(400).json({ error: 'Missing ?mode= parameter' });
  }

  const modeUpper = mode.toUpperCase();

  const missing = ['GCP_PRIVATE_KEY', 'GCP_CLIENT_EMAIL', 'GCP_PROJECT_ID'].filter(k => !process.env[k]);
  if (missing.length > 0) {
    return res.status(500).json({
      error: `Missing env vars: ${missing.join(', ')}. Pastikan file .env sudah diisi dengan benar.`,
    });
  }

  try {
    // Clean private key — handle various .env formatting quirks
    let privateKey = process.env.GCP_PRIVATE_KEY || '';
    privateKey = privateKey.replace(/^"|"$/g, '');   // strip surrounding quotes
    privateKey = privateKey.replace(/\\n/g, '\n');     // convert literal \n to newlines

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GCP_PROJECT_ID,
        private_key_id: process.env.GCP_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.GCP_CLIENT_EMAIL,
        client_id: process.env.GCP_CLIENT_ID,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    });

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    const driveRes = await drive.files.list({
      q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id,name)',
      pageSize: 1,
    });

    const file = driveRes.data.files?.[0];
    if (!file?.id) {
      return res.status(404).json({
        error: `Spreadsheet "${SPREADSHEET_NAME}" tidak ditemukan. Pastikan service account sudah diberi akses.`,
      });
    }

    const spreadsheetId = file.id;
    const namedSheet = SHEET_NAME_MAP[modeUpper];
    let sheetTitle;

    if (namedSheet) {
      sheetTitle = namedSheet;
    } else {
      const meta = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title',
      });
      sheetTitle = meta.data.sheets?.[0]?.properties?.title ?? 'Sheet1';
    }

    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A:ZZ`,
    });

    const rows = dataRes.data.values ?? [];
    const checkCol = CHECK_COL_MAP[modeUpper] ?? 'Workorder';

    if (rows.length < 2) {
      return res.status(200).json({ ids: [], checkColumn: checkCol, sheetName: sheetTitle, totalRows: 0 });
    }

    const headers = rows[0];
    const colIdx = headers.findIndex(h => h.trim() === checkCol.trim());
    const ids = colIdx >= 0
      ? rows.slice(1)
          .map(r => String(r[colIdx] ?? '').trim().replace(/\.0$/, '').split('_')[0].trim())
          .filter(Boolean)
      : [];

    return res.status(200).json({
      ids,
      checkColumn: checkCol,
      sheetName: sheetTitle,
      totalRows: rows.length - 1,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/sheets]', message);
    return res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API dev server running at http://localhost:${PORT}`);
  console.log(`   Endpoint: http://localhost:${PORT}/api/sheets?mode=WSA`);
});
