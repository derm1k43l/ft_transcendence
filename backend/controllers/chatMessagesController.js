const getChatMessagesBetweenUsers = async (req, reply) => {
	try {
		const { userId1, userId2 } = req.params;
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

const getChatMessage = async (req, reply) => {
	try {
		const { id } = req.params;
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
		} else {
			reply.send(message);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving chat message' });
	}
};

const addChatMessage = async (req, reply) => {
	try {
		const { sender_id, receiver_id, content } = req.body;
		const db = req.server.betterSqlite3;
		// timestamp defaults to CURRENT_TIMESTAMP in schema

		if (!sender_id || !receiver_id || !content) {
			reply.code(400).send({ message: 'sender_id, receiver_id, and content are required' });
			return;
		}

		if (sender_id === receiver_id) {
			reply.code(400).send({ message: 'Cannot send message to yourself this way' });
			return;
		}

		// Check if users exist
		const senderExists = db.prepare('SELECT id FROM users WHERE id = ?').get(sender_id);
		const receiverExists = db.prepare('SELECT id FROM users WHERE id = ?').get(receiver_id);

		if (!senderExists || !receiverExists) {
			reply.code(400).send({ message: 'Invalid sender_id or receiver_id' });
			return;
		}

		try {
			const result = db.prepare('INSERT INTO chat_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)').run(sender_id, receiver_id, content);
			const newMessageId = result.lastInsertedRowid;
			// Retrieve the newly inserted message with the actual timestamp from the DB
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

// Mark message as read
const markChatMessageAsRead = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;

		const result = db.prepare('UPDATE chat_messages SET read = 1 WHERE id = ?').run(id);

		if (result.changes === 0) {
			const messageExists = db.prepare('SELECT id FROM chat_messages WHERE id = ?').get(id);
			if (!messageExists) {
				reply.code(404).send({ message: 'Chat message not found' });
			} else {
				reply.code(200).send({ message: 'Chat message already marked as read or no changes made' });
			}
		} else {
			reply.send({ message: `Chat message ${id} marked as read` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error marking chat message as read' });
	}
};

const deleteChatMessage = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;

		const result = db.prepare('DELETE FROM chat_messages WHERE id = ?').run(id);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Chat message not found' });
		} else {
			reply.send({ message: `Chat message ${id} has been removed` });
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
