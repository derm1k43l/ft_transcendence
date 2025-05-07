const getUserFriends = async (req, reply) => {
	try {
		const { userId } = req.params;
		const db = req.server.betterSqlite3;

		// Join with the users table to get friend details
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
			WHERE f.user_id = ?
		`).all(userId);

		reply.send(friends);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user friends' });
	}
};

const checkFriendship = async (req, reply) => {
	try {
		const { userId, friendId } = req.params;
		const db = req.server.betterSqlite3;

		const friendship = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?').get(userId, friendId);

		if (friendship) {
			reply.send({ isFriend: true });
		} else {
			reply.send({ isFriend: false });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error checking friendship status' });
	}
};

const addFriendship = async (req, reply) => {
	try {
		const { user_id, friend_id } = req.body;
		const db = req.server.betterSqlite3;

		if (!user_id || !friend_id) {
			reply.code(400).send({ message: 'user_id and friend_id are required' });
			return;
		}

		if (user_id === friend_id) {
			reply.code(400).send({ message: 'Cannot add yourself as a friend' });
			return;
		}

		// Optional: Check if both users exist
		const user1Exists = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
		const user2Exists = db.prepare('SELECT id FROM users WHERE id = ?').get(friend_id);

		if (!user1Exists || !user2Exists) {
			reply.code(400).send({ message: 'Invalid user_id or friend_id' });
			return;
		}

		try {
			// Add friendship in both directions for a mutual friendship model
			db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(user_id, friend_id);
			db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(friend_id, user_id);

			reply.code(201).send({ message: 'Friendship added successfully' });
		} catch (err) {
			if (err.message.includes('UNIQUE constraint failed')) {
				reply.code(409).send({ message: 'Friendship already exists' });
			} else {
				req.log.error(err);
				reply.code(500).send({ message: 'Error adding friendship', error: err.message });
			}
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error processing request to add friendship' });
	}
};

const removeFriendship = async (req, reply) => {
	try {
		const { userId, friendId } = req.params;
		const db = req.server.betterSqlite3;

		if (userId === friendId) {
			reply.code(400).send({ message: 'Cannot remove yourself as a friend this way' });
			return;
		}

		// Delete friendship in both directions
		const result1 = db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(userId, friendId);
		const result2 = db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(friendId, userId);

		if (result1.changes === 0 && result2.changes === 0) {
			reply.code(404).send({ message: 'Friendship not found' });
		} else {
			reply.send({ message: `Friendship between ${userId} and ${friendId} removed` });
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
