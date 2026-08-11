/**
 * Beyond this, the reading is described as approximate rather than as a
 * position.
 *
 * A GPS fix is 5-20m and a wifi fix 20-100m — both are genuinely "where the
 * property is". An IP-derived fix can be kilometres, which is a different kind
 * of answer wearing the same shape. 100m is where "my building" stops being a
 * reasonable reading of the number.
 */
export const APPROXIMATE_ABOVE_METRES = 100

/** "8 m" / "3.0 km" — a four-digit metre count reads as false precision. */
export function formatMetres(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`
}

/**
 * How a held position describes itself, for as long as it is held.
 *
 * All three fix qualities arrive through the identical geolocation API and
 * land in the identical columns, so the number is the only thing that tells
 * them apart later. Stating it once in a dropdown row and then dropping it
 * leaves the landlord with a saved position and nothing on screen saying how
 * far to trust it — which is the same dishonesty as not reporting it at all.
 */
export function describeAccuracy(metres: number): { text: string; approximate: boolean } {
  const approximate = metres > APPROXIMATE_ABOVE_METRES

  return {
    approximate,
    text: approximate
      ? `Approximate only — accurate to about ${formatMetres(metres)}. Standing outside at the property gives a much better reading.`
      : `Located to within ${formatMetres(metres)}.`
  }
}
