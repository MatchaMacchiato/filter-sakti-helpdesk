import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

const SPREADSHEET_NAME = 'Salinan dari NEW GDOC WSA FULFILLMENT';

const SHEET_NAME_MAP: Record<string, string | null> = {
  WSA: null,         // null = sheet pertama
  WAPPR: null,       // null = sheet pertama
  MODOROSO: 'MODOROSO_JAKTIMSEL',
};

const CHECK_COL_MAP: Record<string, string> = {
  WSA:      'SC Order No/Track ID/CSRM No',
  WAPPR:    'Workorder',
  MODOROSO: 'Workorder',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { mode } = req.query;
  if (!mode || typeof mode !== 'string') {
    return res.status(400).json({ error: 'Missing ?mode= parameter' });
  }

  const modeUpper = mode.toUpperCase();

  // Cek env vars wajib
  const missing = ['GCP_PRIVATE_KEY', 'GCP_CLIENT_EMAIL', 'GCP_PROJECT_ID'].filter(k => !process.env[k]);
  if (missing.length > 0) {
    return res.status(500).json({
      error: `Missing env vars: ${missing.join(', ')}. Set in Vercel → Settings → Environment Variables.`,
    });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GCP_PROJECT_ID,
        private_key_id: process.env.GCP_PRIVATE_KEY_ID,
        private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/"/g, ''),
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

    // Cari spreadsheet by nama (sama seperti gspread client.open())
    const driveRes = await drive.files.list({
      q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id,name)',
      pageSize: 1,
    });

    const file = driveRes.data.files?.[0];
    if (!file?.id) {
      return res.status(404).json({
        error: `Spreadsheet "${SPREADSHEET_NAME}" tidak ditemukan. Pastikan service account sudah diberi akses ke file tsb.`,
      });
    }

    const spreadsheetId = file.id;
    const namedSheet = SHEET_NAME_MAP[modeUpper];
    let sheetTitle: string;

    if (namedSheet) {
      sheetTitle = namedSheet;
    } else {
      // Ambil nama sheet pertama
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

    const headers = rows[0] as string[];
    // Trim whitespace on headers to avoid invisible mismatch
    const colIdx = headers.findIndex(h => h.trim() === checkCol.trim());
    const ids: string[] = colIdx >= 0
      ? rows.slice(1)
          .map(r => String(r[colIdx] ?? '')
            .trim()
            .replace(/\.0$/, '')   // strip float suffix
            .split('_')[0]         // strip _suffix (same as Python x.split('_')[0])
            .trim())
          .filter(Boolean)
      : [];

    return res.status(200).json({
      ids,
      checkColumn: checkCol,
      sheetName: sheetTitle,
      totalRows: rows.length - 1,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/sheets]', message);
    return res.status(500).json({ error: message });
  }
}
