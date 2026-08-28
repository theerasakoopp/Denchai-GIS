const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('osm_raw.json', 'utf8'));

console.log(`Total elements in OSM export: ${raw.elements.length}`);

const named = raw.elements.filter(e => e.tags && (e.tags.name || e.tags['name:th'] || e.tags['name:en']));
console.log(`Named elements: ${named.length}\n`);

named.forEach((e, idx) => {
  const name = e.tags.name || e.tags['name:th'] || e.tags['name:en'];
  const type = e.tags.amenity || e.tags.shop || e.tags.tourism || e.tags.office || e.tags.railway || e.tags.leisure || 'other';
  console.log(`${idx + 1}. [${type}] "${name}" -> lon: ${e.lon || e.center?.lon}, lat: ${e.lat || e.center?.lat}`);
});
