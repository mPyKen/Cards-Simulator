import { Room, Client } from "colyseus";
import { State, Player, DeckResource, Board, Row, Card, Pile } from "./state";

export class GameRoom extends Room<State> {

    // Room.maxClients
    maxClients = 12;

    static gameName: string = "Unnamed";

    onCreate (options) {
        console.log("StateHandlerRoom created!", options);

        this.setState(new State());

        this.onMessage("openBoard", (client, data) => {
            console.log("StateHandlerRoom received message from", this.state.clients[client.sessionId], ":", data);
            if (data["boardId"] >= this.state.boards.length) {
                console.log("client " + this.state.players[this.state.clients[client.sessionId]].name + " tried to open inaccessible board");
                return;
            }
            this.state.players[this.state.clients[client.sessionId]].activeBoard = data["boardId"];
        });
        this.onMessage("managePile", (client, data) => {
            console.log("StateHandlerRoom received message from", this.state.clients[client.sessionId], ":", data);
            var path = data["path"];
            var type = data["type"];
            var board = this.state.boards[path[0]];
            var row = this.state.rows[board.rowIds[path[1]]];
            var pile = this.state.piles[row.pileIds[path[2]]];
            if (type == "shuffle") {
                this.shuffleArray(pile.cardIds);
            } else if (type == "sort") {
                this.sortArray(pile.cardIds);
            }
        });
        this.onMessage("applyMove", (client, data) => {
            var spath = data["source"];
            var tpath = data["target"];
            // data special case for tpath[2]:
            // pileinsert pile0 pileinsert pile1 pileinsert pile2 ...
            // 0          1     2          3     4          5     ...
            var pileinsert = tpath[2] % 2 == 0;
            tpath[2] = Math.floor(tpath[2] / 2);
            console.log("StateHandlerRoom received message from" + this.state.clients[client.sessionId] + ". source: " + data["source"] + " target: " + data["target"] + " pileInsert: " + pileinsert);
            
            var sboard = null, srow = null, spile = null, scard = null;
            var tboard = null, trow = null, tpile = null, tcard = null;
            if (spath[0] >= 0) {
                sboard = this.state.boards[spath[0]];
                if (sboard == undefined) {
                    console.error("invalid client input, spath[0] is undefined!"); return;
                }
                if (spath[1] >= 0) {
                    srow = this.state.rows[sboard.rowIds[spath[1]]];
                    if (srow == undefined) {
                        console.error("invalid client input, spath[1] is undefined!"); return;
                    }
                    if (spath[2] >= 0) {
                        spile = this.state.piles[srow.pileIds[spath[2]]];
                        if (spile == undefined) {
                            console.error("invalid client input, spath[2] is undefined!"); return;
                        }
                        if (spath[3] >= 0) {
                            scard = this.state.cards[spile.cardIds[spath[3]]];
                            if (scard == undefined) {
                                console.error("invalid client input, spath[3] is undefined!"); return;
                            }
                        }
                    }
                }
            }
            if (tpath[0] >= 0) {
                tboard = this.state.boards[tpath[0]];
                /*if (tboard == undefined) {
                    console.error("invalid client input, tpath[0] is undefined!"); return;
                }*/
                if (tpath[1] >= 0) {
                    trow = this.state.rows[tboard.rowIds[tpath[1]]];
                    /*if (trow == undefined) {
                        console.error("invalid client input, tpath[1] is undefined!"); return;
                    }*/
                    if (tpath[2] >= 0) {
                        tpile = this.state.piles[trow.pileIds[tpath[2]]];
                        /*if (tpile == undefined) {
                            console.error("invalid client input, tpath[2] is undefined!"); return;
                        }*/
                        if (tpath[3] >= 0) {
                            tcard = this.state.cards[tpile.cardIds[tpath[3]]];
                            /*if (tcard == undefined) {
                                console.error("invalid client input, tpath[3] is undefined!"); return;
                            }*/
                        }
                    }
                }
            }

            var defaultName = "Undefined";

            //this.broadcast("action-taken", "an action has been taken!", { afterNextPatch: true });
            if (spath[3] != -1) {
                // source is card
                if (tpath[3] != -1) {
                    // target is card - move source card BELOW target card. if last card, remove source pile if unnamed
                    tpile.cardIds.splice(tpath[3], 0, scard.id);
                    tpile.desc = "" + tpile.cardIds.length;
                    if (spath[0] == tpath[0] && spath[1] == tpath[1] && spath[2] == tpath[2] && spath[3] >= tpath[3]) {
                        spath[3]++;
                        scard = this.state.cards[spile.cardIds[spath[3]]];
                    }
                } else if (tpath[2] != -1) {
                    if (pileinsert) {
                        // target is pileinsert - create unnamed pile and place source card on that new pile. again, if last card, remove ...
                        var pile: Pile = new Pile(defaultName);
                        pile.id = this.state.piles.length;
                        this.state.piles.push(pile);
                        trow.pileIds.splice(tpath[2], 0, pile.id);
                        if (spath[0] == tpath[0] && spath[1] == tpath[1] && spath[2] >= tpath[2]) {
                            // this is only necessary if the new pile shifts the source pile
                            spath[2]++;
                            spile = this.state.piles[srow.pileIds[spath[2]]];
                        }
                        tpile = this.state.piles[trow.pileIds[tpath[2]]];
                    }
                    // target is pile - place source card below target pile. if last card, remove ...
                    tpile.cardIds.splice(0, 0, scard.id);
                    tpile.desc = "" + tpile.cardIds.length;
                } else if (tpath[1] != -1) {
                    // target is row - create unnamed pile at end of target row, place card on that pile. if last card, remove ...
                    var pile: Pile = new Pile(defaultName);
                    pile.id = this.state.piles.length;
                    this.state.piles.push(pile);
                    pile.cardIds.push(scard.id);
                    pile.desc = "" + pile.cardIds.length;
                    trow.pileIds.push(pile.id);
                } else if (tpath[0] != -1) {
                    // target is board
                } else {
                    // remove source.
                }
                spile.cardIds.splice(spath[3], 1);
                spile.desc = "" + spile.cardIds.length;
                if (spile.cardIds.length == 0 && spile.name == defaultName) {
                    srow.pileIds.splice(spath[2], 1);
                }
            } else if (spath[2] != -1) {
                // source is pile
                if (spile === tpile) {
                    return;
                }
                var merge = false;
                if (tpath[3] != -1) {
                    // target is card - put content of source pile on top of target card, remove source if unnamed
                    tpile.cardIds.splice(tpath[3]+1, 0, ...spile.cardIds);
                    tpile.desc = "" + tpile.cardIds.length;
                    merge = true;
                } else if (tpath[2] != -1) {
                    if (pileinsert) {
                        // target is pileinsert - move source pile to target pileinsert
                        trow.pileIds.splice(tpath[2], 0, spile.id);
                        if (spath[0] == tpath[0] && spath[1] == tpath[1] && spath[2] > tpath[2]) {
                            spath[2]++;
                            spile = this.state.piles[srow.pileIds[spath[2]]];
                        }
                        srow.pileIds.splice(spath[2], 1);
                    } else {
                        // target is pile - put content of source pile below target pile, remove source if unnamed
                        tpile.cardIds.splice(0, 0, ...spile.cardIds);
                        tpile.desc = "" + tpile.cardIds.length;
                        merge = true;
                    }
                } else if (tpath[1] != -1) {
                    // target is row - move source pile to target row
                    trow.pileIds.push(spile.id);
                    srow.pileIds.splice(spath[2], 1);
                } else if (tpath[0] != -1) {
                    // target is board - move source pile to target board
                } else {
                    // remove source.
                }
                if (merge) {
                    spile.cardIds.splice(0, spile.cardIds.length);
                    spile.desc = "0";
                    if (spile.cardIds.length == 0 && spile.name == defaultName) {
                        srow.pileIds.splice(spath[2], 1);
                    }
                }
            } else if (spath[1] != -1) {
                // source is row
            } else if (spath[0] != -1) {
                // source is board
            } else {
                // source is none. create new sth at target.
                if (tpath[3] != -1) {
                    // target is card
                    // HOW??
                } else if (tpath[2] != -1) {
                    // target is pile
                    var pile: Pile = new Pile(defaultName);
                    pile.id = this.state.piles.length;
                    this.state.piles.push(pile);
                    trow.pileIds.splice(tpath[2], 0, pile.id);
                } else if (tpath[1] != -1) {
                    // target is row
                } else if (tpath[0] != -1) {
                    // target is board
                } else {
                    // all -1. sth is wrong.
                    console.error("tried to do sth with " + spath + ". Something wrong.");
                }
            }
            // TODO HERE NEXT







        });
        // for debugging only. remove later.
        this.onMessage("removeBoard", (client, data) => {
            console.log("StateHandlerRoom received message from", this.state.clients[client.sessionId], ":", data);
            if (data["boardId"] >= this.state.boards.length) {
                console.log("client " + this.state.players[this.state.clients[client.sessionId]].name + " tried to remove inaccessible board");
                return;
            }
            if (data["boardId"] == 0) {
                console.log("client " + this.state.players[this.state.clients[client.sessionId]].name + " tried to remove board 0!!");
                return;
            }
            this.state.boards.splice(data["boardId"], 1);
        });
        this.onCreateSpecificGame(options);
        this.state.enumerateIds();
        this.state.prepInfo();
        this.state.prepCardOrig();

        var thisGame = null;
        allGames().forEach(game => {
            if (this instanceof game) {
                thisGame = game;
            }
        });
        for (var i = 0; i < this.state.resources.length; i++) {
            var res = this.state.resources[i];
            res.url = "/res/" + thisGame.gameName + "/" + res.url;
        }
    }

