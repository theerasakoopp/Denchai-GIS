// ── Water Bodies Polygon Dataset — เทศบาลตำบลเด่นชัย จ.แพร่ ──
// แหล่งน้ำผิวดินแบบ Polygon 100% (แม่น้ำยม, ลำห้วยแม่พวก, อ่างเก็บน้ำ, สระแก้มลิง, สระประปา)

export const WATER_CATEGORIES = {
  "river": {
    "name_th": "แม่น้ำยม / ลำน้ำสายหลัก",
    "name_en": "Mae Yom River & Main Rivers",
    "color": "#0284c7",
    "fillColor": "rgba(2, 132, 199, 0.45)",
    "icon": "🌊"
  },
  "canal": {
    "name_th": "ลำห้วย / คลองส่งน้ำชลประทาน",
    "name_en": "Streams & Canals",
    "color": "#06b6d4",
    "fillColor": "rgba(6, 182, 212, 0.4)",
    "icon": "💧"
  },
  "reservoir": {
    "name_th": "อ่างเก็บน้ำ / สระแก้มลิงชุมชน",
    "name_en": "Reservoirs & Retention Basins",
    "color": "#0ea5e9",
    "fillColor": "rgba(14, 165, 233, 0.45)",
    "icon": "🏞️"
  },
  "pond": {
    "name_th": "สระน้ำเพื่อการเกษตร / หนองน้ำ",
    "name_en": "Agricultural & Public Ponds",
    "color": "#14b8a6",
    "fillColor": "rgba(20, 184, 166, 0.4)",
    "icon": "🌾"
  },
  "water_plant": {
    "name_th": "สระพักน้ำดิบประปาเทศบาล",
    "name_en": "Municipal Water Storage Basins",
    "color": "#3b82f6",
    "fillColor": "rgba(59, 130, 246, 0.45)",
    "icon": "🚰"
  }
};

