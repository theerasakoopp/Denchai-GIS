# 🗺️ คู่มือการใช้งาน Template GeoJSON สำหรับ QGIS & Smart City GIS เทศบาลตำบลเด่นชัย

ไฟล์ทั้งหมดในโฟลเดอร์นี้เป็นไฟล์แม่แบบ **GeoJSON มาตรฐาน (EPSG:4326 - WGS 84)** ที่มีโครงสร้าง Attributes (ตารางข้อมูลคุณลักษณะ) ตรงกับระบบ **Web GIS & Dashboard** ของเทศบาลตำบลเด่นชัย 100%

---

## 📂 สรุปไฟล์ Template ทั้งหมด (16 หมวดข้อมูล)

### 🔹 กลุ่มที่ 1: ข้อมูลหลักที่มีในระบบเว็บแล้ว (Core Existing Layers)
| ชื่อไฟล์ | ชนิด Geometry | รายละเอียด & หมวดหมู่ |
| :--- | :--- | :--- |
| [`template_poi.geojson`](./template_poi.geojson) | `Point` | สถานที่สำคัญ (โรงพยาบาล, คลินิก, โรงเรียน, วัด, ตลาด, ขนส่ง, สถานที่ราชการ) |
| [`template_roads_transport.geojson`](./template_roads_transport.geojson) | `LineString` | โครงข่ายคมนาคมและถนน (ทล.11/101, ทางหลวงชนบท, ถนนเทศบาล, ถนนซอย, สภาพผิวทาง) |
| [`template_water_bodies.geojson`](./template_water_bodies.geojson) | `Polygon` | แหล่งน้ำผิวดิน (แม่น้ำยม, ลำห้วยแม่พวก, อ่างเก็บน้ำ, สระแก้มลิง, สระประปา) |
| [`template_public_services.geojson`](./template_public_services.geojson) | `Point` | ศูนย์บริการประชาชน (สถานีตำรวจ, ดับเพลิง/กู้ภัย, ไปรษณีย์, สุขาภิบาล) |
| [`template_solar_rooftops.geojson`](./template_solar_rooftops.geojson) | `Polygon` | ศักยภาพโซลาร์เซลล์บนหลังคา (Class 1-7, พื้นที่ 3D, Slope, Aspect, kWh/ปี, ยอดประหยัด) |
| [`template_municipal_boundary.geojson`](./template_municipal_boundary.geojson) | `Polygon` | แนวขอบเขตการปกครองเทศบาลตำบลเด่นชัย |

---

### 🔹 กลุ่มที่ 2: ชั้นข้อมูลที่สร้างเพิ่มเติมสำหรับงานเทศบาลครบวงจร (Extended Municipal Layers)
| ชื่อไฟล์ | ชนิด Geometry | รายละเอียด & หมวดหมู่ |
| :--- | :--- | :--- |
| [`template_buildings.geojson`](./template_buildings.geojson) | `Polygon` | อาคารและสิ่งปลูกสร้าง (เลขที่บ้าน, ประเภทอาคาร, จำนวนชั้น, โครงสร้าง, วัสดุหลังคา) |
| [`template_streetlights.geojson`](./template_streetlights.geojson) | `Point` | เสาไฟฟ้า & โคมไฟส่องสว่าง (LED, โซลาร์เซลล์, หลอดส้ม, สถานะติด/ดับ, หมายเลขเสา) |
| [`template_power_grid.geojson`](./template_power_grid.geojson) | `Point` / `LineString` | หม้อแปลงไฟฟ้า (kVA, โหลด) & แนวสายส่งไฟฟ้าแรงสูง 22kV / แรงต่ำ |
| [`template_drainage_system.geojson`](./template_drainage_system.geojson) | `LineString` / `Point` | แนวรางระบายน้ำ (U-Ditch, ท่อ คสล., ขนาด $\varnothing$, ทิศทางการไหล) & บ่อพัก Manhole |
| [`template_water_supply_hydrants.geojson`](./template_water_supply_hydrants.geojson) | `Point` / `LineString` | แนวท่อประปาหลัก (HDPE/PVC) & หัวจ่ายน้ำดับเพลิงสาธารณะ (รัศมี 150 ม.) |
| [`template_cctv_traffic_safety.geojson`](./template_cctv_traffic_safety.geojson) | `Point` | กล้องวงจรปิด CCTV (AI-LPR, PTZ, ทิศทาง FOV) & จุดเสี่ยงอุบัติเหตุจราจร |
| [`template_hazard_evacuation.geojson`](./template_hazard_evacuation.geojson) | `Polygon` / `Point` | พื้นที่เสี่ยงน้ำท่วมซ้ำซากริมแม่น้ำยม/ห้วยแม่พวก & ศูนย์อพยพพักพิงชั่วคราว |
| [`template_waste_management.geojson`](./template_waste_management.geojson) | `Point` / `LineString` | จุดตั้งถังขยะชุมชน 4 ประเภท & เส้นทางเดินรถเก็บขยะ |
| [`template_vulnerable_citizens.geojson`](./template_vulnerable_citizens.geojson) | `Point` | พิกัดบ้านกลุ่มเปราะบาง (ผู้สูงอายุติดเตียง, ผู้พิการ, ผู้ป่วยฟอกไต, อสม. ผู้ดูแล) |
| [`template_community_boundaries.geojson`](./template_community_boundaries.geojson) | `Polygon` | แนวเขตชุมชน / คุ้มบ้าน / หมู่บ้าน (ม.1 ถึง ม.N) พร้อมสถิติประชากร |

---

## 🛠️ วิธีการนำไปใช้งานใน QGIS

1. **เปิดไฟล์ใน QGIS:**
   * ลากไฟล์ `.geojson` จากโฟลเดอร์ `public/templates/` ไปวางในหน้าต่าง Layer Panel ของ **QGIS** ได้โดยตรง
2. **เริ่มวาดหรือแก้ไขข้อมูล (Toggle Editing):**
   * คลิกขวาที่ Layer ➡️ เลือก **Toggle Editing (รูปดินสอ)**
   * กด **Add Point / Add Line / Add Polygon Feature** เพื่อเริ่มวาดจุด, เส้น หรือแปลงที่ดินบนแผนที่ภาพถ่ายดาวเทียม
3. **กรอกตารางข้อมูล (Attribute Form):**
   * เมื่อวาดเสร็จ จะมีหน้าต่างขึ้นมาให้กรอกข้อมูล ซึ่งจะมีฟิลด์ภาษาไทยและอังกฤษตรงตาม Template ทันที
4. **บันทึกข้อมูล (Save Layer Edits):**
   * กดปุ่ม Save Edits ใน QGIS ไฟล์ `.geojson` จะถูกอัปเดต และพร้อมนำไปแสดงผลบน Dashboard ทันทีครับ
