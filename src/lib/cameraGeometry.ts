/**
 * Map bearing: 0° = north (up, negative Y in SVG), clockwise.
 * Returns a point on the circle centered at (cx, cy) with radius `radius`.
 */
function navBearingPoint(cx: number, cy: number, bearingDeg: number, radius: number): { x: number; y: number } {
  const rad = (bearingDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad),
  };
}

/**
 * Returns an SVG path `d` for a camera field-of-view sector: center → outer arc → close.
 * Bearing 0 = north (up), clockwise. `fovDeg` is clamped to (0, 360].
 */
export function cameraFovSectorPath(
  cx: number,
  cy: number,
  bearingDeg: number,
  fovDeg: number,
  rangePx: number
): string {
  const R = rangePx;
  if (!Number.isFinite(R) || R <= 0 || !Number.isFinite(cx) || !Number.isFinite(cy)) {
    return "";
  }

  let fov = fovDeg;
  if (!Number.isFinite(fov)) return "";
  if (fov <= 0) return "";
  fov = Math.min(fov, 360);

  if (fov >= 360) {
    return `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx} ${cy + R} A ${R} ${R} 0 1 1 ${cx} ${cy - R}`;
  }

  const half = fov / 2;
  const b1 = bearingDeg - half;
  const b2 = bearingDeg + half;
  const p1 = navBearingPoint(cx, cy, b1, R);
  const p2 = navBearingPoint(cx, cy, b2, R);

  const largeArc = fov > 180 ? 1 : 0;
  /** Sweep clockwise along the outer perimeter from p1 to p2 (covers the sector). */
  const sweep = 1;

  return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${R} ${R} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y} Z`;
}
