import fs from "fs";
import currenciesRaw from "./currencies.json" with { type: "json" };
import { GoogleFinance } from "./providers.js";
import { isDuplicateCurrenciesPair, isMirrorCurrenciesPair } from "./utils.js";

const now = new Date();
const { regexp, endpoint } = GoogleFinance;
const currencies = currenciesRaw.map((currency) => currency.code);

let primaryCurrency: string;

const collection = new Map<`${string}:${string}`, number>();

async function processResponse(
  currency: string,
  response: Response,
) {
  let value: number = NaN

  const text = await response.text();
  const matches = text.match(regexp);

  if (matches) {
    value = Number(matches[1]);
    console.log(`${primaryCurrency}:${currency}`, "data-last-price:", value);
  } else {
    console.log(`${primaryCurrency}:${currency}`, "data-last-price not found");
  }

  collection.set(`${primaryCurrency}:${currency}`, value);
}

async function makeRequestSync(primaryCurrency: string) {
  const currenciesFiltered = [];
  const currenciesExcluded = [];

  for await (const currency of currencies) {
    if (isMirrorCurrenciesPair(primaryCurrency, currency) || isDuplicateCurrenciesPair(primaryCurrency, currency, collection)) {
      currenciesExcluded.push(currency)
      continue
    }

    currenciesFiltered.push(currency)
  }

  await Promise.all(
    currenciesFiltered.map((code) => fetch(endpoint(code, primaryCurrency))),
  ).then(
    async (responses) => {
      for await (const idx of responses.keys()) {
        console.count("requests");
        await processResponse(currenciesFiltered[idx], responses[idx]);
      }
    }
  );

  for await (const currency of currenciesExcluded) {
    if (isMirrorCurrenciesPair(primaryCurrency, currency)) {
      collection.set(`${primaryCurrency}:${currency}`, 1)
      continue
    }

    if (isDuplicateCurrenciesPair(primaryCurrency, currency, collection)) {
      const value = 1 / collection.get(`${currency}:${primaryCurrency}`)
      collection.set(`${primaryCurrency}:${currency}`, value)
      continue
    }
  }
}

function saveToFile(primaryCurrency: string) {
  const path = `./dist/${primaryCurrency}`;

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  const formattedDate = now.toISOString().split(".")[0] + "Z";
  const data = [...collection].reduce((acc, [key, value]) => {
    if (!key.startsWith(primaryCurrency)) return acc
    const codes = key.split(":");

    acc[codes[1]] = value

    return acc
  }, {})

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
  console.time("total");

  for (const currency of currencies) {
    console.time(currency);
    primaryCurrency = currency;
    await makeRequestSync(currency);
    saveToFile(primaryCurrency);
    console.timeEnd(currency);
  }

  console.timeEnd("total");
}

makeRequestsOnPrimaryCurrency();
