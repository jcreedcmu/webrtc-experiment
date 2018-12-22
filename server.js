"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var express_ws_1 = __importDefault(require("express-ws"));
var mustache_express_1 = __importDefault(require("mustache-express"));
var bodyParser = __importStar(require("body-parser"));
var v1_1 = __importDefault(require("uuid/v1"));
var mustache = mustache_express_1.default();
var app = express_1.default();
function snd(conn, x) {
    conn.send(JSON.stringify(x));
}
var Matcher = /** @class */ (function () {
    function Matcher(app) {
        this.board = {};
        var board = this.board;
        app.ws('/ws', function (conn, req) {
            console.log('conn');
            conn.on('message', function (msg) {
                var cmd = JSON.parse(msg.toString());
                console.log('ws msg', cmd);
                switch (cmd.t) {
                    case 'put':
                        var id = v1_1.default();
                        board[id] = { conn: conn, payload: cmd.payload }; // date for expiration?
                        snd(conn, { t: 'added', id: id });
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
    return Matcher;
}());
// // websocket upgrade plumbing, see
// // https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
var ews = express_ws_1.default(app);
var matcher = new Matcher(ews.app);
app.engine('mst', mustache);
mustache.cache = undefined; // disable cache for debugging purposes
app.set('views', __dirname + '/views');
app.set('view engine', 'mst');
app.use(express_1.default.static('public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.get('/', function (request, response) {
    response.sendFile(__dirname + '/public/index.html');
});
app.get('/action/accept', function (req, response) {
    try {
        var id = req.query.id;
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
            response.status(500).send("No such invite id " + id);
        }
    }
    catch (e) {
        console.log(e);
        response.status(500).send(JSON.stringify({ error: e.stack }));
    }
});
var listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening on port ' + process.env.PORT);
});
// workflow advice for how to edit locally:
// https://support.glitch.com/t/possible-to-code-locally-and-push-to-glitch-with-git/2704/5
// https://support.glitch.com/t/code-locally-push-to-glitch-via-git/4227/5?u=tim
