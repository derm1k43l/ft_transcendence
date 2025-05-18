const updateOnlineStatusPreHandler = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	try {
		const db = req.server.betterSqlite3;
		const result = db.prepare(`
			UPDATE users
			SET status = 'online', last_active = CURRENT_TIMESTAMP
			WHERE id = ? AND status != 'ingame'
		`).run(authenticatedUserId);

		if (result.changes > 0) {
			req.log.debug(`User ${authenticatedUserId} status updated to online and last_active.`);
		} else {
			req.log.debug(`User ${authenticatedUserId} status not updated (already ingame or not found).`);
		}
	} catch (error) {
		req.log.error('Error updating online status in pre-handler:', error);
	}
};

module.exports = updateOnlineStatusPreHandler;
