import * as ws from 'ws';

import express from 'express';
import expressWs from 'express-ws';
import { Express } from 'express';
import mustacheExpress from 'mustache-express';
import * as url from 'url';
import * as bodyParser from 'body-parser';
import uuid from 'uuid/v1';

const mustache = mustacheExpress();
const app = express();

type Message =
  | { t: 'added', id: string }
  | { t: 'response', payload: string };

function snd(conn: ws, x: Message): void {
  conn.send(JSON.stringify(x))
}

class Matcher {
  board: { [k: string]: { conn: ws, payload: string } };

  constructor(app: expressWs.Application) {
    this.board = {};
    const board = this.board;
    app.ws('/ws', (conn, req) => {
      console.log('conn');
      conn.on('message', (msg) => {
        const cmd = JSON.parse(msg.toString());
        console.log('ws msg', cmd)
        switch (cmd.t) {
          case 'put':
            const id = uuid();
            board[id] = { conn, payload: cmd.payload }; // date for expiration?
            snd(conn, { t: 'added', id });
            break;
          case 'respond':
            snd(board[cmd.id].conn, { t: 'response', payload: cmd.payload });
            delete board[cmd.id];
            break;
          default:
            console.error(msg);
        }
      });
    });
  }
}

// // websocket upgrade plumbing, see
// // https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
const ews = expressWs(app);
const matcher = new Matcher(ews.app);

app.engine('mst', mustache);
mustache.cache = undefined; // disable cache for debugging purposes

app.set('views', __dirname + '/views');
app.set('view engine', 'mst');
app.use(express.static('public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/public/index.html');
});

app.get('/action/accept', (req, response) => {
  try {
    const id = req.query.id;
    console.log(id);
    console.log(matcher);
    console.log(matcher.board);
    if (matcher.board[id] != null) {
      response.render('accept', {
        invite: JSON.stringify(matcher.board[id].payload),
        id: JSON.stringify(id),
      });
    }
    else {
      response.status(500).send(`No such invite id ${id}`);
    }
  }
  catch (e) {
    console.log(e);
    response.status(500).send(JSON.stringify({ error: e.stack }));
  }
});

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + process.env.PORT);
});

// workflow advice for how to edit locally:
// https://support.glitch.com/t/possible-to-code-locally-and-push-to-glitch-with-git/2704/5
// https://support.glitch.com/t/code-locally-push-to-glitch-via-git/4227/5?u=tim
