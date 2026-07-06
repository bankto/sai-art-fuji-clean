'use strict';

/* =========================================================================
 * 設定・定数
 * ========================================================================= */
const PLACEHOLDER_TOKEN = '__RESEARCH_SITE_DATA_API_URL__';
const AUTO_REFRESH_MS = 5 * 60 * 1000;

// プレビュー/デザイン確認用のダミーデータ（本番APIが未設定のときのみ使用）
const MOCK_RECORDS = [
  {
    id: 'case-1',
    title: 'FREITAG',
    region: 'スイス',
    category: 'ブランド・製品',
    summary: '廃棄されたトラック幌を裁断・縫製し、一点もののバッグや財布に仕立てるチューリッヒ発のブランド。',
    urls: [{ raw: 'https://www.freitag.ch/', href: 'https://www.freitag.ch/' }],
  },
  {
    id: 'case-2',
    title: 'CopenHill',
    region: 'デンマーク',
    category: '施設',
    summary: 'ゴミ焼却発電施設の屋根に人工スキー場と展望テラスを重ねた複合建築。廃棄処理を都市の日常風景に組み込む。',
    urls: [{ raw: 'https://www.amagerbakke.dk/', href: 'https://www.amagerbakke.dk/' }],
  },
  {
    id: 'case-3',
    title: 'El Anatsui',
    region: 'ガーナ',
    category: 'アート',
    summary: '酒瓶のキャップや金属片を編み合わせ、巨大なタペストリー状の彫刻作品として発表する現代美術家。',
    urls: [{ raw: 'https://example.com/', href: 'https://example.com/' }],
  },
  {
    id: 'case-4',
    title: '瀬戸内海プラスチックアート・プロジェクト',
    region: '日本',
    category: 'アート',
    summary: '海岸に漂着したプラスチックごみを収集し、地域住民と協働で立体作品や展示を制作するプロジェクト。',
    urls: [],
  },
  {
    id: 'case-5',
    title: 'Precious Plastic',
    region: 'オランダ',
    category: 'プロダクト・ツール',
    summary: 'プラスチックごみを粉砕・成形する機械の設計図をオープンソースで公開し、世界中の制作拠点を支援する。',
    urls: [
      { raw: 'https://preciousplastic.com/', href: 'https://preciousplastic.com/' },
      { raw: 'https://community.preciousplastic.com/', href: 'https://community.preciousplastic.com/' },
    ],
  },
];

/* =========================================================================
 * DOM参照
 * ========================================================================= */
const root = document.querySelector('#appRoot');

function cleanConfiguredUrl(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed === PLACEHOLDER_TOKEN || trimmed.startsWith('__')) return '';
  return trimmed;
}

const apiUrl = cleanConfiguredUrl(root?.dataset.apiUrl || '');

let records = [];
let loading = false;
let refreshTimer = null;

const elements = {
  reload: document.querySelector('#reloadData'),
  resultCount: document.querySelector('#resultCount'),
  loadStatus: document.querySelector('#loadStatus'),
  lastFetched: document.querySelector('#lastFetched'),
  list: document.querySelector('#caseList'),
  empty: document.querySelector('#emptyState'),
  template: document.querySelector('#caseCardTemplate'),
};

/* =========================================================================
 * データ取得（触らない部分：ロジックは維持）
 * ========================================================================= */
async function fetchDataApi(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('APIの応答が正常ではありません（status: ' + response.status + '）');
  }
  return response.json();
}

function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = '__researchSiteJsonp_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
    const script = document.createElement('script');
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('JSONP取得がタイムアウトしました'));
    }, 12000);

    window[callbackName] = (payload) => {
      window.clearTimeout(timeoutId);
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      window.clearTimeout(timeoutId);
      cleanup();
      reject(new Error('JSONP取得に失敗しました'));
    };

    const joinChar = url.includes('?') ? '&' : '?';
    script.src = url + joinChar + 'callback=' + callbackName;
    document.head.appendChild(script);
  });
}

function normalizeApiRecords(payload) {
  const rawList = Array.isArray(payload) ? payload : Array.isArray(payload?.records) ? payload.records : [];

  return rawList
    .map((item, index) => {
      const urls = Array.isArray(item?.urls)
        ? item.urls
            .map((u) => ({
              raw: typeof u?.raw === 'string' ? u.raw : '',
              href: typeof u?.href === 'string' ? u.href : (typeof u?.raw === 'string' ? u.raw : ''),
            }))
            .filter((u) => u.href)
        : [];

      return {
        id: item?.id || 'case-' + (index + 1),
        title: (item?.title || '').toString().trim() || '(無題)',
        summary: (item?.summary || '').toString().trim(),
        selectionReason: (item?.selectionReason || '').toString().trim(),
        region: (item?.region || '').toString().trim(),
        category: (item?.category || '').toString().trim(),
        verificationStatus: (item?.verificationStatus || '').toString().trim(),
        urls,
      };
    })
    .filter((item) => item.title);
}

