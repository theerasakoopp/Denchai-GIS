import * as turf from '@turf/turf';

/**
 * Split a LineString feature into 2 separate LineString features at clicked coordinates.
 * @param {Object} lineFeature - GeoJSON LineString feature
 * @param {Array<number>} clickedCoords - [lng, lat]
 * @returns {Array<Object>|null} Array of 2 GeoJSON LineString features, or null if failed
 */
export function splitLineAtPoint(lineFeature, clickedCoords) {
  if (!lineFeature?.geometry?.coordinates || lineFeature.geometry.type !== 'LineString') {
    return null;
  }

  const origCoords = lineFeature.geometry.coordinates;
  if (origCoords.length < 2) return null;

  const line = turf.lineString(origCoords);
  const pt = turf.point(clickedCoords);
  const snapped = turf.nearestPointOnLine(line, pt);
  const snapCoords = snapped.geometry.coordinates;
  const segIndex = snapped.properties.index; // index of the vertex before the point

  // Build Part 1: from 0 to segIndex, plus snapCoords
  const part1Coords = origCoords.slice(0, segIndex + 1);
  const lastPt = part1Coords[part1Coords.length - 1];
  if (turf.distance(turf.point(lastPt), turf.point(snapCoords), { units: 'meters' }) > 0.5) {
    part1Coords.push(snapCoords);
  }

  // Build Part 2: snapCoords, then segIndex + 1 to end
  const part2Coords = [];
  const firstPt = origCoords[segIndex + 1] || origCoords[segIndex];
  if (turf.distance(turf.point(snapCoords), turf.point(firstPt), { units: 'meters' }) > 0.5) {
    part2Coords.push(snapCoords);
  }
  part2Coords.push(...origCoords.slice(segIndex + 1));

  // Must have at least 2 points each
  if (part1Coords.length < 2 || part2Coords.length < 2) return null;

  const baseId = lineFeature.properties?.id || lineFeature.id || `road_${Date.now()}`;
  const baseNameTh = lineFeature.properties?.name_th || 'ถนน';
  const baseNameEn = lineFeature.properties?.name_en || 'Road';
  const ts = Date.now().toString().slice(-4);

  const feat1 = {
    type: 'Feature',
    id: `${baseId}_part1_${ts}`,
    properties: {
      ...(lineFeature.properties || {}),
      id: `${baseId}_part1_${ts}`,
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
    id: `${baseId}_part2_${ts}`,
    properties: {
      ...(lineFeature.properties || {}),
      id: `${baseId}_part2_${ts}`,
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

/**
 * Merge two LineString features into one continuous LineString feature by connecting nearest endpoints.
 * @param {Object} line1 - First GeoJSON LineString feature
 * @param {Object} line2 - Second GeoJSON LineString feature
 * @returns {Object|null} Merged GeoJSON LineString feature, or null if invalid
 */
export function mergeTwoLines(line1, line2) {
  if (!line1?.geometry?.coordinates || !line2?.geometry?.coordinates) return null;
  const c1 = line1.geometry.coordinates;
  const c2 = line2.geometry.coordinates;
  if (c1.length < 2 || c2.length < 2) return null;

  const start1 = c1[0], end1 = c1[c1.length - 1];
  const start2 = c2[0], end2 = c2[c2.length - 1];

  const d1 = turf.distance(turf.point(end1), turf.point(start2), { units: 'meters' });
  const d2 = turf.distance(turf.point(end1), turf.point(end2), { units: 'meters' });
  const d3 = turf.distance(turf.point(start1), turf.point(end2), { units: 'meters' });
  const d4 = turf.distance(turf.point(start1), turf.point(start2), { units: 'meters' });

  const minD = Math.min(d1, d2, d3, d4);
  let mergedCoords = [];

  if (minD === d1) {
    // end1 connects to start2
    mergedCoords = [...c1, ...(d1 < 1 ? c2.slice(1) : c2)];
  } else if (minD === d2) {
    // end1 connects to end2 (reverse line2)
    const rev2 = [...c2].reverse();
    mergedCoords = [...c1, ...(d2 < 1 ? rev2.slice(1) : rev2)];
  } else if (minD === d3) {
    // start1 connects to end2 (line2 then line1)
    mergedCoords = [...c2, ...(d3 < 1 ? c1.slice(1) : c1)];
  } else {
    // start1 connects to start2 (reverse line1 then line2)
    const rev1 = [...c1].reverse();
    mergedCoords = [...rev1, ...(d4 < 1 ? c2.slice(1) : c2)];
  }

  const name1 = line1.properties?.name_th || 'ถนน';
  const name2 = line2.properties?.name_th || 'ถนน';
  const finalNameTh = name1 === name2 ? name1 : `${name1} - ${name2}`;

  const nameEn1 = line1.properties?.name_en || 'Road';
  const nameEn2 = line2.properties?.name_en || 'Road';
  const finalNameEn = nameEn1 === nameEn2 ? nameEn1 : `${nameEn1} - ${nameEn2}`;

  const mergedId = `merged_${Date.now().toString().slice(-6)}`;

  return {
    type: 'Feature',
    id: mergedId,
    properties: {
      ...(line1.properties || {}),
      id: mergedId,
      name_th: finalNameTh,
      name_en: finalNameEn,
      length_km: Number(turf.length(turf.lineString(mergedCoords), { units: 'kilometers' }).toFixed(3))
    },
    geometry: {
      type: 'LineString',
      coordinates: mergedCoords
    }
  };
}