    onAuth(client, options, request) {
        console.log("req.headers.cookie", request.headers.cookie);

        var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress
        console.log("client using ip " + ip);
        this.state.clients[client.sessionId] = ip;

        return true;
    }

    onJoin (client: Client) {
        //client.send("hello", "world");
        if (! (this.state.clients[client.sessionId] in this.state.players)) {
            this.state.createPlayer(this.state.clients[client.sessionId]);
            this.onJoinSpecificGame(client);
        }
        this.state.players[this.state.clients[client.sessionId]].connected = true;
        // broadcast as there is no option afterNextPatch for client.send
        this.broadcast(client.sessionId, "onJoin", { afterNextPatch: true });
    }


    //*
    async onLeave(client, consented: boolean) {
        // flag client as inactive for other users
        this.state.players[this.state.clients[client.sessionId]].connected = false;
        try {
            console.log(this.state.clients[client.sessionId] + " disconnected. Waiting...");
            if (consented) {
                throw new Error("consented leave");
            }
            // allow disconnected client to reconnect into this room for some seconds
            await this.allowReconnection(client, 20);
            // client returned! let's re-activate it.
            this.state.players[this.state.clients[client.sessionId]].connected = true;
            console.log(this.state.clients[client.sessionId] + " reconnected!");
        } catch (e) {
            // timeout reached
            console.log(this.state.clients[client.sessionId] + " disconnected completely.");
            this.state.players[this.state.clients[client.sessionId]].connected = false;
            this.onLeaveSpecificGame(client);
            //this.state.removePlayer(this.state.clients[client.sessionId]);
            delete this.state.clients[client.sessionId];
        }
    }
    //*/
    /*
    onLeave (client) {
        console.log(this.state.clients[client.sessionId] + " disconnected");
        this.state.players[this.state.clients[client.sessionId]].connected = false;
        this.onLeaveSpecificGame(client);
        //this.state.removePlayer(this.state.clients[client.sessionId]);
        delete this.state.clients[client.sessionId];
    }
    //*/