async function loadRecords(options = {}) {
  const { isManual = false } = options;
  if (loading) return;
  loading = true;
  updateReloadButtonState();
  setStatus(isManual ? '再取得しています…' : '取得しています…', 'loading');

  try {
    let payload;

    if (!apiUrl) {
      // API未設定：デザイン確認用のダミーデータを使用
      await new Promise((r) => window.setTimeout(r, 350));
      payload = { ok: true, generatedAt: new Date().toISOString(), records: MOCK_RECORDS };
    } else {
      try {
        payload = await fetchDataApi(apiUrl);
      } catch (fetchError) {
        payload = await fetchJsonp(apiUrl);
      }
    }

    records = normalizeApiRecords(payload);
    setLastFetched(new Date());
    setStatus(apiUrl ? '' : 'プレビュー用のダミーデータを表示しています。', apiUrl ? 'idle' : 'info');
  } catch (error) {
    setStatus('データの取得に失敗しました。しばらくしてから再度お試しください。', 'error');
  } finally {
    loading = false;
    updateReloadButtonState();
    render();
  }
}

/* =========================================================================
 * 描画（自由に変更してよい部分）
 * ========================================================================= */
function updateReloadButtonState() {
  if (!elements.reload) return;
  elements.reload.disabled = loading;
  elements.reload.textContent = loading ? '取得中…' : '再取得';
}

function setStatus(message, state) {
  if (!elements.loadStatus) return;
  elements.loadStatus.textContent = message || '';
  if (state) {
    elements.loadStatus.dataset.state = state;
  } else {
    delete elements.loadStatus.dataset.state;
  }
}

function setLastFetched(date) {
  if (!elements.lastFetched) return;
  const formatted = date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  elements.lastFetched.textContent = formatted;
  elements.lastFetched.setAttribute('datetime', date.toISOString());
}

function domainLabel(urlString) {
  try {
    const u = new URL(urlString);
    return u.hostname.replace(/^www\./, '');
  } catch (e) {
    return urlString;
  }
}

function createCard(record) {
  const fragment = elements.template.content.cloneNode(true);
  let card = fragment.querySelector('.case-item');
  const singleSourceUrl = record.urls.length === 1 ? record.urls[0] : null;

  const titleEl = fragment.querySelector('[data-field="title"]');
  if (titleEl) titleEl.textContent = record.title;

  const summaryEl = fragment.querySelector('[data-field="summary"]');
  if (summaryEl) {
    if (record.summary) {
      summaryEl.textContent = record.summary;
    } else {
      summaryEl.hidden = true;
    }
  }

  const selectionReasonBlock = fragment.querySelector('[data-field="selectionReasonBlock"]');
  const selectionReasonEl = fragment.querySelector('[data-field="selectionReason"]');
  if (selectionReasonBlock && selectionReasonEl) {
    if (record.selectionReason) {
      selectionReasonEl.textContent = record.selectionReason;
      selectionReasonBlock.hidden = false;
    } else {
      selectionReasonBlock.hidden = true;
    }
  }

  const regionEl = fragment.querySelector('[data-field="region"]');
  if (regionEl) regionEl.textContent = record.region || '地域未設定';

  const categoryEl = fragment.querySelector('[data-field="category"]');
  if (categoryEl) categoryEl.textContent = record.category || '種別未設定';

  const verificationStatusBlock = fragment.querySelector('[data-field="verificationStatusBlock"]');
  const verificationStatusEl = fragment.querySelector('[data-field="verificationStatus"]');
  if (verificationStatusBlock && verificationStatusEl) {
    if (record.verificationStatus) {
      verificationStatusEl.textContent = record.verificationStatus;
      verificationStatusBlock.hidden = false;
    } else {
      verificationStatusBlock.hidden = true;
    }
  }

  const linksEl = fragment.querySelector('[data-field="links"]');
  if (linksEl) {
    if (singleSourceUrl) {
      const source = document.createElement('span');
      source.className = 'case-item__source';
      source.textContent = domainLabel(singleSourceUrl.raw || singleSourceUrl.href);
      linksEl.appendChild(source);
    } else {
      record.urls.forEach((urlInfo) => {
        const link = document.createElement('a');
        link.className = 'case-item__link';
        link.href = urlInfo.href;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.textContent = domainLabel(urlInfo.raw || urlInfo.href);
        linksEl.appendChild(link);
      });
    }
  }

  if (singleSourceUrl) {
    const linkedCard = document.createElement('a');
    linkedCard.className = card.className;
    linkedCard.href = singleSourceUrl.href;
    linkedCard.target = '_blank';
    linkedCard.rel = 'noreferrer';

    while (card.firstChild) {
      linkedCard.appendChild(card.firstChild);
    }

    card.replaceWith(linkedCard);
    card = linkedCard;
  }

  return card;
}

function render() {
  if (!elements.list) return;
  elements.list.innerHTML = '';

  const hasRecords = records.length > 0;
  if (elements.empty) elements.empty.hidden = hasRecords;

  if (hasRecords) {
    const fragment = document.createDocumentFragment();
    records.forEach((record) => {
      fragment.appendChild(createCard(record));
    });
    elements.list.appendChild(fragment);
  }

  if (elements.resultCount) {
    elements.resultCount.textContent = hasRecords ? records.length + '件を表示中' : '';
  }
}

/* =========================================================================
 * 初期化
 * ========================================================================= */
function scheduleAutoRefresh() {
  if (refreshTimer) window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(() => {
    loadRecords({ isManual: false });
  }, AUTO_REFRESH_MS);
}

elements.reload?.addEventListener('click', () => {
  loadRecords({ isManual: true });
});

loadRecords({ isManual: false });
scheduleAutoRefresh();
