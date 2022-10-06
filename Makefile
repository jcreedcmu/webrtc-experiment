build:
	node build-client.js

watch:
	node build-client.js watch

serve:
	node build-server.js && node server.js
