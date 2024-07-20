const endpoint = (code: string = 'USD', primaryCode: string = 'EUR') =>
  `https://www.google.com/finance/quote/${code}-${primaryCode}`

const response = await fetch(endpoint(), {
  method: 'GET',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
  },
  mode: 'no-cors',
})

const text = await response.text()

const regex = /data-last-price="([^"]*)"/

// Поиск совпадений
const matches = text.match(regex)

if (matches) {
  // matches[1] содержит значение атрибута data-last-price
  const value = matches[1]
  console.log('Value data-last-price:', value)
} else {
  console.log('Attribute data-last-price not found')
}
