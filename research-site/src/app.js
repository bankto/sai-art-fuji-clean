const DEFAULT_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1YJvTTgZVr9lKFffyKpsqkbbNWuNzyMDlao0iZhgF8t0/export?format=csv&gid=0';
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const THUMBNAIL_TIMEOUT_MS = 4500;

const root = document.querySelector('#appRoot');
const csvUrl = root?.dataset.csvUrl || DEFAULT_CSV_URL;
const apiUrl = cleanConfiguredUrl(root?.dataset.apiUrl || '');
const thumbnailCache = new Map();

let records = [];
let loading = false;

const elements = {
  reload: document.querySelector('#reloadData'),
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
  elements.csvLink.href = apiUrl || csvUrl;
  elements.csvLink.textContent = apiUrl ? '中継API' : '公開CSV';

  elements.reload.addEventListener('click', () => {
    loadRecords({ silent: false });
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
    setStatus('中継APIからデータを取得しています。');
  }
  render();

  let statusMessage = elements.loadStatus.textContent;
  let statusIsError = false;
  try {
    if (!apiUrl) {
      throw new Error('Apps Script API URL is not configured.');
    }

    const payload = await fetchDataApi(apiUrl);
    records = normalizeApiRecords(payload);
    updateFetchedAt(new Date());
    statusMessage = `${records.length}件を取得しました。`;
  } catch (error) {
    console.error('Failed to load data.', error);
    statusMessage = apiUrl
      ? 'データを取得できませんでした。中継APIのURLと公開設定を確認してください。'
      : '中継APIのURLが未設定です。READMEのApps Script設定手順を確認してください。';
    statusIsError = true;
  } finally {
    loading = false;
    elements.reload.disabled = false;
    render();
    setStatus(statusMessage, statusIsError);
  }
}

async function fetchDataApi(url) {
  try {
    const response = await fetch(cacheBustedUrl(url), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`API fetch failed with HTTP ${response.status}.`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Falling back to JSONP for the data API.', error);
    return fetchJsonp(url);
  }
}

function cacheBustedUrl(url) {
  const nextUrl = new URL(url, window.location.href);
  nextUrl.searchParams.set('_', Date.now().toString());
  return nextUrl.toString();
}

function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `__researchSiteData_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('JSONP request timed out.'));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    }

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP request failed.'));
    };
    script.src = withQueryParams(url, {
      callback: callbackName,
      _: Date.now().toString(),
    });
    document.head.appendChild(script);
  });
}

function withQueryParams(url, params) {
  const nextUrl = new URL(url, window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    nextUrl.searchParams.set(key, value);
  });
  return nextUrl.toString();
}

function normalizeApiRecords(payload) {
  if (payload?.ok === false) {
    throw new Error(payload.error || 'Data API returned an error.');
  }

  const rawRecords = Array.isArray(payload) ? payload : payload?.records;
  if (!Array.isArray(rawRecords)) {
    throw new Error('Data API response does not contain records.');
  }

  return rawRecords
    .map((record, index) => {
      const sourceText = text(pickObject(record, 'sourceText', 'url', 'URL'));
      const urls = Array.isArray(record.urls) ? record.urls.map(normalizeUrlEntry) : splitSourceUrls(sourceText);
      return {
        id: text(record.id) || `case-${index + 1}`,
        region: text(pickObject(record, 'region', '国&地域', '国・地域')),
        title: text(pickObject(record, 'title', 'タイトル')),
        sourceText,
        urls,
        summary: text(pickObject(record, 'summary', '概要')),
        category: text(pickObject(record, 'category', 'カテゴリ')),
        verification: text(pickObject(record, 'verification', '検証状態')),
      };
    })
    .filter((record) =>
      [record.region, record.title, record.sourceText, record.summary, record.category, record.verification].some(
        Boolean,
      ),
    );
}

function render() {
  const fragment = document.createDocumentFragment();

  records.forEach((record) => {
    fragment.appendChild(createCard(record));
  });

  elements.list.replaceChildren(fragment);
  elements.empty.hidden = records.length !== 0;
  elements.empty.textContent = '表示できる事例がありません。';
  elements.resultCount.textContent = loading ? '読み込み中' : `${records.length}件を表示中`;
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
  if (typeof url === 'string') {
    return {
      raw: url.trim(),
      href: normalizeHref(url),
    };
  }

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

function cleanConfiguredUrl(value) {
  const nextValue = text(value);
  return nextValue.startsWith('__') ? '' : nextValue;
}

function pickObject(object, ...names) {
  return names.map((name) => object?.[name]).find((value) => value != null) || '';
}

function text(value) {
  return value == null ? '' : String(value).trim();
}
