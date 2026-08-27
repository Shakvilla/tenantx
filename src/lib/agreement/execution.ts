/**
 * Whether an agreement record is actually executed, or merely recorded.
 *
 * The view dialog closed with "This agreement is legally binding and
 * enforceable" on every agreement, including the one onboarding had just
 * created with no signature date, no witness and no document attached. That is
 * the single most dangerous sentence in the product: a landlord who reads it
 * stops chasing the signature, and finds out at the Rent Control office that he
 * has a database row and nothing else.
 *
 * The three signals are what the record can actually evidence. Stamping is a
 * separate step the system does not track at all — see the tracker.
 */
export interface AgreementExecution {
  signed: boolean
  witnessed: boolean
  documentAttached: boolean
  /** True only when all three are present. */
  fullyExecuted: boolean
  /** Plain-language list of what is still outstanding, in the order to do it. */
  missing: string[]
}

export const assessExecution = (agreement: {
  signedDate?: string | null
  witnessName?: string | null
  documentUrl?: string | null
} | null | undefined): AgreementExecution => {
  const notBlank = (value?: string | null) => typeof value === 'string' && value.trim().length > 0

  const signed = notBlank(agreement?.signedDate)
  const witnessed = notBlank(agreement?.witnessName)
  const documentAttached = notBlank(agreement?.documentUrl)

  const missing: string[] = []

  if (!signed) missing.push('the date it was signed')
  if (!witnessed) missing.push('a witness')
  if (!documentAttached) missing.push('a copy of the signed agreement')

  return {
    signed,
    witnessed,
    documentAttached,
    fullyExecuted: signed && witnessed && documentAttached,
    missing
  }
}

/** "a witness and a copy of the signed agreement" */
export const listMissing = (missing: string[]): string => {
  if (missing.length === 0) return ''
  if (missing.length === 1) return missing[0]

  return missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1]
}
