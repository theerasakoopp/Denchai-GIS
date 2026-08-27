// ── Public Services Data — เทศบาลตำบลเด่นชัย ──
// ข้อมูลตัวอย่าง (Demo Data) บริการสาธารณะ

export const SERVICE_CATEGORIES = {
  health:    { name_th: 'สาธารณสุข',       name_en: 'Health',         color: '#ef4444', icon: '🏥' },
  police:    { name_th: 'ตำรวจ/ความปลอดภัย', name_en: 'Police/Safety', color: '#3b82f6', icon: '🚔' },
  fire:      { name_th: 'ดับเพลิง/กู้ภัย',  name_en: 'Fire/Rescue',   color: '#f97316', icon: '🚒' },
  welfare:   { name_th: 'สวัสดิการสังคม',   name_en: 'Social Welfare', color: '#8b5cf6', icon: '🤝' },
  post:      { name_th: 'ไปรษณีย์/สื่อสาร', name_en: 'Post/Comms',    color: '#06b6d4', icon: '📮' },
  waste:     { name_th: 'จัดการขยะ/สิ่งแวดล้อม', name_en: 'Waste Mgmt', color: '#22c55e', icon: '♻️' },
};

export const SERVICE_DATA = {
  type: 'FeatureCollection',
  features: [
    // ── สาธารณสุข ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0530, 17.9855] },
      properties: { id: 'svc-1', name_th: 'โรงพยาบาลส่งเสริมสุขภาพตำบลเด่นชัย', name_en: 'Denchai Health Promoting Hospital', category: 'health', description_th: 'รพ.สต. ให้บริการสาธารณสุขมูลฐาน ตรวจรักษาโรคทั่วไป', description_en: 'Primary health care services', phone: '054-613-xxx' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0495, 17.9835] },
      properties: { id: 'svc-2', name_th: 'ศูนย์สุขภาพชุมชนเด่นชัย', name_en: 'Denchai Community Health Center', category: 'health', description_th: 'ศูนย์บริการสุขภาพชุมชน คลินิกโรคเรื้อรัง', description_en: 'Community health center with chronic disease clinic', phone: '054-613-xxx' }
    },

    // ── ตำรวจ ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0545, 17.9815] },
      properties: { id: 'svc-3', name_th: 'สถานีตำรวจภูธรเด่นชัย', name_en: 'Denchai Police Station', category: 'police', description_th: 'สถานีตำรวจภูธรเด่นชัย อำเภอเด่นชัย จังหวัดแพร่', description_en: 'Denchai Police Station, Phrae Province', phone: '054-613-200' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0570, 17.9845] },
      properties: { id: 'svc-4', name_th: 'จุดตรวจ/ป้อมยามชุมชน', name_en: 'Community Patrol Post', category: 'police', description_th: 'ป้อมยามตำรวจชุมชน ดูแลความปลอดภัยในพื้นที่', description_en: 'Community police patrol post' }
    },

    // ── ดับเพลิง/กู้ภัย ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0510, 17.9845] },
      properties: { id: 'svc-5', name_th: 'งานป้องกันและบรรเทาสาธารณภัย เทศบาลเด่นชัย', name_en: 'Denchai Fire & Disaster Prevention', category: 'fire', description_th: 'หน่วยดับเพลิงและกู้ภัยของเทศบาล พร้อมรถดับเพลิง 2 คัน', description_en: 'Municipal fire brigade with 2 fire trucks', phone: '054-613-xxx' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0600, 17.9830] },
      properties: { id: 'svc-6', name_th: 'มูลนิธิกู้ภัยเด่นชัย', name_en: 'Denchai Rescue Foundation', category: 'fire', description_th: 'หน่วยกู้ภัยอาสาสมัคร บริการ 24 ชั่วโมง', description_en: 'Volunteer rescue unit, 24-hour service' }
    },

    // ── สวัสดิการสังคม ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0535, 17.9860] },
      properties: { id: 'svc-7', name_th: 'ศูนย์พัฒนาคุณภาพชีวิตผู้สูงอายุ', name_en: 'Senior Citizen Quality of Life Center', category: 'welfare', description_th: 'ศูนย์ดูแลและส่งเสริมคุณภาพชีวิตผู้สูงอายุในชุมชน', description_en: 'Center for senior citizen welfare' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0485, 17.9825] },
      properties: { id: 'svc-8', name_th: 'ศูนย์ช่วยเหลือสังคม (OSCC)', name_en: 'One Stop Crisis Center', category: 'welfare', description_th: 'ศูนย์ช่วยเหลือสังคมเทศบาล บริการเบ็ดเสร็จ', description_en: 'Municipal one-stop social assistance center' }
    },

    // ── ไปรษณีย์/สื่อสาร ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0560, 17.9840] },
      properties: { id: 'svc-9', name_th: 'ที่ทำการไปรษณีย์เด่นชัย', name_en: 'Denchai Post Office', category: 'post', description_th: 'ไปรษณีย์ไทย สาขาเด่นชัย รหัส 54110', description_en: 'Thailand Post, Denchai branch, zip 54110', phone: '054-613-xxx' }
    },

    // ── จัดการขยะ ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0630, 17.9800] },
      properties: { id: 'svc-10', name_th: 'ศูนย์จัดการขยะเทศบาลเด่นชัย', name_en: 'Denchai Waste Management Center', category: 'waste', description_th: 'ศูนย์คัดแยกและจัดการขยะมูลฝอยชุมชน', description_en: 'Municipal solid waste sorting and management center' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0505, 17.9870] },
      properties: { id: 'svc-11', name_th: 'จุดรับซื้อของเก่ารีไซเคิล', name_en: 'Recycling Collection Point', category: 'waste', description_th: 'จุดรวบรวมขยะรีไซเคิลชุมชน', description_en: 'Community recycling collection point' }
    },
  ]
};