    onDispose () {
        console.log("Dispose StateHandlerRoom");
    }

    // most games can use the following methods
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    sortArray(array) {
        array.sort((a,b) => a-b);
    }
    static baseZone: string = "'s zone";
    createDedicatedRowForPlayer(client: Client) {
        // create new row for this player
        var rowhand: Row = new Row(this.state.players[this.state.clients[client.sessionId]].name + GameRoom.baseZone);
        this.state.players[this.state.clients[client.sessionId]].onChange = (changes) => {
            changes.forEach(change => {
                switch (change.field) {
                    case "name":
                        rowhand.name = change.value + GameRoom.baseZone;
                        break;
                }
            });
        }
        rowhand.id = this.state.rows.length;
        this.state.rows.push(rowhand);
        var pile: Pile = new Pile("Hand");
        pile.perm.seeFrontWhitelist = true;
        pile.perm.seeBackWhitelist = false;
        pile.perm.seeFront[this.state.clients[client.sessionId]] = true;
        pile.desc = "0";
        pile.id = this.state.piles.length;
        this.state.piles.push(pile);
        rowhand.pileIds.push(pile.id);
        var pile2: Pile = new Pile("Hand2");
        pile2.perm.seeFrontWhitelist = true;
        pile2.perm.seeBackWhitelist = false;
        pile2.perm.seeFront[this.state.clients[client.sessionId]] = true;
        pile2.desc = "0";
        pile2.id = this.state.piles.length;
        this.state.piles.push(pile2);
        rowhand.pileIds.push(pile2.id);
        var pileOut1: Pile = new Pile("Discard");
        pileOut1.perm.seeFrontWhitelist = false;
        pileOut1.perm.seeBackWhitelist = false;
        pileOut1.desc = "0";
        pileOut1.id = this.state.piles.length;
        this.state.piles.push(pileOut1);
        rowhand.pileIds.push(pileOut1.id);
        var pileOut2: Pile = new Pile("Discard2");
        pileOut2.perm.seeFrontWhitelist = false;
        pileOut2.perm.seeBackWhitelist = false;
        pileOut2.desc = "0";
        pileOut2.id = this.state.piles.length;
        this.state.piles.push(pileOut2);
        rowhand.pileIds.push(pileOut2.id);
        this.state.players[this.state.clients[client.sessionId]].rowId = rowhand.id;
        return rowhand.id;
    }


