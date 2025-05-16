// Controller for get single User Game Settings by user_id (Requires AUTH + Matching User ID Check)
const getUserGameSettings = async (req, reply) => {
	const targetId = parseInt(req.params.userId, 10);
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Ensure user ID in URL matches authed user ID
	if (targetId !== authenticatedUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only view your own game settings.'});
		return;
	}

	try {
		const db = req.server.betterSqlite3;
		const settings = db.prepare('SELECT * FROM game_settings WHERE user_id = ?').get(authenticatedUserId);

		if (!settings) {
			reply.code(404).send({ message: 'Game settings not found' });
		} else {
			reply.code(200).send(settings);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving game settings' });
	}
};

// Controller for update Game Settings (Requires AUTH + Matching User ID Check)
const updateGameSettings = async (req, reply) => {
	const targetId = parseInt(req.params.userId, 10);
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Ensure user ID in URL matches authed user ID
	if (targetId !== authenticatedUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only update your own game settings.'});
		return;
	}

	const updates = req.body;

	if (Object.keys(updates).length === 0) {
		reply.code(400).send({ message: 'No fields provided for update' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;

		const settingsExist = db.prepare('SELECT user_id FROM game_settings WHERE user_id = ?').get(authenticatedUserId);

		if (!settingsExist) {
			reply.code(404).send({ message: 'Game settings not found for this user.' });
			return;
		}

		let query = 'UPDATE game_settings SET';
		const params = [];
		const allowedFields = [ 'board_color', 'paddle_color', 'ball_color', 'score_color'];
		let firstField = true;

		allowedFields.forEach(field => {
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

		query += ' WHERE user_id = ?';
		params.push(authenticatedUserId);

		const result = db.prepare(query).run(...params);

		if (result.changes === 0) {
			reply.code(200).send({ message: 'No changes made to game settings' });
		} else {
			const updatedSettings = db.prepare('SELECT * FROM game_settings WHERE user_id = ?').get(authenticatedUserId);
			reply.code(200).send(updatedSettings);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating game settings' });
	}
};

module.exports = {
	getUserGameSettings,
	updateGameSettings,
};
