const getNotifications = async (req, reply) => {
	try {
		// Auth check
		const authenticatedUserId = req.user.id;
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
			WHERE n.user_id = ? -- Filter notifications by the authenticated user ID
			ORDER BY n.timestamp DESC; -- Order by newest first
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

		const insertSql = `
			INSERT INTO notifications (user_id, type, message, action_url, related_user_id)
			VALUES (?, ?, ?, ?, ?);
		`;
		const insertStmt = db.prepare(insertSql);
		const insertResult = insertStmt.run(user_id, type, message, action_url, related_user_id);

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
	try {
		// Auth check
		const authenticatedUserId = req.user.id; // Authenticated user ID from JWT
		const notificationId = req.params.id; // Get the notification ID from URL path
		const db = req.server.betterSqlite3;

		const updateSql = `
			UPDATE notifications
			SET read = 1 -- Hardcode 1 as this endpoint's purpose is to mark as read
			WHERE id = ? AND user_id = ?; -- IMPORTANT: Only update if it matches the ID *and* belongs to the authenticated user
		`;
		const updateStmt = db.prepare(updateSql);
		const updateResult = updateStmt.run(notificationId, authenticatedUserId); //uses auth'd user ID

		if (updateResult.changes === 0) {
			req.log.warn(`Attempted to mark notification ${notificationId} as read for user ${authenticatedUserId}, but no rows updated.`);
			return reply.code(404).send({ message: 'Notification not found or does not belong to user.' });
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