    // overwrite this
    onCreateSpecificGame(options) {}
    onJoinSpecificGame(client: Client) {}
    onLeaveSpecificGame(client: Client) {}
}

export function allGames() {
    return [ CatanGame, StarfarerGame, TicketToRide, Hanabi, Cards ];
}

class CatanGame extends GameRoom {
    static gameName: string = 'Catan';
    onCreateSpecificGame(options) {
        var resfrontRes: DeckResource = new DeckResource("resources.jpg", 3, 3);
        var resbackRes: DeckResource = new DeckResource("resourcesback.jpg", 1, 1);
        var devfrontRes: DeckResource = new DeckResource("development.jpg", 2, 5);
        var devbackRes: DeckResource = new DeckResource("developmentback.jpg", 1, 1);
        var blufrontRes: DeckResource = new DeckResource("blue.jpg", 2, 5);
        var blubackRes: DeckResource = new DeckResource("blueback.jpg", 1, 1);
        var yelfrontRes: DeckResource = new DeckResource("yellow.jpg", 2, 4);
        var yelbackRes: DeckResource = new DeckResource("yellowback.jpg", 1, 1);
        var grefrontRes: DeckResource = new DeckResource("green.jpg", 3, 4);
        var grebackRes: DeckResource = new DeckResource("greenback.jpg", 1, 1);
        this.state.resources.push(resfrontRes);
        this.state.resources.push(resbackRes);
        this.state.resources.push(devfrontRes);
        this.state.resources.push(devbackRes);
        this.state.resources.push(blufrontRes);
        this.state.resources.push(blubackRes);
        this.state.resources.push(yelfrontRes);
        this.state.resources.push(yelbackRes);
        this.state.resources.push(grefrontRes);
        this.state.resources.push(grebackRes);
        this.state.enumerateIds();

        var rowRss: Row = new Row("Resource Cards");
        var rowDev: Row = new Row("Development Cards");
        this.state.rows.push(rowRss);
        this.state.rows.push(rowDev);
        this.state.enumerateIds();

        // generate the 8 cards, 25 each
        for (var i = 0; i < 8; i++) {
            var name = "";
            switch (i) {
                case 0: name = "Wood";  break;
                case 1: name = "Brick"; break;
                case 2: name = "Sheep"; break;
                case 3: name = "Wheat"; break;
                case 4: name = "Ore";   break;
                case 5: name = "Paper"; break;
                case 6: name = "Cloth"; break;
                case 7: name = "Coin";  break;
            }
            var card = new Card(name, true, 0, resfrontRes.id, resbackRes.id, i, 0);
            card.id = this.state.cards.length;
            this.state.cards.push(card);

            var pile: Pile = new Pile(name);
            pile.perm.seeFrontWhitelist = false;
            pile.perm.seeBackWhitelist = false;
            pile.id = this.state.piles.length;
            this.state.piles.push(pile);
            for (var n = 0; n < 25; n++) {
                pile.cardIds.push(i);
            }
            rowRss.pileIds.push(pile.id);
        }
        this.state.enumerateIds();


        var pileClassic: Pile = new Pile("Classic");
        var pileBlu: Pile = new Pile("Blue");
        var pileYel: Pile = new Pile("Yellow");
        var pileGre: Pile = new Pile("Green");
        pileClassic.perm.seeFrontWhitelist = true;
        pileClassic.perm.seeBackWhitelist = false;
        pileBlu.perm.seeFrontWhitelist = true;
        pileBlu.perm.seeBackWhitelist = false;
        pileYel.perm.seeFrontWhitelist = true;
        pileYel.perm.seeBackWhitelist = false;
        pileGre.perm.seeFrontWhitelist = true;
        pileGre.perm.seeBackWhitelist = false;
        this.state.piles.push(pileClassic);
        this.state.piles.push(pileBlu);
        this.state.piles.push(pileYel);
        this.state.piles.push(pileGre);
        this.state.enumerateIds();
        rowDev.pileIds.push(pileClassic.id);
        rowDev.pileIds.push(pileBlu.id);
        rowDev.pileIds.push(pileYel.id);
        rowDev.pileIds.push(pileGre.id);

        for (var i = 0; i < 9; i++) {
            var count = 0;
            switch (i) {
                case 0: count = 14;  break;
                case 1: count = 1;  break;
                case 2: count = 1;  break;
                case 3: count = 1;  break;
                case 4: count = 1;  break;
                case 5: count = 1;  break;
                case 6: count = 2;  break;
                case 7: count = 2;  break;
                case 8: count = 2;  break;
            }
            var card = new Card("Development", true, 0, devfrontRes.id, devbackRes.id, i, 0);
            card.id = this.state.cards.length;
            this.state.cards.push(card);
            for (var n = 0; n < count; n++) {
                pileClassic.cardIds.push(card.id);
            }
            this.shuffleArray(pileClassic.cardIds);
        }
        this.state.enumerateIds();

        for (var i = 0; i < 10; i++) {
            var count = 0;
            switch (i) {
                case 1: count = 1;  break;
                case 6: count = 3;  break;
                default: count = 2;  break;
            }
            var card = new Card("Blue", true, 0, blufrontRes.id, blubackRes.id, i, 0);
            card.id = this.state.cards.length;
            this.state.cards.push(card);
            for (var n = 0; n < count; n++) {
                pileBlu.cardIds.push(card.id);
            }
            this.shuffleArray(pileBlu.cardIds);
        }
        for (var i = 0; i < 6; i++) {
            var count = 0;
            switch (i) {
                case 3: count = 6;  break;
                case 4: count = 4;  break;
                default: count = 2;  break;
            }
            var card = new Card("Yellow", true, 0, yelfrontRes.id, yelbackRes.id, i, 0);
            card.id = this.state.cards.length;
            this.state.cards.push(card);
            for (var n = 0; n < count; n++) {
                pileYel.cardIds.push(card.id);
            }
            this.shuffleArray(pileYel.cardIds);
        }
        for (var i = 0; i < 9; i++) {
            var count = 0;
            switch (i) {
                case 2: count = 1;  break;
                case 7: count = 1;  break;
                default: count = 2;  break;
            }
            var card = new Card("Green", true, 0, grefrontRes.id, grebackRes.id, i, 0);
            card.id = this.state.cards.length;
            this.state.cards.push(card);
            for (var n = 0; n < count; n++) {
                pileGre.cardIds.push(card.id);
            }
            this.shuffleArray(pileGre.cardIds);
        }
        this.state.enumerateIds();


        // create main board
        this.state.boards.push(new Board("Global", [rowRss.id, rowDev.id]))
        //this.state.boards.push(new Board("All hand cards", [rowRss.id, rowDev.id]))
        this.state.boards.push(new Board("Player Zones", []))
        this.state.enumerateIds();
    }
    onJoinSpecificGame(client: Client) {
        var newRowId = this.createDedicatedRowForPlayer(client);
        this.state.boards[1].rowIds.push(newRowId);
    }
    onLeaveSpecificGame(client: Client) {
        // do nothing as player might come back
        return;
        var findRow = this.state.players[this.state.clients[client.sessionId]].name + GameRoom.baseZone;
        for (var i = 0; i < this.state.rows.length; i++) {
            var row = this.state.rows[i];
            if (row.name == findRow) {
                // now find all references to this board
                for (var boardId = 0; boardId < this.state.boards.length; boardId++) {
                    var board = this.state.boards[boardId];
                    for (var rowIdx = 0; rowIdx < board.rowIds.length; rowIdx++) {
                        if (board.rowIds[rowIdx] == row.id) {
                            board.rowIds.splice(rowIdx, 1);
                            console.log("removed " + boardId + " " + rowIdx + " row id " + row.id);
                            rowIdx--;
                        }
                    }
                }
                this.state.rows.splice(i, 1);
                return;
            }
        }
    }
}








