// =============================================
// 狀態管理
// =============================================
const state = {
  files: [],
  isProcessing: false,
};

let nextId = 1;

// =============================================
// DOM 元素
// =============================================
const uploadZone       = document.getElementById('upload-zone');
const fileInput        = document.getElementById('file-input');
const uploadBtnTrigger = document.getElementById('upload-btn-trigger');
const qualitySlider    = document.getElementById('quality-slider');
const qualityDisplay   = document.getElementById('quality-display');
const formatGroup      = document.getElementById('format-group');
const maxWidthInput    = document.getElementById('max-width');
const actionBar        = document.getElementById('action-bar');
const fileCountEl      = document.getElementById('file-count');
const imageListSection = document.getElementById('image-list-section');
const imageList        = document.getElementById('image-list');
const compressBtn      = document.getElementById('compress-btn');
const downloadAllBtn   = document.getElementById('download-all-btn');
const clearAllBtn      = document.getElementById('clear-all-btn');
const addMoreBtn       = document.getElementById('add-more-btn');
const summaryBar       = document.getElementById('summary-bar');
const toastContainer   = document.getElementById('toast-container');

// =============================================
// 工具函式
// =============================================
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getSelectedFormat() {
  const active = formatGroup.querySelector('.format-btn.active');
  return active ? active.dataset.format : 'jpeg';
}

function getMimeType(format) {
  const map = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', original: null };
  return map[format] || 'image/jpeg';
}

function getExtension(format, originalName) {
  if (format === 'original') {
    const ext = originalName.split('.').pop().toLowerCase();
    return ext;
  }
  const map = { jpeg: 'jpg', png: 'png', webp: 'webp' };
  return map[format] || 'jpg';
}

