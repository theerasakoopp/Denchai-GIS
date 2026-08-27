// ── Infrastructure Data — เทศบาลตำบลเด่นชัย ──
// ข้อมูลตัวอย่าง (Demo Data) โครงสร้างพื้นฐาน

export const INFRA_CATEGORIES = {
  road:      { name_th: 'ถนน/เส้นทาง',     name_en: 'Roads',          color: '#f97316', icon: '🛣️' },
  bridge:    { name_th: 'สะพาน',            name_en: 'Bridges',        color: '#ef4444', icon: '🌉' },
  water:     { name_th: 'ระบบประปา/แหล่งน้ำ', name_en: 'Water System', color: '#06b6d4', icon: '💧' },
  electric:  { name_th: 'ระบบไฟฟ้า',        name_en: 'Electrical',     color: '#eab308', icon: '⚡' },
  drainage:  { name_th: 'ระบบระบายน้ำ',     name_en: 'Drainage',       color: '#64748b', icon: '🌊' },
};

export const INFRA_DATA = {
  type: 'FeatureCollection',
  features: [
    // ── ถนน (LineString) ──
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.0420, 17.9780], [100.0480, 17.9810], [100.0540, 17.9835],
          [100.0600, 17.9850], [100.0660, 17.9870]
        ]
      },
      properties: { id: 'infra-1', name_th: 'ทางหลวงแผ่นดินหมายเลข 11', name_en: 'Highway No. 11', category: 'road', description_th: 'ถนนสายหลักผ่านเขตเทศบาล เชื่อมต่อเด่นชัย-เด่นชัย', description_en: 'Main highway through municipality', length_km: 3.2 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.0500, 17.9750], [100.0510, 17.9790], [100.0530, 17.9830],
          [100.0540, 17.9870], [100.0550, 17.9910]
        ]
      },
      properties: { id: 'infra-2', name_th: 'ทางหลวงแผ่นดินหมายเลข 101', name_en: 'Highway No. 101', category: 'road', description_th: 'ถนนสายรองผ่านตัวเมือง', description_en: 'Secondary highway through town center', length_km: 2.1 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.0470, 17.9820], [100.0520, 17.9830], [100.0570, 17.9835],
          [100.0620, 17.9840]
        ]
      },
      properties: { id: 'infra-3', name_th: 'ถนนเทศบาล สาย 1', name_en: 'Municipal Road 1', category: 'road', description_th: 'ถนนสายหลักของเทศบาล', description_en: 'Main municipal road', length_km: 1.6 }
    },

    // ── สะพาน (Point) ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0515, 17.9805] },
      properties: { id: 'infra-4', name_th: 'สะพานข้ามลำน้ำแม่สอง', name_en: 'Mae Song River Bridge', category: 'bridge', description_th: 'สะพานคอนกรีตข้ามลำน้ำแม่สอง กว้าง 8 ม.', description_en: 'Concrete bridge over Mae Song River, 8m wide', width_m: 8, year_built: 2010 }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0580, 17.9790] },
      properties: { id: 'infra-5', name_th: 'สะพานคลองชลประทาน', name_en: 'Irrigation Canal Bridge', category: 'bridge', description_th: 'สะพานเหล็กข้ามคลองชลประทาน', description_en: 'Steel bridge over irrigation canal', width_m: 6, year_built: 2015 }
    },

    // ── ระบบประปา (Point) ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0465, 17.9850] },
      properties: { id: 'infra-6', name_th: 'โรงกรองน้ำประปาเด่นชัย', name_en: 'Denchai Water Treatment Plant', category: 'water', description_th: 'โรงผลิตน้ำประปา กำลังผลิต 200 ลบ.ม./ชม.', description_en: 'Water treatment plant, 200 m³/h capacity', capacity_m3: 200 }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0590, 17.9810] },
      properties: { id: 'infra-7', name_th: 'หอถังสูงประปาเทศบาล', name_en: 'Municipal Water Tower', category: 'water', description_th: 'หอถังสูงจ่ายน้ำประปา ความจุ 100 ลบ.ม.', description_en: 'Water tower, 100 m³ capacity', capacity_m3: 100 }
    },

    // ── ระบบไฟฟ้า (Point) ──
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0475, 17.9830] },
      properties: { id: 'infra-8', name_th: 'สถานีไฟฟ้าย่อยเด่นชัย', name_en: 'Denchai Substation', category: 'electric', description_th: 'สถานีไฟฟ้าย่อย การไฟฟ้าส่วนภูมิภาค', description_en: 'PEA electrical substation', capacity_kva: 5000 }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0555, 17.9865] },
      properties: { id: 'infra-9', name_th: 'หม้อแปลงไฟฟ้าชุมชน', name_en: 'Community Transformer', category: 'electric', description_th: 'หม้อแปลง 250 KVA จ่ายไฟชุมชน', description_en: '250 KVA transformer serving community', capacity_kva: 250 }
    },

    // ── ระบบระบายน้ำ (LineString) ──
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.0480, 17.9870], [100.0520, 17.9850], [100.0560, 17.9830],
          [100.0600, 17.9810]
        ]
      },
      properties: { id: 'infra-10', name_th: 'คลองระบายน้ำสายหลัก', name_en: 'Main Drainage Canal', category: 'drainage', description_th: 'คลองระบายน้ำสายหลักของเทศบาล ยาว 1.5 กม.', description_en: 'Main drainage canal, 1.5 km', length_km: 1.5 }
    },
  ]
};
