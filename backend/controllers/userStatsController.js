// Controller for get single User Stat by user_id (Requires AUTH + Matching User ID Check)
const getUserStat = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.userId, 10);

	// AUTHORIZATION CHECK: Ensure the user ID in the URL matches the authenticated user ID
	if (targetUserId !== authenticatedUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only view your own user stats.' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;
		const stat = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(authenticatedUserId);

		if (!stat) {
			reply.code(404).send({ message: 'User stats not found for this user' });
		} else {
			reply.code(200).send(stat);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user stats' });
	}
};

// Controller for update User Stat (Requires AUTH + Matching User ID Check)
const updateUserStat = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.userId, 10);

	// AUTHORIZATION CHECK: Ensure the user ID in the URL matches the authenticated user ID
	if (targetUserId !== authenticatedUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only update your own user stats.' });
		return;
	}

	const updates = req.body;

	if (Object.keys(updates).length === 0) {
		reply.code(400).send({ message: 'No fields provided for update' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;
		
		const userStatExist = db.prepare('SELECT user_id FROM user_stats WHERE user_id = ?').get(authenticatedUserId);

		if (!userStatExist) {
			reply.code(404).send({ message: 'User stats not found for this user.' });
			return;
		}

		// Build the update query dynamically based on provided fields
		let query = 'UPDATE user_stats SET';
		const params = [];
		const allowedFields = [ 'wins', 'losses', 'rank', 'level' ];
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
			reply.code(200).send({ message: 'No changes made to user stats, values were already the same.' });
		} else {
			const updatedStat = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(authenticatedUserId);
			reply.code(200).send(updatedStat);
		}

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating user stats' });
	}
};

module.exports = {
	getUserStat,
	updateUserStat,
};
