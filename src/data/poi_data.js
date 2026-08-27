// ── Points of Interest (POI) — เทศบาลตำบลเด่นชัย ──
// ข้อมูลตัวอย่าง (Demo Data) พร้อมพิกัดจริงในเขตเทศบาล

export const POI_CATEGORIES = {
  temple:    { name_th: 'วัด/ศาสนสถาน',   name_en: 'Temples',       color: '#f59e0b', icon: '🛕' },
  school:    { name_th: 'โรงเรียน/สถานศึกษา', name_en: 'Schools',    color: '#3b82f6', icon: '🏫' },
  market:    { name_th: 'ตลาด/ร้านค้า',    name_en: 'Markets',       color: '#ef4444', icon: '🏪' },
  transport: { name_th: 'คมนาคม/ขนส่ง',    name_en: 'Transport',     color: '#8b5cf6', icon: '🚉' },
  government:{ name_th: 'หน่วยงานราชการ',   name_en: 'Government',    color: '#06b6d4', icon: '🏛️' },
  park:      { name_th: 'สวนสาธารณะ/นันทนาการ', name_en: 'Parks',   color: '#22c55e', icon: '🌳' },
  bank:      { name_th: 'ธนาคาร/การเงิน',  name_en: 'Banks',         color: '#6366f1', icon: '🏦' },
};

export const POI_DATA = {
  type: 'FeatureCollection',
  features: [
    // ── วัด ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0525, 17.9830] },
      properties: { id: 'poi-1', name_th: 'วัดเด่นชัย', name_en: 'Wat Den Chai', category: 'temple', description_th: 'วัดประจำตำบลเด่นชัย ศูนย์รวมศรัทธาชาวบ้าน', description_en: 'Main temple of Den Chai subdistrict' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0600, 17.9870] },
      properties: { id: 'poi-2', name_th: 'วัดดอนชัย', name_en: 'Wat Don Chai', category: 'temple', description_th: 'วัดเก่าแก่ในเขตเทศบาล', description_en: 'Historic temple in the municipality' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0480, 17.9790] },
      properties: { id: 'poi-3', name_th: 'วัดศรีมงคล', name_en: 'Wat Sri Mongkhon', category: 'temple', description_th: 'วัดสำคัญทางทิศใต้ของเทศบาล', description_en: 'Important temple in the south area' }
    },

    // ── โรงเรียน ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0490, 17.9845] },
      properties: { id: 'poi-4', name_th: 'โรงเรียนเด่นชัยพิทยาคม', name_en: 'Denchai Pittayakom School', category: 'school', description_th: 'โรงเรียนมัธยมศึกษาประจำอำเภอเด่นชัย', description_en: 'Secondary school of Den Chai district' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0560, 17.9810] },
      properties: { id: 'poi-5', name_th: 'โรงเรียนบ้านเด่นชัย', name_en: 'Ban Denchai School', category: 'school', description_th: 'โรงเรียนประถมศึกษาในเขตเทศบาล', description_en: 'Primary school in the municipality' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0610, 17.9855] },
      properties: { id: 'poi-6', name_th: 'ศูนย์พัฒนาเด็กเล็กเทศบาลเด่นชัย', name_en: 'Denchai Child Development Center', category: 'school', description_th: 'ศูนย์พัฒนาเด็กเล็กสังกัดเทศบาล', description_en: 'Municipal child development center' }
    },

    // ── ตลาด ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0545, 17.9835] },
      properties: { id: 'poi-7', name_th: 'ตลาดสดเทศบาลเด่นชัย', name_en: 'Denchai Fresh Market', category: 'market', description_th: 'ตลาดสดประจำเทศบาล จำหน่ายอาหารสด ของแห้ง', description_en: 'Municipal fresh market' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0570, 17.9825] },
      properties: { id: 'poi-8', name_th: 'ตลาดนัดเด่นชัย', name_en: 'Denchai Weekend Market', category: 'market', description_th: 'ตลาดนัดชุมชน เปิดทุกวันเสาร์-อาทิตย์', description_en: 'Community weekend market' }
    },

    // ── คมนาคม ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0505, 17.9820] },
      properties: { id: 'poi-9', name_th: 'สถานีรถไฟเด่นชัย', name_en: 'Denchai Railway Station', category: 'transport', description_th: 'สถานีรถไฟชุมทางสำคัญ เชื่อมเหนือ-ใต้', description_en: 'Major railway junction connecting north-south' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0555, 17.9800] },
      properties: { id: 'poi-10', name_th: 'สถานีขนส่งเด่นชัย', name_en: 'Denchai Bus Terminal', category: 'transport', description_th: 'สถานีขนส่งผู้โดยสารประจำอำเภอ', description_en: 'District bus terminal' }
    },

    // ── หน่วยงานราชการ ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0535, 17.9840] },
      properties: { id: 'poi-11', name_th: 'สำนักงานเทศบาลตำบลเด่นชัย', name_en: 'Denchai Municipality Office', category: 'government', description_th: 'สำนักงานเทศบาลตำบลเด่นชัย ศูนย์บริการประชาชน', description_en: 'Denchai Municipality Office' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0520, 17.9860] },
      properties: { id: 'poi-12', name_th: 'ที่ว่าการอำเภอเด่นชัย', name_en: 'Denchai District Office', category: 'government', description_th: 'ที่ว่าการอำเภอเด่นชัย จังหวัดแพร่', description_en: 'Den Chai District Office, Phrae Province' }
    },

    // ── สวนสาธารณะ ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0580, 17.9850] },
      properties: { id: 'poi-13', name_th: 'สวนสาธารณะเทศบาลเด่นชัย', name_en: 'Denchai Public Park', category: 'park', description_th: 'สวนสาธารณะสำหรับพักผ่อนและออกกำลังกาย', description_en: 'Public park for recreation and exercise' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0460, 17.9815] },
      properties: { id: 'poi-14', name_th: 'ลานกีฬาชุมชนเด่นชัย', name_en: 'Denchai Sports Ground', category: 'park', description_th: 'ลานกีฬาอเนกประสงค์', description_en: 'Multi-purpose sports ground' }
    },

    // ── ธนาคาร ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0540, 17.9830] },
      properties: { id: 'poi-15', name_th: 'ธนาคารกรุงไทย สาขาเด่นชัย', name_en: 'Krungthai Bank - Denchai', category: 'bank', description_th: 'สาขาธนาคารกรุงไทยประจำอำเภอ', description_en: 'Krungthai Bank Denchai branch' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0550, 17.9842] },
      properties: { id: 'poi-16', name_th: 'ธ.ก.ส. สาขาเด่นชัย', name_en: 'BAAC Denchai Branch', category: 'bank', description_th: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', description_en: 'Bank for Agriculture and Agricultural Cooperatives' }
    },
  ]
};
