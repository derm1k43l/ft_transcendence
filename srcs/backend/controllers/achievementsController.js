const getAchievements = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;
		const achievements = db.prepare('SELECT * FROM achievements').all();
		reply.send(achievements);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving achievements' });
	}
};

const getAchievement = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;
		const achievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(id);

		if (!achievement) {
			reply.code(404).send({ message: 'Achievement not found' });
		} else {
			reply.send(achievement);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving achievement' });
	}
};

const getUserAchievements = async (req, reply) => {
	try {
		const { userId } = req.params;
		const db = req.server.betterSqlite3;
		const achievements = db.prepare('SELECT * FROM achievements WHERE user_id = ?').all(userId);
		reply.send(achievements);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user achievements' });
	}
};

const addAchievement = async (req, reply) => {
	try {
		const { user_id, name, description, icon, completed = 0, date_completed } = req.body;
		const db = req.server.betterSqlite3;

		if (!user_id || !name || !description || !icon) {
			reply.code(400).send({ message: 'user_id, name, description, and icon are required' });
			return;
		}

		// Optional: Check if user_id exists
		const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
		if (!userExists) {
			reply.code(400).send({ message: 'Invalid user_id' });
			return;
		}

		// Check if achievement already exists for this user
		const existingAchievement = db.prepare('SELECT * FROM achievements WHERE user_id = ? AND name = ? AND description = ?').get(user_id, name, description);
		if (existingAchievement) {
			reply.code(400).send({ message: 'Achievement already exists for this user' });
			return;
		}

		try {
			const result = db.prepare('INSERT INTO achievements (user_id, name, description, icon, completed, date_completed) VALUES (?, ?, ?, ?, ?, ?)').run(user_id, name, description, icon, completed, date_completed);
			const newAchievementId = result.lastInsertedRowid;
			const newAchievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(newAchievementId);
			reply.code(201).send(newAchievement);
		} catch (err) {
			req.log.error(err);
			reply.code(500).send({ message: 'Error adding achievement', error: err.message });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error processing request to add achievement' });
	}
};

const updateAchievement = async (req, reply) => {
	try {
		const { id } = req.params;
		const { user_id, name, description, icon, completed, date_completed } = req.body;
		const db = req.server.betterSqlite3;

		let query = 'UPDATE achievements SET';
		const params = [];
		const fields = { user_id, name, description, icon, completed, date_completed };
		let firstField = true;

		for (const field in fields) {
			if (fields[field] !== undefined) {
				if (!firstField) {
					query += ',';
				}
				query += ` ${field} = ?`;
				params.push(fields[field]);
				firstField = false;
			}
		}

		if (params.length === 0) {
			reply.code(400).send({ message: 'No fields provided for update' });
			return;
		}

		query += ' WHERE id = ?';
		params.push(id);

		const resultRun = db.prepare(query).run(...params);

		if (resultRun.changes === 0) {
			const achievementExists = db.prepare('SELECT id FROM achievements WHERE id = ?').get(id);
			if (!achievementExists) {
			 reply.code(404).send({ message: 'Achievement not found' });
			} else {
				reply.code(200).send({ message: 'No changes made to achievement' });
			}
		} else {
			const updatedAchievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(id);
			reply.send(updatedAchievement);
		}

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating achievement' });
	}
};

const deleteAchievement = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;

		const result = db.prepare('DELETE FROM achievements WHERE id = ?').run(id);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Achievement not found' });
		} else {
			reply.send({ message: `Achievement ${id} has been removed` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error deleting achievement' });
	}
};

module.exports = {
	getAchievements,
	getAchievement,
	getUserAchievements,
	addAchievement,
	updateAchievement,
	deleteAchievement,
};
