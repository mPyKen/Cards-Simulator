import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { presence } from "colyseus/lib/MatchMaker";

function cpyArray2Schema(arr1: Array<any>, arr2: ArraySchema<any>) {
  if (arr1 == undefined)
    return;
  while(arr2.length > 0) {
    arr2.pop();
  }
  arr1.forEach(element => {
    arr2.push(element)
  });
}

export class Player extends Schema {
  @type('string')
  id: string = "";
  @type('boolean')
  connected: boolean = false;
  @type('string')
  color: string = "red";
  @type('string')
  fontcolor: string = "white";
  @type('string')
  name: string = "Red";
  @type('number')
  activeBoard: number = 0;
  @type('number')
  rowId: number = -1; // player can be the 'owner' of this row
}

export class Permission extends Schema {
  @type('number')
  id: number = -1;
  @type('boolean')
  seeFrontWhitelist: boolean = false;
  @type({ map: 'boolean' })
  seeFront: MapSchema<boolean> = new MapSchema<boolean>();
  @type('boolean')
  seeBackWhitelist: boolean = false;
  @type({ map: 'boolean' })
  seeBack: MapSchema<boolean> = new MapSchema<boolean>();
  constructor(seeFrontWhitelist?: boolean, seeBackWhiltelist?: boolean) {
    super(); this.seeFrontWhitelist = seeFrontWhitelist; this.seeBackWhitelist = seeBackWhiltelist;
  }
}

export class DeckResource extends Schema {
  @type('number')
  id: number = -1;
  @type('string')
  url: string = "";
  @type('number')
  rows: number;
  @type('number')
  cols: number;
  constructor(url:string, rows:number, cols:number) {
    super(); this.url = url; this.rows = rows; this.cols = cols;
  }
}
export class Card extends Schema {
  @type("number")
  id = -1;
  @type("string")
  name = "unnamed card";
  @type("boolean")
  faceup = false;
  @type("number")
  rotation = 0;
  @type("number")
  origin = -10000; // now we can use -1 for e.g. player's specific pile

  @type('number')
  frontresId: number;
  @type('number')
  backresId: number;
  @type("number")
  frontIdx = -1;
  @type("number")
  backIdx = -1;
  constructor(id?: number, name?: string, faceup?: boolean, rotation?: number, frontresId?: number, backresId?: number, frontIdx?: number, backIdx?: number) {
    super(); this.id = id; this.name = name; this.faceup = faceup; this.rotation = rotation; this.frontresId = frontresId; this.backresId = backresId; this.frontIdx = frontIdx; this.backIdx = backIdx;
  }
}
export class Pile extends Schema {
  @type('number')
  id: number = -1;
  @type('string')
  name: string = "unnamed pile";
  @type('string')
  desc: string = "description";
  @type('number')
  cardIdxToDraw: number = -1;
  @type(Permission)
  perm: Permission = new Permission();
  @type(['number'])
  cardIds: ArraySchema<number> = new ArraySchema<number>();
  constructor(name?: string, cards?: Array<number>) {
    super(); this.name = name; cpyArray2Schema(cards, this.cardIds);
  }
}
export class Row extends Schema {
  @type('number')
  id: number = -1;
  @type('string')
  name: string = "unnamed row";
  @type('string')
  desc: string = ""; // leave this empty until it is of further use
  @type(['number'])
  pileIds: ArraySchema<number> = new ArraySchema<number>();
  constructor(name?: string, pileIds?: Array<number>) {
    super(); this.name = name; cpyArray2Schema(pileIds, this.pileIds);
  }
}
export class Board extends Schema {
  @type('number')
  id: number = -1;
  @type('string')
  name: string = "unnamed board";
  @type(['number'])
  rowIds: ArraySchema<number> = new ArraySchema<number>();
  constructor(name: string, rowIds: Array<number>) {
    super(); this.name = name; cpyArray2Schema(rowIds, this.rowIds);
  }
}


export class State extends Schema {
  @type([DeckResource])
  resources: ArraySchema<DeckResource> = new ArraySchema<DeckResource>();
  @type([Card])
  cards: ArraySchema<Card> = new ArraySchema<Card>();
  @type([Pile])
  piles: ArraySchema<Pile> = new ArraySchema<Pile>();
  @type([Row])
  rows: ArraySchema<Row> = new ArraySchema<Row>();
  @type([Board])
  boards: ArraySchema<Board> = new ArraySchema<Board>();

  @type({ map: "string" })
  clients: MapSchema<string> = new MapSchema<string>();

  enumerateIds() {
    [this.resources, this.cards, this.piles, this.rows, this.boards].forEach(arr => {
      for (var i = 0; i < arr.length; i++) {
        arr[i].id = i;
      }
    });
  }

  prepInfo() {
    for (var i = 0; i < this.piles.length; i++) {
      this.piles[i].desc = "" + this.piles[i].cardIds.length;
    }
  }

  prepCardOrig() {
    for (var pileId = 0; pileId < this.piles.length; pileId++) {
      var pile = this.piles[pileId];
      for (var cardIdx = 0; cardIdx < pile.cardIds.length; cardIdx++) {
        var card = this.cards[pile.cardIds[cardIdx]];
        if (card.origin == -10000) {
          card.origin = pile.id;
        }
      }
    }
  }

  // Player logic
  @type({ map: Player })
  players = new MapSchema<Player>();
  createPlayer (id: string) {
      var colors = new Set([
        'red:white',
        'yellow:black',
        'green:white',
        'blue:white',
        'cyan:black',
        'magenta:white',
        'orange:black',
        'brown:white',
        'pink:black',
        'white:black',
        'gray:black',
        'black:white'
      ]);
      for (var p in this.players) {
        colors.delete(this.players[p].color + ":" + this.players[p].fontcolor);
      }
      this.players[id] = new Player();
      if (colors.size == 0) {
        colors.add("red:white");
      }
      this.players[id].id = id;
      this.players[id].color = Array.from(colors.keys())[0].split(":")[0];
      this.players[id].fontcolor = Array.from(colors.keys())[0].split(":")[1];
      this.players[id].name = this.players[id].color;
    }
  removePlayer (id: string) {
      delete this.players[id];
  }
  movePointerTo (id: string, movement: any) {
    if (movement.x && movement.y) {
        this.players[id].pointer.x = movement.x;
        this.players[id].pointer.y = movement.y;
    }
  }
}