class StarfarerGame extends GameRoom {
    static gameName: string = 'Starfarer';
    onCreateSpecificGame(options) {
        var resfrontRes: DeckResource = new DeckResource("front.jpg", 7, 10);
        var resbackRes: DeckResource = new DeckResource("back.jpg", 7, 10);
        this.state.resources.push(resfrontRes);
        this.state.resources.push(resbackRes);
        this.state.enumerateIds();

        var rowRss: Row = new Row("Resource Cards");
        var rowBonus: Row = new Row("Bonus Cards");
        this.state.rows.push(rowRss);
        this.state.rows.push(rowBonus);
        this.state.enumerateIds();

        var pileBonus1: Pile = new Pile("Bonus1");
        pileBonus1.perm.seeFrontWhitelist = true;
        pileBonus1.perm.seeBackWhitelist = false;
        pileBonus1.id = this.state.piles.length;
        this.state.piles.push(pileBonus1);
        rowBonus.pileIds.push(pileBonus1.id);
        var pileBonus2: Pile = new Pile("Bonus2");
        pileBonus2.perm.seeFrontWhitelist = true;
        pileBonus2.perm.seeBackWhitelist = false;
        pileBonus2.id = this.state.piles.length;
        this.state.piles.push(pileBonus2);
        rowBonus.pileIds.push(pileBonus2.id);

        // generate the 5 cards, 25 each
        for (var i = 0; i < 5; i++) {
            var name = "";
            switch (i) {
                case 0: name = "Fuel";  break;
                case 1: name = "Carbon"; break;
                case 2: name = "Food"; break;
                case 3: name = "Goods"; break;
                case 4: name = "Ore";   break;
            }
            var card = new Card(name, true, 0, resfrontRes.id, resbackRes.id, 20+i, 20);
            card.id = this.state.cards.length;
            this.state.cards.push(card);

            var pile: Pile = new Pile(name);
            pile.perm.seeFrontWhitelist = false;
            pile.perm.seeBackWhitelist = false;
            pile.id = this.state.piles.length;

            card.origin = pile.id;

            this.state.piles.push(pile);
            for (var n = 0; n < 25; n++) {
                pile.cardIds.push(card.id);
            }
            rowRss.pileIds.push(pile.id);

            for (var n = 0; n < 12; n++) {
                pileBonus1.cardIds.push(card.id);
            }
            for (var n = 0; n < 10; n++) {
                pileBonus2.cardIds.push(card.id);
            }
        }
        this.state.enumerateIds();

        // shuffle
        this.shuffleArray(pileBonus1.cardIds);
        this.shuffleArray(pileBonus2.cardIds);

        // create main board
        this.state.boards.push(new Board("Global", [rowRss.id, rowBonus.id]))
        this.state.boards.push(new Board("Player Zones", []))
        this.state.enumerateIds();
    }
    onJoinSpecificGame(client: Client) {
        var newRowId = this.createDedicatedRowForPlayer(client);
        this.state.boards[1].rowIds.push(newRowId);
    }
}









