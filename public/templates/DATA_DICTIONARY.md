# 📖 พจนานุกรมข้อมูลเชิงพื้นที่ (GIS Data Dictionary)
## ระบบภูมิสารสนเทศเพื่อการบริหารเมืองอัจฉริยะ เทศบาลตำบลเด่นชัย จ.แพร่ (Denchai Smart City GIS)

**ระบบพิกัดอ้างอิง (Coordinate Reference System):** EPSG:4326 (WGS 84 - World Geodetic System 1984)  
**รูปแบบข้อมูล (Data Format):** GeoJSON Standard (RFC 7946)

---

## 📑 สารบัญหมวดหมู่ชั้นข้อมูล (Layer Index)

1. [หมวดอาคารและสิ่งปลูกสร้าง (Building Footprints)](#1-หมวดอาคารและสิ่งปลูกสร้าง-building-footprints)
2. [หมวดเสาไฟฟ้าและโคมไฟส่องสว่างสาธารณะ (Streetlights & Poles)](#2-หมวดเสาไฟฟ้าและโคมไฟส่องสว่างสาธารณะ-streetlights--poles)
3. [หมวดหม้อแปลงและแนวสายส่งไฟฟ้า (Power Grid & Transformers)](#3-หมวดหม้อแปลงและแนวสายส่งไฟฟ้า-power-grid--transformers)
4. [หมวดระบบระบายน้ำและบ่อพัก (Drainage System & Manholes)](#4-หมวดระบบระบายน้ำและบ่อพัก-drainage-system--manholes)
5. [หมวดระบบท่อประปาและหัวดับเพลิง (Water Supply & Fire Hydrants)](#5-หมวดระบบท่อประปาและหัวดับเพลิง-water-supply--fire-hydrants)
6. [หมวดกล้องวงจรปิดและจุดเสี่ยงจราจร (CCTV & Traffic Safety)](#6-หมวดกล้องวงจรปิดและจุดเสี่ยงจราจร-cctv--traffic-safety)
7. [หมวดพื้นที่เสี่ยงภัยและศูนย์อพยพ (Hazard Zones & Evacuation Centers)](#7-หมวดพื้นที่เสี่ยงภัยและศูนย์อพยพ-hazard-zones--evacuation-centers)
8. [หมวดการจัดการขยะมูลฝอย (Waste Management)](#8-หมวดการจัดการขยะมูลฝอย-waste-management)
9. [หมวดพิกัดบ้านกลุ่มเปราะบางทางสังคม (Vulnerable Citizens)](#9-หมวดพิกัดบ้านกลุ่มเปราะบางทางสังคม-vulnerable-citizens)
10. [หมวดขอบเขตชุมชนและหมู่บ้าน (Community Boundaries)](#10-หมวดขอบเขตชุมชนและหมู่บ้าน-community-boundaries)
11. [หมวดสถานที่สำคัญ (Points of Interest - POI)](#11-หมวดสถานที่สำคัญ-points-of-interest---poi)
12. [หมวดโครงข่ายถนนและคมนาคม (Roads & Transport Network)](#12-หมวดโครงข่ายถนนและคมนาคม-roads--transport-network)
13. [หมวดแหล่งน้ำผิวดิน (Water Bodies)](#13-หมวดแหล่งน้ำผิวดิน-water-bodies)
14. [หมวดศูนย์บริการประชาชน (Public Services)](#14-หมวดศูนย์บริการประชาชน-public-services)
15. [หมวดศักยภาพโซลาร์เซลล์บนหลังคา (Solar Rooftop Facets)](#15-หมวดศักยภาพโซลาร์เซลล์บนหลังคา-solar-rooftop-facets)
16. [หมวดแนวเขตการปกครองเทศบาล (Municipal Boundary)](#16-หมวดแนวเขตการปกครองเทศบาล-municipal-boundary)

---

### 1. หมวดอาคารและสิ่งปลูกสร้าง (Building Footprints)
* **ไฟล์ Template:** `template_buildings.geojson`
* **ประเภท Geometry:** `Polygon`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) | บังคับ (Required) |
| :--- | :--- | :--- | :--- | :---: |
| `building_id` | String | รหัสประจำตัวอาคาร | `BLD-0101-001` | ✅ |
| `building_name` | String | ชื่ออาคารหรือสิ่งปลูกสร้าง | `ที่ว่าการเทศบาลตำบลเด่นชัย` | ❌ |
| `house_no` | String | เลขที่บ้าน / ทะเบียนบ้าน | `199`, `12/4` | ❌ |
| `community_name` | String | ชื่อชุมชน/หมู่บ้านที่ตั้ง | `ชุมชนบ้านเด่นชัยพัฒนา` | ❌ |
| `moo_no` | Integer | หมู่ที่ (1–N) | `1`, `2`, `3` | ❌ |
| `building_type` | String | ประเภทการใช้งานหลัก | `residential`, `commercial`, `government`, `religious`, `industrial`, `educational`, `agricultural` | ✅ |
| `building_type_th` | String | คำอธิบายประเภทการใช้งาน (ภาษาไทย) | `ที่อยู่อาศัย`, `พาณิชยกรรม / ร้านค้า`, `หน่วยงานราชการ` | ❌ |
| `num_floors` | Integer | จำนวนชั้นของอาคาร | `1`, `2`, `3`, `4` | ❌ |
| `structure_type` | String | ชนิดโครงสร้างอาคาร | `rc_concrete` (คสล.), `wood` (ไม้), `steel` (เหล็ก), `mixed` (ครึ่งตึกครึ่งไม้) | ❌ |
| `roof_material` | String | วัสดุมุงหลังคา | `concrete_slab` (ดาดฟ้า), `metal_sheet`, `tile` (กระเบื้อง), `zinc` (สังกะสี) | ❌ |
| `roof_area_sqm` | Float | พื้นที่หลังคารวม (ตารางเมตร) | `180.50`, `650.00` | ❌ |
| `condition` | String | สภาพความมั่นคงแข็งแรง | `good` (ดี), `fair` (พอใช้), `poor` (ชำรุด/ทรุดโทรม) | ❌ |
| `solar_pv_installed` | Boolean | มีการติดตั้งโซลาร์เซลล์แล้วหรือไม่ | `true`, `false` | ❌ |
| `notes` | String | หมายเหตุเพิ่มเติม | `อาคารหลักสำนักงานเทศบาล` | ❌ |

---

### 2. หมวดเสาไฟฟ้าและโคมไฟส่องสว่างสาธารณะ (Streetlights & Poles)
* **ไฟล์ Template:** `template_streetlights.geojson`
* **ประเภท Geometry:** `Point`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) | บังคับ (Required) |
| :--- | :--- | :--- | :--- | :---: |
| `pole_id` | String | รหัสเสาไฟฟ้า / โคมไฟ | `POLE-DC-001` | ✅ |
| `pole_owner` | String | หน่วยงานเจ้าของเสา | `municipality` (เทศบาล), `pea` (กฟภ.), `highway` (กรมทางหลวง) | ✅ |
| `lamp_type` | String | ชนิดของหลอดไฟ | `led`, `solar_led`, `hps` (โซเดียมหลอดส้ม), `fluorescent` | ✅ |
| `lamp_type_th` | String | ชนิดหลอดไฟ (ภาษาไทย) | `โคมไฟ LED ประหยัดพลังงาน`, `โคมไฟถนนโซลาร์เซลล์` | ❌ |
| `wattage_w` | Integer | กำลังไฟฟ้าของหลอด (วัตต์) | `60`, `100`, `150`, `250`, `400` | ❌ |
| `pole_height_m` | Float | ความสูงของเสา (เมตร) | `6.0`, `8.0`, `9.0`, `12.0` | ❌ |
| `power_source` | String | แหล่งพลังงาน | `grid` (สายส่งไฟฟ้า), `solar` (โซลาร์เซลล์อิสระ) | ❌ |
| `status` | String | สถานะการทำงานของโคม | `normal` (ติดปกติ), `damaged` (ดับ/ชำรุด), `pending_repair` (รอดำเนินการซ่อม) | ✅ |
| `road_name` | String | ชื่อถนนหรือซอยที่ติดตั้ง | `ถนนเด่นชัย-แพร่ (ทล.101)`, `ถนนซอยร่วมใจ` | ❌ |
| `community_name` | String | ชื่อชุมชน | `ชุมชนบ้านเด่นชัย` | ❌ |
| `moo_no` | Integer | หมู่ที่ | `1` | ❌ |
| `install_year` | Integer | ปี พ.ศ. ที่ติดตั้ง | `2565`, `2566`, `2567` | ❌ |
| `last_inspected` | String (Date) | วันที่ตรวจสอบสภาพล่าสุด | `2026-06-15` (YYYY-MM-DD) | ❌ |

---

### 3. หมวดหม้อแปลงและแนวสายส่งไฟฟ้า (Power Grid & Transformers)
* **ไฟล์ Template:** `template_power_grid.geojson`
* **ประเภท Geometry:** `Point` (หม้อแปลง) & `LineString` (แนวสายไฟ)

#### ฟีเจอร์หม้อแปลงไฟฟ้า (Transformer - Point)
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `transformer` |
| `asset_id` | String | รหัสทรัพย์สินหม้อแปลง | `TR-DC-01` |
| `name_th` | String | ชื่อเรียกหม้อแปลง | `หม้อแปลงไฟฟ้าชุมชนเด่นชัยพัฒนา` |
| `capacity_kva` | Integer | ขนาดกำลังไฟฟ้า (kVA) | `50`, `100`, `160`, `250`, `315`, `500` |
| `primary_voltage` | String | แรงดันไฟฟ้าด้านแรงสูง | `22 kV` |
| `secondary_voltage` | String | แรงดันไฟฟ้าด้านแรงต่ำ | `400/230 V` |
| `phase` | String | ระบบเฟส | `1-Phase`, `3-Phase` |
| `owner` | String | หน่วยงานเจ้าของ | `PEA เด่นชัย` |
| `load_percentage` | Float | ภาระการจ่ายไฟเฉลี่ย (%) | `68.5` |
| `solar_pv_hosting_capacity_kw` | Float | ขีดความสามารถรองรับ Solar Rooftop (kW) | `80.0` |

#### ฟีเจอร์แนวสายส่งไฟฟ้า (Power Line - LineString)
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `power_line` |
| `asset_id` | String | รหัสสายส่ง | `LINE-MV-01` |
| `voltage_level` | String | ระดับแรงดันไฟฟ้า | `medium_voltage_22kv`, `low_voltage_400v` |
| `conductor_type` | String | ชนิดของสายตัวนำ | `Space Aerial Cable (SAC)`, `All Aluminium Conductor (AAC)`, `Underground Cable` |
| `length_m` | Float | ความยาวสายส่ง (เมตร) | `450.0` |

---

### 4. หมวดระบบระบายน้ำและบ่อพัก (Drainage System & Manholes)
* **ไฟล์ Template:** `template_drainage_system.geojson`
* **ประเภท Geometry:** `LineString` (ราง/ท่อระบายน้ำ) & `Point` (บ่อพัก)

#### ฟีเจอร์ราง/ท่อระบายน้ำ (Drain Line - LineString)
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `drain_line` |
| `asset_id` | String | รหัสสายทางระบายน้ำ | `DR-LINE-001` |
| `drain_type` | String | รูปแบบโครงสร้างทางระบายน้ำ | `u_ditch` (รางยู คสล.), `circular_pipe` (ท่อกลม คสล.), `box_culvert` (ท่อเหลี่ยม), `open_earth` (คูดินเปิด) |
| `width_m` | Float | ความกว้างรางหรือเส้นผ่านศูนย์กลาง (เมตร) | `0.40`, `0.60`, `0.80`, `1.00` |
| `depth_m` | Float | ความลึกของราง/ท่อ (เมตร) | `0.60`, `0.80`, `1.20` |
| `flow_direction` | String | ทิศทางการไหลของน้ำ | `north`, `north-east`, `south`, `west` |
| `outfall_target` | String | ปลายทางจุดระบายน้ำออก | `ลำห้วยแม่พวก`, `แม่น้ำยม` |
| `cleaning_status` | String | สถานะการขุดลอกล้างท่อ | `cleaned_2567`, `needs_cleaning`, `under_construction` |

#### ฟีเจอร์บ่อพักน้ำ (Manhole - Point)
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `manhole` |
| `asset_id` | String | รหัสบ่อพัก | `MH-001` |
| `cover_type` | String | ประเภทฝาบ่อพัก | `steel_grating` (ตะแกรงเหล็ก), `rc_slab` (ฝาคอนกรีตทึบ) |
| `invert_depth_m` | Float | ระดับความลึกก้นบ่อพัก (เมตร) | `1.20` |
| `condition` | String | สภาพบ่อพัก | `normal`, `clogged` (อุดตัน), `broken_cover` (ฝาชำรุด) |

---

### 5. หมวดระบบท่อประปาและหัวดับเพลิง (Water Supply & Fire Hydrants)
* **ไฟล์ Template:** `template_water_supply_hydrants.geojson`
* **ประเภท Geometry:** `Point` (หัวดับเพลิง/วาล์ว) & `LineString` (ท่อประปา)

#### ฟีเจอร์หัวดับเพลิง (Fire Hydrant - Point)
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `fire_hydrant` |
| `asset_id` | String | รหัสหัวดับเพลิง | `HYD-01` |
| `name_th` | String | จุดติดตั้ง/ชื่อเรียก | `หัวจ่ายน้ำดับเพลิง หน้าตลาดเทศบาล` |
| `outlet_size_inch`| Float | ขนาดเกลียวข้อต่อหัวจ่าย (นิ้ว) | `2.5`, `4.0` |
| `water_pressure` | String | ระดับแรงดันน้ำประปา | `high`, `medium`, `low` |
| `water_pressure_bar` | Float | ค่าแรงดันน้ำ (บาร์) | `3.2` |
| `service_radius_m`| Float | รัศมีการคุ้มครองดับเพลิง (เมตร) | `150.0` |
| `status` | String | ความพร้อมใช้งาน | `ready` (พร้อมใช้งาน 100%), `maintenance` (ชำรุด/ปิดซ่อม) |

#### ฟีเจอร์แนวท่อเมนประปา (Water Main Pipe - LineString)
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `water_main_pipe` |
| `asset_id` | String | รหัสท่อประปา | `PIPE-HDPE-100` |
| `material` | String | ชนิดวัสดุท่อ | `HDPE`, `PVC`, `Ductile_Iron` (เหล็กเหนียว) |
| `diameter_mm` | Integer | ขนาดเส้นผ่านศูนย์กลางท่อ (มม.) | `50`, `100`, `150`, `200` |
| `depth_m` | Float | ความลึกฝังกลบ (เมตร) | `1.0`, `1.5` |
| `operator` | String | หน่วยงานบริหารจัดการ | `กองการประปาเทศบาลตำบลเด่นชัย`, `กปภ.` |

---

### 6. หมวดกล้องวงจรปิดและจุดเสี่ยงจราจร (CCTV & Traffic Safety)
* **ไฟล์ Template:** `template_cctv_traffic_safety.geojson`
* **ประเภท Geometry:** `Point`

#### ฟีเจอร์กล้อง CCTV
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `cctv_camera` |
| `device_id` | String | รหัสกล้อง | `CCTV-DC-01` |
| `camera_type` | String | รูปแบบกล้อง | `lpr_license_plate` (อ่านป้ายทะเบียน), `ptz` (กล้องหมุน-ซูม), `fixed` (กล้องมุมฟิกซ์) |
| `fov_angle_deg` | Integer | องศามุมมองภาพกล้อง (Field of View) | `90`, `120`, `360` |
| `facing_direction_deg` | Integer | ทิศทางการส่อง (องศาเทียบทิศเหนือ 0-360) | `45` (ทิศตะวันออกเฉียงเหนือ) |
| `resolution` | String | ความละเอียดกล้อง | `1080p (Full HD)`, `4K (8MP)` |
| `status` | String | สถานะการเชื่อมต่อ | `online`, `offline`, `maintenance` |
| `pole_ref` | String | รหัสเสาไฟที่ติดตั้ง | `POLE-DC-001` |

#### ฟีเจอร์จุดเสี่ยงอุบัติเหตุ (Traffic Blackspot)
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `traffic_blackspot` |
| `spot_id` | String | รหัสจุดเสี่ยง | `BS-01` |
| `name_th` | String | ชื่อบริเวณจุดเสี่ยง | `จุดเสี่ยงทางแยกตัด ทล.101 เข้าสถานีรถไฟ` |
| `risk_level` | String | ระดับความเสี่ยง | `critical` (วิกฤต), `high` (สูง), `medium` (ปานกลาง) |
| `main_cause` | String | สาเหตุหลักของการเกิดเหตุ | `ทัศนวิสัยจำกัด / รถใช้ความเร็วสูง` |
| `accident_count_2566` | Integer | สถิติอุบัติเหตุรอบปีที่ผ่านมา | `5` |

---

### 7. หมวดพื้นที่เสี่ยงภัยและศูนย์อพยพ (Hazard Zones & Evacuation Centers)
* **ไฟล์ Template:** `template_hazard_evacuation.geojson`
* **ประเภท Geometry:** `Polygon` (พื้นที่เสี่ยง) & `Point` (ศูนย์อพยพ)

#### ฟีเจอร์พื้นที่เสี่ยงภัย (Hazard Zone - Polygon)
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `flood_risk_zone` (น้ำท่วม), `landslide_risk_zone` (ดินถล่ม/ตลิ่งทรุด) |
| `zone_id` | String | รหัสโซนเสี่ยงภัย | `FL-ZONE-01` |
| `risk_level` | String | ระดับความรุนแรง | `critical`, `high`, `medium` |
| `max_flood_depth_m` | Float | ระดับน้ำท่วมสูงสุดในอดีต (เมตร) | `1.20` |
| `affected_households` | Integer | จำนวนครัวเรือนที่ได้รับผลกระทบ | `45` |

#### ฟีเจอร์ศูนย์อพยพ/พักพิง (Evacuation Center - Point)
| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `feature_type` | String | ชนิดข้อมูล | `evacuation_center` |
| `center_id` | String | รหัสศูนย์พักพิง | `EVAC-01` |
| `name_th` | String | ชื่อสถานที่พักพิง | `ศูนย์พักพิงชั่วคราว หอประชุมโรงเรียนเด่นชัยวิทยา` |
| `capacity_persons` | Integer | จำนวนคนที่รองรับได้สูงสุด | `300` |
| `facilities` | String | สิ่งอำนวยความสะดวก | `โรงครัวสนาม, เครื่องปั่นไฟสำรอง, หน่วยพยาบาล` |
| `contact_phone` | String | เบอร์โทรผู้ประสานงานศูนย์ | `054-613999` |

---

### 8. หมวดการจัดการขยะมูลฝอย (Waste Management)
* **ไฟล์ Template:** `template_waste_management.geojson`
* **ประเภท Geometry:** `Point` (จุดตั้งถังขยะ) & `LineString` (เส้นทางรถขยะ)

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `station_id` / `route_id` | String | รหัสจุดตั้งถังขยะ หรือ รหัสสายเดินรถ | `BIN-DC-01`, `ROUTE-TRUCK-01` |
| `feature_type` | String | ชนิดข้อมูล | `waste_bin_station`, `waste_collection_route` |
| `bin_types` | String | ประเภทถังขยะที่มี | `ขยะทั่วไป, ขยะเปียก/อินทรีย์, ขยะรีไซเคิล, ขยะอันตราย` |
| `bin_count` | Integer | จำนวนถังในจุดบริการ | `4` |
| `capacity_liters` | Integer | ความจุรวม (ลิตร) | `960` |
| `collection_frequency` | String | ความถี่และช่วงเวลาในการเก็บ | `ทุกวัน (ช่วง 04:00 - 06:00 น.)` |
| `truck_license_plate` | String | ทะเบียนรถเก็บขยะประจำสาย | `81-1234 แพร่` |

---

### 9. หมวดพิกัดบ้านกลุ่มเปราะบางทางสังคม (Vulnerable Citizens)
* **ไฟล์ Template:** `template_vulnerable_citizens.geojson`
* **ประเภท Geometry:** `Point`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `person_id` | String | รหัสระบุตัวตน (เพื่อการคุ้มครองข้อมูลส่วนบุคคล) | `VUL-DC-001` |
| `house_no` | String | บ้านเลขที่ | `45/2` |
| `vulnerability_group` | String | ประเภทกลุ่มเปราะบาง | `bedridden_elderly` (ผู้ป่วยติดเตียง), `wheelchair_user` (ผู้พิการ), `dialysis_patient` (ผู้ป่วยฟอกไต), `solitary_elderly` (ผู้สูงอายุอยู่ลำพัง) |
| `medical_conditions` | String | โรคประจำตัว / ภาวะสุขภาพ | `โรคหลอดเลือดสมอง / อัมพฤกษ์` |
| `requires_power_medical_device` | Boolean | ต้องใช้อุปกรณ์การแพทย์ที่ใช้ไฟฟ้าหรือไม่ | `true` (เช่น เครื่องผลิตออกซิเจน-ห้ามไฟดับนาน), `false` |
| `emergency_evacuation_priority` | String | ลำดับความสำคัญในการอพยพฉุกเฉิน | `priority_1_highest` (ช่วยก่อนทันที), `priority_2_medium` |
| `emergency_contact_phone` | String | เบอร์โทรญาติ/ผู้ดูแล | `081-234-5678` |
| `assigned_vhv_name` | String | ชื่อ อสม. ผู้รับผิดชอบดูแล | `อสม. มาลี ใจดี` |

---

### 10. หมวดขอบเขตชุมชนและหมู่บ้าน (Community Boundaries)
* **ไฟล์ Template:** `template_community_boundaries.geojson`
* **ประเภท Geometry:** `Polygon`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `moo_no` | Integer | หมู่ที่ | `1`, `2`, `3` |
| `village_name_th` | String | ชื่อหมู่บ้าน/ชุมชน (ภาษาไทย) | `บ้านเด่นชัย` |
| `village_name_en` | String | ชื่อหมู่บ้าน/ชุมชน (ภาษาอังกฤษ) | `Ban Den Chai` |
| `headman_name` | String | ชื่อผู้ใหญ่บ้าน / ประธานชุมชน | `นายสมศักดิ์ เด่นภูมิ` |
| `headman_phone` | String | เบอร์โทรศัพท์ผู้นำชุมชน | `081-555-0101` |
| `population_total` | Integer | จำนวนประชากรทั้งหมด (คน) | `1300` |
| `household_count` | Integer | จำนวนครัวเรือน (หลังคาเรือน) | `420` |
| `area_sqkm` | Float | พื้นที่ชุมชน (ตารางกิโลเมตร) | `2.45` |

---

### 11. หมวดสถานที่สำคัญ (Points of Interest - POI)
* **ไฟล์ Template:** `template_poi.geojson`
* **ประเภท Geometry:** `Point`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `id` | String | รหัสสถานที่ | `poi-01` |
| `name_th` | String | ชื่อสถานที่ (ภาษาไทย) | `โรงพยาบาลสมเด็จพระยุพราชเด่นชัย` |
| `name_en` | String | ชื่อสถานที่ (ภาษาอังกฤษ) | `Crown Prince Hospital Den Chai` |
| `category` | String | หมวดหมู่สถานที่ | `hospital`, `clinic`, `pharmacy`, `school`, `temple`, `market`, `transport`, `government`, `park`, `bank`, `industry` |
| `description_th` | String | รายละเอียดการให้บริการ | `โรงพยาบาลชุมชนระดับแม่ข่าย ให้บริการ 24 ชม.` |
| `phone` | String | เบอร์โทรศัพท์ติดต่อ | `054-613111` |

---

### 12. หมวดโครงข่ายถนนและคมนาคม (Roads & Transport Network)
* **ไฟล์ Template:** `template_roads_transport.geojson`
* **ประเภท Geometry:** `LineString`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `id` | String | รหัสสายทาง | `road-main-01` |
| `name_th` | String | ชื่อสายทาง (ภาษาไทย) | `ถนนเทศบาล 1 (สายประธาน)` |
| `category` | String | ลำดับชั้นสายทาง | `highway` (ทล.), `rural_road` (ทช.), `main_road` (สายประธานเทศบาล), `collector_road` (สายรอง), `local_road` (ถนนซอย), `agri_road` (ถนนเกษตร) |
| `surface_type` | String | ชนิดผิวจราจร | `asphalt` (ลาดยางแอสฟัลต์), `concrete` (คสล.), `gravel` (ลูกรัง/หินคลุก), `dirt` (ดิน) |
| `condition` | String | สภาพผิวจราจร | `good` (ดี), `fair` (พอใช้), `poor` (ชำรุดเป็นหลุมบ่อ) |
| `width_m` | Float | ความกว้างผิวจราจร (เมตร) | `6.0`, `8.0`, `12.0` |
| `right_of_way_m` | Float | เขตทางสาธารณะ (เมตร) | `8.0`, `12.0`, `20.0` |
| `lanes` | Integer | จำนวนช่องจราจร | `2`, `4` |
| `drainage` | String | สภาพระบบระบายน้ำข้างทาง | `covered_u_ditch`, `open_u_ditch`, `none` |
| `lighting` | String | สภาพไฟส่องสว่าง | `led`, `solar_led`, `none` |
| `fiscal_year` | String | ปีงบประมาณที่ปรับปรุงล่าสุด | `2567` |

---

### 13. หมวดแหล่งน้ำผิวดิน (Water Bodies)
* **ไฟล์ Template:** `template_water_bodies.geojson`
* **ประเภท Geometry:** `Polygon`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `id` | String | รหัสแหล่งน้ำ | `water-river-01` |
| `name_th` | String | ชื่อแหล่งน้ำ | `แม่น้ำยม (ช่วงผ่านเทศบาลตำบลเด่นชัย)` |
| `category` | String | ประเภทแหล่งน้ำ | `river` (แม่น้ำ), `canal` (ลำห้วย/คลอง), `reservoir` (อ่างเก็บน้ำ), `pond` (สระแก้มลิง/หนองน้ำ), `water_plant` (สระพักน้ำดิบประปา) |
| `area_sqm` | Float | ขนาดพื้นที่ผิวน้ำ (ตารางเมตร) | `85400.0` |
| `capacity_m3` | Float | ปริมาตรความจุน้ำกักเก็บ ($m^3$) | `250000.0` |
| `water_quality` | String | คุณภาพน้ำ | `good` (ดี), `moderate` (ปานกลาง), `poor` (เสื่อมโทรม) |
| `purpose` | String | วัตถุประสงค์การใช้ประโยชน์ | `อุปโภค-บริโภค / ชลประทาน / หน่วงน้ำหลาก` |

---

### 14. หมวดศูนย์บริการประชาชน (Public Services)
* **ไฟล์ Template:** `template_public_services.geojson`
* **ประเภท Geometry:** `Point`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `id` | String | รหัสหน่วยบริการ | `svc-01` |
| `name_th` | String | ชื่อหน่วยงานบริการ | `งานป้องกันและบรรเทาสาธารณภัย (ดับเพลิงเทศบาลเด่นชัย)` |
| `category` | String | ประเภทบริการ | `police` (ความปลอดภัย), `fire` (ดับเพลิง/กู้ภัย), `health` (สาธารณสุข), `welfare` (สังคมสงเคราะห์), `post` (ไปรษณีย์), `waste` (จัดการขยะ) |
| `phone` | String | เบอร์โทรศัพท์สายด่วน | `054-613999` |
| `service_hours` | String | เวลาทำการ | `24 ชั่วโมง`, `08:30 - 16:30 น.` |

---

### 15. หมวดศักยภาพโซลาร์เซลล์บนหลังคา (Solar Rooftop Facets)
* **ไฟล์ Template:** `template_solar_rooftops.geojson`
* **ประเภท Geometry:** `Polygon`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `id` | String | รหัสระนาบหลังคา | `c3_001` |
| `building_id` | String | รหัสอาคารที่สังกัด | `BLD-0101-001` |
| `class_id` | Integer | รหัสทิศทางหลังคา (1–7) | `1`=N-Roof, `2`=E-Roof, `3`=S-Roof, `4`=W-Roof, `5`=Flat Roof, `6`=U-Roof, `7`=PV Panel |
| `class_name` | String | ชื่อทิศทางหลังคา | `S-Roof`, `Flat Roof` |
| `area_2d` | Float | พื้นที่ 2 มิติแนวราบ ($m^2$) | `120.50` |
| `area_3d` | Float | พื้นที่ผิว 3 มิติตามความลาดเอียง ($m^2$) | `128.25` |
| `slope_deg` | Float | มุมลาดเอียงของหลังคา (องศา) | `15.00` |
| `aspect_deg` | Float | ทิศทางมุมอะซิมุทที่หลังคาหันไป (องศา 0–360) | `180.00` (ทิศใต้แท้) |
| `capacity_kwp` | Float | ศักยภาพการติดตั้งโซลาร์ ($kW_p$) | `25.65` |
| `energy_kwh` | Float | ประมาณการพลังงานไฟฟ้าที่ผลิตได้ ($kWh/ปี$) | `37240.00` |
| `savings_thb` | Float | ยอดประหยัดค่าไฟฟ้า ($บาท/ปี$) | `167580.00` |
| `co2_reduction_kg` | Float | ปริมาณการลดก๊าซเรือนกระจก ($kgCO_2/ปี$) | `18620.00` |
| `payback_years` | Float | ระยะเวลาคืนทุน (ปี) | `4.8` |

---

### 16. หมวดแนวเขตการปกครองเทศบาล (Municipal Boundary)
* **ไฟล์ Template:** `template_municipal_boundary.geojson`
* **ประเภท Geometry:** `Polygon`

| ชื่อฟิลด์ (Field Name) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) | ค่าที่กำหนด/ตัวอย่าง (Allowed Values / Examples) |
| :--- | :--- | :--- | :--- |
| `admin_id` | String | รหัสการปกครองราชการ | `ADM-540501` |
| `name_th` | String | ชื่อองค์กรปกครองส่วนท้องถิ่น | `เทศบาลตำบลเด่นชัย` |
| `name_en` | String | ชื่อภาษาอังกฤษ | `Den Chai Sub-district Municipality` |
| `amphoe_th` | String | อำเภอ | `อำเภอเด่นชัย` |
| `province_th` | String | จังหวัด | `จังหวัดแพร่` |
| `area_sqkm` | Float | พื้นที่รับผิดชอบทั้งหมด ($km^2$) | `26.50` |
| `population` | Integer | จำนวนประชากรตามทะเบียนราษฎร์ | `12850` |
| `households` | Integer | จำนวนบ้านทั้งหมด | `4620` |
