const DEFAULT_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1YJvTTgZVr9lKFffyKpsqkbbNWuNzyMDlao0iZhgF8t0/export?format=csv&gid=0';
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const THUMBNAIL_TIMEOUT_MS = 4500;
const EXPECTED_COLUMNS = ['国&地域', 'タイトル', 'URL', '概要', 'カテゴリ'];

const root = document.querySelector('#appRoot');
const csvUrl = root?.dataset.csvUrl || DEFAULT_CSV_URL;
const thumbnailCache = new Map();

let records = [];
let loading = false;

const elements = {
  keyword: document.querySelector('#keywordSearch'),
  region: document.querySelector('#regionFilter'),
  category: document.querySelector('#categoryFilter'),
  reload: document.querySelector('#reloadData'),
  reset: document.querySelector('#resetFilters'),
  resultCount: document.querySelector('#resultCount'),
  loadStatus: document.querySelector('#loadStatus'),
  lastFetched: document.querySelector('#lastFetched'),
  csvLink: document.querySelector('#csvLink'),
  list: document.querySelector('#caseList'),
  empty: document.querySelector('#emptyState'),
  template: document.querySelector('#caseCardTemplate'),
};

initialize();

function initialize() {
  elements.csvLink.href = csvUrl;
  refreshFilterOptions();

  [elements.keyword, elements.region, elements.category].forEach((element) => {
    element.addEventListener('input', render);
    element.addEventListener('change', render);
  });

  elements.reload.addEventListener('click', () => {
    loadRecords({ silent: false });
  });

  elements.reset.addEventListener('click', () => {
    elements.keyword.value = '';
    elements.region.value = '';
    elements.category.value = '';
    render();
    elements.keyword.focus();
  });

  render();
  loadRecords({ silent: false });
  window.setInterval(() => loadRecords({ silent: true }), AUTO_REFRESH_MS);
}

async function loadRecords({ silent = false } = {}) {
  if (loading) {
    return;
  }

  loading = true;
  elements.reload.disabled = true;
  if (!silent) {
    setStatus('公開CSVを取得しています。');
  }
  render();

  let statusMessage = elements.loadStatus.textContent;
  let statusIsError = false;
  try {
    const csv = await fetchCsv(csvUrl);
    records = normalizeRecords(parseCsv(csv));
    refreshFilterOptions();
    updateFetchedAt(new Date());
    statusMessage = `${records.length}件を取得しました。`;
  } catch (error) {
    console.error('Failed to load CSV.', error);
    statusMessage = 'CSVを取得できませんでした。公開設定またはCORSを確認してください。';
    statusIsError = true;
  } finally {
    loading = false;
    elements.reload.disabled = false;
    render();
    setStatus(statusMessage, statusIsError);
  }
}

async function fetchCsv(url) {
  const response = await fetch(cacheBustedUrl(url), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`CSV fetch failed with HTTP ${response.status}.`);
  }
  return response.text();
}

function cacheBustedUrl(url) {
  const nextUrl = new URL(url, window.location.href);
  nextUrl.searchParams.set('_', Date.now().toString());
  return nextUrl.toString();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
      continue;
    }

    if (char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (char === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      if (text[index + 1] === '\n') {
        index += 1;
      }
      continue;
    }

    if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some((value) => normalizeCell(value)));
}

function normalizeRecords(rows) {
  const headerIndex = rows.findIndex((row) => {
    const normalized = row.map(normalizeHeader);
    return normalized.includes('タイトル') && normalized.includes('URL');
  });

  if (headerIndex === -1) {
    console.warn('CSV header row was not found.');
    return [];
  }

  const headers = rows[headerIndex].map(normalizeHeader);
  const missingColumns = EXPECTED_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length > 0) {
    console.warn(`Missing expected columns: ${missingColumns.join(', ')}`);
  }

  return rows
    .slice(headerIndex + 1)
    .map((row, index) => {
      const sourceText = pick(row, headers, 'URL');
      return {
        id: `case-${index + 1}`,
        region: pick(row, headers, '国&地域', '国・地域'),
        title: pick(row, headers, 'タイトル'),
        sourceText,
        urls: splitSourceUrls(sourceText),
        summary: pick(row, headers, '概要'),
        category: pick(row, headers, 'カテゴリ'),
        verification: pick(row, headers, '検証状態'),
      };
    })
    .filter((record) =>
      [record.region, record.title, record.sourceText, record.summary, record.category, record.verification].some(
        Boolean,
      ),
    );
}

function render() {
  const filteredRecords = filterRecords();
  const fragment = document.createDocumentFragment();

  filteredRecords.forEach((record) => {
    fragment.appendChild(createCard(record));
  });

  elements.list.replaceChildren(fragment);
  elements.empty.hidden = filteredRecords.length !== 0;
  elements.empty.textContent = records.length === 0 ? '表示できる事例がありません。' : '条件に一致する事例がありません。';
  elements.resultCount.textContent = loading
    ? '読み込み中'
    : `${records.length}件中 ${filteredRecords.length}件を表示`;
}

function filterRecords() {
  const keyword = normalizeForSearch(elements.keyword.value);
  const region = elements.region.value;
  const category = elements.category.value;

  return records.filter((record) => {
    const matchesRegion = !region || record.region === region;
    const matchesCategory = !category || record.category === category;
    const searchTarget = normalizeForSearch(
      [record.title, record.region, record.summary, record.category, record.sourceText, record.verification].join(' '),
    );
    const matchesKeyword = !keyword || searchTarget.includes(keyword);

    return matchesRegion && matchesCategory && matchesKeyword;
  });
}

