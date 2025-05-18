// Controller for get chat messages between two users (Requires AUTH + Participant Check)
const getChatMessagesBetweenUsers = async (req, reply) => {
	const { userId1, userId2 } = req.params;
	const authenticatedUserId = req.user.id;

	// AUTHORIZATION CHECK: Ensure authenticated user is one of the two users in the conversation
	if (authenticatedUserId !== parseInt(userId1, 10) && authenticatedUserId !== parseInt(userId2, 10)) {
		reply.code(403).send({ message: 'Forbidden: You can only view chat messages you are a part of.' });
		return; // Stop processing
	}

	try {
		const db = req.server.betterSqlite3;

		// Get messages sent from user1 to user2 OR user2 to user1, ordered by timestamp
		const messages = db.prepare(`
			SELECT
				cm.id,
				cm.sender_id,
				cm.receiver_id,
				cm.content,
				cm.timestamp,
				cm.read,
				us.username AS sender_username,
				us.display_name AS sender_display_name,
				us.avatar_url AS sender_avatar_url,
				ur.username AS receiver_username,
				ur.display_name AS receiver_display_name,
				ur.avatar_url AS receiver_avatar_url
			FROM chat_messages cm
			JOIN users us ON cm.sender_id = us.id
			JOIN users ur ON cm.receiver_id = ur.id
			WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
			ORDER BY timestamp
		`).all(userId1, userId2, userId2, userId1);

		reply.send(messages);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving chat messages' });
	}
};

// Controller for get single Chat Message (Requires AUTH + Ownership/Participant Check)
const getChatMessage = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;

	try {
		const db = req.server.betterSqlite3;

		 const message = db.prepare(`
			SELECT
				cm.id,
				cm.sender_id,
				cm.receiver_id,
				cm.content,
				cm.timestamp,
				cm.read,
				us.username AS sender_username,
				us.display_name AS sender_display_name,
				us.avatar_url AS sender_avatar_url,
				ur.username AS receiver_username,
				ur.display_name AS receiver_display_name,
				ur.avatar_url AS receiver_avatar_url
			FROM chat_messages cm
			JOIN users us ON cm.sender_id = us.id
			JOIN users ur ON cm.receiver_id = ur.id
			WHERE cm.id = ?
		`).get(id);

		if (!message) {
			reply.code(404).send({ message: 'Chat message not found' });
			return; // stop
		}

		// AUTHORIZATION CHECK: Ensure authenticated user is either the sender or the receiver
		if (authenticatedUserId !== message.sender_id && authenticatedUserId !== message.receiver_id) {
			reply.code(403).send({ message: 'Forbidden: You can only view chat messages you are a part of.' });
			return;
		}
		reply.code(200).send(message);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving chat message' });
	}
};

// Controller for add Chat Message (Requires AUTH - sender is authenticated user)
const addChatMessage = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const { receiver_id, content } = req.body;
	const db = req.server.betterSqlite3;

	if (authenticatedUserId === receiver_id) {
		reply.code(400).send({ message: 'Cannot send message to yourself this way' });
		return;
	}

	try {
		const receiverExists = db.prepare('SELECT id FROM users WHERE id = ?').get(receiver_id);

		if (!receiverExists) {
			reply.code(400).send({ message: 'Invalid receiver_id: User not found' });
			return;
		}

		// Friendship check
		const friendship = db.prepare(`
			SELECT 1 FROM friends
			WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
		`).get(authenticatedUserId, receiver_id, receiver_id, authenticatedUserId);

		if (!friendship) {
			return reply.code(403).send({ message: 'Forbidden: You can only send messages to friends.' });
		}

		try {
			const result = db.prepare('INSERT INTO chat_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)').run(authenticatedUserId, receiver_id, content);
			const newMessageId = result.lastInsertRowid;
			const newMessage = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(newMessageId);
			reply.code(201).send(newMessage);
		} catch (err) {
			req.log.error(err);
			reply.code(500).send({ message: 'Error adding chat message', error: err.message });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error processing request to add chat message' });
	}
};

// Mark message as read (Requires AUTH + Receiver Check)
const markChatMessageAsRead = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;

	try {
		const db = req.server.betterSqlite3;

		const message = db.prepare('SELECT id, receiver_id FROM chat_messages WHERE id = ?').get(id);

		if (!message) {
			reply.code(404).send({ message: 'Chat message not found' });
			return; // Stop processing
		}

		// AUTHORIZATION CHECK: Ensure authenticated user is the receiver of this message
		if (message.receiver_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only mark messages as read that you received.' });
			return; // Stop processing
		}

		// update the message
		const result = db.prepare('UPDATE chat_messages SET read = 1 WHERE id = ? AND receiver_id = ?').run(id, authenticatedUserId);

		if (result.changes === 0) {
			reply.code(200).send({ message: 'Chat message already marked as read or no changes made' });
		} else {
			reply.code(200).send({ message: `Chat message ${id} marked as read` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error marking chat message as read' });
	}
};

// Controller for delete Chat Message (Requires AUTH + Sender Check)
const deleteChatMessage = async (req, reply) => {
	const { id } = req.params;
	const authenticatedUserId = req.user.id;

	try {
		const db = req.server.betterSqlite3;

		const message = db.prepare('SELECT id, sender_id FROM chat_messages WHERE id = ?').get(id);

		if (!message) {
			reply.code(404).send({ message: 'Chat message not found' });
			return; // Stop processing
		}

		// AUTHORIZATION CHECK: Ensure authenticated user is the sender of this message (maybe we could allow reciever to delete messages too, but who cares)
		if (message.sender_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only delete messages you sent.' });
			return; // Stop processing
		}

		// Delete the message
		const result = db.prepare('DELETE FROM chat_messages WHERE id = ? AND sender_id = ?').run(id, authenticatedUserId);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Chat message not found (or does not belong to you).' });
		} else {
			reply.code(200).send({ message: `Chat message ${id} has been removed` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error deleting chat message' });
	}
};

module.exports = {
	getChatMessagesBetweenUsers,
	getChatMessage,
	addChatMessage,
	markChatMessageAsRead,
	deleteChatMessage,
};
