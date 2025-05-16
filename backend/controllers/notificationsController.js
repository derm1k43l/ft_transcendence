const getNotifications = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	try {
		const db = req.server.betterSqlite3;
		const sql = `
			SELECT
				n.id,
				n.user_id,
				n.type,
				n.message,
				n.read,
				n.timestamp,
				n.action_url,
				n.related_user_id,
				u.username AS related_username,
				u.display_name AS related_display_name,
				u.avatar_url AS related_avatar_url
			FROM notifications n
			LEFT JOIN users u ON n.related_user_id = u.id
			WHERE n.user_id = ?
			ORDER BY n.timestamp DESC;
		`;
		const stmt = db.prepare(sql);
		const notifications = stmt.all(authenticatedUserId);
		reply.code(200).send(notifications);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Failed to fetch notifications.' });
	}
};

const createNotification = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;

		const { user_id, type, message, action_url, related_user_id } = req.body; // user_id is the recipient ID here

		const recipientExists = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
		if (!recipientExists) {
			reply.code(400).send({ message: 'Invalid user_id: Recipient user not found.' });
			return;
		}

		if (related_user_id !== undefined && related_user_id !== null) {
			const relatedUserExists = db.prepare('SELECT id FROM users WHERE id = ?').get(related_user_id);
			if (!relatedUserExists) {
				reply.code(400).send({ message: 'Invalid related_user_id: Related user not found.' });
				return;
			}
		}

		const insertSql = `
			INSERT INTO notifications (user_id, type, message, action_url, related_user_id)
			VALUES (?, ?, ?, ?, ?);
		`;
		const insertStmt = db.prepare(insertSql);
		const insertResult = insertStmt.run(user_id, type, message, action_url || null, related_user_id || null);

		const newNotificationId = insertResult.lastInsertRowid;

		const fetchSql = `
			SELECT
				n.id,
				n.user_id,
				n.type,
				n.message,
				n.read,
				n.timestamp,
				n.action_url,
				n.related_user_id,
				u.username AS related_username,
				u.display_name AS related_display_name,
				u.avatar_url AS related_avatar_url
			FROM notifications n
			LEFT JOIN users u ON n.related_user_id = u.id
			WHERE n.id = ?;
		`;
		const fetchStmt = db.prepare(fetchSql);
		const newNotification = fetchStmt.get(newNotificationId);

		if (!newNotification) {
			req.log.warn(`Failed to fetch newly created notification with ID ${newNotificationId}`);
			// Still send 201, but indicate fetch issue if needed
			return reply.code(201).send({ message: 'Notification created, but could not retrieve details.', id: newNotificationId });
		}

		reply.code(201).send(newNotification);

	} catch (error) {
		req.log.error('Error creating notification:', error);
		reply.code(500).send({ message: 'Failed to create notification.' });
	}
};

const markNotificationAsRead = async (req, reply) => {
	const authenticatedUserId = req.user.id; // Authenticated user ID from JWT
	const notificationId = req.params.id; // Get the notification ID from URL path
	try {
		const db = req.server.betterSqlite3;

		const notification = db.prepare('SELECT id, user_id FROM notifications WHERE id = ?').get(notificationId);

		if (!notification) {
			reply.code(404).send({ message: 'Notification not found.' });
			return;
		}

		// AUTHORIZATION CHECK: Ensure authenticated user is the recipient (user_id) of this notification
		if (notification.user_id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only mark your own notifications as read.' });
			return;
		}

		const updateSql = `
			UPDATE notifications
			SET read = 1
			WHERE id = ? AND user_id = ?;
		`;
		const updateStmt = db.prepare(updateSql);
		const updateResult = updateStmt.run(notificationId, authenticatedUserId); //uses auth'd user ID

		if (updateResult.changes === 0) {
			req.log.warn(`Attempted to mark notification ${notificationId} as read for user ${authenticatedUserId}, but no changes updated (already read?).`);
			reply.code(204).send(); // still send as desired state is achieved
		}

		reply.code(204).send(); // could be 200 too I guess
	} catch (error) {
		req.log.error('Error marking notification as read:', error);
		reply.code(500).send({ message: 'Failed to update notification.' });
	}
};

module.exports = {
	getNotifications,
	createNotification,
	markNotificationAsRead,
};
