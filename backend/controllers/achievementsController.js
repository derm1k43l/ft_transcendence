// Controller for get all Achievements (Public route)
const getAchievements = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;
		const achievements = db.prepare('SELECT * FROM achievements').all();
		reply.code(200).send(achievements);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving achievements' });
	}
};

// Controller for get single Achievement (Requires AUTH + Ownership Check)
const getAchievement = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;
	try {
		const db = req.server.betterSqlite3;
		const achievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(id);

		if (!achievement) {
			reply.code(404).send({ message: 'Achievement not found' });
			return; // stop prcessing
		}

		// AUTHORIZATION CHECK: Ensure the achievement belongs to the authenticated user
		if (achievement.user_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only view your own achievements.' });
			return; // Stop processing
		}
		reply.code(200).send(achievement);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving achievement' });
	}
};

// Controller for get Achievements for a specific user (Requires AUTH + Matching User ID Check)
const getUserAchievements = async (req, reply) => {
	const targetUserId = parseInt(req.params.userId, 10); // Get user ID from URL
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Ensure the user ID in the URL matches the authenticated user ID
	if (targetUserId !== authenticatedUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only view your own achievements.' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;
		const achievements = db.prepare('SELECT * FROM achievements WHERE user_id = ?').all(authenticatedUserId);
		reply.code(200).send(achievements);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user achievements' });
	}
};

// Controller for add Achievement (Requires AUTH - adding for themselves)
const addAchievement = async (req, reply) => {
	const authenticatedUserId = req.user.id;

	try {
		const { name, description, icon, completed = 0, date_completed } = req.body;
		const db = req.server.betterSqlite3;

		if (!name || !description || !icon) {
			reply.code(400).send({ message: 'name, description, and icon are required' });
			return;
		}

		// Optional: Check if user_id exists
		const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(authenticatedUserId);
		if (!userExists) {
			reply.code(400).send({ message: 'Invalid authenticatedUserId' });
			return;
		}

		// Check if achievement already exists for this user
		const existingAchievement = db.prepare('SELECT * FROM achievements WHERE user_id = ? AND name = ? AND description = ?').get(authenticatedUserId, name, description);
		if (existingAchievement) {
			reply.code(409).send({ message: 'Achievement already exists for this user' });
			return;
		}

		try {
			const result = db.prepare('INSERT INTO achievements (user_id, name, description, icon, completed, date_completed) VALUES (?, ?, ?, ?, ?, ?)').run(authenticatedUserId, name, description, icon, completed, date_completed || null);
			const newAchievementId = result.lastInsertRowid;
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

// Controller for update Achievement (Requires AUTH + Ownership Check)
const updateAchievement = async (req, reply) => {
	const { id } = req.params; // achievement id
	const authenticatedUserId = req.user.id;
	const updates = req.body;
	// const { user_id, name, description, icon, completed, date_completed } = req.body;

	if (Object.keys(updates).length === 0) {
		reply.code(400).send({ message: 'No fields provided for update' });
		return;
	}
	// Prevent updating user_id via this endpoint
	if (updates.hasOwnProperty('user_id')) {
		reply.code(400).send({ message: 'Cannot update user_id via this endpoint.' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;

		const achievement = db.prepare('SELECT id, user_id FROM achievements WHERE id = ?').get(id);

		if (!achievement) {
			reply.code(404).send({ message: 'Achievement not found' });
			return; // Stop processing
		}

		// AUTHORIZATION CHECK: Ensure the achievement belongs to the authenticated user
		if (achievement.user_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only update your own achievements.' });
			return; // Stop processing
		}

		let query = 'UPDATE achievements SET';
		const params = [];
		const allowedFields = [ 'name', 'description', 'icon', 'completed', 'date_completed' ];
		let firstField = true;

		allowedFields.forEach(field => {
			// Check if the field exists in the updates body and is not undefined
			if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
				if (!firstField) {
					query += ',';
				}
				query += ` ${field} = ?`;
				params.push(updates[field]);
				firstField = false;
			}
		});

		if (params.length === 0) {
			reply.code(400).send({ message: 'No fields provided for update' });
			return;
		}

		query += ' WHERE id = ? AND user_id = ?';
		params.push(id);
		params.push(authenticatedUserId);

		const resultRun = db.prepare(query).run(...params);

		if (resultRun.changes === 0) {
			reply.code(200).send({ message: 'No changes made to achievement (values were already the same).' });
		} else {
			const updatedAchievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(id);
			reply.code(200).send(updatedAchievement);
		}

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating achievement' });
	}
};

// Controller for delete Achievement (Requires AUTH + Ownership Check)
const deleteAchievement = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;
	try {
		const db = req.server.betterSqlite3;

		const achievement = db.prepare('SELECT user_id FROM achievements WHERE id = ?').get(id);

		if (!achievement) {
			reply.code(404).send({ message: 'Achievement not found' });
			return; // Stop processing
		}

		// AUTHORIZATION CHECK: Ensure the achievement belongs to the authenticated user
		if (achievement.user_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only delete your own achievements.' });
			return; // Stop processing
		}

		// Delete achievement
		const result = db.prepare('DELETE FROM achievements WHERE id = ? AND user_id = ?').run(id, authenticatedUserId);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Achievement not found (or does not belong to you).' });
		} else {
			reply.code(200).send({ message: `Achievement ${id} has been removed` });
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
