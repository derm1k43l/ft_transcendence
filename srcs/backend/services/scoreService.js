const Database = require('better-sqlite3');
const db = new Database('./db/pong.db');

// Create table if it doesn't exist
db.prepare(`
	CREATE TABLE IF NOT EXISTS scores (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		player TEXT NOT NULL,
		score INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
`).run();

function addScore(player, score) {
	const stmt = db.prepare('INSERT INTO scores (player, score) VALUES (?, ?)');
	stmt.run(player, score);
}

function getTopScores(limit = 10) {
	const stmt = db.prepare('SELECT player, score, created_at FROM scores ORDER BY score DESC LIMIT ?');
	return stmt.all(limit);
}

module.exports = {
	addScore,
	getTopScores
};
