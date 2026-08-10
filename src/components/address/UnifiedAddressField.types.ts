export type CapturedPosition = {
  latitude: number
  longitude: number
  /** The browser's own radius of uncertainty. Carried, never discarded. */
  accuracyMetres: number
}
