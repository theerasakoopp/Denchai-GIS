const https = require('https');
const fs = require('fs');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const searchQueries = [
  { key: 'railway', query: 'สถานีรถไฟเด่นชัย', cat: 'transport', name_th: 'สถานีรถไฟชุมทางเด่นชัย', name_en: 'Den Chai Railway Junction Station' },
  { key: 'hospital', query: 'โรงพยาบาลสมเด็จพระยุพราชเด่นชัย', cat: 'service_health', name_th: 'โรงพยาบาลสมเด็จพระยุพราชเด่นชัย', name_en: 'Crown Prince Hospital Den Chai', phone: '054-613111' },
  { key: 'district_office', query: 'ที่ว่าการอำเภอเด่นชัย', cat: 'government', name_th: 'ที่ว่าการอำเภอเด่นชัย', name_en: 'Den Chai District Office' },
  { key: 'municipality', query: 'เทศบาลตำบลเด่นชัย', cat: 'government', name_th: 'สำนักงานเทศบาลตำบลเด่นชัย', name_en: 'Den Chai Municipality Office' },
  { key: 'police', query: 'สถานีตำรวจภูธรเด่นชัย', cat: 'service_police', name_th: 'สถานีตำรวจภูธรเด่นชัย (สภ.เด่นชัย)', name_en: 'Den Chai Police Station', phone: '054-613191' },
  { key: 'post', query: 'ไปรษณีย์ เด่นชัย', cat: 'service_post', name_th: 'ที่ทำการไปรษณีย์เด่นชัย (54110)', name_en: 'Den Chai Post Office', phone: '054-613123' },
  { key: 'wat_suthon', query: 'วัดพระธาตุสุโทนมงคลคีรี', cat: 'temple', name_th: 'วัดพระธาตุสุโทนมงคลคีรี', name_en: 'Wat Phra That Suthon Mongkhon Khiri' },
  { key: 'wat_denchai', query: 'วัดเด่นชัย แพร่', cat: 'temple', name_th: 'วัดเด่นชัย', name_en: 'Wat Den Chai' },
  { key: 'wat_donchai', query: 'วัดดอนชัย เด่นชัย', cat: 'temple', name_th: 'วัดดอนชัย', name_en: 'Wat Don Chai' },
  { key: 'wat_srimongkhon', query: 'วัดศรีมงคล เด่นชัย', cat: 'temple', name_th: 'วัดศรีมงคล', name_en: 'Wat Sri Mongkhon' },
  { key: 'wat_phraetham', query: 'วัดแพร่ธรรมาราม', cat: 'temple', name_th: 'วัดแพร่ธรรมาราม', name_en: 'Wat Phrae Thammaram' },
  { key: 'school_denchai_pittaya', query: 'โรงเรียนเด่นชัยพิทยาคม', cat: 'school', name_th: 'โรงเรียนเด่นชัยพิทยาคม', name_en: 'Denchai Pittayakom School' },
  { key: 'school_ban_denchai', query: 'โรงเรียนบ้านเด่นชัย', cat: 'school', name_th: 'โรงเรียนบ้านเด่นชัย (ประชานุกูล)', name_en: 'Ban Den Chai School' },
  { key: 'school_anuban_denchai', query: 'โรงเรียนอนุบาลเด่นชัย', cat: 'school', name_th: 'โรงเรียนอนุบาลเด่นชัย', name_en: 'Den Chai Kindergarten' },
  { key: 'nakhonchai_air', query: 'นครชัยแอร์ เด่นชัย', cat: 'transport', name_th: 'สถานีเดินรถนครชัยแอร์ เด่นชัย', name_en: 'Nakhonchai Air Den Chai' },
  { key: 'ptt_denchai', query: 'ปตท เด่นชัย', cat: 'transport', name_th: 'สถานีบริการน้ำมัน ปตท. เด่นชัย', name_en: 'PTT Gas Station & Rest Area' },
  { key: 'market_denchai', query: 'ตลาด เด่นชัย', cat: 'market', name_th: 'ตลาดสดเทศบาลตำบลเด่นชัย', name_en: 'Den Chai Fresh Market' },
  { key: 'ktb_denchai', query: 'ธนาคารกรุงไทย เด่นชัย', cat: 'bank', name_th: 'ธนาคารกรุงไทย สาขาเด่นชัย', name_en: 'Krungthai Bank' },
  { key: 'gsb_denchai', query: 'ธนาคารออมสิน เด่นชัย', cat: 'bank', name_th: 'ธนาคารออมสิน สาขาเด่นชัย', name_en: 'Government Savings Bank' },
  { key: 'baac_denchai', query: 'ธ.ก.ส. เด่นชัย', cat: 'bank', name_th: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร สาขาเด่นชัย', name_en: 'BAAC Bank' },
  { key: 'rphst_denchai', query: 'โรงพยาบาลส่งเสริมสุขภาพตำบลเด่นชัย', cat: 'service_health', name_th: 'โรงพยาบาลส่งเสริมสุขภาพตำบลเด่นชัย (รพ.สต.)', name_en: 'Den Chai Health Center', phone: '054-613890' },
  { key: 'fire_denchai', query: 'ดับเพลิง เด่นชัย', cat: 'service_fire', name_th: 'งานป้องกันและบรรเทาสาธารณภัย เทศบาลตำบลเด่นชัย (ดับเพลิง)', name_en: 'Den Chai Fire & Rescue Station', phone: '054-613999' },
];

function fetchNominatim(q) {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=3&countrycodes=th`;
    const options = {
      headers: {
        'User-Agent': 'DenchaiGISPlatform/1.0 (gis-contact@denchai.go.th)'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

(async () => {
  console.log('Starting exact Nominatim Geocoding queries for Den Chai places...\n');
  const results = [];

  for (const item of searchQueries) {
    console.log(`Searching for: ${item.query} ...`);
    const hits = await fetchNominatim(item.query);
    if (hits && hits.length > 0) {
      // Pick best hit near Denchai (lat ~17.9, lon ~100.0)
      const hit = hits.find(h => Number(h.lat) > 17.8 && Number(h.lat) < 18.2 && Number(h.lon) > 99.9 && Number(h.lon) < 100.2) || hits[0];
      console.log(`  -> Found: "${hit.display_name}" [${Number(hit.lon).toFixed(6)}, ${Number(hit.lat).toFixed(6)}]`);
      results.push({
        ...item,
        found: true,
        lat: Number(hit.lat),
        lon: Number(hit.lon),
        display_name: hit.display_name
      });
    } else {
      console.log(`  -> No direct hit, fallback search...`);
      results.push({
        ...item,
        found: false
      });
    }
    await sleep(1100); // Respect Nominatim 1 request per second policy
  }

  fs.writeFileSync('geocoded_pois.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\nSaved all results to geocoded_pois.json!');
})();
