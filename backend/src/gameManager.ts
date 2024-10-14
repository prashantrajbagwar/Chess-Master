// import { WebSocket } from "ws";
// import { INIT_GAME } from "./message";
// import { Game } from "./Game";
// import { MOVE } from "./message";
// export class GameManager
// {
//     private games: Game[];
//     private pendingUser: WebSocket | null;
//     private users: WebSocket[];
//     constructor(){
//         this.games=[];
//         this.pendingUser=null;
//         this.users=[];
//     }
//     addUser(socket:WebSocket){
//         this.users.push(socket);
//         this.addHandler(socket)
//     } 
//     removeUser(socket:WebSocket){
//         this.users=this.users.filter(user=> user!==socket);
//         //user left stop the game 
//     }
//     private addHandler(socket:WebSocket){
//         socket.on("message",(data)=>{
//             const message=JSON.parse(data.toString());

//             if(message.type === INIT_GAME)
//             {
//                 if(this.pendingUser)
//                 {
//                     //start game
//                     const game=new Game(this.pendingUser, socket);
//                     this.games.push(game);
//                     this.pendingUser=null;
//                 }
//                 else{
//                     this.pendingUser = socket;
//                 }
//             }
//             if(message.type===MOVE)
//             {
//                 //handle move
//                 const game=this.games.find(game => game.player1===socket || game.player2===socket);
//                 if(game)
//                 {
//                     game.handleMove(socket,message.move);
//                 }
//             }
//         })
//     }
    
// }

import { WebSocket } from "ws";
import { INIT_GAME, MOVE, GAME_OVER } from "./message";
import { Game } from "./Game";

export class GameManager {
    private games: Game[] = [];
    private pendingUser: WebSocket | null = null;
    private users: WebSocket[] = [];

    constructor() {}

    addUser(socket: WebSocket) {
        this.users.push(socket);
        this.addHandler(socket);

        if (this.pendingUser) {
            // Start a new game if there is a pending user
            const game = new Game(this.pendingUser, socket);
            this.games.push(game);
            this.pendingUser = null;  // Reset pending user
        } else {
            // Set this user as pending if no other user is available
            this.pendingUser = socket;
            socket.send(JSON.stringify({
                type: INIT_GAME,
                payload: { status: "waiting", message: "Waiting for another player..." }
            }));
        }
    }

    removeUser(socket: WebSocket) {
        this.users = this.users.filter(user => user !== socket);

        // If the user disconnects mid-game, stop the game
        const game = this.games.find(g => g.player1 === socket || g.player2 === socket);
        if (game) {
            // Notify the other player that the game is over
            const otherPlayer = game.player1 === socket ? game.player2 : game.player1;
            otherPlayer.send(JSON.stringify({
                type: GAME_OVER,
                payload: { winner: "Opponent disconnected" }
            }));
            // Remove the game
            this.games = this.games.filter(g => g !== game);
        }

        // If the disconnected user was pending, reset pendingUser
        if (this.pendingUser === socket) {
            this.pendingUser = null;
        }
    }

    private addHandler(socket: WebSocket) {
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());

            if (message.type === INIT_GAME) {
                this.addUser(socket);
            }

            if (message.type === MOVE) {
                const game = this.games.find(game => game.player1 === socket || game.player2 === socket);
                if (game) {
                    game.handleMove(socket, message.move);
                }
            }
        });

        socket.on("close", () => {
            this.removeUser(socket);  // Handle user disconnection
        });
    }
}
