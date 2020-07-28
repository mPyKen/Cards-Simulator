let params = new URLSearchParams(location.search);
var devel = (params.get("devel") == 'true');
var GAME = params.get("game");

document.querySelectorAll(".gamename").forEach(function(el) {
    el.innerText = GAME;
});

// warn on leaving
if (!devel) {
    window.onload = function() {
        window.addEventListener("beforeunload", function (e) {
            var confirmationMessage = 'Leave this page?';
            (e || window.event).returnValue = confirmationMessage;
            return confirmationMessage;
        });
    };
}

var handSwiper = new Swiper(document.getElementById("handswiper"), {

    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 'auto',
  
    freeMode: true,
    freeModeSticky: true,
  
    // Optional parameters
    direction: 'horizontal',
    loop: false,
    slideToClickedSlide: true,
  
    //cssMode: true, // not working w coverflow fow now...
    mousewheel: true,
    keyboard: true,
  
    coverflowEffect: {
      rotate: 60,
      stretch: 40,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    },
  
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
    },
  
    // Navigation arrows
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  
    // And if we need scrollbar
    scrollbar: {
      el: '.swiper-scrollbar',
    },
})

function globalZoom(el, ev, type) {
    var cw = getComputedStyle(document.documentElement).getPropertyValue('--card-width');
    var ch = getComputedStyle(document.documentElement).getPropertyValue('--card-height');
    var cwz = getComputedStyle(document.documentElement).getPropertyValue('--card-width-zoom');
    var chz = getComputedStyle(document.documentElement).getPropertyValue('--card-height-zoom');
    var fn = getComputedStyle(document.documentElement).getPropertyValue('--font-name');
    var fd = getComputedStyle(document.documentElement).getPropertyValue('--font-desc');
    var fb = getComputedStyle(document.documentElement).getPropertyValue('--font-button');
    var s = type == 'in'?' + ':' - ';
    cw = "calc(" + cw + s + "8px)";
    ch = "calc(" + ch + s + "12px)";
    cwz = "calc(" + cw + "*3)";
    chz = "calc(" + ch + "*3)";
    fn = "calc(" + fn + s + "1px)";
    fd = "calc(" + fd + s + "1px)";
    fb = "calc(" + fb + s + "1px)";
    document.documentElement.style.setProperty('--card-width', cw);
    document.documentElement.style.setProperty('--card-height', ch);
    document.documentElement.style.setProperty('--card-width-zoom', cwz);
    document.documentElement.style.setProperty('--card-height-zoom', chz);
    document.documentElement.style.setProperty('--font-name', fn);
    document.documentElement.style.setProperty('--font-desc', fd);
    document.documentElement.style.setProperty('--font-button', fb);

    var swipers = document.querySelectorAll(".swiper-container");
    for (var i = 0; i < swipers.length; i++) {
        swipers[i].swiper.update();
    }
}

function doubleclick(el, ev, onsingle, ondouble) {
    if (el.getAttribute("data-dblclick") == null) {
        el.setAttribute("data-dblclick", 1);
        setTimeout(function () {
            if (el.getAttribute("data-dblclick") == 1) {
                onsingle(el, ev);
            }
            el.removeAttribute("data-dblclick");
        }, 300);
    } else {
        el.removeAttribute("data-dblclick");
        ondouble(el, ev);
    }
    ev.stopPropagation();
}

function slideClick(slide, e) {
    e = e || window.event;
    e.stopPropagation();
    var slides = document.getElementsByClassName('selected');
    for (var i = 0; i < slides.length; i++) {
        slides[i].classList.remove("selected");
    }
    slide.classList.add("selected");
    removeZoomClass();
}
function removeZoomClass() {
    //var slides = document.getElementsByClassName('zoom');
    var slides = document.querySelectorAll(".zoom");
    for (var i = 0; i < slides.length; i++) {
        slides[i].classList.remove("zoom");
    }
}
function zoomActiveSlide(button, e) {
    var swiper = button.closest(".swiper-buttons").parentNode.querySelector(".swiper-container").swiper;
    if (swiper.activeIndex < 0) {
        return;
    }
    swiper.slides[swiper.activeIndex].classList.add("zoom");
    button.closest(".swiper-buttons").focus();
}
function slideDoubleClick(slide, e) {
    e = e || window.event;
    e.stopPropagation();
    var sc = slide.closest(".swiper-card");
    sc.classList.add("zoom");
}


var peekingPile = null;
function closePeek(button, e) {
    peekingPile = null;
    document.getElementById("hand").style.display = "none";
    document.querySelector(".handtoggle").classList.remove("close");
}
closePeek(null, null);

