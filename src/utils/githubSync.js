// ── GitHub Auto-Sync Utility ──────────────────────────────
// บันทึกข้อมูลจาก Editor ตรงเข้า GitHub repo อัตโนมัติ
// Token เก็บใน localStorage เท่านั้น ไม่ได้อยู่ใน code

const GITHUB_OWNER = 'theerasakoopp';
const GITHUB_REPO  = 'Denchai-GIS';
const GITHUB_BRANCH = 'main';
const API_BASE = 'https://api.github.com';

// ── ดึง Token จาก localStorage ──
export function getGithubToken() {
  return localStorage.getItem('denchai_github_token') || '';
}

// ── บันทึก Token ──
export function saveGithubToken(token) {
  localStorage.setItem('denchai_github_token', token.trim());
}

// ── ลบ Token ──
export function clearGithubToken() {
  localStorage.removeItem('denchai_github_token');
}

// ── เช็คว่า Token ถูกต้องไหม ──
export async function verifyToken(token) {
  try {
    const res = await fetch(`${API_BASE}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, login: data.login };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

// ── ดึง SHA ของไฟล์ปัจจุบัน (จำเป็นสำหรับ update) ──
async function getFileSHA(path, token) {
  try {
    const res = await fetch(
      `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' } }
    );
    if (res.ok) {
      const data = await res.json();
      return data.sha;
    }
  } catch {}
  return null;
}

// ── Push ไฟล์ขึ้น GitHub ──
export async function pushFileToGitHub({ path, content, message }) {
  const token = getGithubToken();
  if (!token) throw new Error('ไม่พบ GitHub Token กรุณาตั้งค่าก่อน');

  const sha = await getFileSHA(path, token);
  const encoded = btoa(unescape(encodeURIComponent(content)));

  const body = {
    message,
    content: encoded,
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {})
  };

  const res = await fetch(
    `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Push ไม่สำเร็จ');
  }
  return await res.json();
}

// ── Build JS file content จาก GeoJSON data ──
export function buildJsContent(dataName, categoriesName, categoriesObj, geojsonData) {
  return `// Auto-saved by Denchai GIS Editor — ${new Date().toLocaleString('th-TH')}
export const ${categoriesName} = ${JSON.stringify(categoriesObj, null, 2)};
export const ${dataName} = ${JSON.stringify(geojsonData, null, 2)};
`;
}

// ── Map ชื่อ dataset → path ไฟล์ใน repo ──
export const DATASET_FILE_MAP = {
  poi:          { path: 'src/data/poi_data.js',        dataExport: 'POI_DATA',         catsExport: 'POI_CATEGORIES' },
  infra:        { path: 'src/data/infra_data.js',      dataExport: 'INFRA_DATA',       catsExport: 'INFRA_CATEGORIES' },
  service:      { path: 'src/data/service_data.js',    dataExport: 'SERVICE_DATA',     catsExport: 'SERVICE_CATEGORIES' },
  water:        { path: 'src/data/water_data.js',      dataExport: 'WATER_DATA',       catsExport: 'WATER_CATEGORIES' },
  streetlight:  { path: 'src/data/smartcity_data.js',  dataExport: 'STREETLIGHT_DATA', catsExport: 'STREETLIGHT_CATEGORIES' },
  watermeter:   { path: 'src/data/smartcity_data.js',  dataExport: 'WATERMETER_DATA',  catsExport: 'WATERMETER_CATEGORIES' },
  transformer:  { path: 'src/data/smartcity_data.js',  dataExport: 'TRANSFORMER_DATA', catsExport: 'TRANSFORMER_CATEGORIES' },
  trashbin:     { path: 'src/data/smartcity_data.js',  dataExport: 'TRASHBIN_DATA',    catsExport: 'TRASHBIN_CATEGORIES' },
  hydrant:      { path: 'src/data/smartcity_data.js',  dataExport: 'HYDRANT_DATA',     catsExport: 'HYDRANT_CATEGORIES' },
  drain:        { path: 'src/data/smartcity_data.js',  dataExport: 'DRAIN_DATA',       catsExport: 'DRAIN_CATEGORIES' },
  building:     { path: 'src/data/smartcity_data.js',  dataExport: 'BUILDING_DATA',    catsExport: 'BUILDING_CATEGORIES' },
};
