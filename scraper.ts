import fs from 'fs'
import currenciesRaw from './src/currencies.json'

type AllCurrencies = { [x: string]: number }

const now = new Date();
const primaryCurrency = 'EUR'

const regex = /data-last-price="([^"]*)"/
const endpoint = (code: string, primaryCode: string) =>
  `https://www.google.com/finance/quote/${code}-${primaryCode}`

// const currencies = ['USD', 'EUR', 'RUB', 'GEL', 'TRY', 'BAM'] as const
const currencies = currenciesRaw.map((currency) => currency.code)
const requests = currencies.map((code) => fetch(endpoint(code, primaryCurrency)))

const log = (currencyPair: string, ...message: any[]) => console.log(currencyPair, ...message)

async function processResponse(currency: string, response: Response): Promise<number> {
  let value: number = NaN

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

async function processResponses(responses: Response[]): Promise<AllCurrencies> {
  let collection = {}

  for await (const idx of responses.keys()) {
    const value = await processResponse(currencies[idx], responses[idx])
    collection = { ...collection, [currencies[idx]]: value }
  }

  return collection
}

async function makeRequestSync(primaryCurrency: string) {
  return await Promise.all(requests).then(async (responses) => await processResponses(responses))
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

saveToFile(primaryCurrency, await makeRequestSync(primaryCurrency))
