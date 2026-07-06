const SPREADSHEET_ID = '1YJvTTgZVr9lKFffyKpsqkbbNWuNzyMDlao0iZhgF8t0';
const SHEET_GID = 0;

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  const payload = buildPayload_();
  const body = JSON.stringify(payload);

  if (callback) {
    return ContentService.createTextOutput(`${callback}(${body});`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function buildPayload_() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getSheetByGid_(spreadsheet, SHEET_GID) || spreadsheet.getSheets()[0];
    const values = sheet.getDataRange().getDisplayValues();

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      records: normalizeRecords_(values),
    };
  } catch (error) {
    return {
      ok: false,
      generatedAt: new Date().toISOString(),
      error: error && error.message ? error.message : String(error),
      records: [],
    };
  }
}

function getSheetByGid_(spreadsheet, gid) {
  return spreadsheet.getSheets().find((sheet) => sheet.getSheetId() === gid) || null;
}

function normalizeRecords_(rows) {
  const headerIndex = rows.findIndex((row) => {
    const headers = row.map(normalizeHeader_);
    return headers.indexOf('タイトル') >= 0 && headers.indexOf('URL') >= 0;
  });

  if (headerIndex < 0) {
    return [];
  }

  const headers = rows[headerIndex].map(normalizeHeader_);

  return rows
    .slice(headerIndex + 1)
    .map((row, index) => {
      const sourceText = pick_(row, headers, 'URL');
      return {
        id: `case-${index + 1}`,
        title: pick_(row, headers, 'タイトル'),
        summary: pick_(row, headers, 'summary', 'Summary', '概要'),
        selectionReason: pick_(row, headers, '選定理由'),
        region: pick_(row, headers, '国&地域', '国・地域'),
        category: pick_(row, headers, 'カテゴリ'),
        verificationStatus: pick_(row, headers, '検証状態'),
        urls: splitSourceUrls_(sourceText),
      };
    })
    .filter((record) => {
      return [record.title, record.summary, record.region, record.category].some(Boolean) || record.urls.length > 0;
    });
}

function splitSourceUrls_(sourceText) {
  return String(sourceText || '')
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((raw) => {
      return {
        raw,
        href: normalizeHref_(raw),
      };
    });
}

function normalizeHref_(raw) {
  const value = String(raw || '').trim();
  return /^https?:\/\//.test(value) ? value : '';
}

function pick_(row, headers, ...names) {
  const index = names.map((name) => headers.indexOf(name)).find((currentIndex) => currentIndex >= 0);
  return index === undefined ? '' : normalizeCell_(row[index] || '');
}

function normalizeHeader_(value) {
  return normalizeCell_(value).replace(/^\uFEFF/, '');
}

function normalizeCell_(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}
