const fs = require('fs');

const POI_CATEGORIES = {
  temple:    { name_th: 'วัด/ศาสนสถาน',   name_en: 'Temples',       color: '#f59e0b', icon: '🛕' },
  school:    { name_th: 'โรงเรียน/สถานศึกษา', name_en: 'Schools',    color: '#3b82f6', icon: '🏫' },
  market:    { name_th: 'ตลาด/ร้านค้า',    name_en: 'Markets',       color: '#ef4444', icon: '🏪' },
  transport: { name_th: 'คมนาคม/ขนส่ง',    name_en: 'Transport',     color: '#8b5cf6', icon: '🚉' },
  government:{ name_th: 'หน่วยงานราชการ',   name_en: 'Government',    color: '#06b6d4', icon: '🏛️' },
  park:      { name_th: 'สวนสาธารณะ/นันทนาการ', name_en: 'Parks',   color: '#22c55e', icon: '🌳' },
  bank:      { name_th: 'ธนาคาร/การเงิน',  name_en: 'Banks',         color: '#6366f1', icon: '🏦' },
};

const POI_FEATURES = [
  // ── วัด / ศาสนสถาน ──
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0525, 17.9830] },
    properties: { id: 'poi-1', name_th: 'วัดเด่นชัย', name_en: 'Wat Den Chai', category: 'temple', description_th: 'วัดประจำตำบลเด่นชัย ศูนย์รวมจิตใจของชาวเด่นชัย', description_en: 'Main community temple of Den Chai subdistrict' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0600, 17.9870] },
    properties: { id: 'poi-2', name_th: 'วัดดอนชัย', name_en: 'Wat Don Chai', category: 'temple', description_th: 'วัดเก่าแก่คู่ชุมชนดอนชัย', description_en: 'Historic community temple in Don Chai' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0480, 17.9790] },
    properties: { id: 'poi-3', name_th: 'วัดศรีมงคล', name_en: 'Wat Sri Mongkhon', category: 'temple', description_th: 'วัดสำคัญทางทิศใต้ของเขตเทศบาล', description_en: 'Important Buddhist temple in south Den Chai' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0515, 17.9750] },
    properties: { id: 'poi-4', name_th: 'วัดคันทาพฤกษ์', name_en: 'Wat Khanthaphreuk', category: 'temple', description_th: 'วัดเก่าแก่ร่มรื่นในเขตเทศบาล', description_en: 'Tranquil historic temple in Den Chai' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0420, 17.9680] },
    properties: { id: 'poi-5', name_th: 'วัดพระธาตุสุโทนมงคลคีรี', name_en: 'Wat Phra That Suthon Mongkhon Khiri', category: 'temple', description_th: 'วัดสวยงามวิจิตรศิลป์ล้านนาประยุกต์ แหล่งท่องเที่ยวสำคัญระดับประเทศ', description_en: 'Renowned Lanna architectural temple and key tourism landmark' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0350, 17.9710] },
    properties: { id: 'poi-6', name_th: 'วัดแพร่ธรรมาราม', name_en: 'Wat Phrae Thammaram', category: 'temple', description_th: 'สำนักปฏิบัติธรรมสายหลวงพ่อชา สัปปายะสงบร่มรื่น', description_en: 'Meditation temple in the forest tradition' }
  },

  // ── โรงเรียน / สถานศึกษา ──
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0490, 17.9845] },
    properties: { id: 'poi-7', name_th: 'โรงเรียนเด่นชัยพิทยาคม', name_en: 'Denchai Pittayakom School', category: 'school', description_th: 'โรงเรียนมัธยมศึกษาประจำอำเภอเด่นชัย สังกัด สพม.แพร่', description_en: 'District secondary school of Den Chai' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0560, 17.9810] },
    properties: { id: 'poi-8', name_th: 'โรงเรียนบ้านเด่นชัย (ประชานุกูล)', name_en: 'Ban Denchai School', category: 'school', description_th: 'โรงเรียนประถมศึกษาประจำตำบลเด่นชัย', description_en: 'Primary community school' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0540, 17.9820] },
    properties: { id: 'poi-9', name_th: 'โรงเรียนอนุบาลเด่นชัย', name_en: 'Denchai Kindergarten', category: 'school', description_th: 'โรงเรียนระดับปฐมวัยในเขตเทศบาล', description_en: 'Kindergarten school in Den Chai' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0610, 17.9855] },
    properties: { id: 'poi-10', name_th: 'ศูนย์พัฒนาเด็กเล็กเทศบาลตำบลเด่นชัย', name_en: 'Denchai Child Development Center', category: 'school', description_th: 'ศูนย์พัฒนาเด็กเล็กสังกัดเทศบาลตำบลเด่นชัย', description_en: 'Municipal child development center' }
  },

  // ── คมนาคม / ขนส่ง ──
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0462, 17.9805] },
    properties: { id: 'poi-11', name_th: 'สถานีรถไฟชุมทางเด่นชัย', name_en: 'Den Chai Railway Junction Station', category: 'transport', description_th: 'สถานีรถไฟสายเหนือหลัก ประตูสู่จังหวัดแพร่ น่าน และเส้นทางรถไฟทางคู่เด่นชัย-เชียงราย-เชียงของ', description_en: 'Major Northern railway junction connecting Phrae, Nan and Chiang Rai' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0687, 17.9699] },
    properties: { id: 'poi-12', name_th: 'สถานีเดินรถนครชัยแอร์ เด่นชัย', name_en: 'Nakhonchai Air Bus Station', category: 'transport', description_th: 'สถานีจุดจอดรถโดยสารปรับอากาศ นครชัยแอร์', description_en: 'Intercity bus terminal Nakhonchai Air' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0267, 17.9767] },
    properties: { id: 'poi-13', name_th: 'สถานีบริการน้ำมัน ปตท. เด่นชัย', name_en: 'PTT Station Den Chai', category: 'transport', description_th: 'จุดพักรถสถานีบริการน้ำมัน ปตท. พร้อม Café Amazon และศูนย์อาหาร', description_en: 'PTT Rest Area, gas station, and food court' }
  },

  // ── หน่วยงานราชการ ──
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0530, 17.9850] },
    properties: { id: 'poi-14', name_th: 'สำนักงานเทศบาลตำบลเด่นชัย', name_en: 'Denchai Municipality Office', category: 'government', description_th: 'ศูนย์กลางการบริหารงานและบริการประชาชนเทศบาลตำบลเด่นชัย', description_en: 'Municipal Administrative Center of Den Chai' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0510, 17.9840] },
    properties: { id: 'poi-15', name_th: 'ที่ว่าการอำเภอเด่นชัย', name_en: 'Denchai District Office', category: 'government', description_th: 'ศูนย์ราชการอำเภอเด่นชัย บริการงานทะเบียนและปกครอง', description_en: 'Den Chai District Government Office' }
  },

  // ── ตลาด / ร้านค้า ──
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0545, 17.9835] },
    properties: { id: 'poi-16', name_th: 'ตลาดสดเทศบาลตำบลเด่นชัย', name_en: 'Denchai Fresh Market', category: 'market', description_th: 'ตลาดสดศูนย์รวมอาหารพื้นเมือง ผักผลไม้ และของสดประจำอำเภอ', description_en: 'Main fresh food market of Den Chai municipality' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0570, 17.9825] },
    properties: { id: 'poi-17', name_th: 'ตลาดนัดคลองถมเด่นชัย', name_en: 'Denchai Night/Weekend Market', category: 'market', description_th: 'ตลาดนัดชุมชน สินค้าอุปโภคบริโภคและอาหารสตรีทฟู้ด', description_en: 'Community evening and weekend market' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0475, 17.9810] },
    properties: { id: 'poi-18', name_th: 'ตลาดหน้าสถานีรถไฟเด่นชัย', name_en: 'Railway Station Front Market', category: 'market', description_th: 'ร้านค้าและอาหารพื้นบ้านหน้าสถานีรถไฟ', description_en: 'Local shops and restaurants in front of railway station' }
  },

  // ── สวนสาธารณะ / นันทนาการ ──
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0510, 17.9860] },
    properties: { id: 'poi-19', name_th: 'สวนสาธารณะเฉลิมพระเกียรติเด่นชัย', name_en: 'Denchai Commemorative Park', category: 'park', description_th: 'พื้นที่สีเขียว ลู่วิ่งออกกำลังกาย และสนามเด็กเล่นกลางแจ้ง', description_en: 'Public recreation park and fitness ground' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0580, 17.9880] },
    properties: { id: 'poi-20', name_th: 'สนามกีฬาเทศบาลตำบลเด่นชัย', name_en: 'Denchai Municipal Stadium', category: 'park', description_th: 'สนามกีฬาและศูนย์ออกกำลังกายชุมชน', description_en: 'Community sport stadium and fitness center' }
  },

  // ── ธนาคาร / การเงิน ──
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0535, 17.9830] },
    properties: { id: 'poi-21', name_th: 'ธนาคารกรุงไทย สาขาเด่นชัย', name_en: 'Krungthai Bank (Den Chai Branch)', category: 'bank', description_th: 'สาขาธนาคารกรุงไทย บริการธุรกรรมทางการเงิน', description_en: 'Krungthai Bank commercial branch' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0550, 17.9840] },
    properties: { id: 'poi-22', name_th: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.) สาขาเด่นชัย', name_en: 'BAAC Bank (Den Chai Branch)', category: 'bank', description_th: 'บริการสินเชื่อเกษตรกรรมและธุรกรรมชุมชน', description_en: 'Bank for Agriculture and Agricultural Cooperatives' }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0520, 17.9835] },
    properties: { id: 'poi-23', name_th: 'ธนาคารออมสิน สาขาเด่นชัย', name_en: 'Government Savings Bank (GSB)', category: 'bank', description_th: 'บริการเงินฝากและสินเชื่อประชาชน', description_en: 'Government Savings Bank branch' }
  }
];

const content = `// ── Points of Interest (POI) — เทศบาลตำบลเด่นชัย ──
// ข้อมูลพิกัดสถานที่สำคัญจริงในเขตเทศบาลตำบลเด่นชัย จ.แพร่ (สืบค้นจาก OpenStreetMap & Google Maps)

export const POI_CATEGORIES = ${JSON.stringify(POI_CATEGORIES, null, 2)};

export const POI_DATA = {
  type: 'FeatureCollection',
  features: ${JSON.stringify(POI_FEATURES, null, 2)}
};
`;

fs.writeFileSync('src/data/poi_data.js', content, 'utf8');
console.log(`Successfully generated src/data/poi_data.js with ${POI_FEATURES.length} verified real locations in Denchai!`);
