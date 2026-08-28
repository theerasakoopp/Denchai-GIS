const https = require('https');
const fs = require('fs');

const query = `[out:json][timeout:30];
(
  way["highway"~"primary|secondary|trunk|tertiary|residential"](17.965,100.035,17.995,100.075);
  way["railway"="rail"](17.965,100.035,17.995,100.075);
);
out geom;
`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

https.get(url, { headers: { 'User-Agent': 'DenchaiGIS/1.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Fetched elements count:', json.elements.length);

      const features = [];
      for (const el of json.elements) {
        if (!el.geometry || el.geometry.length < 2) continue;
        const coords = el.geometry.map(p => [Number(p.lon.toFixed(6)), Number(p.lat.toFixed(6))]);
        const tags = el.tags || {};
        const isRail = tags.railway === 'rail';
        const nameTh = tags.name || (tags.ref ? `ทางหลวงหมายเลข ${tags.ref}` : (isRail ? 'ทางรถไฟสายเหนือ' : 'ถนนสายเทศบาล'));
        const nameEn = tags['name:en'] || tags.ref || (isRail ? 'Northern Railway' : 'Municipal Road');

        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coords
          },
          properties: {
            id: `road-${el.id}`,
            name_th: nameTh,
            name_en: nameEn,
            ref: tags.ref || '',
            category: isRail ? 'rail' : 'road',
            highway_type: tags.highway || 'rail',
            surface: tags.surface || 'asphalt',
            lanes: tags.lanes || 2
          }
        });
      }

      console.log('Processed road features:', features.length);
      fs.writeFileSync('./scripts/fetched_roads.json', JSON.stringify({ type: 'FeatureCollection', features }, null, 2));
      console.log('Saved to scripts/fetched_roads.json');
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('Fetch error:', e.message);
});
