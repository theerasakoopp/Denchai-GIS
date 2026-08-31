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

// ── 7. ชั้นอาคาร (เชื่อมข้อมูลภาษีที่ดินและสิ่งปลูกสร้าง) ────
export const BUILDING_CATEGORIES = {
  // ── ประเภทตาม พ.ร.บ.ภาษีที่ดินฯ 2562 ──
  "residential":     { "name_th": "บ้านพักอาศัย",          "name_en": "Residential",        "color": "#64748b", "icon": "🏠", "tax_rate": 0.02 },
  "commercial":      { "name_th": "พาณิชยกรรม/ห้องแถว",    "name_en": "Commercial",         "color": "#f97316", "icon": "🏪", "tax_rate": 0.30 },
  "mixed":           { "name_th": "อยู่อาศัย+พาณิชย์",     "name_en": "Mixed Use",          "color": "#eab308", "icon": "🏘️", "tax_rate": 0.15 },
  "government":      { "name_th": "ราชการ/สาธารณะ",        "name_en": "Government",         "color": "#3b82f6", "icon": "🏛️", "tax_rate": 0.00 },
  "education":       { "name_th": "การศึกษา",               "name_en": "Education",          "color": "#8b5cf6", "icon": "🏫", "tax_rate": 0.00 },
  "religious":       { "name_th": "ศาสนสถาน",               "name_en": "Religious",          "color": "#a78bfa", "icon": "⛪", "tax_rate": 0.00 },
  "health":          { "name_th": "สถานพยาบาล/คลินิก",     "name_en": "Health",             "color": "#ef4444", "icon": "🏥", "tax_rate": 0.00 },
  "industrial":      { "name_th": "อุตสาหกรรม/โรงงาน",    "name_en": "Industrial",         "color": "#475569", "icon": "🏭", "tax_rate": 0.30 },
  "warehouse":       { "name_th": "โกดัง/โรงเก็บสินค้า",  "name_en": "Warehouse",          "color": "#78716c", "icon": "🏗️", "tax_rate": 0.30 },
  "agricultural":    { "name_th": "โรงเรือนเกษตร",         "name_en": "Agricultural",       "color": "#22c55e", "icon": "🌾", "tax_rate": 0.01 },
  "vacant":          { "name_th": "อาคารร้าง/ว่างเปล่า",  "name_en": "Vacant",             "color": "#dc2626", "icon": "🚫", "tax_rate": 0.30 },
  "under_const":     { "name_th": "อยู่ระหว่างก่อสร้าง",   "name_en": "Under Construction", "color": "#fb923c", "icon": "🔨", "tax_rate": 0.00 }
};

// ── Schema อ้างอิงสำหรับ Feature properties ──
// properties ของแต่ละ Feature ควรมี field ดังนี้:
//
// [ระบุตัวตน]
//   id          : รหัสอาคารในระบบ  เช่น "bld_001"
//   house_no    : เลขที่บ้าน        เช่น "123/4"
//   moo         : หมู่ที่           เช่น "5"
//   road        : ถนน/ซอย          เช่น "ถนนเด่นชัย-งาว"
//   tambon      : ตำบล             เช่น "เด่นชัย"
//   name_th     : ชื่ออาคาร (ถ้ามี) เช่น "ตลาดเทศบาล"
//   name_en     : ชื่ออาคาร (EN)
//
// [กายภาพ]
//   category    : ประเภทอาคาร (ตาม BUILDING_CATEGORIES)
//   floors      : จำนวนชั้น
//   area_sqm    : พื้นที่ก่อสร้าง (ตร.ม.)
//   height_m    : ความสูง (ม.)
//   width_m     : ความกว้าง (ม.)
//   length_m    : ความยาว (ม.)
//   wall_mat    : วัสดุผนัง  เช่น "คสล." / "อิฐ" / "ไม้" / "เหล็ก"
//   roof_mat    : วัสดุหลังคา เช่น "กระเบื้อง" / "สังกะสี" / "คสล."
//   year_built  : ปีที่สร้าง (พ.ศ.)
//   condition   : สภาพ  "ดี" / "ปานกลาง" / "ชำรุด" / "รื้อถอน"
//
// [ภาษีที่ดินและสิ่งปลูกสร้าง]
//   land_deed_no : เลขโฉนด/น.ส.3
//   parcel_id    : รหัสแปลงที่ดิน (เชื่อม GIS กรมที่ดิน)
//   owner_name   : ชื่อเจ้าของ
//   owner_id     : เลขบัตรประชาชนเจ้าของ (13 หลัก)
//   tax_value    : มูลค่าอาคาร (บาท)
//   tax_year     : ปีภาษี (พ.ศ.)
//   permit_no    : เลขที่ใบอนุญาตก่อสร้าง
//
// [อื่นๆ]
//   remark       : หมายเหตุ
//   survey_date  : วันที่สำรวจ (YYYY-MM-DD)
//   surveyor     : ผู้สำรวจ

export const BUILDING_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_Buildings",
  "features": []
};
