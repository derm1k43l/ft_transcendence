// Controller for get all Friend Requests (Requires AUTH - potentially admin or debugging)
const getFriendRequests = async (req, reply) => {
	try {
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
		`).all();

		reply.send(requests);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving friend requests' });
	}
};

// Controller for get single Friend Request (Requires AUTH + Participant Check)
const getFriendRequest = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;

	try {
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
			return;
		}

		// AUTHORIZATION CHECK: Ensure authenticated user is either the sender or the receiver
		if (authenticatedUserId !== request.from_user_id && authenticatedUserId !== request.to_user_id) {
			reply.code(403).send({ message: 'Forbidden: You can only view friend requests you are a part of.' });
			return;
		}
		reply.code(200).send(request);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving friend request' });
	}
};

// Controller for get Sent Friend Requests for a user (Requires AUTH + Matching User ID Check)
const getSentFriendRequests = async (req, reply) => {
	const targetUserId = parseInt(req.params.userId, 10);
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Ensure the user ID in the URL matches the authenticated user ID
	if (targetUserId !== authenticatedUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only view your own sent friend requests.' });
		return;
	}

	try {
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
			WHERE fr.from_user_id = ? -- Filter by the authenticated user ID
		`).all(authenticatedUserId);

		reply.code(200).send(requests);

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving sent friend requests' });
	}
};

