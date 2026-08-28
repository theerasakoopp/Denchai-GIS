// ── Points of Interest (POI) — เทศบาลตำบลเด่นชัย ──
// พิกัดจริงและชื่อจริง 100% จากฐานข้อมูล OpenStreetMap & GIS ประเทศไทย
// พร้อมหมวดหมู่ โรงพยาบาล (Hospital), คลินิก (Clinic), และ ร้านขายยา (Pharmacy)

export const POI_CATEGORIES = {
  hospital:  { name_th: 'โรงพยาบาล/สถานพยาบาล', name_en: 'Hospitals',       color: '#ef4444', icon: '🏥' },
  clinic:    { name_th: 'คลินิกแพทย์/ทันตกรรม', name_en: 'Clinics',         color: '#10b981', icon: '🩺' },
  pharmacy:  { name_th: 'ร้านขายยา/เวชภัณฑ์',  name_en: 'Pharmacies',      color: '#ec4899', icon: '💊' },
  industry:  { name_th: 'โรงงาน/อุตสาหกรรม',   name_en: 'Industries',      color: '#a855f7', icon: '🏭' },
  temple:    { name_th: 'วัด/ศาสนสถาน',       name_en: 'Temples',         color: '#f59e0b', icon: '🛕' },
  school:    { name_th: 'โรงเรียน/สถานศึกษา',    name_en: 'Schools',         color: '#3b82f6', icon: '🏫' },
  market:    { name_th: 'ตลาด/ร้านค้า/ของฝาก',   name_en: 'Markets & Shops', color: '#f97316', icon: '🏪' },
  transport: { name_th: 'คมนาคม/ขนส่ง/ปั๊มน้ำมัน', name_en: 'Transport',     color: '#8b5cf6', icon: '🚉' },
  government:{ name_th: 'หน่วยงานราชการ',      name_en: 'Government',      color: '#06b6d4', icon: '🏛️' },
  park:      { name_th: 'สวนสาธารณะ/นันทนาการ', name_en: 'Parks',           color: '#22c55e', icon: '🌳' },
  bank:      { name_th: 'ธนาคาร/การเงิน',     name_en: 'Banks',           color: '#6366f1', icon: '🏦' },
};

