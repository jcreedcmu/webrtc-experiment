import express, { Express, Request, Response } from 'express';
import { makeTable, tableRecv, tableSend } from './pi';
import * as path from 'path';

const table = makeTable<string>();

const app: Express = express();
app.use('/', express.static(path.join(__dirname, '../../manual/public/')));

app.get('/favicon.ico', (req, res) => res.writeHead(200, { 'Content-Type': 'text/plain', 'Link': 'rel="shortcut icon" href="#"' }));
app.get('/get', async (req, res) => {
  const query: { key: string } = req.query as any;
  const value = await tableRecv(table, query.key);
  res.json(value);
});

app.get('/put', async (req, res) => {
  const query: { key: string, value: string } = req.query as any;
  const value = await tableSend(table, query.key, query.value);
  res.json('ok');
});

app.post('/get', express.json(), async (req, res) => {
  console.log('get body', JSON.stringify(req.body));
  const query: { key: string } = req.body;
  const value = await tableRecv(table, query.key);
  res.json(value);
});

app.post('/put', express.json(), async (req, res) => {
  console.log('put body', JSON.stringify(req.body));
  const query: { key: string, value: string } = req.body;
  const value = await tableSend(table, query.key, query.value);
  res.json('ok');
});

const PORT = 8001;
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
