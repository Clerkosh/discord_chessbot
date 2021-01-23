class Puzzle {
    constructor(entry) {
        this.id = entry[0];
        this.fen = entry[1];
        this.movesArr = entry[2];
        this.rating = entry[3];
        this.ratingDeviation = entry[4];
        this.popularity = entry[5];
        this.nbPlays = entry[6];
        this.themes = entry[7];
        this.gameUrl = entry[8];
    }
}
module.exports = Puzzle