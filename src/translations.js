export const translations = {
  th: {
    appTitle: 'Denchai Smart City',
    appSubtitle: 'ระบบภูมิสารสนเทศข้อมูลเมืองอัจฉริยะ เทศบาลตำบลเด่นชัย จ.แพร่',
    badgeLive: 'ข้อมูล UAV ความละเอียดสูง',
    badgeSmartCity: 'เมืองอัจฉริยะ',

    // Tab Navigation
    tabPoi: 'สถานที่สำคัญ',
    tabInfra: 'โครงสร้างพื้นฐาน',
    tabService: 'บริการสาธารณะ',
    tabSolar: 'พลังงานแสงอาทิตย์',

    // POI Tab
    poiHeader: 'สถานที่สำคัญในเขตเทศบาล',
    poiCount: 'จุดข้อมูล',
    poiShowAll: 'แสดงทั้งหมด',
    poiHideAll: 'ซ่อนทั้งหมด',

    // Infrastructure Tab
    infraHeader: 'โครงสร้างพื้นฐานสาธารณะ',
    infraCount: 'รายการ',

    // Service Tab
    serviceHeader: 'บริการสาธารณะและหน่วยงาน',
    serviceCount: 'แห่ง',
    servicePhone: 'โทรศัพท์',
    
    // View modes
    viewMode: 'โหมดมุมมองข้อมูล',
    viewFacets: 'ระนาบหลังคา 3D (Facets)',
    viewBuildings: 'รูปทรงอาคาร (Buildings)',
    
    // Color modes
    colorMode: 'การแสดงสีข้อมูล',
    colorClass: 'ทิศทางและความชันหลังคา',
    colorEnergy: 'ระดับศักยภาพพลังงาน (Heatmap)',
    
    // KPIs
    kpiTotalEnergy: 'พลังงานผลิตได้รวมต่อปี',
    kpiTotalSavings: 'ประหยัดค่าไฟฟ้ารวมต่อปี',
    kpiTotalArea: 'พื้นที่หลังคารวม',
    kpiBuildingCount: 'จำนวนหลังคา / อาคาร',
    kpiCarbonOffset: 'ลดการปล่อยคาร์บอน (CO₂)',
    kpiTreeEquivalent: 'เทียบเท่าปลูกต้นไม้',
    kpiEstInvestment: 'ประมาณการเงินลงทุนติดตั้ง',
    kpiPaybackPeriod: 'ระยะเวลาคืนทุนโดยเฉลี่ย',
    
    // Units
    unitThbPerYear: 'บาท / ปี',
    unitMillionThb: 'ล้านบาท / ปี',
    unitMillionThbTotal: 'ล้านบาท',
    unitYears: 'ปี',
    unitTonsPerYear: 'ตัน CO₂e / ปี',
    unitTrees: 'ต้น',
    unitSqM: 'ตร.ม.',
    unitItems: 'แปลง / หลังคา',
    
    // Sliders & Filters
    filterHeader: 'ตัวกรองข้อมูลเชิงพื้นที่',
    minArea: 'พื้นที่หลังคาขั้นต่ำ (ตร.ม.)',
    minEnergy: 'พลังงานขั้นต่ำ (kWh / ปี)',
    resetFilters: 'รีเซ็ตตัวกรอง',
    
    // ROI Calculator Modal
    roiSettings: 'ตั้งค่าสมมติฐานทางเศรษฐศาสตร์ (Solar ROI)',
    tariffRate: 'อัตราค่าไฟฟ้าเฉลี่ย (บาท / หน่วย kWh)',
    systemCost: 'ต้นทุนติดตั้งระบบ (บาท / kWp)',
    applyRoi: 'นำไปคำนวณ',
    
    // Layer toggles
    roofClassesHeader: 'การจำแนกทิศทางและประเภทหลังคา',
    selectAll: 'เลือกทั้งหมด',
    deselectAll: 'ยกเลิกทั้งหมด',
    
    // Basemap selector
    basemapHeader: 'แผนที่ฐาน (Basemap)',
    basemapSatellite: 'ภาพถ่ายดาวเทียม (Satellite)',
    basemapDark: 'แผนที่มืด (Dark Matter)',
    basemapLight: 'แผนที่สว่าง (Positron)',
    basemapOsm: 'แผนที่ถนน (OpenStreetMap)',
    
    // AOI & Boundary
    aoiHeader: 'ขอบเขตพื้นที่ศึกษา (AOI)',
    aoiUploadBtn: 'อัปโหลด Shapefile / GeoJSON',
    aoiRemove: 'ล้างขอบเขตกำหนดเอง',
    aoiFilteredStatus: 'คำนวณเฉพาะพื้นที่ที่เลือก',
    zoomToDenchai: 'ซูมไปที่เทศบาลตำบลเด่นชัย',
    
    // Export
    exportHeader: 'ส่งออกข้อมูลและรายงาน',
    exportCsv: 'ส่งออกข้อมูลสถิติ (CSV)',
    exportGeoJson: 'ส่งออกเชิงพื้นที่ (GeoJSON)',
    exportReport: 'พิมพ์ / บันทึกรายงาน PDF',
    
    // Popup
    popupTitle: 'ข้อมูลศักยภาพพลังงานแสงอาทิตย์',
    popupRoofType: 'ประเภท / ทิศทางหลังคา',
    popupArea: 'พื้นที่ 3D',
    popupSlope: 'ความชันหลังคา',
    popupAspect: 'ทิศทาง Azimuth',
    popupCapacity: 'ขนาดกำลังผลิตติดตั้ง',
    popupAnnualEnergy: 'ผลิตพลังงานได้',
    popupAnnualSavings: 'ประหยัดค่าไฟฟ้า',
    popupCo2: 'ลดก๊าซคาร์บอนไดออกไซด์',
    
    // Classes
    classes: {
      1: 'หลังคาลาดทิศเหนือ (N-Roof)',
      2: 'หลังคาลาดทิศตะวันออก (E-Roof)',
      3: 'หลังคาลาดทิศใต้ (S-Roof)',
      4: 'หลังคาลาดทิศตะวันตก (W-Roof)',
      5: 'หลังคาดาดฟ้าแบน (Flat Roof)',
      6: 'หลังคาไม่จัดกลุ่ม (U-Roof)',
      7: 'อาคารที่ติดตั้งโซลาร์เซลล์แล้ว (PV Panel)'
    }
  },
  
  en: {
    appTitle: 'Denchai Smart City',
    appSubtitle: 'Smart City GIS Platform — Denchai Municipality, Phrae, Thailand',
    badgeLive: 'High-Resolution UAV LiDAR/Orthophoto',
    badgeSmartCity: 'Smart City',

    // Tab Navigation
    tabPoi: 'Points of Interest',
    tabInfra: 'Infrastructure',
    tabService: 'Public Services',
    tabSolar: 'Solar Potential',

    // POI Tab
    poiHeader: 'Points of Interest in Municipality',
    poiCount: 'locations',
    poiShowAll: 'Show All',
    poiHideAll: 'Hide All',

    // Infrastructure Tab
    infraHeader: 'Public Infrastructure',
    infraCount: 'items',

    // Service Tab
    serviceHeader: 'Public Services & Agencies',
    serviceCount: 'locations',
    servicePhone: 'Phone',
    
    // View modes
    viewMode: 'Data View Mode',
    viewFacets: '3D Rooftop Facets',
    viewBuildings: 'Building Footprints',
    
    // Color modes
    colorMode: 'Color Visualization',
    colorClass: 'Roof Orientation & Slope',
    colorEnergy: 'Solar Energy Potential Heatmap',
    
    // KPIs
    kpiTotalEnergy: 'Total Annual Solar Yield',
    kpiTotalSavings: 'Total Annual Bill Savings',
    kpiTotalArea: 'Total Rooftop Area',
    kpiBuildingCount: 'Rooftop / Building Count',
    kpiCarbonOffset: 'Carbon Offset (CO₂)',
    kpiTreeEquivalent: 'Tree Planting Equivalent',
    kpiEstInvestment: 'Estimated Capital Investment',
    kpiPaybackPeriod: 'Average Payback Period',
    
    // Units
    unitThbPerYear: 'THB / yr',
    unitMillionThb: 'M THB / yr',
    unitMillionThbTotal: 'M THB',
    unitYears: 'Years',
    unitTonsPerYear: 't CO₂e / yr',
    unitTrees: 'Trees',
    unitSqM: 'sq.m.',
    unitItems: 'facets / buildings',
    
    // Sliders & Filters
    filterHeader: 'Spatial Data Filtering',
    minArea: 'Min Rooftop Area (sq.m.)',
    minEnergy: 'Min Energy Yield (kWh / yr)',
    resetFilters: 'Reset Filters',
    
    // ROI Calculator Modal
    roiSettings: 'Solar Economic & Financial ROI Settings',
    tariffRate: 'Electricity Tariff (THB / kWh)',
    systemCost: 'Installed System Cost (THB / kWp)',
    applyRoi: 'Apply Parameters',
    
    // Layer toggles
    roofClassesHeader: 'Roof Direction & Classification',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    
    // Basemap selector
    basemapHeader: 'Basemap Selection',
    basemapSatellite: 'High-Res Satellite (Esri)',
    basemapDark: 'Dark Matter (CartoDB)',
    basemapLight: 'Positron Light (CartoDB)',
    basemapOsm: 'OpenStreetMap Standard',
    
    // AOI & Boundary
    aoiHeader: 'Area of Interest (AOI)',
    aoiUploadBtn: 'Upload Shapefile / GeoJSON',
    aoiRemove: 'Clear Custom AOI',
    aoiFilteredStatus: 'Clipping active for selected AOI',
    zoomToDenchai: 'Zoom to Denchai Municipality',
    
    // Export
    exportHeader: 'Data Export & Reports',
    exportCsv: 'Export Statistics (CSV)',
    exportGeoJson: 'Export Spatial Data (GeoJSON)',
    exportReport: 'Print / Save PDF Report',
    
    // Popup
    popupTitle: 'Rooftop Solar Potential Attributes',
    popupRoofType: 'Roof Orientation / Type',
    popupArea: '3D Area',
    popupSlope: 'Roof Slope',
    popupAspect: 'Azimuth Aspect',
    popupCapacity: 'PV System Capacity',
    popupAnnualEnergy: 'Annual Solar Energy',
    popupAnnualSavings: 'Estimated Bill Savings',
    popupCo2: 'Carbon Offset',
    
    // Classes
    classes: {
      1: 'North-Facing (N-Roof)',
      2: 'East-Facing (E-Roof)',
      3: 'South-Facing (S-Roof)',
      4: 'West-Facing (W-Roof)',
      5: 'Flat Rooftop',
      6: 'Unclassified / Complex',
      7: 'Existing PV Installation'
    }
  }
};
