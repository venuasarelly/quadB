const express = require('express');
const mongoose = require('mongoose');
const Ticker = require('./model');
const https = require('https');

const app = express();

mongoose.connect('write Yours DB URL', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to database'))
  .catch(error => console.error('Failed to connect to database:', error));

app.get('/tickers', (req, res) => {
  https.get('https://api.wazirx.com/api/v2/tickers', wazirxRes => {
    let data = '';
    wazirxRes.on('data', chunk => {
      data += chunk;
    });
    wazirxRes.on('end', () => {
      const tickers = JSON.parse(data);
      const tickerArray = [];

      for (const [key, value] of Object.entries(tickers)) {
        const tickerData = {
          name: key.toUpperCase(),
          volume: value.volume,
          sell: value.sell,
          buy: value.buy,
          base_unit: value.base_unit.toUpperCase(),
          last: value.last || 0 // provide a default value of 0 if last field is missing
        };
        tickerArray.push(tickerData);
      }

      const top10Tickers = tickerArray.slice(0, 10); // Keep only the first 10 elements

      Ticker.insertMany(top10Tickers)
      .then(() => {
        res.send(`<html><head><title>Top 10 tickers</title></head><body><h1>Top 10 tickers</h1><ul>${top10Tickers.map(ticker => `<li>${ticker.name}: ${ticker.last} ${ticker.base_unit}</li>`).join('')}</ul></body></html>`);
      })
      .catch(error => {
        console.error('Failed to insert tickers into database:', error);
        res.status(500).json({ error: 'Failed to insert tickers into database' });
      });
    });
  });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