class TicketToRide extends GameRoom {
    static gameName: string = 'TicketToRide';
    onCreateSpecificGame(options) {
        var ticketRes: DeckResource = new DeckResource("ticket.png", 7, 10);
        var trainRes: DeckResource = new DeckResource("train.png", 7, 10);
        this.state.resources.push(ticketRes);
        this.state.resources.push(trainRes);
        this.state.enumerateIds();

        var rowRss: Row = new Row("Decks");
        var rowTrains: Row = new Row("Offers");
        this.state.rows.push(rowRss);
        this.state.rows.push(rowTrains);
        this.state.enumerateIds();

        var ticketPile: Pile = new Pile("Tickets");
        ticketPile.perm.seeFrontWhitelist = true;
        ticketPile.perm.seeBackWhitelist = false;
        ticketPile.id = this.state.piles.length;
        this.state.piles.push(ticketPile);
        rowRss.pileIds.push(ticketPile.id);

        var ticketDiscardPile: Pile = new Pile("Ticket Discard");
        ticketDiscardPile.perm.seeFrontWhitelist = true;
        ticketDiscardPile.perm.seeBackWhitelist = false;
        ticketDiscardPile.id = this.state.piles.length;
        this.state.piles.push(ticketDiscardPile);
        rowRss.pileIds.push(ticketDiscardPile.id);

        // generate the ticket cards
        for (var i = 0; i < 69; i++) {
            var name = "Ticket";

            var card = new Card(name, true, 0, ticketRes.id, ticketRes.id, i, 69);
            card.id = this.state.cards.length;
            this.state.cards.push(card);
            card.origin = ticketDiscardPile.id;

            ticketPile.cardIds.push(card.id);
        }
        this.state.enumerateIds();

        var trainPile: Pile = new Pile("Trains");
        trainPile.perm.seeFrontWhitelist = true;
        trainPile.perm.seeBackWhitelist = false;
        trainPile.id = this.state.piles.length;
        this.state.piles.push(trainPile);
        rowRss.pileIds.push(trainPile.id);

        var trainDiscardPile: Pile = new Pile("Train Discard");
        trainDiscardPile.perm.seeFrontWhitelist = false;
        trainDiscardPile.perm.seeBackWhitelist = false;
        trainDiscardPile.id = this.state.piles.length;
        this.state.piles.push(trainDiscardPile);
        rowRss.pileIds.push(trainDiscardPile.id);

        // generate the 9 train cards, 12 each, except for multicolored: 14.
        for (var i = 0; i < 9; i++) {
            var name = "Train";
            var n = 12;
            if (i == 8) { n = 14; }

            var card = new Card(name, true, 0, trainRes.id, trainRes.id, i, 69);
            card.id = this.state.cards.length;
            this.state.cards.push(card);
            card.origin = trainDiscardPile.id;

            for (var x = 0; x < n; x++) {
                trainPile.cardIds.push(card.id);
            }
        }
        this.state.enumerateIds();

        // shuffle
        this.shuffleArray(trainPile.cardIds);
        this.shuffleArray(ticketPile.cardIds);


        for (var i = 0; i < 5; i++) {
            let pile: Pile = new Pile("Train" + (i+1));
            pile.perm.seeFrontWhitelist = false;
            pile.perm.seeBackWhitelist = false;
            pile.id = this.state.piles.length;
            this.state.piles.push(pile);
            rowTrains.pileIds.push(pile.id);
        }

        // create main board
        this.state.boards.push(new Board("Global", [rowRss.id, rowTrains.id]))
        this.state.boards.push(new Board("Player Zones", []))
        this.state.enumerateIds();
    }
    onJoinSpecificGame(client: Client) {
        var newRowId = this.createDedicatedRowForPlayer(client);
        this.state.boards[1].rowIds.push(newRowId);
    }
}