function peek(button, e) {
    var rowIdx = findRowIdx(button);
    var boardIdx = findBoardIdx(button);
    var rowswiper = button.closest(".swiper-buttons").parentNode.querySelector(".swiper-container").swiper;
    //var rowswiper = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[boardIdx].getElementsByClassName("row")[rowIdx].getElementsByClassName("swiper-container")[0].swiper;
    if (rowswiper == null) {
        alert("couldnt find swiper");
        return;
    }
    var pileIdx = rowswiper.activeIndex;

    var board = room.state.boards[boardIdx];
    var row = room.state.rows[board.rowIds[rowIdx]];
    var pile = room.state.piles[row.pileIds[pileIdx]];
    peekPile(pile);
}
function peekPile(pile) {
    document.querySelector(".handtoggle").classList.add("close");
    peekingPile = pile;
    // create hand
    document.getElementById("hand").style.display = "flex";
    handSwiper.removeAllSlides();
    for (var i = 0; i < pile.cardIds.length; i++) {
        var card = room.state.cards[pile.cardIds[i]];
        reconfigureHandCard(pile, i, card, "add");
    }
    setHandPileName(pile.name);
    setHandPileDesc(pile.desc);
}
function reconfigureHandCard(pile, cardIdx, card, task) {
    if (pile != peekingPile) {
        return;
    }
    if (task == "remove") {
        console.log("REMOVING FROM hand " + cardIdx);
        if (cardIdx >= handSwiper.slides.length) {
            // assume cardIds.onRemove workaround: when a pile of 3 cards is removed, we receive
            // onRemove(0, card), onRemove(1, card), onRemove(2, card) (in this exact order)
            // so if we dont do the following, cardIdx 1 is not removed
            cardIdx = handSwiper.slides.length - 1;
            console.log("  ASSUMPTION: this is " + cardIdx);
        }
        handSwiper.removeSlide(cardIdx);
        return;
    }
    if (task == "change") {
        reconfigureHandCard(pile, cardIdx, card, "remove");
    }

    var tmpname = card.name;
    if (!canSeeFront(pile.perm)) {
        tmpname = "hidden";
    }

    var slide = '<div onclick="doubleclick(this, event, function(a,b){slideClick(a,b)}, function(a,b){slideDoubleClick(a,b)})" class="swiper-slide swiper-card card cardid' + card.id + ' disable-dbl-tap-zoom">'
                + '<div class="card-face card-front">'
                    + '<div class="crop"><img src="" style="--x: 0; --y: 0; --w: 1; --h: 1;"></div>'
                    + '<div class="textoverlay">'
                    + '<svg width="40px" height="40px" viewBox="0 0 16 16" class="bi bi-box-arrow-up" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
                        + '<path fill-rule="evenodd" d="M4.646 4.354a.5.5 0 0 0 .708 0L8 1.707l2.646 2.647a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 0 0 0 .708z"/>'
                        + '<path fill-rule="evenodd" d="M8 11.5a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-1 0v9a.5.5 0 0 0 .5.5z"/>'
                        + '<path fill-rule="evenodd" d="M2.5 14A1.5 1.5 0 0 0 4 15.5h8a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 12 5.5h-1.5a.5.5 0 0 0 0 1H12a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 0 0-1H4A1.5 1.5 0 0 0 2.5 7v7z"/>'
                    + '</svg>'
                + '</div>'
                + '</div>'
                + '<div class="card-face card-back">'
                    + '<div class="crop"><img src="" style="--x: 0; --y: 0; --w: 1; --h: 1;"></div>'
                    + '<div class="textoverlay">'
                    + '<svg width="40px" height="40px" viewBox="0 0 16 16" class="bi bi-box-arrow-up" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
                        + '<path fill-rule="evenodd" d="M4.646 4.354a.5.5 0 0 0 .708 0L8 1.707l2.646 2.647a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 0 0 0 .708z"/>'
                        + '<path fill-rule="evenodd" d="M8 11.5a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-1 0v9a.5.5 0 0 0 .5.5z"/>'
                        + '<path fill-rule="evenodd" d="M2.5 14A1.5 1.5 0 0 0 4 15.5h8a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 12 5.5h-1.5a.5.5 0 0 0 0 1H12a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 0 0-1H4A1.5 1.5 0 0 0 2.5 7v7z"/>'
                    + '</svg>'
                + '</div>'
                + '</div>'
                + '<div class="card-name">' + tmpname + '</div>'
                + '<div class="card-desc"></div>'
            + '</div>';
    //pilelist.insertAdjacentHTML('beforeend', slide);
    //pilelist.getElementsByClassName("pile")[i].getElementsByClassName("swiper-container")[0].swiper.appendSlide(pilelist.getElementsByClassName("pile")[i]);
    handSwiper.addSlide(cardIdx, slide);
    redrawSlide(handSwiper, cardIdx, card, pile.perm);
}


