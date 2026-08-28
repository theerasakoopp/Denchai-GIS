const https = require('https');
const fs = require('fs');

const bbox = '17.960,100.020,18.015,100.090';

const query = `[out:json][timeout:25];(node["amenity"](${bbox});way["amenity"](${bbox});node["shop"](${bbox});node["tourism"](${bbox});node["railway"="station"](${bbox});node["office"](${bbox});node["leisure"](${bbox}););out center;`;

const postData = 'data=' + encodeURIComponent(query);

const options = {
  hostname: 'overpass-api.de',
  port: 443,
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'DenchaiSmartCityGIS/1.0 (gis@denchai.go.th)'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`Successfully received ${json.elements?.length || 0} POI elements!`);
      fs.writeFileSync('osm_raw.json', JSON.stringify(json, null, 2));
    } catch (e) {
      console.error('Response status:', res.statusCode);
      console.error('Response snippet:', data.slice(0, 300));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(postData);
req.end();
