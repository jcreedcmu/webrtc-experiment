import express, { Express, Request, Response } from 'express';
import { makeTable, tableRecv, tableSend } from './pi';

const table = makeTable<string>();

const app: Express = express();
app.get('/', (req, res) => {
  res.json('ok');
});

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

app.post('/put', async (req, res) => {
  console.log('put body', JSON.stringify(req.body));
  const query: { key: string, value: string } = req.body;
  const value = await tableSend(table, query.key, query.value);
  res.json('ok');
});

const PORT = 8001;
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
