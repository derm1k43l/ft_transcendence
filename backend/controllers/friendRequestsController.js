const getFriendRequests = async (req, reply) => {
	try {
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
		const db = req.server.betterSqlite3;

		// Join with users table to get sender and receiver details
		const requests = db.prepare(`
			SELECT
				fr.id,
				fr.from_user_id,
				fr.to_user_id,
				fr.status,
				fr.date,
				uf.username AS from_username,
				uf.display_name AS from_display_name,
				uf.avatar_url AS from_avatar_url,
				ut.username AS to_username,
				ut.display_name AS to_display_name,
				ut.avatar_url AS to_avatar_url
			FROM friend_requests fr
			JOIN users uf ON fr.from_user_id = uf.id
			JOIN users ut ON fr.to_user_id = ut.id
		`).all();

		reply.send(requests);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving friend requests' });
	}
};

const getFriendRequest = async (req, reply) => {
	try {
		const { id } = req.params;
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
		const db = req.server.betterSqlite3;

		const request = db.prepare(`
			SELECT
				fr.id,
				fr.from_user_id,
				fr.to_user_id,
				fr.status,
				fr.date,
				uf.username AS from_username,
				uf.display_name AS from_display_name,
				uf.avatar_url AS from_avatar_url,
				ut.username AS to_username,
				ut.display_name AS to_display_name,
				ut.avatar_url AS to_avatar_url
			FROM friend_requests fr
			JOIN users uf ON fr.from_user_id = uf.id
			JOIN users ut ON fr.to_user_id = ut.id
			WHERE fr.id = ?
		`).get(id);

		if (!request) {
			reply.code(404).send({ message: 'Friend request not found' });
		} else {
			reply.send(request);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving friend request' });
	}
};

const getSentFriendRequests = async (req, reply) => {
	try {
		const { userId } = req.params;
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
		const db = req.server.betterSqlite3;

		const requests = db.prepare(`
			SELECT
				fr.id,
				fr.from_user_id,
				fr.to_user_id,
				fr.status,
				fr.date,
				uf.username AS from_username,
				uf.display_name AS from_display_name,
				uf.avatar_url AS from_avatar_url,
				ut.username AS to_username,
				ut.display_name AS to_display_name,
				ut.avatar_url AS to_avatar_url
			FROM friend_requests fr
			JOIN users uf ON fr.from_user_id = uf.id
			JOIN users ut ON fr.to_user_id = ut.id
			WHERE fr.from_user_id = ?
		`).all(userId);

		reply.send(requests);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving sent friend requests' });
	}
};

const getReceivedFriendRequests = async (req, reply) => {
	try {
		const { userId } = req.params;
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
		const db = req.server.betterSqlite3;

		const requests = db.prepare(`
			SELECT
				fr.id,
				fr.from_user_id,
				fr.to_user_id,
				fr.status,
				fr.date,
				uf.username AS from_username,
				uf.display_name AS from_display_name,
				uf.avatar_url AS from_avatar_url,
				ut.username AS to_username,
				ut.display_name AS to_display_name,
				ut.avatar_url AS to_avatar_url
			FROM friend_requests fr
			JOIN users uf ON fr.from_user_id = uf.id
			JOIN users ut ON fr.to_user_id = ut.id
			WHERE fr.to_user_id = ? AND fr.status = 'pending'
		`).all(userId); // Usually only show pending requests

		reply.send(requests);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving received friend requests' });
	}
};


const addFriendRequest = async (req, reply) => {
	try {
		const { from_user_id, to_user_id } = req.body;
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
		const db = req.server.betterSqlite3;
		const date = new Date().toISOString();

		if (!from_user_id || !to_user_id) {
			reply.code(400).send({ message: 'from_user_id and to_user_id are required' });
			return;
		}

		if (from_user_id === to_user_id) {
			reply.code(400).send({ message: 'Cannot send a friend request to yourself' });
			return;
		}

		// Check if users exist (could be the cause of errors)
		const fromUserExists = db.prepare('SELECT id FROM users WHERE id = ?').get(from_user_id);
		const toUserExists = db.prepare('SELECT id FROM users WHERE id = ?').get(to_user_id);

		if (!fromUserExists || !toUserExists) {
			reply.code(400).send({ message: 'Invalid from_user_id or to_user_id' });
			return;
		}

		// Check if a pending request already exists (in either direction) (could be the coulprit too)
		const existingRequest = db.prepare('SELECT id FROM friend_requests WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?) AND status = \'pending\'').get(from_user_id, to_user_id, to_user_id, from_user_id);

		if (existingRequest) {
			reply.code(409).send({ message: 'A pending friend request already exists' });
			return;
		}

		// Check if they are already friends (could be the coulprit too)
		const alreadyFriends = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?').get(from_user_id, to_user_id);
		if (alreadyFriends) {
			reply.code(409).send({ message: 'You are already friends with this user' });
			return;
		}

		try {
			const result = db.prepare('INSERT INTO friend_requests (from_user_id, to_user_id, status, date) VALUES (?, ?, ?, ?)').run(from_user_id, to_user_id, 'pending', date);
			const newRequestId = result.lastInsertedRowid;
			const newRequest = db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(newRequestId); // Return basic request object
			reply.code(201).send(newRequest);
		} catch (err) {
			req.log.error(err);
			reply.code(500).send({ message: 'Error adding friend request', error: err.message });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error processing request to add friend request' });
	}
};

const updateFriendRequestStatus = async (req, reply) => {
	try {
		const { id } = req.params;
		const { status } = req.body; // 'accepted' or 'rejected'
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
		const db = req.server.betterSqlite3;

		if (!status || !['accepted', 'rejected'].includes(status)) {
			reply.code(400).send({ message: 'status is required and must be "accepted" or "rejected"' });
			return;
		}

		const request = db.prepare('SELECT * FROM friend_requests WHERE id = ? AND status = \'pending\'').get(id);

		if (!request) {
			reply.code(404).send({ message: 'Pending friend request not found' });
			return;
		}

		const { from_user_id, to_user_id } = request;

		const updateResult = db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?').run(status, id);

		if (updateResult.changes === 0) {
			reply.code(500).send({ message: 'Failed to update request status' }); // Should not happen if request was found
			return;
		}

		if (status === 'accepted') {
			try {
				// Add friendship in both directions
				db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(from_user_id, to_user_id);
				db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(to_user_id, from_user_id);
				reply.send({ message: 'Friend request accepted and friendship created' });
			} catch (err) {
				if (err.message.includes('UNIQUE constraint failed')) {
					reply.code(409).send({ message: 'Friendship already exists, request marked as accepted' });
				} else {
					req.log.error(err);
					reply.code(500).send({ message: 'Error creating friendship after accepting request', error: err.message });
				}
			}
		} else { // status === 'rejected'
			reply.send({ message: 'Friend request rejected' });
		}

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating friend request status' });
	}
};

const deleteFriendRequest = async (req, reply) => {
	try {
		const { id } = req.params;
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
		const db = req.server.betterSqlite3;

		const result = db.prepare('DELETE FROM friend_requests WHERE id = ?').run(id);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Friend request not found' });
		} else {
			reply.send({ message: `Friend request ${id} has been removed` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error deleting friend request' });
	}
};

module.exports = {
	getFriendRequests,
	getFriendRequest,
	getSentFriendRequests,
	getReceivedFriendRequests,
	addFriendRequest,
	updateFriendRequestStatus,
	deleteFriendRequest,
};