function createCard(record) {
  const fragment = elements.template.content.cloneNode(true);
  const card = fragment.querySelector('.case-card');

  card.dataset.recordId = record.id;
  setText(card, '[data-field="region"]', record.region || '国・地域未設定');
  setText(card, '[data-field="category"]', record.category || 'カテゴリ未設定');
  setText(card, '[data-field="title"]', record.title || 'タイトル未設定');
  setText(card, '[data-field="summary"]', record.summary || '概要未設定');

  const verification = card.querySelector('[data-field="verification"]');
  if (record.verification) {
    verification.textContent = record.verification;
    verification.hidden = false;
  }

  const linkList = card.querySelector('[data-field="links"]');
  appendLinks(linkList, record.urls);
  loadThumbnail(record, card);

  return fragment;
}

function appendLinks(container, urls) {
  const validUrls = urls.map(normalizeUrlEntry).filter((url) => url.raw);

  if (validUrls.length === 0) {
    const missing = document.createElement('span');
    missing.className = 'missing-link';
    missing.textContent = 'URL未設定';
    container.appendChild(missing);
    return;
  }

  validUrls.forEach((url, index) => {
    if (!url.href) {
      const plainText = document.createElement('span');
      plainText.className = 'source-link source-link--plain';
      plainText.textContent = url.raw;
      container.appendChild(plainText);
      return;
    }

    const link = document.createElement('a');
    link.className = 'source-link';
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.title = url.raw;
    link.textContent = `${index + 1}. ${labelForUrl(url.href)}`;
    container.appendChild(link);
  });
}

async function loadThumbnail(record, card) {
  const firstUrl = record.urls.find((url) => url.href)?.href;
  if (!firstUrl) {
    return;
  }

  const imageUrl = await getThumbnail(firstUrl);
  if (!imageUrl || !card.isConnected) {
    return;
  }

  const thumbnail = card.querySelector('[data-field="thumbnail"]');
  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = '';
  image.loading = 'lazy';
  image.decoding = 'async';
  thumbnail.replaceChildren(image);
  thumbnail.classList.add('has-image');
}

function getThumbnail(pageUrl) {
  if (!thumbnailCache.has(pageUrl)) {
    thumbnailCache.set(
      pageUrl,
      fetchOpenGraphImage(pageUrl).catch(() => ''),
    );
  }
  return thumbnailCache.get(pageUrl);
}

async function fetchOpenGraphImage(pageUrl) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), THUMBNAIL_TIMEOUT_MS);

  try {
    const response = await fetch(pageUrl, {
      cache: 'force-cache',
      signal: controller.signal,
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return '';
    }

    const html = await response.text();
    const documentFragment = new DOMParser().parseFromString(html, 'text/html');
    const image =
      findMetaContent(documentFragment, 'meta[property="og:image"]') ||
      findMetaContent(documentFragment, 'meta[property="og:image:url"]') ||
      findMetaContent(documentFragment, 'meta[name="twitter:image"]');

    return normalizeImageUrl(image, pageUrl);
  } finally {
    window.clearTimeout(timeout);
  }
}

function findMetaContent(documentFragment, selector) {
  return documentFragment.querySelector(selector)?.getAttribute('content') || '';
}

function normalizeImageUrl(value, baseUrl) {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value, baseUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function normalizeUrlEntry(url) {
  return {
    raw: text(url.raw),
    href: text(url.href),
  };
}

function labelForUrl(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}

function refreshFilterOptions() {
  fillSelect(elements.region, uniqueValues('region'), elements.region.value);
  fillSelect(elements.category, uniqueValues('category'), elements.category.value);
}

function fillSelect(select, values, currentValue = '') {
  select.replaceChildren(new Option('すべて', ''));
  values.forEach((value) => {
    select.appendChild(new Option(value, value));
  });
  select.value = values.includes(currentValue) ? currentValue : '';
}

function uniqueValues(field) {
  return [...new Set(records.map((record) => record[field]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ja'),
  );
}

function setText(root, selector, value) {
  const element = root.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function splitSourceUrls(sourceText) {
  return sourceText
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((raw) => ({
      raw,
      href: normalizeHref(raw),
    }));
}

function normalizeHref(raw) {
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function pick(row, headers, ...names) {
  const index = names.map((name) => headers.indexOf(name)).find((currentIndex) => currentIndex >= 0);
  return index === undefined ? '' : normalizeCell(row[index] || '');
}

function normalizeHeader(value) {
  return normalizeCell(value).replace(/^\uFEFF/, '');
}

function normalizeCell(value = '') {
  return String(value).replace(/\r\n/g, '\n').trim();
}

function setStatus(message, isError = false) {
  elements.loadStatus.textContent = message;
  elements.loadStatus.classList.toggle('is-error', isError);
}

function updateFetchedAt(date) {
  const label = new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);

  elements.lastFetched.dateTime = date.toISOString();
  elements.lastFetched.textContent = label;
}

function normalizeForSearch(value) {
  return text(value).normalize('NFKC').toLocaleLowerCase('ja-JP');
}

function text(value) {
  return value == null ? '' : String(value).trim();
}
