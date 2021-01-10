//Discord BOT for Lichess -> invite link: https://discord.com/api/oauth2/authorize?client_id=796884770814165002&permissions=0&scope=bot
/*TODO:
- zacząć grę blindfolded i dodać komendę showboard
- grać na innych lub bota i wybierać poziom
- dodać możliwość zmiany koloru kratek na dowolny? oprócz tych dodanych w enumie
- naprawić funkcje convertUCItoSAN, bo jak 2 skoczki mogą wykonać ten sam ruch to funkcja nie precyzuje którym skoczkiem ruszyć(chess.move zwraca property .san może coś z tym)
*/
const Discord = require('discord.js');
require('dotenv').config()
const Enum = require('enum')
const config = require("./config.json")
const ChessWebAPI = require('chess-web-api');
const lichess = require('lichess-api');
const { Chess } = require('./chess.js')
const Engine = require('node-uci').Engine;
const ChessImageGenerator = require('chess-image-generator');
const client = new Discord.Client();
const inviteLink = process.env.INVITE_LINK
const BASE_URL = config.BASE_URL
const RESOURCES_URL = config.RESOURCES_URL
const STOCKFISH = config.STOCKFISH
var prefix = config.PREFIX
var botColor = config.BOT_COLOR
var imageGenerator

colorsEnum = new Enum({
    1: "#D6D6D6",
    2: "#6B6B6B",
    3: "#072CBE",
    4: "#FAF798",
    5: "#A60B0B",
    6: "#7C31C7",
    7: "#C69CF1",
    8: "#BCF5BD",
    9: "#229121",
    10: "#F69FF8",
    11: "#DC13C8",
    12: "#F1A430",
    13: "#B9581C",
    14: "#EA4747"
})
function convertUCItoSAN(move, chess) {
    square = move.substr(0, 2)
    square2 = move.substr(2, 2)
    chessSquare = chess.get(square)
    chessSquare2 = chess.get(square2)
    if (chessSquare == null && chessSquare2 == null) {
        move = square2
    } else if (chessSquare != null && chessSquare2 == null) {
        if (chessSquare.type == 'p') {
            move = square2
        } else if (chessSquare.type == 'r' || chessSquare.type == 'R') {
            move = 'R' + square2
        } else if (chessSquare.type == 'b' || chessSquare.type == 'B') {
            move = 'B' + square2
        } else if (chessSquare.type == 'n' || chessSquare.type == 'N') {
            move = 'N' + square2
        } else if (chessSquare.type == 'q' || chessSquare.type == 'Q') {
            move = 'Q' + square2
        } else if (chessSquare.type == 'k' || chessSquare.type == 'K') {
            move = 'K' + square2
        }
    } else if (chessSquare == null && chessSquare2 != null) {
        move = square.charAt(0) + 'x' + square2
    } else if (chessSquare != null && chessSquare2 != null) {
        if (chessSquare.type == 'p') {
            move = square.charAt(0) + 'x' + square2
        } else if (chessSquare.type == 'r' || chessSquare.type == 'R') {
            move = 'R' + 'x' + square2
        } else if (chessSquare.type == 'b' || chessSquare.type == 'B') {
            move = 'B' + 'x' + square2
        } else if (chessSquare.type == 'n' || chessSquare.type == 'N') {
            move = 'N' + 'x' + square2
        } else if (chessSquare.type == 'q' || chessSquare.type == 'Q') {
            move = 'Q' + 'x' + square2
        } else if (chessSquare.type == 'k' || chessSquare.type == 'K') {
            move = 'K' + 'x' + square2
        }
    }
    return move
}
async function generatePNG() {
    await imageGenerator.generatePNG(RESOURCES_URL + 'default.png')
}
function setBoardDefault() {
    imageGenerator.size = 1200
    imageGenerator.light = colorsEnum.get('1').value
    imageGenerator.dark = colorsEnum.get('2').value
    imageGenerator.style = 'alpha'
}

client.login();
client.on('ready', function (evt) {
    console.log('ready');
    chessAPI = new ChessWebAPI();
    imageGenerator = new ChessImageGenerator({
        size: 1200,
        light: colorsEnum.get('1').value,
        dark: colorsEnum.get('2').value,
        style: 'alpha'   // alpha (default), cburnett, cheq, leipzig, merida, 
    });
});

