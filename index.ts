import express from 'express';
import serveIndex from 'serve-index';
import path from 'path';
import cors from 'cors';
import { createServer } from 'http';
import { Server, LobbyRoom, RelayRoom } from 'colyseus';
import { monitor } from '@colyseus/monitor';
import { GameRoom, allGames } from './src/server/game-room';

const port = Number(process.env.PORT || 2567) + Number(process.env.NODE_APP_INSTANCE || 0);
const app = express();

app.use(cors());
app.use(express.json());

// Attach WebSocket Server on HTTP Server.
const gameServer = new Server({
  server: createServer(app),
  express: app,
  pingInterval: 0,
});

allGames().forEach(game => {
    // Define game rooms
    console.log("creating room for " + game.gameName + "...");
    gameServer.define(game.gameName, game);
});

// Define "lobby" room
gameServer.define("lobby", LobbyRoom);

// Define "relay" room
gameServer.define("relay", RelayRoom, { maxClients: 4 })
    .enableRealtimeListing();

// folder view
//app.use('/', serveIndex(path.join(__dirname, "landing"), {'icons': true}))
app.use('/dist', express.static(path.join(__dirname, "/dist"), {'icons': true}));
app.use('/', express.static(__dirname + "/landing", {'icons': true}));
app.use('/rooms', express.static(__dirname + "/rooms", {'icons': true}));
app.use('/dist/jquery', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/dist/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/dist/popper', express.static(__dirname + '/node_modules/popper.js/dist/umd'));
app.use('/client', express.static(__dirname + "/src/client", {'icons': true}));
app.use('/res', express.static(__dirname + "/res", {'icons': true}));

// (optional) attach web monitoring panel
app.use('/colyseus', monitor());

gameServer.onShutdown(function() {
  console.log(`game server is going down.`);
});

gameServer.listen(port);

// process.on("uncaughtException", (e) => {
//   console.log(e.stack);
//   process.exit(1);
// });

console.log(`Listening on http://localhost:${ port }`);
