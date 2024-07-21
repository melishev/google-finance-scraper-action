import fs from 'fs'
import currenciesRaw from './src/currencies.json'

const now = new Date();

type AllCurrencies = { [x: string]: number }

const regex = /data-last-price="([^"]*)"/
const endpoint = (code: string, primaryCode: string) =>
  `https://www.google.com/finance/quote/${code}-${primaryCode}`

const log = (currencyPair: string, ...message: any[]) => console.log(currencyPair, ...message)

function prepareRequests(primaryCurrency: string) {
  // const currencies = ['USD', 'EUR', 'RUB', 'GEL', 'TRY', 'BAM'] as const
  const currencies = currenciesRaw.map((currency) => currency.code)
  const requests = currencies.map((code) => fetch(endpoint(code, primaryCurrency)))

  return {
    requests,
    currencies,
  }
}

// async function makeRequest(primaryCurrency: string): Promise<AllCurrencies> {
//   const { requests, currencies } = prepareRequests(primaryCurrency)

//   // const value = new Map<string, number>();
//   let collection: AllCurrencies = {}

//   for (const currency of currencies) {
//     const response = await fetch(endpoint(currency, primaryCurrency), {
//       method: 'GET',
//     })
//     const text = await response.text()
//     const matches = text.match(regex)

//     if (matches) {
//       const value = Number(matches[1])
//       // value.set(currency, Number(matches[1]))
//       collection = { ...collection, [currency]: value }
//       log(currency, 'data-last-price:', value)
//     } else {
//       log(currency, 'data-last-price not found')
//     }
//   }

//   return collection
// }

async function processResponse(currency: string, response: Response): Promise<number> {
  let value = NaN

  const text = await response.text()
  const matches = text.match(regex)

  if (matches) {
    value = Number(matches[1])
    log(currency, 'data-last-price:', value)
  } else {
    log(currency, 'data-last-price not found')
  }

  return value
}

async function makeRequestSync(primaryCurrency: string) {
  const { requests, currencies } = prepareRequests(primaryCurrency)

  const value = await Promise.all(requests).then(async (responses) => {
    return currencies.reduce(async (acc, currency, idx) => {
      const value = await processResponse(currency, responses[idx])
      acc = { ...acc, [currency]: value }
      return acc
    }, {})
  })

  return value
}

/** The method saves the received data to a file */
function saveToFile(primaryCurrency: string, data: AllCurrencies) {
  const path = `./dist/${primaryCurrency}`

  if (!fs.existsSync(path)){
    fs.mkdirSync(path, { recursive: true });
  }

  const formattedDate = now.toISOString().split('.')[0] + 'Z'

  const content = {
    meta: {
      code: '',
      createdAt: formattedDate
    },
    data,
  }

  fs.writeFileSync(`${path}/${formattedDate}.json`, JSON.stringify(content, null, 2), 'utf-8')
}

const primaryCurrency = 'EUR'
saveToFile(primaryCurrency, await makeRequestSync(primaryCurrency))