client.on('message', message => {
    if (message.content.startsWith(prefix + "prefix") || message.content.startsWith("!prefix")) {
        args = message.content.split(" ")
        newPrefix = args[1]
        prefix = newPrefix
        const embedPrefix = new Discord.MessageEmbed()
            .setColor(botColor)
            .setTitle('Bot Lichess')
            .setURL("")
            .addFields(
                { name: '\u2800', value: "Prefix changed to `" + prefix + "`" }
            )
        message.channel.send(embedPrefix)
    }
    else if (message.content.startsWith(prefix + 'chess')) {
        args = message.content.split(" ")
        username = args[1]
        chessAPI.getPlayerStats(username)
            .then(function (response) {
                response.body.chess_rapid.last.date = new Date(response.body.chess_rapid.last.date * 1000).toGMTString()
                response.body.chess_rapid.best.date = new Date(response.body.chess_rapid.best.date * 1000).toGMTString()
                response.body.chess_bullet.last.date = new Date(response.body.chess_bullet.last.date * 1000).toGMTString()
                response.body.chess_bullet.best.date = new Date(response.body.chess_bullet.best.date * 1000).toGMTString()
                response.body.chess_blitz.last.date = new Date(response.body.chess_blitz.last.date * 1000).toGMTString()
                response.body.chess_blitz.best.date = new Date(response.body.chess_blitz.best.date * 1000).toGMTString()

                rapid_last_rating = response.body.chess_rapid.last.rating
                rapid_last_date = response.body.chess_rapid.last.date
                rapid_best_rating = response.body.chess_rapid.best.rating
                rapid_best_date = response.body.chess_rapid.best.date
                bullet_last_rating = response.body.chess_bullet.last.rating
                bullet_last_date = response.body.chess_bullet.last.date
                bullet_best_rating = response.body.chess_bullet.best.rating
                bullet_best_date = response.body.chess_bullet.best.date
                blitz_last_rating = response.body.chess_blitz.last.rating
                blitz_last_date = response.body.chess_blitz.last.date
                blitz_best_rating = response.body.chess_blitz.best.rating
                blitz_best_date = response.body.chess_blitz.best.date

                message.channel.send('**' + username + ' stats:**\n**Rapid**:\ncurrent rating: **' + rapid_last_rating + '**\t\tdate: **' + rapid_last_date
                    + "**\nbest rating: **" + rapid_best_rating + '**\t\tdate: **' + rapid_best_date + "**\t\tgame: <" + response.body.chess_rapid.best.game +
                    '>\n**Bullet**:\ncurrent rating: **' + bullet_last_rating + '**\t\tdate: **' + bullet_last_date
                    + "\n**best rating: **" + bullet_best_rating + '**\t\tdate: **' + bullet_best_date + "**\t\tgame: <" + response.body.chess_bullet.best.game +
                    '>\n**Blitz**:\ncurrent rating: **' + blitz_last_rating + '**\t\tdate: **' + blitz_last_date
                    + "\n**best rating: **" + blitz_best_rating + '**\t\tdate: **' + blitz_best_date + "**\t\tgame: <" + response.body.chess_blitz.best.game +
                    ">\n**Puzzle Rush**:\nscore: **" + response.body.puzzle_rush.best.score + "**\t\ttotal attemts: **" + response.body.puzzle_rush.best.total_attempts +
                    "**\n**FIDE**: **" + response.body.fide + "**");

            }, function (err) {
                console.error(err);
                message.channel.send(err.message);
            });
    } else if (message.content.startsWith(prefix + 'lichess ')) {
        String.prototype.minsToHHMMSS = function () {
            var minsNum = parseFloat(this / 60, 10);
            var days = Math.floor(minsNum / (60 * 24));
            var hours = Math.floor((minsNum / 60) % 24)
            var minutes = Math.floor(minsNum % 60)

            if (days < 10) { days = "0" + days; }
            if (hours < 10) { hours = "0" + hours; }
            if (minutes < 10) { minutes = "0" + minutes; }

            return days < 1 ? hours + 'h ' + minutes + 'm ' : days + 'd ' + hours + 'h ' + minutes + 'm '
        }
        args = message.content.split(" ")
        username = args[1]
        lichess.user(username, function (err, user) {
            user = JSON.parse(user)
            playTime = user.playTime.total.toString().minsToHHMMSS()
            tvTime = user.playTime.tv.toString().minsToHHMMSS()
            message.channel.send('**' + username + ' stats:**\n**Rapid**:\ncurrent rating: **' + user.perfs.rapid.rating + '**\t\tgames played: **' + user.perfs.rapid.games + '**\n' +
                '**Ultra Bullet**:\ncurrent rating: **' + user.perfs.ultraBullet.rating + '**\t\tgames played: **' + user.perfs.ultraBullet.games + '**\n' +
                '**Bullet**:\ncurrent rating: **' + user.perfs.bullet.rating + '**\t\tgames played: **' + user.perfs.bullet.games + '**\n' +
                '**Blitz**:\ncurrent rating: **' + user.perfs.blitz.rating + '**\t\tgames played: **' + user.perfs.blitz.games + '**\n' +
                '**Classical**:\ncurrent rating: **' + user.perfs.classical.rating + '**\t\tgames played: **' + user.perfs.classical.games + '**\n' +
                '**Correspondence**:\ncurrent rating: **' + user.perfs.correspondence.rating + '**\t\tgames played: **' + user.perfs.correspondence.games + '**\n' +
                '**Puzzle**:\ncurrent rating: **' + user.perfs.puzzle.rating + '**\t\t puzzles solved: **' + user.perfs.puzzle.games + '**\n' +
                '**All games played: ' + user.count.all + '\t\twin: ' + user.count.win + '\t\tloss: ' + user.count.loss + '\t\ttime played: ' + playTime + '\t\ttime on lichess tv: ' + tvTime + '**'
            )
            //message.channel.send('**'+username+' stats:**\n')
        });
    } else if (message.content.startsWith(prefix + 'lichessGames')) {

        args = message.content.split(" ")
        username = args[1]
        lichess.user.games(username, function (err, games) {
            console.log(games);
            // message.channel.send(games);
        });
    } else if (message.content.startsWith(prefix + 'lichessGame ')) {
        const chess = new Chess()
        args = message.content.split(" ")
        gameId = args[1]
        lichess.game(gameId, { with_analysis: 1, with_moves: 1, with_opening: 1, with_fens: 1 }, function (err, game) {
            if (err) throw err
            //console.log(game);
            if (game != "") {

                gameJson = JSON.parse(game)
                moves = gameJson.moves.split(" ")

                for (var i = 0; i < moves.length; i++) {
                    chess.move(moves[i]);
                }
                imageGenerator.loadFEN(chess.fen())
                imageGenerator.generatePNG(RESOURCES_URL + gameId + '.png')
                const engine = new Engine(STOCKFISH)
                engine
                    .chain()
                    .init()
                    .setoption('MultiPV', 3)
                    .position(chess.fen())
                    .go({ depth: 15 })
                    .then(result => {
                        openingName = "??"
                        if (gameJson.opening != undefined) {
                            openingName = gameJson.opening.name
                        }
                        //console.log(result)
                        bestMove = convertUCItoSAN(result.bestmove, chess)
                        const embedPNG = new Discord.MessageEmbed()
                            .setColor(botColor)
                            .setTitle('Chess')
                            .setURL('https://lichess.org/' + gameId)
                            .addFields(
                                { name: 'Opening:', value: openingName },
                                //{ name: '\u200B', value: '\u200B' },      // <br>
                                { name: 'Moves', value: gameJson.moves },
                                { name: 'Best move', value: bestMove },
                            )
                            .setTimestamp()
                            .attachFiles(RESOURCES_URL + gameId + '.png')
                            .setImage("attachment://" + gameId + ".png")
                        message.channel.send(embedPNG)
                    })

            }
        });
    } else if (message.content.startsWith(prefix + 'puzzle')) {
        const embedPuzzle = new Discord.MessageEmbed()
            .setColor(botColor)
            .setTitle('puzzleid')
            .setURL("https://lichess.org/training/" + puzzleId)
            .addFields(
                { name: '\u200B', value: "**Available commands:**" },
                { name: '\u200B', value: "**" + prefix + "prefix** *<newPrefix>* - changes prefix\n" },
                { name: '\u200B', value: "**" + prefix + "lichess** *<username>* - stats of *username* on <https://lichess.org>" },
                { name: '\u200B', value: "**" + prefix + "chess** *<username>* - stats of *username* on <https://chess.com>" },
                { name: '\u200B', value: "**" + prefix + "lichessGame** *<id>* - returns info about game (opening, best move, etc..)" },
                { name: '\u200B', value: "**" + prefix + "help** - list of available commands" },
            )
        message.channel.send(embedHelp);
    } else if (message.content == (prefix + 'board')) {
        const embedBoard = new Discord.MessageEmbed()
            .setColor(botColor)
            .setTitle('Board settings')
            .setURL(inviteLink)
            .addFields(
                { name: '\u200B', value: "**Available board commands:**" },
                { name: '\u200B', value: "**" + prefix + "bShow** - show current board settings" },
                { name: '\u200B', value: "**" + prefix + "bStyle** *<newStyle>* - style of pieces on board, f.e merida" },
                { name: '\u200B', value: "**" + prefix + "bLight** *<newColorOfLightSquares>* - color of light squares, f.e rgb(255,255,255) or #ffffff" },
                { name: '\u200B', value: "**" + prefix + "bDark** *<newColorOfDarkSquares>* - color of dark squares, f.e rgb(0,0,0) or #000000" },
                { name: '\u200B', value: "**" + prefix + "bDefault** - restores default settings" },
                { name: '\u200B', value: "**" + prefix + "help** - list of available commands" },
            )
        message.channel.send(embedBoard);
    } else if (message.content.startsWith(prefix + 'b')) {
        const chess = new Chess()
        imageGenerator.loadFEN(chess.fen())
        args = message.content.split(" ");
        command = args[0]
        switch (command) {
            case prefix + "bStyle": {
                if (args.length > 1) {
                    newStyleNum = args[1]
                    if (newStyleNum == "1" || newStyleNum == "alpha") newStyle = "alpha"
                    else if (newStyleNum == "2" || newStyleNum == "cburnett") newStyle = "cburnett"
                    else if (newStyleNum == "3" || newStyleNum == "cheq") newStyle = "cheq"
                    else if (newStyleNum == "4" || newStyleNum == "leipzig") newStyle = "leipzig"
                    else if (newStyleNum == "5" || newStyleNum == "merida") newStyle = "merida"

                    imageGenerator.style = newStyle
                    imageGenerator.generatePNG(RESOURCES_URL + 'current.png')
                    setTimeout(() => {
                        const embedBoard = new Discord.MessageEmbed()
                            .setColor(botColor)
                            .setTitle('Board settings')
                            .setURL(inviteLink)
                            .addFields(
                                { name: '\u200B', value: "Pieces style changed to: **" + imageGenerator.style + "**" }
                            )
                            .attachFiles(RESOURCES_URL + 'current.png')
                            .setImage("attachment://current.png")

                        message.channel.send(embedBoard);
                    }, 200)
                } else {
                    const embedBoard = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle('Board settings')
                        .setURL(inviteLink)
                        .addFields(
                            { name: '\u200B', value: "**Current style:** " + imageGenerator.style }
                        )
                        .attachFiles(RESOURCES_URL + 'styles.png')
                        .setImage("attachment://styles.png")

                    message.channel.send(embedBoard);
                }


                break
            }
            case prefix + "bShow": {
                imageGenerator.generatePNG(RESOURCES_URL + 'current.png')
                for(let i=1; i<=14; i++){
                    if(colorsEnum.get(''+i).value == imageGenerator.light){
                        lightColorNum = colorsEnum.get(''+i).key
                    }
                }
                for(let i=1; i<=14; i++){
                    if(colorsEnum.get(''+i).value == imageGenerator.dark){
                        darkColorNum = colorsEnum.get(''+i).key
                    }
                }
                setTimeout(() => {
                    const embedBoard = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle('Board settings')
                        .setURL(inviteLink)
                        .addFields(
                            { name: '\u200B', value: "**Current board settings:**" },
                            { name: '\u200B', value: "**Light squares color:** " + lightColorNum + " (" + imageGenerator.light +")"},
                            { name: '\u200B', value: "**Dark squares color:** " + darkColorNum+ " (" + imageGenerator.dark +")"},
                            { name: '\u200B', value: "**Pieces style:** " + imageGenerator.style}
                        )
                        .attachFiles(RESOURCES_URL + 'current.png')
                        .setImage("attachment://current.png")

                    message.channel.send(embedBoard);
                }, 200)
                break
            }
            case prefix + "bLight": {
                if (args.length > 1) {
                    newColorNum = args[1]
                    imageGenerator.light = colorsEnum.get(''+newColorNum).value
                    imageGenerator.generatePNG(RESOURCES_URL + 'current.png')
                    setTimeout(() => {
                        const embedBoard = new Discord.MessageEmbed()
                            .setColor(botColor)
                            .setTitle('Board settings')
                            .setURL(inviteLink)
                            .addFields(
                                { name: '\u200B', value: "**Color of light squares changed to: **" + newColorNum + " (" + imageGenerator.light + ")" }
                            )
                            .attachFiles(RESOURCES_URL + 'current.png')
                            .setImage("attachment://current.png")

                        message.channel.send(embedBoard);
                    }, 200)
                } else {
                    for(let i=1; i<=14; i++){
                        if(colorsEnum.get(''+i).value == imageGenerator.light){
                            colorNum = colorsEnum.get(''+i).key
                        }
                    }
                    const embedBoard = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle('Board settings')
                        .setURL(inviteLink)
                        .addFields(
                            { name: '\u200B', value: "**Current light squares color:** " + colorNum }
                        )
                        .attachFiles(RESOURCES_URL + 'colors.png')
                        .setImage("attachment://colors.png")

                    message.channel.send(embedBoard);
                }
                break
            }
            case prefix + "bDark": {
                if (args.length > 1) {
                    newColorNum = args[1]
                    imageGenerator.dark = colorsEnum.get(newColorNum).value
                    imageGenerator.generatePNG(RESOURCES_URL + 'current.png')
                    setTimeout(() => {
                        const embedBoard = new Discord.MessageEmbed()
                            .setColor(botColor)
                            .setTitle('Board settings')
                            .setURL(inviteLink)
                            .addFields(
                                { name: '\u200B', value: "**Color of dark squares changed to:** " + newColorNum + " (" + imageGenerator.dark + ")" }
                            )
                            .attachFiles(RESOURCES_URL + 'current.png')
                            .setImage("attachment://current.png")

                        message.channel.send(embedBoard);
                    }, 200)
                } else {
                    for(let i=1; i<=14; i++){
                        if(colorsEnum.get(''+i).value == imageGenerator.dark){
                            colorNum = colorsEnum.get(''+i).key
                        }
                    }
                    const embedBoard = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle('Board settings')
                        .setURL(inviteLink)
                        .addFields(
                            { name: '\u200B', value: "**Current dark squares color:** " + colorNum }
                        )
                        .attachFiles(RESOURCES_URL + 'colors.png')
                        .setImage("attachment://colors.png")

                    message.channel.send(embedBoard);
                }
                break
            }
            case prefix + "bDefault": {
                setBoardDefault()
                generatePNG()
                setTimeout(() => {
                    const embedBoard = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle('Board settings')
                        .setURL(inviteLink)
                        .addFields(
                            { name: '\u200B', value: "**Board settings set to *default* **" }
                        )
                        .attachFiles(RESOURCES_URL + 'default.png')
                        .setImage("attachment://default.png")

                    message.channel.send(embedBoard);
                }, 200)

                break
            }
        }
    } else if (message.content.startsWith(prefix + 'help')) {
        const embedHelp = new Discord.MessageEmbed()
            .setColor(botColor)
            .setTitle('BOT Lichess')
            .setURL(inviteLink)
            .addFields(
                { name: '\u200B', value: "**Available commands:**" },
                { name: '\u200B', value: "**" + prefix + "prefix** *<newPrefix>* - changes prefix\n" },
                { name: '\u200B', value: "**" + prefix + "lichess** *<username>* - stats of *username* on <https://lichess.org>" },
                { name: '\u200B', value: "**" + prefix + "chess** *<username>* - stats of *username* on <https://chess.com>" },
                { name: '\u200B', value: "**" + prefix + "lichessGame** *<id>* - returns info about game (opening, best move, etc..)" },
                { name: '\u200B', value: "**" + prefix + "board** - list of board settings commands" },
                { name: '\u200B', value: "**" + prefix + "help** - list of available commands" },
            )
        message.channel.send(embedHelp);
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
});
server.listen(3000);