class Hanabi extends GameRoom {
    static gameName: string = 'Hanabi';
    onCreateSpecificGame(options) {
        var deckres: DeckResource = new DeckResource("cards.jpg", 7, 10);
        this.state.resources.push(deckres);
        this.state.enumerateIds();

        var rowRss: Row = new Row("Resources");
        var rowGoal: Row = new Row("Goal");
        this.state.rows.push(rowRss);
        this.state.rows.push(rowGoal);
        this.state.enumerateIds();

        var rssPile: Pile = new Pile("Deck");
        rssPile.perm.seeFrontWhitelist = true;
        rssPile.perm.seeBackWhitelist = false;
        rssPile.id = this.state.piles.length;
        this.state.piles.push(rssPile);
        rowRss.pileIds.push(rssPile.id);

        var rssDiscardPile: Pile = new Pile("Discard");
        rssDiscardPile.perm.seeFrontWhitelist = false;
        rssDiscardPile.perm.seeBackWhitelist = false;
        rssDiscardPile.id = this.state.piles.length;
        this.state.piles.push(rssDiscardPile);
        rowRss.pileIds.push(rssDiscardPile.id);

        var extensionPile: Pile = new Pile("Extension");
        extensionPile.perm.seeFrontWhitelist = false;
        extensionPile.perm.seeBackWhitelist = false;
        extensionPile.id = this.state.piles.length;
        this.state.piles.push(extensionPile);
        rowRss.pileIds.push(extensionPile.id);

        // generate the ticket cards
        for (var i = 0; i < 30; i++) {
            var name = "Hanabi";

            var card = new Card(name, true, 0, deckres.id, deckres.id, i, 69);
            card.id = this.state.cards.length;
            this.state.cards.push(card);
            card.origin = rssDiscardPile.id;

            var n = 0;
            switch (i % 5) {
                case 0: n = 3; break;
                case 1: n = 2; break;
                case 2: n = 2; break;
                case 3: n = 2; break;
                case 4: n = 1; break;
            }
            for (var k = 0; k < n; k++) {
                if (i >= 25) {
                    extensionPile.cardIds.push(card.id);
                } else {
                    rssPile.cardIds.push(card.id);
                }
            }
        }
        this.state.enumerateIds();

        // shuffle
        this.shuffleArray(rssPile.cardIds);

        // goal piles
        for (var i = 0; i < 6; i++) {
            var name = "";
            switch (i) {
                case 0: name = "Blue"; break;
                case 1: name = "Green"; break;
                case 2: name = "Red"; break;
                case 3: name = "White"; break;
                case 4: name = "Yellow"; break;
                case 5: name = "Rainbow"; break;
            }
            let pile: Pile = new Pile(name);
            pile.perm.seeFrontWhitelist = false;
            pile.perm.seeBackWhitelist = false;
            pile.id = this.state.piles.length;
            this.state.piles.push(pile);
            rowGoal.pileIds.push(pile.id);
        }

        // create main board
        this.state.boards.push(new Board("Global", [rowRss.id, rowGoal.id]))
        this.state.enumerateIds();
    }
    onJoinSpecificGame(client: Client) {
        // create new row for this player
        var rowhand: Row = new Row(this.state.players[this.state.clients[client.sessionId]].name + GameRoom.baseZone);
        this.state.players[this.state.clients[client.sessionId]].onChange = (changes) => {
            changes.forEach(change => {
                switch (change.field) {
                    case "name":
                        rowhand.name = change.value + GameRoom.baseZone;
                        break;
                }
            });
        }
        rowhand.id = this.state.rows.length;
        this.state.rows.push(rowhand);

        for (var i = 0; i < 5; i++) {
            var pile: Pile = new Pile("Card " + String.fromCharCode(65+i)); // 65 = 'A'
            pile.perm.seeFrontWhitelist = false;
            pile.perm.seeBackWhitelist = false;
            pile.perm.seeFront[this.state.clients[client.sessionId]] = true;
            pile.desc = "0";
            pile.id = this.state.piles.length;
            this.state.piles.push(pile);
            rowhand.pileIds.push(pile.id);
        }
        this.state.players[this.state.clients[client.sessionId]].rowId = rowhand.id;
        this.state.boards[0].rowIds.push(rowhand.id);
    }
}






