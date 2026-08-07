import { describe, it, expect } from 'vitest'

import { applyPlaceToForm, describeAutofill } from '@/views/properties/addressAutofill'

const full = {
  label: '23 Lagos Avenue, East Legon, Accra',
  street: '23 Lagos Avenue',
  region: 'greater-accra',
  district: 'ayawaso-west',
  city: 'East Legon',
  latitude: 5.6339009,
  longitude: -0.1727902,
  placeId: 'osm:N4951010023'
}

const partial = { ...full, district: null, city: null }

describe('applyPlaceToForm', () => {
  it('assigns every matched field', () => {
    const next = applyPlaceToForm({ region: '', district: '', city: '' }, full)

    expect(next).toMatchObject({
      region: 'greater-accra',
      district: 'ayawaso-west',
      city: 'East Legon'
    })
  })

  it('does not wipe a field the geocoder could not match', () => {
    // Assigning region normally cascades district and city to empty. Doing
    // that here would erase the values assigned in the same selection.
    const next = applyPlaceToForm({ region: '', district: '', city: '' }, full)

    expect(next.district).toBe('ayawaso-west')
  })

  it('clears stale values when the new place has no match for them', () => {
    const previous = { region: 'ashanti', district: 'kumasi-metro', city: 'Adum' }
    const next = applyPlaceToForm(previous, partial)

    // Keeping Kumasi's district under a Greater Accra address would be worse
    // than an empty field: it is wrong and it looks deliberate.
    expect(next.region).toBe('greater-accra')
    expect(next.district).toBe('')
    expect(next.city).toBe('')
  })

  it('assigns city from a region-wide fallback even though district is unmatched', () => {
    // GhanaLocationMatcher's region-wide locality fallback: district null,
    // city present. applyPlaceToForm itself has no opinion on preserving
    // this city through a later district pick — that cascade lives in the
    // callers (AddPropertyDialog, PropertyStep) — but it must assign what it
    // was given.
    const regionWideFallback = { ...full, district: null, city: 'Community 25' }
    const next = applyPlaceToForm({ region: 'ashanti', district: 'kumasi-metro', city: 'Adum' }, regionWideFallback)

    expect(next).toMatchObject({ region: 'greater-accra', district: '', city: 'Community 25' })
  })
})

describe('describeAutofill', () => {
  it('lists what it filled', () => {
    expect(describeAutofill(full)).toBe('Filled region, district and city from the address.')
  })

  it('names what it could not match so the user knows to pick it', () => {
    expect(describeAutofill(partial)).toBe(
      'Filled region from the address. Please choose the district and city below.'
    )
  })

  it('says so when nothing matched', () => {
    // Must not claim to have filled the street: applyPlaceToForm never
    // assigns it (street is not one of LocationFields), so that claim was
    // false whenever region/district/city all missed too (IMPORTANT 4 of
    // the whole-branch review).
    expect(describeAutofill({ ...full, region: null, district: null, city: null })).toBe(
      'Please choose the region, district and city below.'
    )
  })

  it('describes a region-wide fallback match (district null, city present)', () => {
    // GhanaLocationMatcher can legitimately return a city with no district —
    // its region-wide locality fallback. No test covered this exact shape
    // before (IMPORTANT 2 of the whole-branch review).
    const regionWideFallback = { ...full, district: null, city: 'Community 25' }

    expect(describeAutofill(regionWideFallback)).toBe(
      'Filled region and city from the address. Please choose the district below.'
    )
  })
})
