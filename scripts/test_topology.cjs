const turf = require('@turf/turf');

function splitLineExact(lineFeature, clickedPoint) {
  const line = turf.lineString(lineFeature.geometry.coordinates);
  const pt = Array.isArray(clickedPoint) ? turf.point(clickedPoint) : clickedPoint;
  const snapped = turf.nearestPointOnLine(line, pt);
  const snapCoords = snapped.geometry.coordinates;
  const segIndex = snapped.properties.index;

  const origCoords = lineFeature.geometry.coordinates;
  
  // Part 1
  const part1Coords = origCoords.slice(0, segIndex + 1);
  const lastPt = part1Coords[part1Coords.length - 1];
  if (turf.distance(turf.point(lastPt), turf.point(snapCoords), { units: 'meters' }) > 0.5) {
    part1Coords.push(snapCoords);
  }

  // Part 2
  const part2Coords = [];
  const firstPt = origCoords[segIndex + 1];
  if (turf.distance(turf.point(snapCoords), turf.point(firstPt), { units: 'meters' }) > 0.5) {
    part2Coords.push(snapCoords);
  }
  part2Coords.push(...origCoords.slice(segIndex + 1));

  const baseId = lineFeature.properties?.id || lineFeature.id || 'road';
  const baseNameTh = lineFeature.properties?.name_th || 'ถนน';
  const baseNameEn = lineFeature.properties?.name_en || 'Road';

  const feat1 = {
    type: 'Feature',
    id: `${baseId}_pt1_${Date.now().toString().slice(-4)}`,
    properties: {
      ...(lineFeature.properties || {}),
      id: `${baseId}_pt1_${Date.now().toString().slice(-4)}`,
      name_th: `${baseNameTh} (ตอน 1)`,
      name_en: `${baseNameEn} (Part 1)`,
      length_km: Number(turf.length(turf.lineString(part1Coords), { units: 'kilometers' }).toFixed(3))
    },
    geometry: {
      type: 'LineString',
      coordinates: part1Coords
    }
  };

  const feat2 = {
    type: 'Feature',
    id: `${baseId}_pt2_${Date.now().toString().slice(-4)}`,
    properties: {
      ...(lineFeature.properties || {}),
      id: `${baseId}_pt2_${Date.now().toString().slice(-4)}`,
      name_th: `${baseNameTh} (ตอน 2)`,
      name_en: `${baseNameEn} (Part 2)`,
      length_km: Number(turf.length(turf.lineString(part2Coords), { units: 'kilometers' }).toFixed(3))
    },
    geometry: {
      type: 'LineString',
      coordinates: part2Coords
    }
  };

  return [feat1, feat2];
}

function mergeLines(line1, line2) {
  const c1 = line1.geometry.coordinates;
  const c2 = line2.geometry.coordinates;
  if (!c1?.length || !c2?.length) return null;

  const start1 = c1[0], end1 = c1[c1.length - 1];
  const start2 = c2[0], end2 = c2[c2.length - 1];

  const d1 = turf.distance(turf.point(end1), turf.point(start2), { units: 'meters' });
  const d2 = turf.distance(turf.point(end1), turf.point(end2), { units: 'meters' });
  const d3 = turf.distance(turf.point(start1), turf.point(end2), { units: 'meters' });
  const d4 = turf.distance(turf.point(start1), turf.point(start2), { units: 'meters' });

  const minD = Math.min(d1, d2, d3, d4);
  let mergedCoords = [];

  if (minD === d1) {
    mergedCoords = [...c1, ...(d1 < 1 ? c2.slice(1) : c2)];
  } else if (minD === d2) {
    const rev2 = [...c2].reverse();
    mergedCoords = [...c1, ...(d2 < 1 ? rev2.slice(1) : rev2)];
  } else if (minD === d3) {
    mergedCoords = [...c2, ...(d3 < 1 ? c1.slice(1) : c1)];
  } else {
    const rev1 = [...c1].reverse();
    mergedCoords = [...rev1, ...(d4 < 1 ? c2.slice(1) : c2)];
  }

  const name1 = line1.properties?.name_th || 'ถนน';
  const name2 = line2.properties?.name_th || 'ถนน';
  const finalName = name1 === name2 ? name1 : `${name1} - ${name2}`;

  const mergedFeature = {
    type: 'Feature',
    id: line1.properties?.id || line1.id || `merged_${Date.now()}`,
    properties: {
      ...(line1.properties || {}),
      id: line1.properties?.id || line1.id || `merged_${Date.now()}`,
      name_th: finalName,
      name_en: (line1.properties?.name_en || 'Road') + ' (Merged)',
      length_km: Number(turf.length(turf.lineString(mergedCoords), { units: 'kilometers' }).toFixed(3))
    },
    geometry: {
      type: 'LineString',
      coordinates: mergedCoords
    }
  };

  return mergedFeature;
}

// Test
const l1 = {
  type: 'Feature',
  properties: { id: 'a', name_th: 'ถนนหน้าสถานี' },
  geometry: { type: 'LineString', coordinates: [[100.0, 17.0], [100.05, 17.05]] }
};
const l2 = {
  type: 'Feature',
  properties: { id: 'b', name_th: 'ถนนเทศบาล 1' },
  geometry: { type: 'LineString', coordinates: [[100.05, 17.05], [100.1, 17.08]] }
};

const merged = mergeLines(l1, l2);
console.log('Merged Name:', merged.properties.name_th);
console.log('Merged Coords:', merged.geometry.coordinates);
console.log('Merged Length:', merged.properties.length_km, 'km');

const splitParts = splitLineExact(merged, [100.03, 17.03]);
console.log('Split Result: Part 1 len:', splitParts[0].properties.length_km, 'Part 2 len:', splitParts[1].properties.length_km);
