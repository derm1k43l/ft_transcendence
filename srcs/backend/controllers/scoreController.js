
// Controller functions are async Fastify handlers
const getScores = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;
		const scores = db.prepare(`
			SELECT
				s.id,
				s.user_id,
				p.username,
				s.score,
				s.game_date
			FROM scores s
			JOIN users p ON s.user_id = p.id
			ORDER BY s.score DESC
		`).all();
		reply.send(scores);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving scores '});
	}
}

const getUserScores = async (req, reply) => {
	try {
		const { user_id } = req.params;
		const db = req.server.betterSqlite3;

		// First check if user exists
		const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
		if (!user) {
			reply.code(404).send({ message: 'User not found' });
			return;
		}


		const scores = db.prepare(`
			SELECT
				s.id,
				s.user_id,
				p.username,
				s.score,
				s.game_date
			FROM scores s
			JOIN users p ON s.user_id = p.id
			WHERE s.user_id = ?
			ORDER BY s.score DESC
		`).all(user_id);

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
		const { user_id, score } = req.body;
		const db = req.server.betterSqlite3;

		if (!user_id || score === undefined) {
			reply.code(400).send({ message: 'User ID and score are required' });
			return;
		}

		// Check if user exists
		const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
		if (!user) {
			reply.code(404).send({ message: 'User not found' });
			return;
		}

		const result = db.prepare('INSERT INTO scores (user_id, score) VALUES (?, ?)').run(user_id, score);
		const newScoreId = result.lastInsertRowid;
		
		const newScore = db.prepare(`
			SELECT 
				s.id, 
				s.user_id, 
				p.username, 
				s.score, 
				s.game_date 
			FROM scores s
			JOIN users p ON s.user_id = p.id
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
	getUserScores,
	addScore,
	deleteScore
};