export const WATER_DATA = {
  "type": "FeatureCollection",
  "name": "Denchai_Water_Bodies_Polygons",
  "features": [
    // ── 1. แม่น้ำยม (Mae Yom River Reach 1 - ทอดยาวผ่านเทศบาลเด่นชัย) ──
    {
      "type": "Feature",
      "properties": {
        "id": "water_poly_01",
        "name_th": "แม่น้ำยม (ช่วงผ่านเขตเทศบาลตำบลเด่นชัย)",
        "name_en": "Mae Yom River (Den Chai Reach)",
        "category": "river",
        "area_sqm": 128450,
        "area_rai": "80 ไร่ 1 งาน 12.5 วา",
        "capacity_m3": 450000,
        "water_quality": "good",
        "purpose": "แหล่งน้ำต้นทุนสายหลัก / ชลประทาน / ระบบนิเวศน์",
        "description_th": "แม่น้ำสายประธานสำคัญ หล่อเลี้ยงพื้นที่เกษตรกรรมและการผลิตน้ำประปาของอำเภอเด่นชัย",
        "description_en": "Main river basin supporting municipal water intake and regional agriculture."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [100.0380, 18.0042], [100.0410, 18.0035], [100.0452, 18.0018],
          [100.0495, 17.9985], [100.0538, 17.9942], [100.0582, 17.9890],
          [100.0615, 17.9835], [100.0642, 17.9780], [100.0668, 17.9725],
          [100.0685, 17.9680], [100.0672, 17.9678], [100.0652, 17.9720],
          [100.0628, 17.9775], [100.0601, 17.9830], [100.0568, 17.9885],
          [100.0522, 17.9938], [100.0480, 17.9980], [100.0438, 18.0012],
          [100.0395, 18.0030], [100.0368, 18.0038], [100.0380, 18.0042]
        ]]
      }
    },

    // ── 2. ลำห้วยแม่พวก (Huai Mae Phuak Stream Corridor) ──
    {
      "type": "Feature",
      "properties": {
        "id": "water_poly_02",
        "name_th": "ลำห้วยแม่พวก (ช่วงย่านสถานีรถไฟเด่นชัย)",
        "name_en": "Huai Mae Phuak Stream Corridor",
        "category": "canal",
        "area_sqm": 42600,
        "area_rai": "26 ไร่ 2 งาน 50.0 วา",
        "capacity_m3": 85000,
        "water_quality": "good",
        "purpose": "ระบายน้ำธรรมชาติ / เกษตรกรรมชุมชน",
        "description_th": "ลำน้ำธรรมชาติสาขาของแม่น้ำยม ไหลผ่านใจกลางเมืองเด่นชัยและย่านสถานีรถไฟ",
        "description_en": "Natural stream flowing through central Den Chai town into Yom River."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [100.0485, 17.9782], [100.0512, 17.9795], [100.0538, 17.9818],
          [100.0565, 17.9845], [100.0588, 17.9878], [100.0602, 17.9882],
          [100.0582, 17.9868], [100.0558, 17.9838], [100.0530, 17.9810],
          [100.0505, 17.9788], [100.0480, 17.9776], [100.0485, 17.9782]
        ]]
      }
    },

    // ── 3. อ่างเก็บน้ำห้วยไร่ (Huai Rai Reservoir) ──
    {
      "type": "Feature",
      "properties": {
        "id": "water_poly_03",
        "name_th": "อ่างเก็บน้ำห้วยไร่ (เทศบาลตำบลเด่นชัย)",
        "name_en": "Huai Rai Municipal Reservoir",
        "category": "reservoir",
        "area_sqm": 68500,
        "area_rai": "42 ไร่ 3 งาน 25.0 วา",
        "capacity_m3": 320000,
        "water_quality": "good",
        "purpose": "กักเก็บน้ำอุปโภคบริโภค / ชะลอน้ำหลาก",
        "description_th": "อ่างเก็บน้ำขนาดกลางทางทิศใต้ของเทศบาล เป็นแหล่งน้ำสำรองและพักผ่อนหย่อนใจ",
        "description_en": "Medium reservoir serving as key municipal raw water reserve and flood prevention."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [100.0710, 17.9750], [100.0745, 17.9765], [100.0768, 17.9752],
          [100.0780, 17.9730], [100.0762, 17.9708], [100.0725, 17.9715],
          [100.0702, 17.9732], [100.0710, 17.9750]
        ]]
      }
    },

    // ── 4. สระแก้มลิงหนองช้างเปา (Nong Chang Pao Flood Retention Basin) ──
    {
      "type": "Feature",
      "properties": {
        "id": "water_poly_04",
        "name_th": "สระแก้มลิงและหนองน้ำสาธารณะหนองช้างเปา",
        "name_en": "Nong Chang Pao Public Retention Basin",
        "category": "reservoir",
        "area_sqm": 35200,
        "area_rai": "22 ไร่ 0 งาน 0.0 วา",
        "capacity_m3": 120000,
        "water_quality": "fair",
        "purpose": "แก้มลิงหน่วงน้ำ / แหล่งประมงชุมชน",
        "description_th": "สระแก้มลิงหนองช้างเปา รองรับน้ำหลากช่วงฤดูฝน ป้องกันน้ำท่วมพื้นที่ชุมชนและตลาดสด",
        "description_en": "Community retention basin preventing seasonal flooding and supporting fisheries."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [100.0540, 17.9880], [100.0568, 17.9892], [100.0582, 17.9875],
          [100.0570, 17.9858], [100.0542, 17.9862], [100.0540, 17.9880]
        ]]
      }
    },

    // ── 5. สระพักน้ำดิบผลิตประปาเทศบาลตำบลเด่นชัย ──
    {
      "type": "Feature",
      "properties": {
        "id": "water_poly_05",
        "name_th": "สระพักน้ำดิบและบ่อตกตะกอนการประปาเทศบาล",
        "name_en": "Den Chai Municipal Water Treatment Storage Ponds",
        "category": "water_plant",
        "area_sqm": 18400,
        "area_rai": "11 ไร่ 2 งาน 0.0 วา",
        "capacity_m3": 65000,
        "water_quality": "good",
        "purpose": "ผลิตน้ำประปาสะอาดบริการประชาชน",
        "description_th": "สระกักเก็บน้ำดิบและบ่อตกตะกอนของโรงผลิตน้ำประปาเทศบาลตำบลเด่นชัย",
        "description_en": "Raw water storage and sedimentation basins for municipal potable water production."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [100.0520, 17.9835], [100.0542, 17.9842], [100.0548, 17.9825],
          [100.0526, 17.9818], [100.0520, 17.9835]
        ]]
      }
    },

    // ── 6. สระน้ำเพื่อการเกษตรชุมชนห้วยไร่ (Agricultural Retention Pond 1) ──
    {
      "type": "Feature",
      "properties": {
        "id": "water_poly_06",
        "name_th": "สระน้ำเพื่อการเกษตรชุมชนห้วยไร่ (แปลงที่ 1)",
        "name_en": "Huai Rai Agricultural Retention Pond #1",
        "category": "pond",
        "area_sqm": 14200,
        "area_rai": "8 ไร่ 3 งาน 50.0 วา",
        "capacity_m3": 42000,
        "water_quality": "good",
        "purpose": "น้ำเพื่อการเกษตรและเพาะปลูกพืชฤดูแล้ง",
        "description_th": "สระน้ำประจำแปลงเกษตรผสมผสานและสวนผลไม้ ให้บริการเกษตรกรในพื้นที่",
        "description_en": "Agricultural storage pond supporting drought cultivation and fruit orchards."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [100.0665, 17.9840], [100.0688, 17.9848], [100.0695, 17.9832],
          [100.0672, 17.9825], [100.0665, 17.9840]
        ]]
      }
    },

    // ── 7. สระน้ำเพื่อการเกษตรบ้านเด่นชัย (Agricultural Retention Pond 2) ──
    {
      "type": "Feature",
      "properties": {
        "id": "water_poly_07",
        "name_th": "สระน้ำเพื่อการเกษตรบ้านเด่นชัย (แปลงที่ 2)",
        "name_en": "Ban Den Chai Agricultural Pond #2",
        "category": "pond",
        "area_sqm": 9800,
        "area_rai": "6 ไร่ 0 งาน 50.0 วา",
        "capacity_m3": 28000,
        "water_quality": "good",
        "purpose": "น้ำเพื่อการเกษตร / ปศุสัตว์",
        "description_th": "สระน้ำชุมชนเพื่อการชลประทานและน้ำกินสำหรับปศุสัตว์",
        "description_en": "Community agricultural pond for small-scale irrigation and livestock."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [100.0430, 17.9895], [100.0450, 17.9902], [100.0455, 17.9888],
          [100.0435, 17.9882], [100.0430, 17.9895]
        ]]
      }
    },

    // ── 8. ลำเหมืองส่งน้ำชลประทานเด่นชัย (Irrigation Canal Corridor) ──
    {
      "type": "Feature",
      "properties": {
        "id": "water_poly_08",
        "name_th": "คลองส่งน้ำชลประทานฝายแม่ยม-เด่นชัย",
        "name_en": "Mae Yom - Den Chai Irrigation Canal Corridor",
        "category": "canal",
        "area_sqm": 26800,
        "area_rai": "16 ไร่ 3 งาน 0.0 วา",
        "capacity_m3": 52000,
        "water_quality": "good",
        "purpose": "กระจายน้ำชลประทานสู่แปลงนา",
        "description_th": "คลองส่งน้ำคอนกรีตดาดและรางน้ำเปิด รับน้ำจากฝายแม่ยมเข้าสู่พื้นที่เพาะปลูกข้าวของเทศบาล",
        "description_en": "Irrigation canal supplying water from Mae Yom Weir to municipality paddy fields."
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [100.0350, 17.9920], [100.0385, 17.9912], [100.0425, 17.9898],
          [100.0468, 17.9875], [100.0465, 17.9868], [100.0422, 17.9890],
          [100.0382, 17.9905], [100.0348, 17.9912], [100.0350, 17.9920]
        ]]
      }
    }
  ]
};
