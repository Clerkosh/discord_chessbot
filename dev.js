//Discord BOT for Lichess -> invite link: https://discord.com/api/oauth2/authorize?client_id=796884770814165002&permissions=0&scope=bot
/*TODO:
- =answer MOVE IN FORMAT Nxe5 for example
- zacząć grę blindfolded i dodać komendę showboard
- grać na innych lub bota i wybierać poziom
- dodać możliwość zmiany koloru kratek na dowolny? oprócz tych dodanych w enumie
- naprawić funkcje convertUCItoSAN, bo jak 2 skoczki mogą wykonać ten sam ruch to funkcja nie precyzuje którym skoczkiem ruszyć(chess.move zwraca property .san może coś z tym)
*/
const fs = require('fs')
const Enum = require('enum')
const config = require("./config_dev.json")
const Discord = require('discord.js');
const ChessWebAPI = require('chess-web-api');
const lichess = require('lichess-api');
const { Chess } = require('./chess.js')
const chess = new Chess()
const Engine = require('node-uci').Engine;
var ChessImageGenerator = require('chess-image-generator');
const Puzzle = require('./puzzle.js')
const client = new Discord.Client();
const inviteLink = config.INVITE_LINK
var botColor = config.BOT_COLOR
const CLIENT_TOKEN = config.CLIENT_TOKEN
var prefix = config.PREFIX
const BASE_URL = config.BASE_URL
const RESOURCES_URL = config.RESOURCES_URL
const STOCKFISH = config.STOCKFISH
var imageGenerator
var puzzles = [];
var isPuzzleActive = false;
var startIndex = 1;
var puzzle = null;

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
    14: "#EA4747",
    "red": "#ff0000",
    "blue": "#0099ff",
    "green": "#00ff00",
    "orange": "#ff9900"
})
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
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
function generatePuzzle(message) {
    chess.reset()
    puzzle = puzzles[getRandomInt(0, puzzles.length - 1)]
    chess.load(puzzle.fen)
    puzzleMoves = puzzle.movesArr.split(" ")
    chess.move(puzzleMoves[0], { sloppy: true }) // first move is computer move
    embedMessage = ""
    if (chess.turn() == 'w') {
        embedMessage = "Find a move for white! (puzzle id: " + puzzle.id + ")"
    } else {
        embedMessage = "Find a move for black! (puzzle id: " + puzzle.id + ")"
    }
    imageGenerator.loadFEN(chess.fen())
    imageGenerator.generatePNG(RESOURCES_URL + 'puzzle-' + puzzle.id + '.png')
    setTimeout(() => {
        const embedPuzzle = new Discord.MessageEmbed()
            .setColor(botColor)
            .setTitle(embedMessage)
            .setURL("https://lichess.org/training/" + puzzle.id)
            .addFields(
                { name: '\u200B', value: "Rating: **" + puzzle.rating + "**", inline: true },
                { name: '\u200B', value: "Themes: ||" + puzzle.themes + "||", inline: true },
                { name: '\u200B', value: "Game played: <" + puzzle.gameUrl + ">" },
                { name: '\u200B', value: "Answer puzzle using: `" + prefix + "answer` or get best move using: `" + prefix + "bestMove`" },
                { name: '\u200B', value: "Generate new puzzle using: `" + prefix + "newPuzzle`" }
            )
            .attachFiles(RESOURCES_URL + 'puzzle-' + puzzle.id + '.png')
            .setImage("attachment://puzzle-" + puzzle.id + ".png")

        message.channel.send(embedPuzzle);
    }, 200)
    isPuzzleActive = true
}
client.login("Nzk2ODg0NzcwODE0MTY1MDAy.X_eaxg.C3HaxE03TQvEyalgkiPis4u4cmk");
client.on('ready', function (evt) {
    console.log('ready');
    chessAPI = new ChessWebAPI();
    imageGenerator = new ChessImageGenerator({
        size: 1200,
        light: colorsEnum.get('1').value,
        dark: colorsEnum.get('2').value,
        style: 'alpha'   // alpha (default), cburnett, cheq, leipzig, merida, 
    });
    var contents = fs.readFileSync(RESOURCES_URL + 'puzzles.csv', 'utf-8', function (err, data) {
        if (err) return console.log(err)
    });
    var allTextLines = contents.split(/\r\n|\n/);

    for (let i = 0; i < allTextLines.length; i++) {
        var entry = allTextLines[i].split(',');
        puzzle = new Puzzle(entry)
        puzzles.push(puzzle)
    }
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
    } else if (message.content.startsWith(prefix + 'chess')) {
        args = message.content.split(" ")
        username = args[1]
        avatar = ''
        title = ''
        rapid_last_rating = "0"
        rapid_best_rating = "0"
        bullet_last_rating = "0"
        bullet_best_rating = "0"
        blitz_last_rating = "0"
        blitz_best_rating = "0"
        daily_last_rating = "0"
        daily_best_rating = "0"
        puzzle_best = "0"
        puzzle_total = "0"

        chessAPI.getPlayer(username)
            .then(function (response) {
                if (response.body.hasOwnProperty('avatar')) {
                    avatar = response.body.avatar
                } else avatar = 'https://betacssjs.chesscomfiles.com/bundles/web/images/noavatar_l.84a92436.gif'
                if (response.body.hasOwnProperty('title'))
                    title = response.body.title
            })
        setTimeout(() => {
            chessAPI.getPlayerStats(username)
                .then(function (response) {

                    if (response.body.hasOwnProperty('chess_rapid')) {
                        if (response.body.chess_rapid.hasOwnProperty('last'))
                            rapid_last_rating = response.body.chess_rapid.last.rating
                        if (response.body.chess_rapid.hasOwnProperty('best'))
                            rapid_best_rating = response.body.chess_rapid.best.rating
                    }
                    if (response.body.hasOwnProperty('chess_bullet')) {
                        if (response.body.chess_bullet.hasOwnProperty('last'))
                            bullet_last_rating = response.body.chess_bullet.last.rating
                        if (response.body.chess_bullet.hasOwnProperty('best'))
                            bullet_best_rating = response.body.chess_bullet.best.rating
                    }
                    if (response.body.hasOwnProperty('chess_blitz')) {
                        if (response.body.chess_blitz.hasOwnProperty('last'))
                            blitz_last_rating = response.body.chess_blitz.last.rating
                        if (response.body.chess_blitz.hasOwnProperty('best'))
                            blitz_best_rating = response.body.chess_blitz.best.rating
                    }
                    if (response.body.hasOwnProperty('chess_daily')) {
                        if (response.body.chess_daily.hasOwnProperty('last'))
                            daily_last_rating = response.body.chess_daily.last.rating
                        if (response.body.chess_daily.hasOwnProperty('best'))
                            daily_best_rating = response.body.chess_daily.best.rating
                    }
                    if (response.body.hasOwnProperty('puzzle_rush')) {
                        if (response.body.puzzle_rush.hasOwnProperty('best')) {
                            puzzle_best = response.body.puzzle_rush.best.score
                            puzzle_total = response.body.puzzle_rush.best.total_attempts
                        }
                    }
                    const embedPNG = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle(title + ' ' + username + ' stats')
                        .setThumbnail(avatar)
                        .setURL('https://chess.com/member/' + username)
                        .addFields(
                            { name: '**Rapid**', value: 'current: **' + rapid_last_rating + '**\nbest: **' + rapid_best_rating + '**', inline: true },
                            { name: '**Bullet**', value: 'current: **' + bullet_last_rating + '**\nbest: **' + bullet_best_rating + '**', inline: true },
                            { name: '**Blitz**', value: 'current: **' + blitz_last_rating + '**\nbest: **' + blitz_best_rating + '**', inline: true },
                            { name: '\u2800', value: '\u2800' },
                            { name: '**Daily**', value: 'current: **' + daily_last_rating + '**\nbest: **' + daily_best_rating + '**', inline: true },
                            { name: '**Puzzle Rush**', value: 'best: **' + puzzle_best + '**', inline: true },
                            { name: '**FIDE**', value: '**' + response.body.fide + '**', inline: true }
                        )
                    message.channel.send(embedPNG)
                }, 800)
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
            const embedPNG = new Discord.MessageEmbed()
                .setColor(botColor)
                .setTitle(username + ' stats')
                .setThumbnail('https://images.prismic.io/lichess/5cfd2630-2a8f-4fa9-8f78-04c2d9f0e5fe_lichess-box-1024.png?auto=compress')
                .setURL('https://lichess.org/@/' + username)
                .addFields(
                    { name: "**Rapid**", value: user.perfs.rapid.rating, inline: true },
                    { name: "**Ultra Bullet**", value: user.perfs.ultraBullet.rating, inline: true },
                    { name: "**Bullet**", value: user.perfs.bullet.rating, inline: true },
                    { name: "**Blitz**", value: user.perfs.blitz.rating, inline: true },
                    { name: "**Classical**", value: user.perfs.classical.rating, inline: true },
                    { name: "**Correspondence**", value: user.perfs.correspondence.rating, inline: true },
                    { name: "**Puzzle**", value: user.perfs.puzzle.rating, inline: true },
                    { name: "**All games**", value: user.count.all + " (win: " + user.count.win + ", loss: " + user.count.loss + ")", inline: true },
                    { name: "**Time played**", value: playTime, inline: true }
                )

            message.channel.send(embedPNG)
        });
    } else if (message.content.startsWith(prefix + 'lichessGames')) {

        args = message.content.split(" ")
        username = args[1]
        lichess.user.games(username, function (err, games) {
            console.log(games);
            // message.channel.send(games);
        });
    } else if (message.content.startsWith(prefix + 'newPuzzle')) {
        generatePuzzle(message)
        isPuzzleActive = true
    } else if (message.content.startsWith(prefix + 'answer')) {
        if (isPuzzleActive) {
            args = message.content.split(" ")
            move = args[1]
            puzzleMoves = puzzle.movesArr.split(" ")

            if (puzzleMoves[startIndex].includes(move)) {

                chess.move(puzzleMoves[startIndex], { sloppy: true })
                if (startIndex < puzzleMoves.length - 1) {
                    startIndex++
                    chess.move(puzzleMoves[startIndex], { sloppy: true })
                    imageGenerator.loadFEN(chess.fen())
                    imageGenerator.generatePNG(RESOURCES_URL + 'puzzle-' + puzzle.id + '.png')
                    setTimeout(() => {
                        const embedPuzzle = new Discord.MessageEmbed()
                            .setColor(botColor)
                            .setTitle("Correct!")
                            .setURL(puzzle.gameUrl)
                            .addFields(

                                { name: '\u200B', value: "Opponent moved `" + puzzleMoves[startIndex] + "`" },
                                { name: '\u200B', value: "What's your next move? Answer with: `" + prefix + "answer`" }
                            )
                            .attachFiles(RESOURCES_URL + 'puzzle-' + puzzle.id + '.png')
                            .setImage("attachment://puzzle-" + puzzle.id + ".png")
                        message.channel.send(embedPuzzle);
                        startIndex++
                    }, 200)
                } else {
                    isPuzzleActive = false
                    const embedPuzzle = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle("You solved the puzzle! Congratz!")
                        .setURL(puzzle.gameUrl)
                        .addFields(
                            { name: '\u200B', value: "Generate new puzzle using: `" + prefix + "puzzle`" }
                        )
                    message.channel.send(embedPuzzle);
                }
            } else {
                const embedPuzzle = new Discord.MessageEmbed()
                    .setColor(botColor)
                    .setTitle("Wrong answer!")
                    .setURL(puzzle.gameUrl)
                    .addFields(
                        { name: '\u200B', value: "Try again using: `" + prefix + "answer` or get best move using: `" + prefix + "bestMove`" },
                        { name: '\u200B', value: "Generate new puzzle using: `" + prefix + "newPuzzle`" }
                    )
                message.channel.send(embedPuzzle);
            }
        } else {
            const embedPuzzle = new Discord.MessageEmbed()
                .setColor(botColor)
                .setTitle("No puzzles are active!")
                .setURL(inviteLink)
                .addFields(
                    { name: '\u200B', value: "Generate new puzzle using: `" + prefix + "puzzle`" }
                )
            message.channel.send(embedPuzzle);
        }
    } else if (message.content.startsWith(prefix + 'lichessGame ')) {
        chess.reset()
        args = message.content.split(" ")
        gameId = args[1]
        lichess.game(gameId, { with_analysis: 1, with_moves: 1, with_opening: 1, with_fens: 1 }, function (err, game) {
            if (err) throw err
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
        if (!isPuzzleActive) {
            generatePuzzle(message)
        } else { // puzzle is already active
            embedMessage = ""
            if (chess.turn() == 'w') {
                embedMessage = "Find a move for white! (puzzle id: " + puzzle.id + ")"
            } else {
                embedMessage = "Find a move for black! (puzzle id: " + puzzle.id + ")"
            }
            
            const embedPuzzle = new Discord.MessageEmbed()
                .setColor(botColor)
                .setTitle(embedMessage)
                .setURL(puzzle.gameUrl)
                .addFields(
                    { name: '\u200B', value: "Rating: **" + puzzle.rating + "**", inline: true },
                    { name: '\u200B', value: "Themes: **" + puzzle.themes + "**", inline: true },
                    { name: '\u200B', value: "Answer puzzle using: `" + prefix + "answer` or get best move using: `" + prefix + "bestMove`" },
                    { name: '\u200B', value: "Generate new puzzle using: `" + prefix + "newPuzzle`" }
                )
                .attachFiles(RESOURCES_URL + 'puzzle-' + puzzle.id + '.png')
                .setImage("attachment://puzzle-" + puzzle.id + ".png")
            message.channel.send(embedPuzzle);
        }

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
    } else if (message.content.startsWith(prefix + 'bestMove')) {
        if (isPuzzleActive) {
            moves = puzzle.movesArr.split(" ")
            bestmove = ""
            for (var i = startIndex; i < moves.length; i++) {
                bestmove += moves[i] + " "
            }
            const embedPuzzle = new Discord.MessageEmbed()
                .setColor(botColor)
                .setTitle("Best move")
                .setURL(puzzle.gameUrl)
                .addFields(
                    { name: '\u200B', value: "Best move: ||" + bestmove + "||. Don't tell others!" }
                )
            message.channel.send(embedPuzzle);
        } else {
            const embedPuzzle = new Discord.MessageEmbed()
                .setColor(botColor)
                .setTitle("No puzzles are active!")
                .setURL(inviteLink)
                .addFields(
                    { name: '\u200B', value: "Generate new puzzle using: `" + prefix + "puzzle`" }
                )
            message.channel.send(embedPuzzle);
        }
    } else if (message.content.startsWith(prefix + 'b')) {
        var fen = chess.fen()
        chess.reset()
        imageGenerator.loadFEN(chess.fen())
        args = message.content.split(" ");
        command = args[0]
        switch (command) {
            case prefix + "botColor": {
                if (args.length > 1) {
                    botColorNum = args[1]
                    for (let color in colorsEnum) {
                        if (color == botColorNum) {
                            botColor = colorsEnum[color].value
                        }
                    }
                    setTimeout(() => {
                        const embedBoard = new Discord.MessageEmbed()
                            .setColor(botColor)
                            .setTitle('Board settings')
                            .setURL(inviteLink)
                            .addFields(
                                { name: '\u200B', value: "Bot color changed to: **" + botColor + "**" }
                            )
                        message.channel.send(embedBoard);
                    }, 200)
                } else {

                }
                break
            }
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
                for (let color in colorsEnum) {
                    if (colorsEnum[color].value == imageGenerator.light) {
                        lightColorNum = color
                    }
                }
                for (let color in colorsEnum) {
                    if (colorsEnum[color].value == imageGenerator.dark) {
                        darkColorNum = color
                    }
                }
                setTimeout(() => {
                    const embedBoard = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle('Board settings')
                        .setURL(inviteLink)
                        .addFields(
                            { name: '\u200B', value: "**Current board settings:**" },
                            { name: '\u200B', value: "**Light squares color:** " + lightColorNum + " (" + imageGenerator.light + ")" },
                            { name: '\u200B', value: "**Dark squares color:** " + darkColorNum + " (" + imageGenerator.dark + ")" },
                            { name: '\u200B', value: "**Pieces style:** " + imageGenerator.style }
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
                    imageGenerator.light = colorsEnum.get('' + newColorNum).value
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
                    for (let color in colorsEnum) {
                        if (colorsEnum[color].value == imageGenerator.light) {
                            lightColorNum = color
                        }
                    }
                    const embedBoard = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle('Board settings')
                        .setURL(inviteLink)
                        .addFields(
                            { name: '\u200B', value: "**Current light squares color:** " + lightColorNum }
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
                    for (let color in colorsEnum) {
                        if (colorsEnum[color].value == imageGenerator.dark) {
                            darkColorNum = color
                        }
                    }
                    const embedBoard = new Discord.MessageEmbed()
                        .setColor(botColor)
                        .setTitle('Board settings')
                        .setURL(inviteLink)
                        .addFields(
                            { name: '\u200B', value: "**Current dark squares color:** " + darkColorNum }
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
        chess.load(fen)
    } else if (message.content.startsWith(prefix + 'helpPuzzle')) {
        const embedHelp = new Discord.MessageEmbed()
            .setColor(botColor)
            .setTitle('BOT Lichess')
            .setURL(inviteLink)
            .addFields(
                { name: '\u200B', value: "**Available puzzle commands:**" },
                { name: '\u200B', value: "**" + prefix + "puzzle** *<puzzleID>* - generates random puzzle or puzzle with given ID" },
                { name: '\u200B', value: "**" + prefix + "answer** *<move>* - gives answer to active puzzle" },
                { name: '\u200B', value: "**" + prefix + "bestMove** - gives whole solution to a puzzle" },
                { name: '\u200B', value: "**" + prefix + "newPuzzle** - generates new random puzzle" },
                { name: '\u200B', value: "**" + prefix + "helpPuzzle** - list of board settings commands" },
                { name: '\u200B', value: "**" + prefix + "help** - list of available commands" }
            )
        message.channel.send(embedHelp);
    } else if (message.content.startsWith(prefix + 'help')) {
        const embedHelp = new Discord.MessageEmbed()
            .setColor(botColor)
            .setTitle('BOT Lichess')
            .setURL(inviteLink)
            .addFields(
                { name: '\u200B', value: "**Available commands:**" },
                { name: '\u200B', value: "**" + prefix + "prefix** *<newPrefix>* - changes prefix" },
                { name: '\u200B', value: "**" + prefix + "botColor** *<newColor>* - changes bot color (1-14 or red, green, blue, orange)" },
                { name: '\u200B', value: "**" + prefix + "lichess** *<username>* - stats of *username* on <https://lichess.org>" },
                { name: '\u200B', value: "**" + prefix + "chess** *<username>* - stats of *username* on <https://chess.com>" },
                { name: '\u200B', value: "**" + prefix + "lichessGame** *<id>* - returns info about game (opening, best move, etc..)" },
                { name: '\u200B', value: "**" + prefix + "board** - list of board settings commands" },
                { name: '\u200B', value: "**" + prefix + "helpPuzzle** - list of board settings commands" },
                { name: '\u200B', value: "**" + prefix + "help** - list of available commands" }
            )
        message.channel.send(embedHelp);
    }
});