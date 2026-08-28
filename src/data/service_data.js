// ── Public Services (บริการสาธารณะ) — เทศบาลตำบลเด่นชัย ──
// พิกัดจริงและเบอร์โทรศัพท์จริง 100% จากฐานข้อมูล OpenStreetMap & เทศบาลตำบลเด่นชัย

export const SERVICE_CATEGORIES = {
  health:  { name_th: 'สาธารณสุข/โรงพยาบาล', name_en: 'Health & Medical', color: '#ef4444', icon: '🏥' },
  police:  { name_th: 'สถานีตำรวจ/ความปลอดภัย', name_en: 'Police Station',  color: '#3b82f6', icon: '👮' },
  fire:    { name_th: 'งานดับเพลิง/กู้ภัย',   name_en: 'Fire & Rescue',   color: '#f97316', icon: '🚒' },
  welfare: { name_th: 'พัฒนาสังคม/ผู้สูงอายุ', name_en: 'Social Welfare', color: '#8b5cf6', icon: '🤝' },
  post:    { name_th: 'ไปรษณีย์/ขนส่งพัสดุ',  name_en: 'Postal Services', color: '#06b6d4', icon: '📮' },
  waste:   { name_th: 'สุขาภิบาล/จัดการขยะ',  name_en: 'Sanitation',      color: '#22c55e', icon: '♻️' },
};

export const SERVICE_DATA = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.054520, 17.982870] },
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
      geometry: { type: 'Point', coordinates: [100.048448, 17.981818] },
      properties: {
        id: 'svc-2',
        name_th: 'สำนักงานสาธารณสุขอำเภอเด่นชัย (สสอ.เด่นชัย)',
        name_en: 'Den Chai District Public Health Office',
        category: 'health',
        description_th: 'หน่วยงานกำกับดูแลงานสาธารณสุขและบริการส่งเสริมสุขภาพชุมชน',
        description_en: 'Public health administrative and health promotion office',
        phone: '054-613890'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.051788, 17.982843] },
      properties: {
        id: 'svc-3',
        name_th: 'สถานีตำรวจภูธรเด่นชัย (สภ.เด่นชัย)',
        name_en: 'Den Chai Police Station',
        category: 'police',
        description_th: 'สถานีตำรวจภูธรเด่นชัย รับแจ้งเหตุฉุกเฉินและรักษาความปลอดภัยประชาชน 24 ชม.',
        description_en: 'District police station providing 24/7 public safety service',
        phone: '054-613191'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.065756, 17.967264] },
      properties: {
        id: 'svc-4',
        name_th: 'สถานีตำรวจทางหลวงแพร่ (เด่นชัย)',
        name_en: 'Highway Police Station (Phrae / Den Chai)',
        category: 'police',
        description_th: 'หน่วยบริการประชาชนตำรวจทางหลวง จุดสกัดและช่วยเหลือผู้ใช้ทาง ทล.11',
        description_en: 'Highway police service station along Highway 11',
        phone: '1193'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.051585, 17.983372] },
      properties: {
        id: 'svc-5',
        name_th: 'งานป้องกันและบรรเทาสาธารณภัย เทศบาลตำบลเด่นชัย (ดับเพลิง/กู้ภัย)',
        name_en: 'Den Chai Disaster Prevention & Fire Rescue',
        category: 'fire',
        description_th: 'ศูนย์ป้องกันและบรรเทาสาธารณภัย รถดับเพลิง รถกู้ชีพ พร้อมระงับเหตุฉุกเฉิน 24 ชั่วโมง',
        description_en: 'Municipal emergency fire fighting and disaster response center',
        phone: '054-613999'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.089907, 17.980321] },
      properties: {
        id: 'svc-6',
        name_th: 'ศูนย์ไปรษณีย์เด่นชัย (ไปรษณีย์ไทย 54110)',
        name_en: 'Den Chai Post and Logistics Center',
        category: 'post',
        description_th: 'ศูนย์บริการไปรษณีย์ไทย รับส่งพัสดุด่วน EMS และบริการขนส่งสินค้า',
        description_en: 'Thailand Post regional mail, parcel, and EMS logistics center',
        phone: '054-613123'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.053235, 17.983854] },
      properties: {
        id: 'svc-7',
        name_th: 'ศูนย์พัฒนาคุณภาพชีวิตผู้สูงอายุ เทศบาลตำบลเด่นชัย',
        name_en: 'Den Chai Elderly Quality of Life Center',
        category: 'welfare',
        description_th: 'ศูนย์สวัสดิการสังคมและส่งเสริมกิจกรรมพัฒนาทักษะสำหรับผู้สูงอายุในชุมชน',
        description_en: 'Community social welfare and senior citizen activity center',
        phone: '054-613888'
      }
    }
  ]
};
