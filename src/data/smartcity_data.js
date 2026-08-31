// ── Smart City Infrastructure Data — เทศบาลตำบลเด่นชัย ──
// Layer เปล่าสำหรับเพิ่มข้อมูลผ่าน Editor

// ── 1. เสาไฟฟ้า ──────────────────────────────────────────
export const STREETLIGHT_CATEGORIES = {
  "light_on":  { "name_th": "มีไฟส่องสว่าง",    "name_en": "Has Street Light", "color": "#facc15", "icon": "💡" },
  "light_off": { "name_th": "ไม่มีไฟส่องสว่าง", "name_en": "No Street Light",  "color": "#64748b", "icon": "🔦" },
  "damaged":   { "name_th": "ชำรุด/รอซ่อม",     "name_en": "Damaged",          "color": "#ef4444", "icon": "⚠️" }
};
export const STREETLIGHT_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_Streetlights",
  "features": []
};

// ── 2. มิเตอร์น้ำ ─────────────────────────────────────────
export const WATERMETER_CATEGORIES = {
  "residential": { "name_th": "บ้านพักอาศัย",  "name_en": "Residential", "color": "#0ea5e9", "icon": "🏠" },
  "commercial":  { "name_th": "พาณิชยกรรม",    "name_en": "Commercial",  "color": "#f97316", "icon": "🏪" },
  "government":  { "name_th": "หน่วยงานราชการ","name_en": "Government",  "color": "#8b5cf6", "icon": "🏛️" },
  "inactive":    { "name_th": "ระงับใช้งาน",   "name_en": "Inactive",    "color": "#94a3b8", "icon": "❌" }
};
export const WATERMETER_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_WaterMeters",
  "features": []
};

// ── 3. หม้อแปลงไฟฟ้า ─────────────────────────────────────
export const TRANSFORMER_CATEGORIES = {
  "pea":      { "name_th": "การไฟฟ้าส่วนภูมิภาค", "name_en": "PEA Transformer",   "color": "#eab308", "icon": "⚡" },
  "mea":      { "name_th": "การไฟฟ้านครหลวง",     "name_en": "MEA Transformer",   "color": "#f97316", "icon": "🔌" },
  "private":  { "name_th": "เอกชน",               "name_en": "Private",           "color": "#6366f1", "icon": "🏭" },
  "damaged":  { "name_th": "ชำรุด/รอซ่อม",        "name_en": "Damaged",           "color": "#ef4444", "icon": "⚠️" }
};
export const TRANSFORMER_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_Transformers",
  "features": []
};

// ── 4. ถังขยะ ─────────────────────────────────────────────
export const TRASHBIN_CATEGORIES = {
  "general":   { "name_th": "ขยะทั่วไป",     "name_en": "General Waste",   "color": "#64748b", "icon": "🗑️" },
  "recycle":   { "name_th": "ขยะรีไซเคิล",  "name_en": "Recycle",         "color": "#22c55e", "icon": "♻️" },
  "hazardous": { "name_th": "ขยะอันตราย",   "name_en": "Hazardous Waste", "color": "#ef4444", "icon": "☣️" },
  "organic":   { "name_th": "ขยะอินทรีย์",  "name_en": "Organic Waste",   "color": "#a3e635", "icon": "🌿" }
};
export const TRASHBIN_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_TrashBins",
  "features": []
};

// ── 5. หัวจ่ายน้ำดับเพลิง ────────────────────────────────
export const HYDRANT_CATEGORIES = {
  "active":   { "name_th": "ใช้งานได้",    "name_en": "Active",   "color": "#ef4444", "icon": "🚒" },
  "inactive": { "name_th": "ไม่ได้ใช้งาน","name_en": "Inactive", "color": "#94a3b8", "icon": "🔴" },
  "damaged":  { "name_th": "ชำรุด",        "name_en": "Damaged",  "color": "#f97316", "icon": "⚠️" }
};
export const HYDRANT_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_FireHydrants",
  "features": []
};

// ── 6. แนวทางระบายน้ำ ────────────────────────────────────
export const DRAIN_CATEGORIES = {
  "main":      { "name_th": "คูระบายน้ำสายหลัก", "name_en": "Main Drain",      "color": "#0284c7", "icon": "🌊" },
  "secondary": { "name_th": "คูระบายน้ำสายรอง",  "name_en": "Secondary Drain", "color": "#06b6d4", "icon": "💧" },
  "culvert":   { "name_th": "ท่อลอดเหลี่ยม",     "name_en": "Culvert",         "color": "#7c3aed", "icon": "🔵" },
  "blocked":   { "name_th": "อุดตัน/รอซ่อม",    "name_en": "Blocked",         "color": "#ef4444", "icon": "⚠️" }
};
export const DRAIN_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_DrainageLines",
  "features": []
};

// ── 7. ชั้นอาคาร ─────────────────────────────────────────
export const BUILDING_CATEGORIES = {
  "residential":  { "name_th": "บ้านพักอาศัย",     "name_en": "Residential",  "color": "#94a3b8", "icon": "🏠" },
  "commercial":   { "name_th": "พาณิชยกรรม",       "name_en": "Commercial",   "color": "#f97316", "icon": "🏪" },
  "government":   { "name_th": "ราชการ/สาธารณะ",  "name_en": "Government",   "color": "#3b82f6", "icon": "🏛️" },
  "education":    { "name_th": "การศึกษา",          "name_en": "Education",    "color": "#8b5cf6", "icon": "🏫" },
  "religious":    { "name_th": "ศาสนสถาน",          "name_en": "Religious",    "color": "#f59e0b", "icon": "⛪" },
  "industrial":   { "name_th": "อุตสาหกรรม/โกดัง", "name_en": "Industrial",   "color": "#6b7280", "icon": "🏭" },
  "health":       { "name_th": "สถานพยาบาล",        "name_en": "Health",       "color": "#ef4444", "icon": "🏥" },
  "agricultural": { "name_th": "เกษตร/โรงเก็บ",    "name_en": "Agricultural", "color": "#22c55e", "icon": "🌾" }
};
export const BUILDING_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_Buildings",
  "features": []
};