// Controller for get Received Friend Requests for a user (usually pending) (Requires AUTH + Matching User ID Check)
const getReceivedFriendRequests = async (req, reply) => {
	const targetUserId = parseInt(req.params.userId, 10);
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Ensure the user ID in the URL matches the authenticated user ID
	if (targetUserId !== authenticatedUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only view your own received friend requests.' });
		return;
	}

	try {
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
			WHERE fr.to_user_id = ? AND fr.status = 'pending' -- Filter by authenticated user ID and status
		`).all(authenticatedUserId);
		reply.code(200).send(requests);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving received friend requests' });
	}
};

// Controller for add Friend Request (Requires AUTH - sender is authenticated user)
const addFriendRequest = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const { to_user_id } = req.body;
	const db = req.server.betterSqlite3;
	const date = new Date().toISOString();

	if (authenticatedUserId === to_user_id) {
		reply.code(400).send({ message: 'Cannot send a friend request to yourself' });
		return;
	}

	try {
		const toUserExists = db.prepare('SELECT id FROM users WHERE id = ?').get(to_user_id);

		if (!toUserExists) {
			reply.code(400).send({ message: 'Invalid to_user_id: User not found' });
			return;
		}

		// Check if a pending request already exists (in either direction)
		const existingRequest = db.prepare('SELECT id FROM friend_requests WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?) AND status = \'pending\'').get(authenticatedUserId, to_user_id, to_user_id, authenticatedUserId);

		if (existingRequest) {
			reply.code(409).send({ message: 'A pending friend request already exists with this user.' });
			return;
		}

		// Check if they are already friends
		const alreadyFriends = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?').get(authenticatedUserId, to_user_id);
		if (alreadyFriends) {
			reply.code(409).send({ message: 'You are already friends with this user.' });
			return;
		}

		// Insert the new friend request using the authenticated user ID as the sender
		try {
			const result = db.prepare('INSERT INTO friend_requests (from_user_id, to_user_id, status, date) VALUES (?, ?, ?, ?)').run(
				authenticatedUserId,
				to_user_id,
				'pending',
				date
			);
			const newRequestId = result.lastInsertedRowid;
			const newRequest = db.prepare('SELECT id, from_user_id, to_user_id, status, date FROM friend_requests WHERE id = ?').get(newRequestId);
			reply.code(201).send(newRequest);
		} catch (err) {
			req.log.error('Database error during addFriendRequest:', err);
			reply.code(500).send({ message: 'Error adding friend request', error: err.message });
		}
	} catch (error) {
		req.log.error('Error processing request to add friend request:', error);
		reply.code(500).send({ message: 'Error processing request to add friend request' });
	}
};

// Controller for update Friend Request Status (accept/reject) (Requires AUTH + Receiver Check)
const updateFriendRequestStatus = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;
	const { status } = req.body; // 'accepted' or 'rejected'

	try {
		const db = req.server.betterSqlite3;

		// Fetch the pending request to check if the authenticated user is the receiver
		const request = db.prepare('SELECT id, from_user_id, to_user_id FROM friend_requests WHERE id = ? AND status = \'pending\'').get(id);

		if (!request) {
			reply.code(404).send({ message: 'Pending friend request not found' });
			return;
		}

		// AUTHORIZATION CHECK: Ensure authenticated user is the receiver of this request
		if (request.to_user_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only update the status of requests you received.' });
			return;
		}

		const { from_user_id, to_user_id } = request;

		let responseMessage = '';
		let statusCode = 200;

		if (status === 'accepted') {
			try {
				const addFriendshipAndDeleteRequest = db.transaction(() => {
					const alreadyFriends = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?').get(from_user_id, to_user_id);
					if (alreadyFriends) {
						db.prepare('DELETE FROM friend_requests WHERE id = ?').run(id);
						throw new Error('ALREADY_FRIENDS');
					}

					// Insert friendship entries
					db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(from_user_id, to_user_id);
					db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(to_user_id, from_user_id);

					// Delete the request after successful friendship creation
					db.prepare('DELETE FROM friend_requests WHERE id = ?').run(id);
				});
				addFriendshipAndDeleteRequest();
				responseMessage = 'Friend request accepted, friendship created.';
			} catch (err) {
				if (err.message === 'ALREADY_FRIENDS') {
					responseMessage = 'Friendship already exists. Friend request deleted.';
					statusCode = 409;
				} else if (err.message.includes('UNIQUE constraint failed')) {
					req.log.warn(`Concurrent friendship creation detected for request ${id}. Deleting request.`);
					db.prepare('DELETE FROM friend_requests WHERE id = ?').run(id);
					responseMessage = 'Friendship already exists. Friend request deleted.';
					statusCode = 409;
				}
				else {
					req.log.error('Database error during friend request acceptance transaction:', err);
					reply.code(500).send({ message: 'Error processing friend request acceptance', error: err.message });
					return;
				}
			}
		} else { // status === 'rejected', simply delete the request.
			const result = db.prepare('DELETE FROM friend_requests WHERE id = ? AND to_user_id = ?').run(id, authenticatedUserId);
			if (result.changes === 0) {
				req.log.warn(`Attempted to reject request ${id} for user ${authenticatedUserId} but no changes made.`);
				reply.code(404).send({ message: 'Pending friend request not found or does not belong to you.' });
				return;
			}
			responseMessage = 'Friend request rejected and deleted.';
		}
		reply.code(statusCode).send({ message: responseMessage });
	} catch (error) {
		req.log.error('Error updating friend request status:', error);
		reply.code(500).send({ message: 'Error updating friend request status' });
	}
};

// Controller for delete Friend Request (Requires AUTH + Participant Check)
const deleteFriendRequest = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;

	try {
		const db = req.server.betterSqlite3;

		// Fetch the request to check if the authenticated user is a participant
		const request = db.prepare('SELECT id, from_user_id, to_user_id FROM friend_requests WHERE id = ?').get(id);

		if (!request) {
			reply.code(404).send({ message: 'Friend request not found' });
			return;
		}

		// AUTHORIZATION CHECK: Ensure authenticated user is either the sender or the receiver
		if (authenticatedUserId !== request.from_user_id && authenticatedUserId !== request.to_user_id) {
			reply.code(403).send({ message: 'Forbidden: You can only delete friend requests you are a part of.' });
			return;
		}

		// Delete the request, filtering by ID and ensuring the user is a participant for extra safety
		const result = db.prepare('DELETE FROM friend_requests WHERE id = ? AND (from_user_id = ? OR to_user_id = ?)').run(id, authenticatedUserId, authenticatedUserId);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Friend request not found (or does not belong to you).' });
		} else {
			reply.code(200).send({ message: `Friend request ${id} has been removed` });
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
