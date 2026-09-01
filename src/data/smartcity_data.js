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

// ── 7. ชั้นอาคาร (เชื่อมข้อมูลภาษีที่ดินและสิ่งปลูกสร้าง LTAX3000) ────
export const BUILDING_CATEGORIES = {
  // ── ประเภทตาม พ.ร.บ.ภาษีที่ดินฯ 2562 และ LTAX3000 land_use_code ──
  "residential":  { "name_th":"บ้านพักอาศัย",        "name_en":"Residential",        "color":"#64748b","icon":"🏠","tax_rate":0.02,"ltax_code":"100","ltax_type":"1" },
  "commercial":   { "name_th":"พาณิชยกรรม/ห้องแถว",  "name_en":"Commercial",         "color":"#f97316","icon":"🏪","tax_rate":0.30,"ltax_code":"200","ltax_type":"2" },
  "mixed":        { "name_th":"อยู่อาศัย+พาณิชย์",   "name_en":"Mixed Use",          "color":"#eab308","icon":"🏘️","tax_rate":0.15,"ltax_code":"110","ltax_type":"1" },
  "government":   { "name_th":"ราชการ/สาธารณะ",      "name_en":"Government",         "color":"#3b82f6","icon":"🏛️","tax_rate":0.00,"ltax_code":"400","ltax_type":"4" },
  "education":    { "name_th":"การศึกษา",             "name_en":"Education",          "color":"#8b5cf6","icon":"🏫","tax_rate":0.00,"ltax_code":"410","ltax_type":"4" },
  "religious":    { "name_th":"ศาสนสถาน",             "name_en":"Religious",          "color":"#a78bfa","icon":"⛪","tax_rate":0.00,"ltax_code":"420","ltax_type":"4" },
  "health":       { "name_th":"สถานพยาบาล/คลินิก",   "name_en":"Health",             "color":"#ef4444","icon":"🏥","tax_rate":0.00,"ltax_code":"430","ltax_type":"4" },
  "industrial":   { "name_th":"อุตสาหกรรม/โรงงาน",  "name_en":"Industrial",         "color":"#475569","icon":"🏭","tax_rate":0.30,"ltax_code":"300","ltax_type":"3" },
  "warehouse":    { "name_th":"โกดัง/โรงเก็บสินค้า","name_en":"Warehouse",          "color":"#78716c","icon":"🏗️","tax_rate":0.30,"ltax_code":"310","ltax_type":"3" },
  "agricultural": { "name_th":"โรงเรือนเกษตร",       "name_en":"Agricultural",       "color":"#22c55e","icon":"🌾","tax_rate":0.01,"ltax_code":"500","ltax_type":"5" },
  "vacant":       { "name_th":"อาคารร้าง/ว่างเปล่า","name_en":"Vacant",             "color":"#dc2626","icon":"🚫","tax_rate":0.30,"ltax_code":"600","ltax_type":"6" },
  "under_const":  { "name_th":"อยู่ระหว่างก่อสร้าง", "name_en":"Under Construction", "color":"#fb923c","icon":"🔨","tax_rate":0.00,"ltax_code":"610","ltax_type":"6" },
};

// ── LTAX3000 ค่าเสื่อมราคาอาคารตามอายุ (กรมธนารักษ์) ─────────────
// ใช้คำนวณ: มูลค่าอาคาร = ราคากลาง × พื้นที่ × (1 - depreciation_pct/100)
export const LTAX_DEPRECIATION = {
  // อายุอาคาร (ปี) : depreciation (%)
  0:0, 1:2, 2:4, 3:6, 4:8, 5:10,
  10:20, 15:30, 20:40, 25:50, 30:60,
  35:70, 40:80, 50:80 // max 80%
};

// ── ราคากลางกรมธนารักษ์ต่อ ตร.ม. (ปรับปรุงตามประกาศ) ────────────
export const LTAX_UNIT_PRICE = {
  "คสล._commercial":  8500,
  "คสล._residential": 6500,
  "คสล._industrial":  5500,
  "อิฐ_residential":  4500,
  "ไม้_residential":  3000,
  "เหล็ก_industrial": 6000,
};

