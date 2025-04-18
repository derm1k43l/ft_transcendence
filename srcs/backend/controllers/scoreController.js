
// Controller functions are async Fastify handlers
const getScores = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;
		const scores = db.prepare(`
			SELECT
				s.id,
				s.player_id,
				p.username,
				s.score,
				s.game_date
			FROM scores s
			JOIN players p ON s.player_id = p.id
			ORDER BY s.score DESC
		`).all();
		reply.send(scores);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving scores '});
	}
}

const getPlayerScores = async (req, reply) => {
	try {
		const { player_id } = req.params;
		const db = req.server.betterSqlite3;

		// First check if player exists
		const player = db.prepare('SELECT * FROM players WHERE id = ?').get(player_id);
		if (!player) {
			reply.code(404).send({ message: 'Player not found' });
			return;
		}


		const scores = db.prepare(`
			SELECT
				s.id,
				s.player_id,
				p.username,
				s.score,
				s.game_date
			FROM scores s
			JOIN players p ON s.player_id = p.id
			WHERE s.player_id = ?
			ORDER BY s.score DESC
		`).all(player_id);

		if (!scores) { //check if needed
			reply.code(404).send({ message: 'Scores not found' });
		} else {
			reply.send(scores);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving scores' });
	}
}

const addScore = async (req, reply) => {
	try {
		const { player_id, score } = req.body;
		const db = req.server.betterSqlite3;

		if (!player_id || score === undefined) {
			reply.code(400).send({ message: 'Player ID and score are required' });
			return;
		}

		// Check if player exists
		const player = db.prepare('SELECT * FROM players WHERE id = ?').get(player_id);
		if (!player) {
			reply.code(404).send({ message: 'Player not found' });
			return;
		}

		const result = db.prepare('INSERT INTO scores (player_id, score) VALUES (?, ?)').run(player_id, score);
		const newScoreId = result.lastInsertRowid;
		
		const newScore = db.prepare(`
			SELECT 
				s.id, 
				s.player_id, 
				p.username, 
				s.score, 
				s.game_date 
			FROM scores s
			JOIN players p ON s.player_id = p.id
			WHERE s.id = ?
		`).get(newScoreId);
		reply.code(201).send(newScore);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error adding score' });
	}
}

const deleteScore = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;
	
		const result = db.prepare('DELETE FROM scores WHERE id = ?').run(id);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Score not found' });
		} else {
			reply.send({ message: `Score ${id} has been removed` });
		}
	} catch (error) {
		reply.log.error(error);
		reply.code(500).send({ message: 'Error deleting score '});
	}
}

module.exports = {
	getScores,
	getPlayerScores,
	addScore,
	deleteScore
};