class Cards extends GameRoom {
    static gameName: string = 'Cards';
    onCreateSpecificGame(options) {
        var deckres: DeckResource = new DeckResource("cards.jpg", 7, 10);
        this.state.resources.push(deckres);
        this.state.enumerateIds();

        var rowRss: Row = new Row("Cards");
        var rowFree: Row = new Row("Free");
        this.state.rows.push(rowRss);
        this.state.rows.push(rowFree);
        this.state.enumerateIds();

        var rssPile1: Pile = new Pile("Red Deck");
        rssPile1.perm.seeFrontWhitelist = true;
        rssPile1.perm.seeBackWhitelist = false;
        rssPile1.id = this.state.piles.length;
        this.state.piles.push(rssPile1);
        rowRss.pileIds.push(rssPile1.id);

        var rssDiscardPile1: Pile = new Pile("Discard");
        rssDiscardPile1.perm.seeFrontWhitelist = false;
        rssDiscardPile1.perm.seeBackWhitelist = false;
        rssDiscardPile1.id = this.state.piles.length;
        this.state.piles.push(rssDiscardPile1);
        rowRss.pileIds.push(rssDiscardPile1.id);

        var rssPile2: Pile = new Pile("Blue Deck");
        rssPile2.perm.seeFrontWhitelist = true;
        rssPile2.perm.seeBackWhitelist = false;
        rssPile2.id = this.state.piles.length;
        this.state.piles.push(rssPile2);
        rowRss.pileIds.push(rssPile2.id);

        var rssDiscardPile2: Pile = new Pile("Discard");
        rssDiscardPile2.perm.seeFrontWhitelist = false;
        rssDiscardPile2.perm.seeBackWhitelist = false;
        rssDiscardPile2.id = this.state.piles.length;
        this.state.piles.push(rssDiscardPile2);
        rowRss.pileIds.push(rssDiscardPile2.id);

        // generate the ticket cards
        for (var i = 0; i < 52; i++) {
            var name = "Card";
            //var idx = Math.floor(i / 13) * 13 + i % 13;
            var idx = (i % 4) * 13 + Math.floor(i / 4);

            var card1 = new Card(name, true, 0, deckres.id, deckres.id, idx, 54);
            card1.id = this.state.cards.length;
            this.state.cards.push(card1);
            card1.origin = rssDiscardPile1.id;

            var card2 = new Card(name, true, 0, deckres.id, deckres.id, idx, 55);
            card2.id = this.state.cards.length;
            this.state.cards.push(card2);
            card2.origin = rssDiscardPile2.id;

            rssPile1.cardIds.push(card1.id);
            rssPile2.cardIds.push(card2.id);
        }
        for (var i = 52; i < 54; i++) {
            var name = "Card";

            var card1 = new Card(name, true, 0, deckres.id, deckres.id, i, 54);
            card1.id = this.state.cards.length;
            this.state.cards.push(card1);
            card1.origin = rssDiscardPile1.id;

            var card2 = new Card(name, true, 0, deckres.id, deckres.id, i, 55);
            card2.id = this.state.cards.length;
            this.state.cards.push(card2);
            card2.origin = rssDiscardPile2.id;

            rssDiscardPile1.cardIds.push(card1.id);
            rssDiscardPile2.cardIds.push(card2.id);
        }
        this.state.enumerateIds();

        for (var i = 0; i < 5; i++) {
            let pile: Pile = new Pile("Pile " + (i+1));
            pile.perm.seeFrontWhitelist = false;
            pile.perm.seeBackWhitelist = false;
            pile.id = this.state.piles.length;
            this.state.piles.push(pile);
            rowFree.pileIds.push(pile.id);
        }

        // shuffle
        //this.shuffleArray(rssPile.cardIds);

        // create main board
        this.state.boards.push(new Board("Global", [rowRss.id, rowFree.id]))
        this.state.enumerateIds();
    }
    onJoinSpecificGame(client: Client) {
        var newRowId = this.createDedicatedRowForPlayer(client);
        this.state.boards[0].rowIds.push(newRowId);
    }
}