function getIdxFromElements(p, classname, node) {
    var classes = p.getElementsByClassName(classname);
    for (var i = 0; i < classes.length; i++) {
        if (classes[i] == node) {
            return i;
        }
    }
    return -1;
}
function findSwiperCardIdx(element) {
    var sc = element.closest(".swiper-card");
    var scIdx = getIdxFromElements(sc.parentNode, "swiper-card", sc);
    return scIdx;
}
function findPileIdx(element) {
    var pile = element.closest(".pile");
    var pileIdx = getIdxFromElements(pile.parentNode, "pile", pile);
    return pileIdx;
}
function findRowIdx(element) {
    var row = element.closest(".row");
    var rowIdx = getIdxFromElements(row.parentNode, "row", row);
    return rowIdx;
}
function findBoardIdx(element) {
    var board = element.closest(".boardcontent");
    var boardIdx = getIdxFromElements(board.parentNode, "boardcontent", board);
    return boardIdx;
}
function manageCards(button, event, type) {
    var tpath = [-1, -1, -1, -1];
    var hand = button.closest(".hand");
    if (hand != null) {
        var pile = document.getElementsByClassName("pileid" + peekingPile.id)[0];
        tpath[2] = findPileIdx(pile);
        tpath[1] = findRowIdx(pile);
        tpath[0] = findBoardIdx(pile);
    } else {
        tpath[0] = findBoardIdx(button);
        tpath[1] = findRowIdx(button);
        var rowswiper = button.closest(".row").querySelector(".swiper-container").swiper;
        tpath[2] = rowswiper.activeIndex;
    }
    room.send("managePile", {type: type, path: tpath});
}
function returnCard(bIdx, rIdx, pIdx, cIdx, type2) {
    console.log("return " + bIdx + "," + rIdx + "," + pIdx + "," + cIdx);
    var b = room.state.boards[bIdx];
    var r = room.state.rows[b.rowIds[rIdx]];
    var p = room.state.piles[r.pileIds[pIdx]];
    var c = room.state.cards[p.cardIds[cIdx]];
    var returnPile = c.origin;
    if (type2 == "playerdiscard" && playerDiscardPileReference != null) {
        returnPile = playerDiscardPileReference.id;
        console.log("  return to DISCARD (" + playerDiscardPileReference.name + ")");
    }
    for (var boardId = 0; boardId < room.state.boards.length; boardId++) {
        var board = room.state.boards[boardId];
        for (var rowIdx = 0; rowIdx < board.rowIds.length; rowIdx++) {
            var row = room.state.rows[board.rowIds[rowIdx]];
            for (var pileIdx = 0; pileIdx < row.pileIds.length; pileIdx++) {
                var pile = room.state.piles[row.pileIds[pileIdx]];
                if (pile.id == returnPile) {
                    var spath = [bIdx, rIdx, pIdx, cIdx];
                    var tpath = [boardId, rowIdx, pileIdx*2+1, pile.cardIds.length];
                    console.log("try move: " + spath + " -> " + tpath);
                    room.send("applyMove", {source: spath, target: tpath});
                    return;
                }
            }
        }
    }
}
function returnCards(button, event, type, type2) {
    var tpath = [-1, -1, -1, -1];
    var hand = button.closest(".hand");
    if (hand != null) {
        if (peekingPile == null || handSwiper.slides.length == 0) { return; }
        var pile = document.getElementsByClassName("pileid" + peekingPile.id)[0];
        tpath[2] = findPileIdx(pile);
        tpath[1] = findRowIdx(pile);
        tpath[0] = findBoardIdx(pile);
        tpath[3] = handSwiper.activeIndex;
    } else {
        tpath[0] = findBoardIdx(button);
        tpath[1] = findRowIdx(button);
        var rowswiper = button.closest(".row").querySelector(".swiper-container").swiper;
        if (rowswiper.slides.length == 0) { return; }
        tpath[2] = rowswiper.activeIndex;
        if (type == "card") {
            var board = room.state.boards[tpath[0]];
            var row = room.state.rows[board.rowIds[tpath[1]]];
            var pile = room.state.piles[row.pileIds[tpath[2]]];
            if (pile.cardIds.length == 0) { return; }
            tpath[3] = pile.cardIds.length - 1;
        }
    }
    if (type == "card") {
        returnCard(tpath[0], tpath[1], tpath[2], tpath[3], type2);
        return;
    }
    var board = room.state.boards[tpath[0]];
    var row = room.state.rows[board.rowIds[tpath[1]]];
    var pile = room.state.piles[row.pileIds[tpath[2]]];
    for (tpath[3] = pile.cardIds.length-1; tpath[3] >= 0; tpath[3]--) {
    //for (tpath[3] = 0; tpath[3] < pile.cardIds.length; tpath[3]++) {
            returnCard(tpath[0], tpath[1], tpath[2], tpath[3], type2);
    }
}
function take(button, event, type) {
    if (peekingPile == null) {
        alert("Peek a pile first");
        return;
    }

    var spath = [-1, -1, -1, -1];
    var tpath = [-1, -1, -1, -1];

    // find source pile
    spath[0] = findBoardIdx(button);
    spath[1] = findRowIdx(button);
    var rowswiper = button.closest(".row").querySelector(".swiper-container").swiper;
    spath[2] = rowswiper.activeIndex;
    var board = room.state.boards[spath[0]];
    var row = room.state.rows[board.rowIds[spath[1]]];
    var pile = room.state.piles[row.pileIds[spath[2]]];
    if (pile.cardIds.length == 0) {
        return;
    }
    if (type == "top") {
        spath[3] = pile.cardIds.length - 1;
    } else if (type == "bottom") {
        spath[3] = 0;
    } else if (type == "random") {
        spath[3] = Math.floor(Math.random() * pile.cardIds.length);
    }

    // find hand pile
    tpath[3] = handSwiper.slides.length;
    var pile = document.getElementsByClassName("pileid" + peekingPile.id)[0];
    tpath[2] = findPileIdx(pile);
    tpath[1] = findRowIdx(pile);
    tpath[0] = findBoardIdx(pile);

    tpath[2] = tpath[2] * 2 + 1;
    console.log("try move: " + spath + " -> " + tpath);
    room.send("applyMove", {source: spath, target: tpath});
}
function insert(button, event, type) {

    var spath = [-1, -1, -1, -1];
    var tpath = [-1, -1, -1, -1];

    // spath
    var selected = document.getElementsByClassName("selected")[0];
    if (selected == null) {
        alert("Please select a card");
        return;
    }
    var hand = selected.closest(".hand");
    if (hand != null) {
        spath[3] = findSwiperCardIdx(selected);
        var pile = document.getElementsByClassName("pileid" + peekingPile.id)[0];
        spath[2] = findPileIdx(pile);
        spath[1] = findRowIdx(pile);
        spath[0] = findBoardIdx(pile);
    } else {
        spath[2] = findPileIdx(selected);
        spath[1] = findRowIdx(selected);
        spath[0] = findBoardIdx(selected);
        if (selected.classList.contains("card-face")) {
            var board = room.state.boards[spath[0]];
            var row = room.state.rows[board.rowIds[spath[1]]];
            var pile = room.state.piles[row.pileIds[spath[2]]];
            spath[3] = pile.cardIds.length - 1;
        }
    }
    // tpath
    var hand = button.closest(".hand");
    if (hand != null) {
        var pile = document.getElementsByClassName("pileid" + peekingPile.id)[0];
        tpath[2] = findPileIdx(pile);
        tpath[1] = findRowIdx(pile);
        tpath[0] = findBoardIdx(pile);
        if (type == "left") {
            tpath[3] = 0;
        } else if (type == "right") {
            tpath[3] = handSwiper.slides.length;
        } else {
            tpath[3] = handSwiper.activeIndex;
            tpath[3] = tpath[3] + (type=="after"?1:0);
        }
        tpath[2] = tpath[2] * 2 + 1;
    } else {
        tpath[0] = findBoardIdx(button);
        tpath[1] = findRowIdx(button);
        var rowswiper = button.closest(".row").querySelector(".swiper-container").swiper;
        tpath[2] = rowswiper.activeIndex;
        if (type == "top") {
            var board = room.state.boards[tpath[0]];
            var row = room.state.rows[board.rowIds[tpath[1]]];
            var pile = room.state.piles[row.pileIds[tpath[2]]];
            tpath[3] = pile.cardIds.length;
        } else if (type == "bottom") {
            tpath[3] = 0;
        }
        if (type == "left") {
            tpath[2] = 0;
        } else if (type == "right") {
            tpath[2] = rowswiper.slides.length * 2;
        } else {
            tpath[2] = tpath[2] * 2 + 1 + (type=="after"?1:0) + (type=="before"?-1:0);
        }
    }
    console.log("try move: " + spath + " -> " + tpath);
    room.send("applyMove", {source: spath, target: tpath});
}
var playerHandPileReference = null;
var playerDiscardPileReference = null;
function toggleHand(button, event) {
    if (playerHandPileReference === null) { return; }
    if (peekingPile != null) {
        closePeek(null, null);
    } else {
        peekPile(playerHandPileReference);
    }
}


function new_connection(room_instance) {
    connected = true;
    room = room_instance;

    console.log("joined successfully", room_instance);

    room.onError((code, message) => {
        console.error(code, "<- code room.onError message ->", message);
        connected = false;
    });
    room.onStateChange((state) => {
        console.log(room.name, "has new state:", state);
    });
    room.onLeave((code) => {
        console.log(code, "<- code onLeave room.name->", room.name);
        connected = false;
    });

    var initialized = false;
    room.onMessage(room.sessionId, (client, message) => {
        if (message == "onJoin") { } // message seems to be empty for broadcast...
        myClientId = room.state.clients[room.sessionId];
        console.log(">>>>>>>>>>>>> NEW STATUS ", message, " - ", myClientId );
        if (initialized) { return; }
        initialized = true;
        initialize();
    });
}

/* JOIN SERVER */

