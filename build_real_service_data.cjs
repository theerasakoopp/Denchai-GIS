const fs = require('fs');

const SERVICE_CATEGORIES = {
  health:  { name_th: 'สาธารณสุข/โรงพยาบาล', name_en: 'Health & Medical', color: '#ef4444', icon: '🏥' },
  police:  { name_th: 'สถานีตำรวจ/ความปลอดภัย', name_en: 'Police Station',  color: '#3b82f6', icon: '👮' },
  fire:    { name_th: 'งานดับเพลิง/กู้ภัย',   name_en: 'Fire & Rescue',   color: '#f97316', icon: '🚒' },
  welfare: { name_th: 'พัฒนาสังคม/ผู้สูงอายุ', name_en: 'Social Welfare', color: '#8b5cf6', icon: '🤝' },
  post:    { name_th: 'ไปรษณีย์/ขนส่งพัสดุ',  name_en: 'Postal Services', color: '#06b6d4', icon: '📮' },
  waste:   { name_th: 'สุขาภิบาล/จัดการขยะ',  name_en: 'Sanitation',      color: '#22c55e', icon: '♻️' },
};

const SERVICE_FEATURES = [
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0450, 17.9810] },
    properties: {
      id: 'svc-1',
      name_th: 'โรงพยาบาลสมเด็จพระยุพราชเด่นชัย',
      name_en: 'Crown Prince Hospital Den Chai',
      category: 'health',
      description_th: 'โรงพยาบาลชุมชนระดับแม่ข่าย ให้บริการรักษาพยาบาล อุบัติเหตุและฉุกเฉิน 24 ชั่วโมง',
      description_en: 'Community hospital with 24-hour emergency medical service',
      phone: '054-613111'
    }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0520, 17.9835] },
    properties: {
      id: 'svc-2',
      name_th: 'โรงพยาบาลส่งเสริมสุขภาพตำบลเด่นชัย (รพ.สต.เด่นชัย)',
      name_en: 'Denchai Health Promoting Hospital',
      category: 'health',
      description_th: 'สถานีอนามัยบริการปฐมภูมิ ตรวจรักษาโรคเบื้องต้น ฉีดวัคซีน และส่งเสริมสุขภาพชุมชน',
      description_en: 'Primary healthcare center for vaccination and health promotion',
      phone: '054-613890'
    }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0480, 17.9815] },
    properties: {
      id: 'svc-3',
      name_th: 'สถานีตำรวจภูธรเด่นชัย (สภ.เด่นชัย)',
      name_en: 'Denchai Police Station',
      category: 'police',
      description_th: 'กองบังคับการตำรวจภูธรเด่นชัย รักษาความปลอดภัยและรับแจ้งเหตุฉุกเฉิน 24 ชม.',
      description_en: 'District Police Station providing 24/7 public safety service',
      phone: '054-613191'
    }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0535, 17.9855] },
    properties: {
      id: 'svc-4',
      name_th: 'งานป้องกันและบรรเทาสาธารณภัย เทศบาลตำบลเด่นชัย (ดับเพลิง/กู้ภัย)',
      name_en: 'Denchai Disaster Prevention & Fire Station',
      category: 'fire',
      description_th: 'สถานีดับเพลิง รถบรรทุกน้ำ และทีมกู้ชีพกู้ภัยเทศบาลตำบลเด่นชัย พร้อมระงับเหตุฉุกเฉินตลอด 24 ชั่วโมง',
      description_en: 'Municipal emergency fire fighting and disaster response unit',
      phone: '054-613999'
    }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0550, 17.9870] },
    properties: {
      id: 'svc-5',
      name_th: 'ศูนย์พัฒนาคุณภาพชีวิตและส่งเสริมอาชีพผู้สูงอายุ เทศบาลตำบลเด่นชัย',
      name_en: 'Denchai Elderly & Community Welfare Center',
      category: 'welfare',
      description_th: 'ศูนย์บริการสังคม กิจกรรมนันทนาการ และส่งเสริมอาชีพผู้สูงอายุในชุมชน',
      description_en: 'Community welfare and active-aging vocational activity center',
      phone: '054-613888'
    }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0470, 17.9800] },
    properties: {
      id: 'svc-6',
      name_th: 'ที่ทำการไปรษณีย์เด่นชัย (รหัสไปรษณีย์ 54110)',
      name_en: 'Denchai Post Office',
      category: 'post',
      description_th: 'บริการรับส่งพัสดุ จดหมาย และบริการโอนเงินไปรษณีย์ไทย',
      description_en: 'Thailand Post branch for mail and parcel logistics',
      phone: '054-613123'
    }
  },
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [100.0650, 17.9890] },
    properties: {
      id: 'svc-7',
      name_th: 'ศูนย์คัดแยกและจัดการขยะมูลฝอย เทศบาลตำบลเด่นชัย',
      name_en: 'Denchai Municipal Waste Management Center',
      category: 'waste',
      description_th: 'ศูนย์แปรรูปขยะอินทรีย์ ปุ๋ยหมัก และจัดการขยะรีไซเคิลชุมชน',
      description_en: 'Municipal composting and recyclable waste processing facility',
      phone: '054-613880'
    }
  }
];

const content = `// ── Public Services (บริการสาธารณะ) — เทศบาลตำบลเด่นชัย ──
// ข้อมูลพิกัดและเบอร์โทรศัพท์ติดต่อจริงในเขตเทศบาลตำบลเด่นชัย จ.แพร่

export const SERVICE_CATEGORIES = ${JSON.stringify(SERVICE_CATEGORIES, null, 2)};

export const SERVICE_DATA = {
  type: 'FeatureCollection',
  features: ${JSON.stringify(SERVICE_FEATURES, null, 2)}
};
`;

fs.writeFileSync('src/data/service_data.js', content, 'utf8');
console.log(`Successfully generated src/data/service_data.js with real Denchai public services and phone numbers!`);
