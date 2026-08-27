# 🛰️ Denchai-GIS: Rooftop Solar Potential Analytics & GIS Platform
### ระบบสารสนเทศภูมิศาสตร์และประเมินศักยภาพพลังงานแสงอาทิตย์บนหลังคา เทศบาลตำบลเด่นชัย จ.แพร่

[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-6.2-3969EC?logo=maplibre&logoColor=white)](https://maplibre.org/)
[![Turf.js](https://img.shields.io/badge/Turf.js-Spatial_Analysis-2ecc71)](https://turfjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 บทนำ (Introduction)
**Denchai-GIS** เป็นระบบภูมิสารสนเทศ (Web GIS) ขั้นสูงที่พัฒนาขึ้นสำหรับการประเมินศักยภาพการผลิตพลังงานแสงอาทิตย์บนหลังคา (Rooftop Solar Potential Assessment) ครอบคลุมพื้นที่เทศบาลตำบลเด่นชัย อำเภอเด่นชัย จังหวัดแพร่ โดยประมวลผลจากข้อมูลภาพถ่ายทางอากาศและข้อมูลความสูง 3 มิติจากอากาศยานไร้คนขับ (UAV LiDAR & High-Resolution Photogrammetry)

---

## ✨ ฟีเจอร์หลัก (Key Features)

- 🗺️ **3D Web GIS & Multiple Basemaps**:
  - แสดงผลแผนที่ความละเอียดสูงแบบ 3 มิติ (3D Pitch & Tilt)
  - สลับแผนที่ฐานได้หลากหลาย: ภาพถ่ายดาวเทียมความละเอียดสูง (Esri Satellite), CartoDB Dark Matter, Positron Light, และ OpenStreetMap
- ☀️ **การจำแนกทิศทางและมุมเอียงหลังคา (Rooftop Facet Classification)**:
  - จำแนกหลังคาตามทิศทางและความชัน: N-Roof, E-Roof, S-Roof, W-Roof, Flat Roof, U-Roof และ PV Panel
  - ปรับแก้ค่าความเข้มรังสีดวงอาทิตย์ตามทิศทางจริง (Azimuth Correction: Duffie & Beckman Model)
- 💰 **การวิเคราะห์ทางเศรษฐศาสตร์และระยะเวลาคืนทุน (Solar ROI & Financial Analytics)**:
  - คำนวณพลังงานที่ผลิตได้ต่อปี (Annual Solar Yield: kWh / MWh / GWh)
  - ประมาณการเงินประหยัดค่าไฟฟ้าต่อปี (Annual Cost Savings: THB)
  - ประเมินระยะเวลาคืนทุน (Payback Period) และประมาณการต้นทุนติดตั้ง (Capital Investment)
  - สามารถปรับอัตราค่าไฟฟ้า (Tariff Rate) และต้นทุนติดตั้งต่อ kWp ได้แบบเรียลไทม์
- 🌿 **การประเมินผลกระทบด้านสิ่งแวดล้อม (Environmental Impact)**:
  - คำนวณปริมาณการลดการปล่อยก๊าซเรือนกระจก (CO₂ Emissions Avoided: tCO₂e/year)
  - เปรียบเทียบเทียบเท่าจำนวนต้นไม้ที่ปลูก (Tree Planting Equivalency)
- ✂️ **การวิเคราะห์เฉพาะโซน (AOI Spatial Analysis)**:
  - อัปโหลดขอบเขตพื้นที่ศึกษาที่ต้องการ (.zip Shapefile หรือ .geojson) เพื่อตัดข้อมูลและคำนวณสถิติเฉพาะโซนได้ทันทีผ่าน Turf.js ในเบราว์เซอร์
- 📊 **การส่งออกข้อมูลและรายงาน (Data Export & Reports)**:
  - ส่งออกสถิติในรูปแบบ **CSV** และข้อมูลเชิงพื้นที่ **GeoJSON**
  - รองรับการสั่งพิมพ์ / บันทึกรายงานสรุปผลเทศบาลเป็น **PDF**

---

## 🛠️ โครงสร้างเทคโนโลยี (Tech Stack)

| ส่วนประกอบ | เทคโนโลยี |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 8 |
| **Mapping Engine** | MapLibre GL JS, Turf.js |
| **Data Visualization** | Recharts, Lucide Icons |
| **Spatial File Processing** | Shpjs (Zipped Shapefiles), GeoJSON |
| **Styling** | Vanilla CSS (Glassmorphism & Cyber Theme) |
| **Deployment** | GitHub Pages & GitHub Actions CI/CD |

---

## 🚀 การติดตั้งและรันบนเครื่อง (Local Development)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. เริ่มต้นรัน Dev Server
npm run dev

# 3. สร้าง Production Bundle
npm run build
```

---

## 📦 การอัปเดตและส่งขึ้น GitHub (1-Click Git Push)

สามารถอัปเดตโค้ดและส่งขึ้น GitHub repository ได้ง่ายๆ ผ่านคำสั่ง:

```bash
npm run push
```
หรือดับเบิลคลิกที่ไฟล์ `scripts/git-push.bat` ในโฟลเดอร์โปรเจกต์

---

## 👥 ผู้พัฒนา (Developers)
- **Denchai Municipality GIS & UAV-SolarNet Team**
- GitHub: [@theerasakoopp](https://github.com/theerasakoopp)
- Repository: [Denchai-GIS](https://github.com/theerasakoopp/Denchai-GIS)