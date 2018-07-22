const express = require('express');
const app = express();
const url = require('url');
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');

const offers = {};

app.use(express.static('public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
});

app.post('/action/add', function(request, response) {
  try {
	 const id = uuid();
	 offers[id] = request.body;
	 console.log(request.body);
	 response.json({added: id});
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