var host = window.document.location.host.replace(/:.*/, '');
var connected = false;
var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : ''));
var room = undefined;
console.log("Entering " + GAME + "...");
client.joinOrCreate(GAME).then(room_instance => {
    new_connection(room_instance);
});
window.onfocus = function() {
    if (!connected && room != undefined) {
        console.log(">>>>>>> try reconnection!");
        room = client.reconnect(room.id, client.sessionId).then(room_instance => {
            new_connection(room_instance);
        }).catch(e => {
            //console.error("join error", e);
            console.error("Could not reconnect to server. Try rejoining.");
            client.joinOrCreate(GAME).then(room_instance => {
                new_connection(room_instance);
            });
        });
    }
};
window.onunload = function() {
    console.log("onUnload! connected: " + connected);
    if (connected) {
        room.leave(true);
    }
}
/*window.onblur = function() {
    // we could disconnect here to close connection if needed...
};*/


function checkPermission(whitelist, list) {
    if (whitelist) {
        return (myClientId in list);
    }
    if (!whitelist) {
        return !(myClientId in list);
    }
}
function canSeeFront(perm) {
    return checkPermission(perm.seeFrontWhitelist, perm.seeFront);
}
function canSeeBack(perm) {
    return checkPermission(perm.seeBackWhitelist, perm.seeBack);
}
function redrawSlide(swiper, index, card, perm) {
    console.log("redraw swiper slide of index " + index);
    //var pileUi = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id].getElementsByClassName("row")[rowIdx].getElementsByClassName("pile")[pileIdx];
    var pileUi = swiper.slides[index];
    var imfront = pileUi.querySelector(".card-front img");
    var imback = pileUi.querySelector(".card-back img");

    if (card != null && (canSeeFront(perm) || canSeeBack(perm))) {
        console.log("  draw a " + card.name);
        // TODO: rotate card
        var resf = room.state.resources[card.frontresId];
        var resb = room.state.resources[card.backresId];
        imfront.style.opacity = 1;
        imback.style.opacity = 1;
        imfront.src = resf.url;
        imfront.style.setProperty('--x', card.frontIdx % resf.cols);
        imfront.style.setProperty('--y', Math.floor(card.frontIdx / resf.cols));
        imfront.style.setProperty('--w', resf.cols);
        imfront.style.setProperty('--h', resf.rows);
        imback.src = resb.url;
        imback.style.setProperty('--x', card.backIdx % resb.cols);
        imback.style.setProperty('--y', Math.floor(card.backIdx / resb.cols));
        imback.style.setProperty('--w', resb.cols);
        imback.style.setProperty('--h', resb.rows);
        if (card.faceup && canSeeFront(perm)) {
            if (! pileUi.classList.contains("visible")) {
                pileUi.classList.add("visible");
            }
        } else {
            if (pileUi.classList.contains("visible")) {
                pileUi.classList.remove("visible");
            }
        }
    } else {
        console.log("  draw a NULL");
        imfront.style.opacity = 0;
        imback.style.opacity = 0;
        imfront.src = "";
        imfront.style.setProperty('--x', 0);
        imfront.style.setProperty('--y', 0);
        imfront.style.setProperty('--w', 1);
        imfront.style.setProperty('--h', 1);
        imback.src = "";
        imback.style.setProperty('--x', 0);
        imback.style.setProperty('--y', 0);
        imback.style.setProperty('--w', 1);
        imback.style.setProperty('--h', 1);
    }
}

function setPileName(board, rowIdx, row, pileIdx, pile, name) {
    var pilelist = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id].getElementsByClassName("row")[rowIdx];
    pilelist.getElementsByClassName("pile")[pileIdx].getElementsByClassName("card-name")[0].innerText = name;
    if (pile == peekingPile) {
        setHandPileName(name);
    }
}
function setHandPileName(name) {
    document.getElementById("hand").querySelector(".pilename").innerText = name;
}
function setPileDesc(board, rowIdx, row, pileIdx, pile, desc) {
    var pilelist = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id].getElementsByClassName("row")[rowIdx];
    pilelist.getElementsByClassName("pile")[pileIdx].getElementsByClassName("card-desc")[0].innerText = desc;
    if (pile == peekingPile) {
        setHandPileDesc(desc);
    }
}
function setHandPileDesc(desc) {
    document.getElementById("hand").querySelector(".piledesc").innerText = desc;
}

