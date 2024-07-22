/** Determines whether a potential pair is a mirror pair, ex: USD:USD | EUR:EUR */
export function isMirrorCurrenciesPair(currencyBase: string, currency: string): boolean {
  return currencyBase === currency
}

/** Determines whether a potential pair is a duplicate in a collection of already received pairs */
export function isDuplicateCurrenciesPair(currencyBase: string, currency: string, collection: Map<string, number>) {
  return collection.has(`${currency}:${currencyBase}`)
}

// export function analyzeDuplicateExist(currencyBase: string, currency: string, collection: Map<string, number>): number | undefined {
//   const value = collection.get(`${currencyBase}:${currency}`)

//   if (!value) return

//   /** Function returns the inverse of the currency pair rate, ex: USD:EUR=0.9179 -> EUR:USD=1.0895 */
//   function duplicateCurrenciesPair(value: number): number {
//     return 1 / value
//   }

//   return duplicateCurrenciesPair(value)
// }