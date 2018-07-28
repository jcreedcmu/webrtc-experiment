const ws = require('ws');
const express = require('express');
const mustache = require('mustache-express')();
const app = express();
const url = require('url');
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');

const invites = {};
const wss = new ws.Server({port: 8080});

wss.on('connection', (conn) => {
  conn.on('message', (msg) => {
	 console.log('ws msg', JSON.parse(msg))
	 conn.send(JSON.stringify({"ok": "ok"}));
  });
});
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

app.post('/action/add', function(request, response) {
  try {
	 const id = uuid();
	 invites[id] = request.body;
	 console.log(request.body);
	 response.json({added: id});
  }
  catch(e) {
	 console.log(e);
	 response.status(500).send(JSON.stringify({error: e.stack}));
  }
});

app.get('/action/accept', function(req, response) {
  try {
	 const id = req.query.id;
	 if (invites[id] != null) {
		response.render('accept', {invite: JSON.stringify(invites[id])});
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