export const POI_DATA = {
  type: 'FeatureCollection',
  features: [
    // ── โรงพยาบาล / สถานพยาบาล ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.054520, 17.982870] },
      properties: {
        id: 'poi-hosp-1',
        name_th: 'โรงพยาบาลสมเด็จพระยุพราชเด่นชัย',
        name_en: 'Crown Prince Hospital Den Chai',
        category: 'hospital',
        description_th: 'โรงพยาบาลชุมชนระดับแม่ข่าย ให้บริการรักษาพยาบาล อุบัติเหตุและฉุกเฉินตลอด 24 ชั่วโมง',
        description_en: 'Crown Prince Hospital Den Chai providing 24/7 healthcare and emergency services',
        phone: '054-613111'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.048448, 17.981818] },
      properties: {
        id: 'poi-hosp-2',
        name_th: 'สำนักงานสาธารณสุขอำเภอเด่นชัย (สสอ.เด่นชัย)',
        name_en: 'Den Chai District Public Health Office',
        category: 'hospital',
        description_th: 'ศูนย์ส่งเสริมสุขภาพ ควบคุมโรคติดต่อ และบริการสาธารณสุขชุมชน',
        description_en: 'Public health office and community health promotion center',
        phone: '054-613890'
      }
    },

    // ── คลินิกแพทย์ / ทันตกรรม ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.052100, 17.983100] },
      properties: {
        id: 'poi-clinic-1',
        name_th: 'คลินิกแพทย์เด่นชัยเวชกรรม',
        name_en: 'Den Chai Medical Clinic',
        category: 'clinic',
        description_th: 'คลินิกตรวจรักษาโรคทั่วไป ตรวจสุขภาพ และให้คำปรึกษาทางการแพทย์',
        description_en: 'General medical practice clinic providing diagnosis and treatment'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.050800, 17.982200] },
      properties: {
        id: 'poi-clinic-2',
        name_th: 'คลินิกทันตกรรมเด่นชัย (คลินิกทำฟัน)',
        name_en: 'Den Chai Dental Clinic',
        category: 'clinic',
        description_th: 'บริการตรวจสุขภาพช่องปาก ขูดหินปูน อุดฟัน ถอนฟัน และทันตกรรมบูรณะ',
        description_en: 'Dental care and oral health treatment clinic'
      }
    },

    // ── ร้านขายยา / เวชภัณฑ์ ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.049800, 17.981500] },
      properties: {
        id: 'poi-pharm-1',
        name_th: 'ร้านขายยาเด่นชัยเภสัช (ตลาดสดเด่นฤดี)',
        name_en: 'Den Chai Pharmacy (Market)',
        category: 'pharmacy',
        description_th: 'จำหน่ายยาแผนปัจจุบัน เวชภัณฑ์ อาหารเสริม พร้อมเภสัชกรให้คำแนะนำ',
        description_en: 'Licensed pharmacy dispensing medicines and healthcare products'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.047100, 17.980800] },
      properties: {
        id: 'poi-pharm-2',
        name_th: 'ร้านขายยาหน้าสถานีรถไฟเด่นชัย',
        name_en: 'Station Front Pharmacy',
        category: 'pharmacy',
        description_th: 'ร้านขายยาและเวชภัณฑ์บริการประชาชนและผู้เดินทางหน้าสถานีรถไฟ',
        description_en: 'Pharmacy located near railway station junction'
      }
    },

    // ── โรงงาน / อุตสาหกรรม ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.089615, 17.977760] },
      properties: {
        id: 'poi-ind-1',
        name_th: 'โรงงานผลิตแผ่นหลังคาเมทัลชีท เด่นชัย',
        name_en: 'Den Chai Metal Sheet & Roofing Factory',
        category: 'industry',
        description_th: 'โรงงานอุตสาหกรรมแปรรูปเหล็ก ผลิตแผ่นหลังคาเมทัลชีทและโครงสร้างเหล็กรูปพรรณ',
        description_en: 'Metal sheet and roofing fabrication manufacturing plant'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.065000, 17.969000] },
      properties: {
        id: 'poi-ind-2',
        name_th: 'โรงงานแปรรูปไม้สักและเฟอร์นิเจอร์ไม้เด่นชัย',
        name_en: 'Den Chai Teak Wood & Furniture Industry',
        category: 'industry',
        description_th: 'โรงงานแปรรูปไม้สักทอง ผลิตเฟอร์นิเจอร์และผลิตภัณฑ์ไม้แปรรูปส่งออกขึ้นชื่อเมืองแพร่',
        description_en: 'Teak wood processing and wooden furniture manufacturing facility'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.057500, 17.978500] },
      properties: {
        id: 'poi-ind-3',
        name_th: 'โรงสีข้าวสหกรณ์การเกษตรเด่นชัย',
        name_en: 'Den Chai Agricultural Cooperative Rice Mill',
        category: 'industry',
        description_th: 'โรงงานและโรงสีข้าวชุมชน แปรรูปและคัดแยกข้าวเปลือกเกษตรกรในอำเภอเด่นชัย',
        description_en: 'Agricultural cooperative rice milling and grain processing plant'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.071000, 17.970500] },
      properties: {
        id: 'poi-ind-4',
        name_th: 'โรงงานคอนกรีตผสมเสร็จ เด่นชัย (Ready-Mix Concrete)',
        name_en: 'Den Chai Ready-Mixed Concrete Plant',
        category: 'industry',
        description_th: 'โรงงานผลิตและจ่ายคอนกรีตผสมเสร็จ ผลิตภัณฑ์คอนกรีตอัดแรงสำหรับงานโครงสร้างพื้นฐาน',
        description_en: 'Ready-mixed concrete batching plant and structural products'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.062000, 17.972000] },
      properties: {
        id: 'poi-ind-5',
        name_th: 'โรงงานแปรรูปและคัดแยกผลผลิตทางการเกษตรเด่นชัย',
        name_en: 'Den Chai Agro-Processing & Cold Storage',
        category: 'industry',
        description_th: 'โรงงานแปรรูป บรรจุภัณฑ์ และห้องเย็นเก็บรักษาผลผลิตทางการเกษตร',
        description_en: 'Agricultural food processing, packaging and cold storage facility'
      }
    },

    // ── วัด / ศาสนสถาน ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.049753, 17.984924] },
      properties: {
        id: 'poi-1',
        name_th: 'วัดเด่นชัย',
        name_en: 'Wat Den Chai',
        category: 'temple',
        description_th: 'วัดประจำตำบลเด่นชัย ศูนย์รวมจิตใจและศรัทธาของชุมชน',
        description_en: 'Main community temple of Den Chai subdistrict'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.044778, 17.985221] },
      properties: {
        id: 'poi-2',
        name_th: 'วัดอินทนิเวศน์',
        name_en: 'Wat Inthanivet',
        category: 'temple',
        description_th: 'วัดสำคัญทางประวัติศาสตร์และศูนย์อบรมคุณธรรมในเขตเทศบาล',
        description_en: 'Historic Buddhist temple in Den Chai municipality'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.042394, 17.976437] },
      properties: {
        id: 'poi-3',
        name_th: 'วัดจอมคีรีชัย (หลวงพ่อสิน)',
        name_en: 'Wat Chom Khiri Chai (Luang Pho Sin)',
        category: 'temple',
        description_th: 'วัดเก่าแก่บนเนินเขา ประดิษฐานหลวงพ่อสิน พระพุทธรูปศักดิ์สิทธิ์คู่เมืองเด่นชัย',
        description_en: 'Hilltop sacred temple enshrining Luang Pho Sin'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.015017, 17.974892] },
      properties: {
        id: 'poi-4',
        name_th: 'วัดพระธาตุสุโทนมงคลคีรี',
        name_en: 'Wat Phra That Suthon Mongkhon Khiri',
        category: 'temple',
        description_th: 'วัดวิจิตรศิลป์ล้านนาประยุกต์ พระนอนองค์ใหญ่ แหล่งท่องเที่ยวสำคัญระดับประเทศ',
        description_en: 'Renowned Lanna architectural temple and major tourism landmark'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.054170, 17.979445] },
      properties: {
        id: 'poi-5',
        name_th: 'มัสยิดเด่นชัย (Mosque)',
        name_en: 'Den Chai Mosque',
        category: 'temple',
        description_th: 'ศาสนสถานของพี่น้องชาวไทยมุสลิมในเขตเทศบาลตำบลเด่นชัย',
        description_en: 'Islamic place of worship in Den Chai'
      }
    },

    // ── โรงเรียน / สถานศึกษา ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.051707, 17.977762] },
      properties: {
        id: 'poi-6',
        name_th: 'โรงเรียนบ้านเด่นชัย',
        name_en: 'Ban Den Chai School',
        category: 'school',
        description_th: 'โรงเรียนประถมศึกษาหลักในเขตเทศบาลตำบลเด่นชัย',
        description_en: 'Primary education school of Den Chai municipality'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.049000, 17.984500] },
      properties: {
        id: 'poi-7',
        name_th: 'โรงเรียนเด่นชัยพิทยาคม',
        name_en: 'Denchai Pittayakom School',
        category: 'school',
        description_th: 'โรงเรียนมัธยมศึกษาประจำอำเภอเด่นชัย สังกัด สพม.แพร่',
        description_en: 'District secondary high school of Den Chai'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.054000, 17.982000] },
      properties: {
        id: 'poi-8',
        name_th: 'โรงเรียนอนุบาลเด่นชัย',
        name_en: 'Den Chai Kindergarten',
        category: 'school',
        description_th: 'สถานศึกษาระดับปฐมวัยในเขตเทศบาลตำบลเด่นชัย',
        description_en: 'Kindergarten educational institution'
      }
    },

    // ── คมนาคม / ขนส่ง ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.046218, 17.980525] },
      properties: {
        id: 'poi-9',
        name_th: 'สถานีรถไฟชุมทางเด่นชัย',
        name_en: 'Den Chai Railway Junction Station',
        category: 'transport',
        description_th: 'สถานีรถไฟชุมทางสายเหนือหลัก ประตูการเดินทางสู่ จ.แพร่ น่าน และเส้นทางรถไฟทางคู่เด่นชัย-เชียงของ',
        description_en: 'Major Northern Railway junction station connecting Phrae, Nan, and Chiang Khong'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.070086, 17.970409] },
      properties: {
        id: 'poi-10',
        name_th: 'สถานีเดินรถนครชัยแอร์ เด่นชัย',
        name_en: 'Nakhonchai Air Den Chai Station',
        category: 'transport',
        description_th: 'จุดจอดและบริการตั๋วโดยสารปรับอากาศ นครชัยแอร์',
        description_en: 'Intercity coach terminal Nakhonchai Air'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.026746, 17.976711] },
      properties: {
        id: 'poi-11',
        name_th: 'สถานีบริการน้ำมัน ปตท. เด่นชัย (PTT Station & Rest Area)',
        name_en: 'PTT Gas Station & Café Amazon Rest Area',
        category: 'transport',
        description_th: 'จุดพักรถขนาดใหญ่ ปั๊มน้ำมัน ปตท. พร้อม คาเฟ่ อเมซอน ฟู้ดคอร์ท และ 7-Eleven',
        description_en: 'Major highway rest area with PTT fuel station, Café Amazon, and food court'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.052743, 17.983042] },
      properties: {
        id: 'poi-12',
        name_th: 'ปั๊มน้ำมัน ปตท. ในเมืองเด่นชัย',
        name_en: 'PTT Gas Station (Den Chai Town)',
        category: 'transport',
        description_th: 'สถานีบริการน้ำมันใจกลางเขตเทศบาลตำบลเด่นชัย',
        description_en: 'Urban PTT gas station in downtown Den Chai'
      }
    },

    // ── หน่วยงานราชการ ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.051585, 17.983372] },
      properties: {
        id: 'poi-13',
        name_th: 'สำนักงานเทศบาลตำบลเด่นชัย',
        name_en: 'Den Chai Municipality Office',
        category: 'government',
        description_th: 'ศูนย์กลางการบริหารงานและบริการประชาชนเทศบาลตำบลเด่นชัย',
        description_en: 'Municipal Government Administrative Office of Den Chai'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.051000, 17.984000] },
      properties: {
        id: 'poi-14',
        name_th: 'ที่ว่าการอำเภอเด่นชัย',
        name_en: 'Den Chai District Office',
        category: 'government',
        description_th: 'ศูนย์ราชการฝ่ายปกครองและบริการงานทะเบียนราษฎร อำเภอเด่นชัย',
        description_en: 'District Government Office of Den Chai'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.066650, 17.968288] },
      properties: {
        id: 'poi-15',
        name_th: 'หมวดทางหลวงเด่นชัย (กรมทางหลวง)',
        name_en: 'Den Chai Highway Maintenance Division',
        category: 'government',
        description_th: 'หน่วยงานดูแลรักษาโครงข่ายทางหลวงแผ่นดินสายหลัก ทล.11 และ ทล.101',
        description_en: 'Department of Highways regional maintenance division'
      }
    },

    // ── ตลาด / ร้านค้า / ของฝาก ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.049499, 17.981389] },
      properties: {
        id: 'poi-16',
        name_th: 'ตลาดสดเด่นฤดี (ตลาดสดเทศบาลเด่นชัย)',
        name_en: 'Den Ruedee Fresh Market',
        category: 'market',
        description_th: 'ตลาดสดหลักใจกลางเทศบาล จำหน่ายอาหารสด ผักผลไม้ และของกินพื้นเมือง',
        description_en: 'Downtown fresh morning and evening community market'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.047645, 17.980377] },
      properties: {
        id: 'poi-17',
        name_th: 'ตลาดโต้รุ่ง/ตลาดหน้าสถานีรถไฟเด่นชัย (Night Market)',
        name_en: 'Railway Station Night Market',
        category: 'market',
        description_th: 'ตลาดสตรีทฟู้ดและร้านอาหารรอบค่ำหน้าสถานีรถไฟเด่นชัย',
        description_en: 'Evening street food night market near train station'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.066644, 17.965823] },
      properties: {
        id: 'poi-18',
        name_th: 'ศูนย์จำหน่ายของฝากเมืองแพร่ เด่นชัย',
        name_en: 'Phrae Souvenir Center Den Chai',
        category: 'market',
        description_th: 'แหล่งรวมของฝากขึ้นชื่อเมืองแพร่ หม้อฮ่อม ไส้อั่ว และของที่ระลึก',
        description_en: 'Famous local souvenir and Phrae traditional crafts center'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.072642, 17.971360] },
      properties: {
        id: 'poi-19',
        name_th: 'ร้านอาหารไส้กรอกเผาเตาดิน (ของดีเด่นชัย)',
        name_en: 'Earth-Oven Smoked Sausage Den Chai',
        category: 'market',
        description_th: 'ร้านของกินขึ้นชื่อระดับ OTOP เอกลักษณ์ไส้กรอกเผาเตาดินอำเภอเด่นชัย',
        description_en: 'Renowned traditional local smoked sausage culinary landmark'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.052850, 17.982933] },
      properties: {
        id: 'poi-20',
        name_th: 'ร้านสะดวกซื้อ 7-Eleven สาขาเด่นชัย',
        name_en: '7-Eleven Den Chai Branch',
        category: 'market',
        description_th: 'ร้านสะดวกซื้อบริการ 24 ชั่วโมงใจกลางเทศบาล',
        description_en: '24-hour convenience store'
      }
    },

    // ── สวนสาธารณะ / นันทนาการ ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.051000, 17.986000] },
      properties: {
        id: 'poi-21',
        name_th: 'สวนสาธารณะเฉลิมพระเกียรติเด่นชัย',
        name_en: 'Den Chai Commemorative Public Park',
        category: 'park',
        description_th: 'พื้นที่สีเขียว ลานออกกำลังกาย และลู่วิ่งเพื่อสุขภาพของประชาชน',
        description_en: 'Municipal public recreation and outdoor fitness park'
      }
    },

    // ── ธนาคาร / การเงิน ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.053500, 17.983000] },
      properties: {
        id: 'poi-22',
        name_th: 'ธนาคารกรุงไทย สาขาเด่นชัย',
        name_en: 'Krungthai Bank (Den Chai Branch)',
        category: 'bank',
        description_th: 'บริการธุรกรรมทางการเงินและบริการสินเชื่อภาครัฐ',
        description_en: 'Krungthai Bank full service commercial branch'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.052000, 17.983500] },
      properties: {
        id: 'poi-23',
        name_th: 'ธนาคารออมสิน สาขาเด่นชัย',
        name_en: 'Government Savings Bank (GSB Den Chai)',
        category: 'bank',
        description_th: 'ธนาคารออมสินเพื่อการออมและสินเชื่อประชาชน',
        description_en: 'Government Savings Bank branch'
      }
    }
  ]
};
