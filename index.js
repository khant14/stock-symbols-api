const NodeCache = require('node-cache');
const express = require('express');
const app = express();
const tickerCache = new NodeCache({ stdTTL: 40000, checkperiod: 10000 });

const getTickers = async () => {
  const NASDAQ = await fetch('https://raw.githubusercontent.com/khant14/stock-symbols/main/nasdaq.json').then(response => response.json());
  const NYSE = await fetch('https://raw.githubusercontent.com/khant14/stock-symbols/main/nyse.json').then(response => response.json());
  const AMEX = await fetch('https://raw.githubusercontent.com/khant14/stock-symbols/main/amex.json').then(response => response.json());

  const tickers = new Map();
  const storeTickers = (exchange) => {
    exchange.forEach(ticker => {
      tickers.set(ticker.symbol, ticker.name);
    });
  }
  storeTickers(NASDAQ);
  storeTickers(NYSE);
  storeTickers(AMEX);
  tickerCache.set('tickers', tickers);

  return tickers;
}

(async () => {
  let tickers = await getTickers();
  tickerCache.on("expired", async () => {
    tickers = await getTickers();
  });

  app.get('/:ticker', (req, res) => {
    const searchTicker = req.params.ticker;
    const resultSymbolsMatch = Array.from(tickers.keys()).sort().filter(element => element.includes(searchTicker));
    const resultNameMatch = Array.from(tickers.values()).sort().filter(element => element.toLowerCase().includes(searchTicker.toLowerCase()));
    const combinedResult = [...resultSymbolsMatch, ...resultNameMatch].map(element => ({ ticker: element, name: tickers.get(element) }));

    res.send(combinedResult);
  });

  app.listen(process.env.PORT, () =>
    console.log(`Listening on port: ${process.env.PORT}!`),
  );
})();
