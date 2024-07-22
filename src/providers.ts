export const GoogleFinance = {
    regexp: /data-last-price="([^"]*)"/,
    endpoint: (code: string, primaryCode: string) => `https://www.google.com/finance/quote/${code}-${primaryCode}`
}

// Add cryptocurrencies, e.g. TON, BTC, ETH