// ── Schema อ้างอิงสำหรับ Feature properties (เทียบกับ LTAX3000) ──
// ═══════════════════════════════════════════════════════════════════
// [หมวด 1: ระบุตัวตน — LTAX3000 Section A]
//   id           : รหัสอาคารในระบบ GIS        เช่น "bld_001"
//   ltax_id      : รหัสอาคารใน LTAX3000        เช่น "76010100001"  ← เพิ่มใหม่
//   house_no     : เลขที่บ้าน (ทร.14)          เช่น "123/4"
//   house_id_11  : เลขประจำบ้าน 11 หลัก        เช่น "76010100001"  ← เพิ่มใหม่
//   land_no      : เลขที่ดินในโฉนด              เช่น "45"           ← เพิ่มใหม่
//   survey_page  : เลขหน้าสำรวจ (น.ส.ล.)       เช่น "12"           ← เพิ่มใหม่
//   land_deed_no : เลขโฉนด/น.ส.3/น.ส.3ก        เช่น "1234"
//   parcel_id    : รหัสแปลงที่ดิน 12 หลัก       เช่น "760101001001"
//
// [หมวด 2: ที่ตั้ง — LTAX3000 Section B]
//   name_th      : ชื่ออาคาร (ถ้ามี)            เช่น "ตลาดเทศบาล"
//   house_no     : เลขที่บ้าน
//   moo          : หมู่ที่                        เช่น "5"
//   road         : ถนน/ซอย                       เช่น "ถนนเด่นชัย-งาว"
//   tambon       : ตำบล                           เช่น "เด่นชัย"
//   amphoe       : อำเภอ (fix="เด่นชัย")         ← เพิ่มใหม่
//   changwat     : จังหวัด (fix="แพร่")          ← เพิ่มใหม่
//   lat / lng    : พิกัด WGS84 (แปลงจาก UTM47N)
//
// [หมวด 3: ลักษณะอาคาร — LTAX3000 Section C]
//   category         : ประเภทอาคาร (key ของ BUILDING_CATEGORIES)
//   land_use_code    : รหัสการใช้ประโยชน์ LTAX  เช่น "100","200"   ← เพิ่มใหม่
//   floors           : จำนวนชั้น
//   area_sqm         : พื้นที่ก่อสร้าง (ตร.ม.)  ← LTAX: พื้นที่ก่อสร้าง
//   area_usable_sqm  : พื้นที่ใช้สอย (ตร.ม.)    ← เพิ่มใหม่ (LTAX แยก field นี้)
//   height_m         : ความสูง (ม.)
//   width_m          : ความกว้าง (ม.)
//   length_m         : ความยาว (ม.)
//   wall_mat         : วัสดุผนัง  "คสล."/"อิฐ"/"ไม้"/"เหล็ก"
//   roof_mat         : วัสดุหลังคา "กระเบื้อง"/"สังกะสี"/"คสล."
//   year_built       : ปีที่สร้าง (พ.ศ.)
//   depreciation_pct : ค่าเสื่อมราคา (%)         ← เพิ่มใหม่ (LTAX ใช้คำนวณมูลค่า)
//   condition        : สภาพ  "ดี"/"ปานกลาง"/"ชำรุด"/"รื้อถอน"
//
// [หมวด 4: ภาษีและเจ้าของ — LTAX3000 Section D]
//   owner_name           : ชื่อเจ้าของ
//   owner_id             : เลขบัตรประชาชน 13 หลัก
//   tax_assessment_value : ราคาประเมินกรมธนารักษ์ (บาท)  ← เพิ่มใหม่
//   tax_value            : มูลค่าอาคารที่ใช้คำนวณภาษี (บาท)
//   tax_rate             : อัตราภาษี (%) ต่อจุดข้อมูล   ← ย้ายจาก category มาเก็บต่อ feature
//   tax_year             : ปีภาษี (พ.ศ.)
//   permit_no            : เลขที่ใบอนุญาตก่อสร้าง
//
// [หมวด 5: Meta]
//   remark       : หมายเหตุ
//   survey_date  : วันที่สำรวจ (YYYY-MM-DD)
//   surveyor     : ผู้สำรวจ

export const BUILDING_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_Buildings",
  "crs": { "type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"} },
  "ltax_version": "LTAX3000",
  "features": []
};