function showToast(message, type = 'default', duration = 3000) {
  const icons = {
    success: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    default: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = (icons[type] || icons.default) + `<span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// =============================================
// UI 更新
// =============================================
function updateUI() {
  const count = state.files.length;
  fileCountEl.textContent = count;
  actionBar.style.display = count > 0 ? 'flex' : 'none';
  imageListSection.classList.toggle('visible', count > 0);

  const doneCount = state.files.filter(f => f.status === 'done' && f.downloadUrl).length;
  downloadAllBtn.style.display = doneCount > 0 ? 'inline-flex' : 'none';

  // 統計摘要
  if (doneCount > 0) {
    summaryBar.classList.add('visible');
    const totalOriginal = state.files.filter(f => f.status === 'done').reduce((s, f) => s + f.originalSize, 0);
    const totalCompressed = state.files.filter(f => f.status === 'done').reduce((s, f) => s + (f.resultSize || 0), 0);
    const saved = totalOriginal - totalCompressed;
    const savedPct = totalOriginal > 0 ? Math.round((saved / totalOriginal) * 100) : 0;
    document.getElementById('stat-count').textContent = doneCount;
    document.getElementById('stat-original').textContent = formatBytes(totalOriginal);
    document.getElementById('stat-compressed').textContent = formatBytes(totalCompressed);
    document.getElementById('stat-saved').textContent = `${savedPct}% (${formatBytes(saved)})`;
  } else {
    summaryBar.classList.remove('visible');
  }
}

function renderImageList() {
  imageList.innerHTML = '';
  state.files.forEach(item => {
    const el = createImageItemEl(item);
    imageList.appendChild(el);
  });
  updateUI();
}

function createImageItemEl(item) {
  const div = document.createElement('div');
  div.className = `image-item ${item.status}`;
  div.dataset.id = item.id;

  // 縮圖
  let thumbHtml = '';
  if (item.thumbUrl) {
    thumbHtml = `<img class="image-thumb" src="${item.thumbUrl}" alt="${item.name}" />`;
  } else {
    thumbHtml = `<div class="image-thumb-placeholder"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
  }

  // 狀態徽章
  const statusMap = {
    waiting:    { label: '等待中',  icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', cls: 'waiting' },
    processing: { label: '處理中',  icon: '<div class="spinner dark"></div>',                                                                        cls: 'processing' },
    done:       { label: '完成',    icon: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',                                       cls: 'done' },
    error:      { label: '失敗',    icon: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', cls: 'error' },
  };
  const s = statusMap[item.status] || statusMap.waiting;
  const statusBadge = `<span class="status-badge ${s.cls}">${s.icon}${s.label}</span>`;

  // 大小資訊（節省比例移到獨立的醒目徽章，不再塞在這裡）
  let sizeInfo = `<span class="meta-tag">${formatBytes(item.originalSize)}</span>`;
  let savedBadge = '';
  if (item.status === 'done' && item.resultSize) {
    const pct = Math.round(((item.originalSize - item.resultSize) / item.originalSize) * 100);
    sizeInfo += `<span class="meta-arrow">→</span><span class="meta-tag">${formatBytes(item.resultSize)}</span>`;
    if (pct > 0) {
      savedBadge = `
        <div class="saved-badge">
          <span class="saved-badge-value">-${pct}%</span>
          <span class="saved-badge-label">已節省</span>
        </div>`;
    }
  }

  // 進度條
  const progressHtml = (item.status === 'processing')
    ? `<div class="progress-wrap"><div class="progress-bar-bg"><div class="progress-bar-fill" id="progress-${item.id}" style="width:${item.progress || 0}%"></div></div></div>`
    : (item.status === 'done' ? `<div class="progress-wrap"><div class="progress-bar-bg"><div class="progress-bar-fill done" style="width:100%"></div></div></div>` : '');

  // 下載按鈕
  const downloadBtn = item.status === 'done'
    ? `<button class="icon-btn download" data-action="download" data-id="${item.id}" title="下載">
         <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
       </button>` : '';

  div.innerHTML = `
    ${thumbHtml}
    <div class="image-info">
      <div class="image-name" title="${item.name}">${item.name}</div>
      <div class="image-meta">${sizeInfo}${statusBadge}</div>
      ${progressHtml}
    </div>
    ${savedBadge}
    <div class="item-actions">
      ${downloadBtn}
      <button class="icon-btn remove" data-action="remove" data-id="${item.id}" title="移除">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;

  return div;
}

function updateItemEl(item) {
  const existing = imageList.querySelector(`[data-id="${item.id}"]`);
  if (!existing) return;
  const newEl = createImageItemEl(item);
  imageList.replaceChild(newEl, existing);
}

// =============================================
// 檔案處理
// =============================================
function addFiles(files) {
  const MAX = 20;
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  let added = 0;

  for (const file of files) {
    if (state.files.length >= MAX) {
      showToast(`最多只能同時處理 ${MAX} 張圖片`, 'warning');
      break;
    }
    if (!allowed.includes(file.type)) {
      showToast(`不支援的格式：${file.name}`, 'error');
      continue;
    }

    const id = nextId++;
    const item = {
      id, file,
      name: file.name,
      originalSize: file.size,
      status: 'waiting',
      thumbUrl: null,
      resultBlob: null,
      resultSize: null,
      progress: 0,
    };

    // 生成縮圖
    const reader = new FileReader();
    reader.onload = (e) => {
      item.thumbUrl = e.target.result;
      updateItemEl(item);
    };
    reader.readAsDataURL(file);

    state.files.push(item);
    added++;
  }

  if (added > 0) {
    renderImageList();
    showToast(`已新增 ${added} 張圖片`, 'success');
  }
}

function removeFile(id) {
  const idx = state.files.findIndex(f => f.id === id);
  if (idx !== -1) {
    state.files.splice(idx, 1);
    renderImageList();
  }
}

function clearAll() {
  state.files = [];
  renderImageList();
  downloadAllBtn.style.display = 'none';
  summaryBar.classList.remove('visible');
}

// =============================================
// 圖片壓縮核心（呼叫後端 /images/process API）
// =============================================
async function compressImage(item) {
  const format = getSelectedFormat();
  const quality = parseInt(qualitySlider.value);
  const maxW = parseInt(maxWidthInput.value) || null;

  const fd = new FormData();
  fd.append('image', item.file);
  fd.append('format', format);
  fd.append('quality', quality);
  if (maxW) fd.append('maxWidth', maxW);

  const res = await fetch('/images/process', { method: 'POST', body: fd });
  const json = await res.json();

  // 統一回應格式（草案，待後端確認）：{ status, data, message }
  if (!res.ok || json.status === 'error') {
    throw new Error(json.message || '伺服器處理失敗');
  }

  return json.data; // { filename, originalSize, outputSize, savedPercent, format, previewUrl, downloadUrl }
}

async function startCompression() {
  if (state.isProcessing) return;
  const pending = state.files.filter(f => f.status === 'waiting' || f.status === 'error');
  if (pending.length === 0) {
    showToast('沒有待處理的圖片', 'warning');
    return;
  }

  state.isProcessing = true;
  compressBtn.disabled = true;
  compressBtn.innerHTML = '<div class="spinner"></div> 處理中…';

  for (const item of pending) {
    item.status = 'processing';
    item.progress = 40;
    updateItemEl(item);

    try {
      const result = await compressImage(item);
      item.resultSize = result.outputSize;
      item.downloadUrl = result.downloadUrl;  // 後端提供的下載路徑
      item.outputFormat = result.format;
      item.status = 'done';
      item.progress = 100;
    } catch (err) {
      item.status = 'error';
      item.errorMsg = err.message;
      showToast(`${item.name}：${err.message}`, 'error');
      console.error(err);
    }

    updateItemEl(item);
    updateUI();
  }

  state.isProcessing = false;
  compressBtn.disabled = false;
  compressBtn.innerHTML = `<svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> 開始壓縮`;

  const doneCount = state.files.filter(f => f.status === 'done').length;
  if (doneCount > 0) showToast(`壓縮完成！共處理 ${doneCount} 張圖片`, 'success', 4000);
  updateUI();
}

// =============================================
// 下載
// =============================================
function downloadItem(id) {
  const item = state.files.find(f => f.id === id);
  if (!item || !item.downloadUrl) return;

  const baseName = item.name.replace(/\.[^.]+$/, '');
  const ext = item.outputFormat || 'webp';
  const fileName = `${baseName}_compressed.${ext}`;

  // 用後端提供的 downloadUrl 直接下載
  const a = document.createElement('a');
  a.href = item.downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadAll() {
  const done = state.files.filter(f => f.status === 'done' && f.downloadUrl);
  if (done.length === 0) return;

  if (done.length === 1) {
    downloadItem(done[0].id);
    return;
  }

  // 多檔案逐一下載（間隔避免瀏覽器攔截）
  showToast(`正在下載 ${done.length} 張圖片…`, 'default', 2000);
  for (let i = 0; i < done.length; i++) {
    await new Promise(r => setTimeout(r, i * 200));
    downloadItem(done[i].id);
  }
}

// =============================================
// 事件綁定
// =============================================

// 上傳區拖曳
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', (e) => {
  if (!uploadZone.contains(e.relatedTarget)) {
    uploadZone.classList.remove('drag-over');
  }
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  addFiles(e.dataTransfer.files);
});

uploadZone.addEventListener('click', (e) => {
  if (e.target === uploadZone || e.target.closest('.upload-icon-wrap') || e.target.classList.contains('upload-title') || e.target.classList.contains('upload-subtitle')) {
    fileInput.click();
  }
});

uploadBtnTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  addFiles(e.target.files);
  fileInput.value = '';
});

addMoreBtn.addEventListener('click', () => fileInput.click());

// 品質滑桿
qualitySlider.addEventListener('input', () => {
  qualityDisplay.textContent = qualitySlider.value + '%';
  // 動態更新滑桿填充色
  const pct = (qualitySlider.value - 1) / 99 * 100;
  qualitySlider.style.background = `linear-gradient(to right, var(--color-wood-400) ${pct}%, var(--color-border) ${pct}%)`;
});
// 初始化滑桿顏色
qualitySlider.dispatchEvent(new Event('input'));

// 格式選擇
formatGroup.addEventListener('click', (e) => {
  const btn = e.target.closest('.format-btn');
  if (!btn) return;
  formatGroup.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

// 寬度輸入（送給後端 maxWidth）
maxWidthInput.addEventListener('input', () => {
  // 直接帶入 compressImage 時使用，無需額外處理
});

// 圖片列表操作（事件委派）
imageList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = parseInt(btn.dataset.id);
  if (action === 'remove') removeFile(id);
  if (action === 'download') downloadItem(id);
});

// 壓縮按鈕
compressBtn.addEventListener('click', startCompression);

// 下載全部
downloadAllBtn.addEventListener('click', downloadAll);

// 清除全部
clearAllBtn.addEventListener('click', () => {
  if (state.files.length === 0) return;
  clearAll();
  showToast('已清除所有圖片', 'default');
});

// 全域貼上（Ctrl+V）
document.addEventListener('paste', (e) => {
  const items = Array.from(e.clipboardData?.items || []);
  const imageItems = items.filter(i => i.type.startsWith('image/'));
  if (imageItems.length > 0) {
    const files = imageItems.map(i => i.getAsFile()).filter(Boolean);
    addFiles(files);
  }
});

// 初始化
updateUI();
