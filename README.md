# Cards Simulator

Multiplayer Cards Game Simulator for Local Network.  
This project can be seen as an extension to [Tabletop Simulator](https://www.tabletopsimulator.com/).
TTS allows playing in Hot-Seat mode, but any game that requires players to hold and hide cards from other players has been an unsatisfactory experience as everyone shares one screen.
With this Cards Simulator, all players can use their smartphones to control the (hand) cards.
With the combination of both - TTS single player mode AND Cards Simulator - TTS represents the board for all players while Card Simulator manages the cards that have to be kept secret.

![Preview image](/preview/preview1.png?raw=true "Preview")

<img src="/preview/preview2.png?raw=true" width="24%"></img>
<img src="/preview/preview3.png?raw=true" width="24%"></img>
<img src="/preview/preview4.png?raw=true" width="24%"></img>

## Install

1. Clone Repository  
`git clone https://github.com/MitskiP/Cards-Simulator`
2. Install dependencies  
`npm install`
3. Download resource files  
`sh res/get.sh`
4. Run server  
`npm run start`

Now open up your server's ip address on your smartphone, usually something like `192.168.1.X:2567`.

## Adding custom games

There is no configuration file (yet); all games are defined in `src/server/game-room.ts`.
Extend `GameRoom` and add it to the function `allGames()`. Enjoy!
