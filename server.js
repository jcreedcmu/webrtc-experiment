const ws = require('ws');
const express = require('express');
const mustache = require('mustache-express')();
const app = express();
const url = require('url');
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');

function Matcher() {
  const board = this.board = {};
  const wss = new ws.Server({port: 8080});
  wss.on('connection', (conn) => {
	 function snd(conn, x) { conn.send(JSON.stringify(x)) }

	 console.log('conn');
	 conn.on('message', (msg) => {
		const cmd = JSON.parse(msg);
		console.log('ws msg', cmd)
		switch (cmd.t) {
		case 'put':
 		  const id = uuid();
		  board[id] = {conn, payload: cmd.payload}; // date for expiration?
		  snd(conn, {t: 'added', id});
		  break;
		case 'respond':
		  snd(board[cmd.id].conn, {t: 'response', payload: cmd.payload});
		  delete board[cmd.id];
		  break;
		default:
		  console.error(msg);
		}
	 });
  });
}

const matcher = new Matcher();

app.engine('mst', mustache);
mustache.cache = undefined; // disable cache for debugging purposes

app.set('views', __dirname + '/views');
app.set('view engine', 'mst');
app.use(express.static('public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
});

app.get('/action/accept', function(req, response) {
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
  catch(e) {
	 console.log(e);
	 response.status(500).send(JSON.stringify({error: e.stack}));
  }
});

const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

// workflow advice for how to edit locally:
// https://support.glitch.com/t/possible-to-code-locally-and-push-to-glitch-with-git/2704/5
// https://support.glitch.com/t/code-locally-push-to-glitch-via-git/4227/5?u=tim
