// Controller for get friends for a specific user (Requires AUTH + Matching User ID Check)
const getUserFriends = async (req, reply) => {
	const { userId } = req.params;
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Ensure the user ID in the URL matches the authenticated user ID
	if (parseInt(userId, 10) !== authenticatedUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only view your own friends list.' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;
		const friends = db.prepare(`
			SELECT
				f.user_id,
				f.friend_id,
				u.username AS friend_username,
				u.display_name AS friend_display_name,
				u.avatar_url AS friend_avatar_url,
				u.status AS friend_status,
				u.last_active AS friend_last_active
			FROM friends f
			JOIN users u ON f.friend_id = u.id
			WHERE f.user_id = ? -- Filter by the authenticated user ID
		`).all(authenticatedUserId);
		reply.code(200).send(friends);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user friends' });
	}
};

// Controller for checking if two users are friends (Requires AUTH + Participant Check)
const checkFriendship = async (req, reply) => {
	const { userId, friendId } = req.params;
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Ensure authenticated user is one of the two users being checked
	if (authenticatedUserId !== parseInt(userId, 10) && authenticatedUserId !== parseInt(friendId, 10)) {
		reply.code(403).send({ message: 'Forbidden: You can only check friendship status for yourself or with another user.' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;
		// Check for friendship in one direction (since it's mutual in DB)
		const friendship = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?').get(userId, friendId);
		reply.code(200).send({ isFriend: !!friendship });
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error checking friendship status' });
	}
};

// Controller for add friendship (Requires AUTH - user_id is authenticated user)
const addFriendship = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const { friend_id } = req.body;
	const db = req.server.betterSqlite3;

	if (authenticatedUserId === friend_id) {
		reply.code(400).send({ message: 'Cannot add yourself as a friend' });
		return;
	}

	try {
		const friendUserExists = db.prepare('SELECT id FROM users WHERE id = ?').get(friend_id);

		if (!friendUserExists) {
			reply.code(400).send({ message: 'Invalid friend_id: User not found' });
			return;
		}

		const alreadyFriends = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?').get(authenticatedUserId, friend_id);
		if (alreadyFriends) {
			reply.code(409).send({ message: 'Friendship already exists.' });
			return;
		}

		try {
			const addMutualFriendship = db.transaction(() => {
				db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(authenticatedUserId, friend_id);
				db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(friend_id, authenticatedUserId);
			});
			addMutualFriendship();
			reply.code(201).send({ message: 'Friendship added successfully' });

		} catch (err) {
			if (err.message.includes('UNIQUE constraint failed')) {
				reply.code(409).send({ message: 'Friendship already exists (concurrent creation).' });
			} else {
				req.log.error('Database error during addFriendship:', err);
				reply.code(500).send({ message: 'Error adding friendship', error: err.message });
			}
		}
	} catch (error) {
		req.log.error('Error processing request to add friendship:', error);
		reply.code(500).send({ message: 'Error processing request to add friendship' });
	}
};

// Controller for remove friendship (Requires AUTH + Participant Check)
const removeFriendship = async (req, reply) => {
	const { userId, friendId } = req.params;
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Ensure authenticated user is one of the two users in the friendship
	if (authenticatedUserId !== parseInt(userId, 10) && authenticatedUserId !== parseInt(friendId, 10)) {
		reply.code(403).send({ message: 'Forbidden: You can only remove friendships you are a part of.' });
		return;
	}

	// Additional validation: Cannot remove yourself as a friend this way
	if (parseInt(userId, 10) === parseInt(friendId, 10)) {
		reply.code(400).send({ message: 'Cannot remove yourself as a friend this way' });
		return;
	}

	try {
		const db = req.server.betterSqlite3;

		const removeMutualFriendship = db.transaction(() => {
			const result1 = db.prepare('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)').run(userId, parseInt(friendId, 10), parseInt(friendId, 10), userId);

			return { totalChanges: result1.changes };
		});

		const result = removeMutualFriendship();

		if (result.totalChanges === 0) {
			reply.code(404).send({ message: 'Friendship not found or does not involve you.' });
		} else {
			reply.code(200).send({ message: `Friendship between ${userId} and ${friendId} removed` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error removing friendship' });
	}
};

module.exports = {
	getUserFriends,
	checkFriendship,
	addFriendship,
	removeFriendship,
};