function initialize() {
    function reconfigureBoardRowPile(board, rowIdx, row, pileIdx, pile, task) {
        console.log("reconf board " + board.id + " row " + rowIdx + " pile " + pileIdx + " " + task);
        var rowswiper = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id].getElementsByClassName("row")[rowIdx].getElementsByClassName("swiper-container")[0].swiper;
        if (task == "remove") {
            //document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id].getElementsByClassName("row")[rowIdx].getElementsByClassName("pile")[pileIdx].remove();
            rowswiper.removeSlide(pileIdx);
            return;
        }
        if (task == "change") {
            //rowswiper.removeSlide(rowIdx);
            reconfigureBoardRowPile(board, rowIdx, row, pileIdx, room.state.piles[row.pileIds[pileIdx]], "remove");
        }

        // create missing pile
        var slide = ''
                    + '<div onclick="doubleclick(this, event, function(a,b){slideClick(a,b)}, function(a,b){slideDoubleClick(a,b)})" class="swiper-slide swiper-card pile pileid' + pile.id + ' disable-dbl-tap-zoom">'
                        + '<div class="pileanimation wrench">'
                            + '<svg width="15px" height="15px" viewBox="0 0 16 16" class="bi bi-wrench" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
                                + '<path fill-rule="evenodd" d="M.102 2.223A3.004 3.004 0 0 0 3.78 5.897l6.341 6.252A3.003 3.003 0 0 0 13 16a3 3 0 1 0-.851-5.878L5.897 3.781A3.004 3.004 0 0 0 2.223.1l2.141 2.142L4 4l-1.757.364L.102 2.223zm13.37 9.019L13 11l-.471.242-.529.026-.287.445-.445.287-.026.529L11 13l.242.471.026.529.445.287.287.445.529.026L13 15l.471-.242.529-.026.287-.445.445-.287.026-.529L15 13l-.242-.471-.026-.529-.445-.287-.287-.445-.529-.026z"/>'
                            + '</svg>'
                        + '</div>'
                        + '<div class="pileanimation plus"></div>'
                        + '<div class="pileanimation minus"></div>'
                        + '<div onclick="doubleclick(this, event, function(a,b){slideClick(a,b)}, function(a,b){slideDoubleClick(a,b)})" class="card-face card-front disable-dbl-tap-zoom">'
                            + '<div class="crop"><img src="resourcesback.jpg" style="--x: 0; --y: 0; --w: 1; --h: 1;"></div>'
                            + '<div class="textoverlay">'
                            + '<svg width="40px" height="40px" viewBox="0 0 16 16" class="bi bi-box-arrow-up" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
                                + '<path fill-rule="evenodd" d="M4.646 4.354a.5.5 0 0 0 .708 0L8 1.707l2.646 2.647a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 0 0 0 .708z"/>'
                                + '<path fill-rule="evenodd" d="M8 11.5a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-1 0v9a.5.5 0 0 0 .5.5z"/>'
                                + '<path fill-rule="evenodd" d="M2.5 14A1.5 1.5 0 0 0 4 15.5h8a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 12 5.5h-1.5a.5.5 0 0 0 0 1H12a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 0 0-1H4A1.5 1.5 0 0 0 2.5 7v7z"/>'
                            + '</svg>'
                        + '</div>'
                        + '</div>'
                        + '<div onclick="doubleclick(this, event, function(a,b){slideClick(a,b)}, function(a,b){slideDoubleClick(a,b)})" class="card-face card-back disable-dbl-tap-zoom">'
                            + '<div class="crop"><img src="resourcesback.jpg" style="--x: 0; --y: 0; --w: 1; --h: 1;"></div>'
                            + '<div class="textoverlay">'
                            + '<svg width="40px" height="40px" viewBox="0 0 16 16" class="bi bi-box-arrow-up" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
                                + '<path fill-rule="evenodd" d="M4.646 4.354a.5.5 0 0 0 .708 0L8 1.707l2.646 2.647a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 0 0 0 .708z"/>'
                                + '<path fill-rule="evenodd" d="M8 11.5a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-1 0v9a.5.5 0 0 0 .5.5z"/>'
                                + '<path fill-rule="evenodd" d="M2.5 14A1.5 1.5 0 0 0 4 15.5h8a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 12 5.5h-1.5a.5.5 0 0 0 0 1H12a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 0 0-1H4A1.5 1.5 0 0 0 2.5 7v7z"/>'
                            + '</svg>'
                        + '</div>'
                        + '</div>'
                        + '<div class=card-name></div>'
                        + '<div class=card-desc></div>'
                    + '</div>';
        //pilelist.insertAdjacentHTML('beforeend', slide);
        //pilelist.getElementsByClassName("pile")[i].getElementsByClassName("swiper-container")[0].swiper.appendSlide(pilelist.getElementsByClassName("pile")[i]);
        rowswiper.addSlide(pileIdx, slide);

        setPileName(board, rowIdx, row, pileIdx, pile, pile.name);
        setPileDesc(board, rowIdx, row, pileIdx, pile, pile.desc);
        console.log("create pile " + pileIdx);

        var cardIdx = pile.cardIds.length - 1;
        redrawSlide(rowswiper, pileIdx, room.state.cards[pile.cardIds[cardIdx]], pile.perm);
    }

    // ROW logic
    function setRowName(board, rowIdx, row, name) {
        var rowlist = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id];
        rowlist.getElementsByClassName("row")[rowIdx].getElementsByClassName("rowname")[0].innerText = name;
    }
    function setRowDesc(board, rowIdx, row, desc) {
        var rowlist = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id];
        rowlist.getElementsByClassName("row")[rowIdx].getElementsByClassName("rowdesc")[0].innerText = desc;
    }
    function reconfigureBoardRow(board, rowIdx, row, task) {
        if (task == "remove") {
            document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id].getElementsByClassName("row")[rowIdx].remove();
            return;
        }
        console.log("reconf board " + board.id + " row " + rowIdx + " " + task);
        
        var rowlist = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id];
        var insertBeforeNode = rowlist.getElementsByClassName("row")[rowIdx];

        if (task == "change" && insertBeforeNode != undefined) {
            insertBeforeNode = insertBeforeNode.nextSibling;
            reconfigureBoardRow(board, rowIdx, room.state.rows[board.rowIds[rowIdx]], "remove");
        }

        var element = document.createElement("div");
        element.className = "row rowid" + row.id + (room.state.players[myClientId].rowId==row.id?" myrow":"");
        element.innerHTML = ''
                    + '<div class="swiper-description">'
                        + '<a class="rowname"></a>'
                        + '<a class="rowdesc"></a>'
                    + '</div>'
                    + '<div class="swiper-container swipe-piles">'
                        + '<div class="swiper-wrapper">'
                        + '</div>'
                        + '<!--<div class="swiper-pagination"></div>-->'
                        + '<div class="swiper-button-prev"></div>'
                        + '<div class="swiper-button-next"></div>'
                        + '<div class="swiper-scrollbar"></div>'
                    + '</div>'
                    + '<div class="swiper-buttons">'
                        + '<div class="btn-group">'
                            + '<button type="button" class="btn btn-primary btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'
                                + '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-list" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
                                    + '<path fill-rule="evenodd" d="M2.5 11.5A.5.5 0 0 1 3 11h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4A.5.5 0 0 1 3 7h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4A.5.5 0 0 1 3 3h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>'
                                + '</svg>'
                                + ' More'
                            + '</button>'
                            + '<div class="dropdown-menu">'
                            + '<a class="dropdown-item" href="#" onclick="zoomActiveSlide(this, event);">Zoom Active Card</a>'
                            + '<div class="dropdown-divider"></div>'
                            + '<a class="dropdown-item" href="#" onclick="manageCards(this, event, \'shuffle\')">Shuffle Pile</a>'
                            + '<a class="dropdown-item" href="#" onclick="manageCards(this, event, \'sort\')">Sort Pile</a>'
                            + '<div class="dropdown-divider"></div>'
                            + '<a class="dropdown-item" href="#" onclick="peek(this, event)">Peek</a>'
                            + '</div>'
                        + '</div>'
                        + '<div class="btn-group">'
                            + '<button type="button" class="btn btn-warning btn-sm" onclick="take(this, event, \'top\');">'
                                + '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-box-arrow-up" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
                                    + '<path fill-rule="evenodd" d="M4.646 4.354a.5.5 0 0 0 .708 0L8 1.707l2.646 2.647a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 0 0 0 .708z"/>'
                                    + '<path fill-rule="evenodd" d="M8 11.5a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-1 0v9a.5.5 0 0 0 .5.5z"/>'
                                    + '<path fill-rule="evenodd" d="M2.5 14A1.5 1.5 0 0 0 4 15.5h8a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 12 5.5h-1.5a.5.5 0 0 0 0 1H12a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 0 0-1H4A1.5 1.5 0 0 0 2.5 7v7z"/>'
                                + '</svg>'
                                + ' Take Top'
                            + '</button>'
                            + '<button type="button" class="btn btn-warning btn-sm dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>'
                            + '<div class="dropdown-menu">'
                                + '<a class="dropdown-item" href="#" onclick="take(this, event, \'top\');">Take Top</a>'
                                + '<a class="dropdown-item" href="#" onclick="take(this, event, \'bottom\');">Take Bottom</a>'
                                + '<a class="dropdown-item" href="#" onclick="take(this, event, \'random\');">Take Random</a>'
                                + '<div class="dropdown-divider"></div>'
                                + '<a class="dropdown-item" href="#" onclick="returnCards(this, event, \'card\')">Return Top Card</a>'
                                + '<a class="dropdown-item" href="#" onclick="returnCards(this, event, \'pile\')">Return Pile</a>'
                            + '</div>'
                        + '</div>'
                        + '<div class="btn-group">'
                            + '<button type="button" class="btn btn-danger btn-sm" onclick="insert(this, event, \'top\');">'
                                + '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-box-arrow-in-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">'
                                    + '<path fill-rule="evenodd" d="M4.646 8.146a.5.5 0 0 1 .708 0L8 10.793l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/>'
                                    + '<path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0v-9A.5.5 0 0 1 8 1z"/>'
                                    + '<path fill-rule="evenodd" d="M1.5 13.5A1.5 1.5 0 0 0 3 15h10a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 13 4h-1.5a.5.5 0 0 0 0 1H13a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-8A.5.5 0 0 1 3 5h1.5a.5.5 0 0 0 0-1H3a1.5 1.5 0 0 0-1.5 1.5v8z"/>'
                                + '</svg>'
                                + ' Place'
                            + '</button>'
                            + '<button type="button" class="btn btn-danger btn-sm dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>'
                            + '<div class="dropdown-menu">'
                                + '<a class="dropdown-item" href="#" onclick="insert(this, event, \'top\');">Place Above</a>'
                                + '<a class="dropdown-item" href="#" onclick="insert(this, event, \'bottom\');">Place Below</a>'
                                + '<div class="dropdown-divider"></div>'
                                + '<a class="dropdown-item" href="#" onclick="insert(this, event, \'left\');">Place Left-Most</a>'
                                + '<a class="dropdown-item" href="#" onclick="insert(this, event, \'before\');">Place Left</a>'
                                + '<a class="dropdown-item" href="#" onclick="insert(this, event, \'after\');">Place Right</a>'
                                + '<a class="dropdown-item" href="#" onclick="insert(this, event, \'right\');">Place Right-Most</a>'
                            + '</div>'
                        + '</div>'

                + '</div>';

        rowlist.insertBefore(element, insertBeforeNode);

        var swiper = new Swiper(element.getElementsByClassName("swiper-container")[0], {

            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',

            spaceBetween: 5,

            freeMode: true,
            freeModeSticky: true,

            // Optional parameters
            direction: 'horizontal',
            loop: false,
            slideToClickedSlide: true,

            //cssMode: true, // not working w coverflow fow now...
            mousewheel: false,
            keyboard: false,

            // If we need pagination
            pagination: {
                el: '.swiper-pagination',
            },

            // Navigation arrows
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },

            // And if we need scrollbar
            scrollbar: {
                el: '.swiper-scrollbar',
            },

            on: {
                init: () => {
                    setRowName(board, rowIdx, row, row.name);
                    setRowDesc(board, rowIdx, row, row.desc);
                    for (var i = 0; i < row.pileIds.length; i++) {
                        if (row.pileIds[i] < room.state.piles.length) {
                            reconfigureBoardRowPile(board, rowIdx, row, i, room.state.piles[row.pileIds[i]], "add");
                        }
                    }
                },
            },
        });
        console.log("create row " + rowIdx);
    }

    // BOARD logic
    function reconfigureBoard(board, task) {
        if (task == "remove") {
            // TODO: do this server-side
            if (room.state.players[myClientId].activeBoard == board.id) {
                room.send("openBoard", {boardId: 0});
            }
            console.log("removing board");
            document.getElementById("boardlinklist").getElementsByClassName("boardlink")[board.id].remove();
            document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[board.id].remove();
            return;
        }
        console.log("reconf board " + board.id + " " + task);

        function setBoardName(name) {
            document.getElementById("boardlinklist").getElementsByClassName("boardlink")[board.id].firstChild.innerText = name;
        }
    
        var boardlinklist = document.getElementById("boardlinklist");
        for (var i = boardlinklist.getElementsByClassName("boardlink").length; i <= board.id; i++) {
            boardlinklist.insertAdjacentHTML('beforeend', '<li class="nav-item boardlink" onclick="openBoard(this);" data-toggle="collapse" data-target="#navbarText">'
                                                            + '<a class="nav-link"></a>'
                                                        + '</li>');
            console.log("create board " + i);
        }
        // do the same as above for boardcontent
        var boardcontentlist = document.getElementById("boardcontentlist");
        for (var i = boardcontentlist.getElementsByClassName("boardcontent").length; i <= board.id; i++) {
            boardcontentlist.insertAdjacentHTML('beforeend', '<div class="boardcontent"></div>');
        }
        //boardcontentlist.getElementsByClassName("boardcontent")[boardId].innerText = board.name;

        setBoardName(board.name);

        // add rows in board
        for (var i = 0; i < board.rowIds.length; i++) {
            if (board.rowIds[i] < room.state.rows.length) {
                reconfigureBoardRow(board, i, room.state.rows[board.rowIds[i]], "add");
            }
        }
        
        board.onChange = (changes) => {
            changes.forEach(change => {
                switch (change.field) {
                    case "name":
                        setBoardName(change.value);
                        break;
                    case "rowIds": break;
                    default:
                        console.log("received board change in field " + change.field + " to " + change.value);
                        break;
                }
            });
        }

        board.rowIds.onAdd = function(rowId, rowIdx) {
            //if (rowId < room.state.rows.length) {
                console.log("board.rowIds.onAdd " + board.id + " " + rowIdx + " row id " + rowId);
                reconfigureBoardRow(board, rowIdx, room.state.rows[rowId], "add");
            //}
        }
        board.rowIds.onChange = function(rowId, rowIdx) {
            //if (rowId < room.state.rows.length) {
                console.log("board.rowIds.onChange " + board.id + " " + rowIdx + " row id " + rowId);
                reconfigureBoardRow(board, rowIdx, room.state.rows[rowId], "change");
            //}
        }
        board.rowIds.onRemove = function(rowId, rowIdx) {
            //console.log("removing row " + rowIdx);
            //if (rowId < room.state.rows.length) {
                console.log("board.rowIds.onRemove " + board.id + " " + rowIdx + " row id " + rowId);
                reconfigureBoardRow(board, rowIdx, room.state.rows[rowId], "remove");
            //}
        }
    }

    room.state.boards.onAdd = function(board, boardId) {
        reconfigureBoard(board, "add");
    }
    room.state.boards.onChange = function(board, boardId) {
        console.log("boardS.onchange. shall we uncomment this? boardId: " + boardId + ", board: " + board);
        //reconfigureBoard(board, "change");
    }
    room.state.boards.onRemove = function (board, boardId) {
        console.log("boardS.onremove. shall we uncomment this? boardId: " + boardId + ", board: " + board);
        reconfigureBoard(board, "remove");
    }


    // DO INITIALIZE
    document.getElementById("boardlinklist").innerHTML = "";
    document.getElementById("boardcontentlist").innerHTML = "";
    for (var boardId = 0; boardId < room.state.boards.length; boardId++) {
        var board = room.state.boards[boardId];
        reconfigureBoard(board, "add");
    }




    

    function attachListenersPlayer(player, clientId) {
        function setPlayerName(name) {
            if (clientId == myClientId) {
                var elements = document.getElementsByClassName("playername");
                for (var i = 0; i < elements.length; i++) {
                    elements[i].innerText = name;
                }
            }
        }
        function setPlayerActiveBoard(value) {
            // switch visible content if clientId == myClientId
            if (clientId != myClientId)
                return;
            // Get all elements with class="tabcontent" and hide them
            var boardcontent = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent");
            for (var i = 0; i < boardcontent.length; i++) {
                //boardcontent[i].style.display = "none";
                boardcontent[i].style.height = "0px";
            }
            // Get all elements with class="tablinks" and remove the class "active"
            var boardlinks = document.getElementById("boardlinklist").getElementsByClassName("boardlink");
            for (i = 0; i < boardlinks.length; i++) {
                boardlinks[i].className = boardlinks[i].className.replace(" active", "");
            }
            // Show the current tab, and add an "active" class to the button that opened the tab
            //boardcontent[value].style.display = "flex";
            boardcontent[value].style.height = "";
            boardlinks[value].className += " active";
        }
        function setPlayerColor(color, fontcolor) {
            // my ui color
            if (clientId == myClientId) {
                var elements = document.getElementsByClassName("playercolor");
                for (i = 0; i < elements.length; i++) {
                    if (color != undefined)
                        elements[i].style.backgroundColor = color;
                    if (fontcolor != undefined)
                        elements[i].style.color = fontcolor;
                }
            }
        }
        function setPlayerRow(rowId) {
            if (clientId == myClientId) {
                var row = room.state.rows[rowId];
                for (var pileIdx = 0; pileIdx < row.pileIds.length; pileIdx++) {
                    var pile = room.state.piles[row.pileIds[pileIdx]];
                    if (pile.name == "Hand" || pile.name == "Hand1") {
                        if (playerHandPileReference != null) {
                            continue;
                        }
                        console.log("Got player's row with hand cards. Now peek pile: " + pile.name + " in " + row.name);
                        document.querySelector(".handtoggle").style.display = "block";
                        document.querySelector(".handtoggle").classList.add("close");
                        playerHandPileReference = pile;
                        peekPile(pile);
                    } else if (pile.name == "Discard" || pile.name == "Discard1") {
                        if (playerHandPileReference == null || playerDiscardPileReference != null) {
                            continue;
                        }
                        console.log("Got player's discard pile.");
                        playerDiscardPileReference = pile;
                    }
                }
            }
        }
        player.onChange = function (changes) {
            changes.forEach(change => {
                switch (change.field) {
                    case "name":
                        setPlayerName(change.value);
                        break;
                    case "color":
                        setPlayerColor(change.value, undefined);
                        break;
                    case "fontcolor":
                        setPlayerColor(undefined, change.value);
                        break;
                    case "activeBoard":
                        setPlayerActiveBoard(change.value);
                        break;
                    case "rowId":
                        setPlayerRow(change.value);
                        break;
                }
            });
        }
        player.triggerAll();
    }
    for (var p in room.state.players) {
        attachListenersPlayer(room.state.players[p], p);
    }
    room.state.players.onAdd = function (player, clientId) {
        attachListenersPlayer(player, clientId);
    }
    room.state.players.onRemove = function (player, clientID) {
    }






    function reconfigureRow(row, task) {
        function reconfigureAllBoardRowPile(pileIdx, pileId, task) {
            for (var boardId = 0; boardId < room.state.boards.length; boardId++) {
                var board = room.state.boards[boardId];
                for (var rowIdx = 0; rowIdx < board.rowIds.length; rowIdx++) {
                    if (board.rowIds[rowIdx] == row.id) {
                        reconfigureBoardRowPile(board, rowIdx, row, pileIdx, room.state.piles[pileId], task);
                    }
                }
            }
        }
        row.pileIds.onAdd = function(pileId, pileIdx) {
            if (pileId < room.state.piles.length) {
                console.log("row.pileIds.onAdd " + pileIdx);
                reconfigureAllBoardRowPile(pileIdx, pileId, "add");
            }
        }
        row.pileIds.onChange = function(pileId, pileIdx) {
            if (pileId < room.state.piles.length) {
                console.log("row.pileIds.onChange " + pileIdx);
                reconfigureAllBoardRowPile(pileIdx, pileId, "change");
            }
        }
        row.pileIds.onRemove = function(pileId, pileIdx) {
            console.log("row.pileIds.onRemove " + pileIdx);
            reconfigureAllBoardRowPile(pileIdx, pileId, "remove");
        }
        row.onChange = function(changes) {
            changes.forEach(change => {
                switch (change.field) {
                    case "name":
                        for (var boardId = 0; boardId < room.state.boards.length; boardId++) {
                            var board = room.state.boards[boardId];
                            for (var rowIdx = 0; rowIdx < board.rowIds.length; rowIdx++) {
                                if (board.rowIds[rowIdx] == row.id) {
                                    setRowName(board, rowIdx, row, change.value);
                                }
                            }
                        }
                        break;
                    case "desc":
                        for (var boardId = 0; boardId < room.state.boards.length; boardId++) {
                            var board = room.state.boards[boardId];
                            for (var rowIdx = 0; rowIdx < board.rowIds.length; rowIdx++) {
                                if (board.rowIds[rowIdx] == row.id) {
                                    setRowDesc(board, rowIdx, row, change.value);
                                }
                            }
                        }
                        break;
                    case "pileIds": break;
                    default:
                        console.log("received row change in field " + change.field + " to " + change.value);
                        break;
                }
            });
        }
    }
    for (var i = 0; i < room.state.rows.length; i++) {
        reconfigureRow(room.state.rows[i], "add");
    }
    room.state.rows.onAdd = function(row, rowId) {
        reconfigureRow(row, "add");
    }
    room.state.rows.onChange = function(row, rowId) {
        console.log("rowS.onchange. shall we uncomment this? rowId: " + rowId + ", row: " + row);
        //reconfigureRow(row, "change");
    }
    room.state.rows.onRemove = function (row, rowId) {
        console.log("rowS.onremove. shall we uncomment this? rowId: " + rowId + ", row: " + row);
        //console.log("removing row");
        //reconfigureRow(row, "remove");
    }













    function reconfigurePile(pile, task) {
        function redrawInAllBoards(cardIdx, cardId, task) {
            var handschanged = false;
            for (var boardId = 0; boardId < room.state.boards.length; boardId++) {
                var board = room.state.boards[boardId];
                for (var rowIdx = 0; rowIdx < board.rowIds.length; rowIdx++) {
                    var row = room.state.rows[board.rowIds[rowIdx]];
                    var rowswiper = document.getElementById("boardcontentlist").getElementsByClassName("boardcontent")[boardId].getElementsByClassName("row")[rowIdx].getElementsByClassName("swiper-container")[0].swiper;
                    for (var pileIdx = 0; pileIdx < row.pileIds.length; pileIdx++) {
                        if (row.pileIds[pileIdx] == pile.id) {
                            redrawSlide(rowswiper, pileIdx, room.state.cards[cardId], pile.perm);
                            if (task == "add" || task == "remove" || task == "change") {
                                var elm = rowswiper.slides[pileIdx].querySelector(task=="add"?".plus":(task=="remove"?".minus":".wrench"));
                                elm.classList.remove("animated");
                                void elm.offsetWidth;
                                elm.classList.add("animated");
                            }
                            if (!handschanged) {
                                reconfigureHandCard(pile, cardIdx, room.state.cards[cardId], task);
                                handschanged = true;
                            }
                        }
                    }
                }
            }
        }
        pile.cardIds.onAdd = function(cardId, cardIdx) {
            console.log("received cardS onAdd: " + cardIdx);
            // if card is on top
            //if (cardIdx == pile.cardIds.length) {
                redrawInAllBoards(cardIdx, cardId, "add");
            //}
        }
        pile.cardIds.onChange = function(cardId, cardIdx) {
            console.log("received cardS onChange: " + cardIdx);
            // if card is on top
            //if (cardIdx == pile.cardIds.length) {
                redrawInAllBoards(cardIdx, cardId, "change");
            //}
        }

        /*
        use workaround by polling, see
        https://stackoverflow.com/questions/3635924/how-can-i-make-a-program-wait-for-a-variable-change-in-javascript
        */
        function onChange(comp, cachedval, func, explanation, retry=0) {
            if (retry > 10) {
                console.error("onChange: waited " + retry + " times for value change. " + explanation);
                return;
            }
            if(comp() === cachedval) {
                setTimeout(onChange, 50, comp, cachedval, func, retry+1); //wait 50 millisecnds then recheck
                return;
            }
            func();
        }
        pile.cardIds.onRemove = function(cardId, cardIdx) {
            console.log("received cardS onRemove: " + cardIdx);
            //redrawInAllBoards(cardIdx, null, "remove");
            //redrawInAllBoards(cardIdx, pile.cardIds[cardIdx-1], "remove");
            // WORKAROUND, wait for colyseus v. 0.14. instead of above, poll for change
            onChange(function() { return pile.cardIds.length; }, pile.cardIds.length,
            function() {
                redrawInAllBoards(cardIdx, pile.cardIds[pile.cardIds.length-1], "remove");
            }, "redraw top card");
        }
        pile.onChange = function(changes) {
            changes.forEach(change => {
                switch (change.field) {
                    case "name":
                        for (var boardId = 0; boardId < room.state.boards.length; boardId++) {
                            var board = room.state.boards[boardId];
                            for (var rowIdx = 0; rowIdx < board.rowIds.length; rowIdx++) {
                                var row = room.state.rows[board.rowIds[rowIdx]];
                                for (var pileIdx = 0; pileIdx < row.pileIds.length; pileIdx++) {
                                    if (row.pileIds[pileIdx] == pile.id) {
                                        setPileName(board, rowIdx, row, pileIdx, pile, change.value);
                                    }
                                }
                            }
                        }
                        break;
                    case "desc":
                        for (var boardId = 0; boardId < room.state.boards.length; boardId++) {
                            var board = room.state.boards[boardId];
                            for (var rowIdx = 0; rowIdx < board.rowIds.length; rowIdx++) {
                                var row = room.state.rows[board.rowIds[rowIdx]];
                                for (var pileIdx = 0; pileIdx < row.pileIds.length; pileIdx++) {
                                    if (row.pileIds[pileIdx] == pile.id) {
                                        setPileDesc(board, rowIdx, row, pileIdx, pile, change.value);
                                    }
                                }
                            }
                        }
                        break;
                    case "cardIds": break;
                    default:
                        console.log("received pile change in field " + change.field + " to " + change.value);
                        break;
                }
            });
        }
    }
    for (var i = 0; i < room.state.piles.length; i++) {
        reconfigurePile(room.state.piles[i], "add");
    }
    room.state.piles.onAdd = function(pile, pileId) {
        reconfigurePile(pile, "add");
    }
    room.state.piles.onChange = function(pile, pileId) {
        console.log("pileS.onchange. shall we uncomment this? pileId: " + pileId + ", pile: " + pile);
        //reconfigurePile(pile, "change");
    }
    room.state.piles.onRemove = function(pile, pileId) {
        console.log("pileS.onremove. shall we uncomment this? pileId: " + pileId + ", pile: " + pile);
        //reconfigurePile(pile, "remove");
    }
}


function openBoard(element) {
    if (room != undefined) {
        var boardlinklist = document.getElementById("boardlinklist");
        for (i = 0; i < boardlinklist.getElementsByClassName("boardlink").length; i++) {
            if (boardlinklist.getElementsByClassName("boardlink")[i] == element) {
                console.log("Clicked on " + element.firstChild.innerText);
                room.send("openBoard", {boardId: i});
                return;
            }
        }
        console.error("couldnt fint board " + element + ", please check.");
    }
}


