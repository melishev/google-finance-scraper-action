// TODO: store currency pair crossings in Set or Map and prevent a query call if a pair and its value are available
// TODO: add creation of separate workers, so that requests for each primary currency would occur in parallel in separate wokers
import fs from "fs";
import currenciesRaw from "./src/currencies.json";

type AllCurrencies = { [x: string]: number };

const now = new Date();
let primaryCurrency: string;

const regex = /data-last-price="([^"]*)"/;
const endpoint = (code: string, primaryCode: string) =>
  `https://www.google.com/finance/quote/${code}-${primaryCode}`;

const currencies = currenciesRaw.map((currency) => currency.code);

const log = (currencyPair: string, ...message: any[]) =>
  console.log(currencyPair, ...message);

async function processResponse(
  currency: string,
  response: Response,
): Promise<number> {
  let value: number = NaN;

  const text = await response.text();
  const matches = text.match(regex);

  if (matches) {
    value = Number(matches[1]);
    log(`${primaryCurrency}:${currency}`, "data-last-price:", value);
  } else {
    log(`${primaryCurrency}:${currency}`, "data-last-price not found");
  }

  return value;
}

async function processResponses(responses: Response[]): Promise<AllCurrencies> {
  let collection = {};

  for await (const idx of responses.keys()) {
    const value = await processResponse(currencies[idx], responses[idx]);
    collection = { ...collection, [currencies[idx]]: value };
  }

  return collection;
}

async function makeRequestSync(primaryCurrency: string) {
  return await Promise.all(
    currencies.map((code) => fetch(endpoint(code, primaryCurrency))),
  ).then(async (responses) => await processResponses(responses));
}

/** The method saves the received data to a file */
function saveToFile(primaryCurrency: string, data: AllCurrencies) {
  const path = `./dist/${primaryCurrency}`;

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  const formattedDate = now.toISOString().split(".")[0] + "Z";

  const content = {
    meta: {
      code: primaryCurrency,
      createdAt: formattedDate,
    },
    data,
  };

  fs.writeFileSync(
    `${path}/${formattedDate}.json`,
    JSON.stringify(content, null, 2),
    "utf-8",
  );
}

async function makeRequestsOnPrimaryCurrency() {
  // const currencies = ["USD", "EUR"] as const;

  for await (const currency of currencies) {
    primaryCurrency = currency; // remove
    const data = await makeRequestSync(currency);
    saveToFile(primaryCurrency, data);
  }
}

makeRequestsOnPrimaryCurrency();
