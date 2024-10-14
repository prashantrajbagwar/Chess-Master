"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//web socket in node.js
//initilize of web socket server
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 4000 });
// const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });
    ws.send('something');
});
