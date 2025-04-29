const getUsers = async (req, reply) => {
	try {
	const db = req.server.betterSqlite3;
	const users = db.prepare(`
		SELECT 
		id, username, display_name, email, bio,
		avatar_url, cover_photo_url, join_date,
		has_two_factor_auth, status, last_active, created_at
		FROM users
	`).all();
	reply.send(users);
	} catch (error) {
	req.log.error(error);
	reply.code(500).send({ message: 'Error retrieving users' });
	}
};

const getUser = async (req, reply) => {
	try {
	const { id } = req.params;
	const db = req.server.betterSqlite3;
	
	const user = db.prepare(`
		SELECT 
		id, username, display_name, email, bio,
		avatar_url, cover_photo_url, join_date,
		has_two_factor_auth, status, last_active, created_at
		FROM users 
		WHERE id = ?
	`).get(id);

	if (!user) {
		reply.code(404).send({ message: 'User not found' });
	} else {
		reply.send(user);
	}
	} catch (error) {
	req.log.error(error);
	reply.code(500).send({ message: 'Error retrieving user' });
	}
};

const getUserProfile = async (req, reply) => {
	try {
	const { id } = req.params;
	const db = req.server.betterSqlite3;
	
	const user = db.prepare(`
		SELECT 
		id, username, display_name, email, bio,
		avatar_url, cover_photo_url, join_date,
		status, last_active
		FROM users 
		WHERE id = ?
	`).get(id);

	if (!user) {
		reply.code(404).send({ message: 'User not found' });
	} else {
		reply.send(user);
	}
	} catch (error) {
	req.log.error(error);
	reply.code(500).send({ message: 'Error retrieving user profile' });
	}
};

const addUser = async (req, reply) => {
	try {
	const { 
		username, 
		password, 
		display_name, 
		email, 
		bio, 
		avatar_url, 
		cover_photo_url 
	} = req.body;
	
	const db = req.server.betterSqlite3;

	// Basic validation
	if (!username || !password || !display_name) {
		return reply.code(400).send({ message: 'Username, password and display name are required' });
	}

	try {
		const result = db.prepare(`
		INSERT INTO users (
			username, password, display_name, email, bio, 
			avatar_url, cover_photo_url, join_date
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`).run(
		username,
		password,
		display_name,
		email || null,
		bio || null,
		avatar_url || null,
		cover_photo_url || null,
		new Date().toISOString()
		);

		const newUser = db.prepare(`
		SELECT 
			id, username, display_name, email, bio,
			avatar_url, cover_photo_url, join_date,
			has_two_factor_auth, status, last_active, created_at
		FROM users 
		WHERE id = ?
		`).get(result.lastInsertRowid);

		reply.code(201).send(newUser);
	} catch (err) {
		if (err.message.includes('UNIQUE constraint failed: users.username')) {
		reply.code(409).send({ message: 'Username already exists' });
		} else if (err.message.includes('UNIQUE constraint failed: users.email') && email) {
		reply.code(409).send({ message: 'Email already exists' });
		} else {
		throw err;
		}
	}
	} catch (error) {
	req.log.error(error);
	reply.code(500).send({ message: 'Error adding user' });
	}
};

const updateUser = async (req, reply) => {
	try {
	const { id } = req.params;
	const updates = req.body;
	const db = req.server.betterSqlite3;

	// Don't allow updating certain fields directly
	const { password, ...allowedUpdates } = updates;

	const setClauses = [];
	const params = [];
	
	// Convert camelCase to snake_case and build SQL
	Object.entries(allowedUpdates).forEach(([key, value]) => {
		const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
		setClauses.push(`${dbKey} = ?`);
		params.push(value);
	});

	if (setClauses.length === 0) {
		return reply.code(400).send({ message: 'No valid updates provided' });
	}

	params.push(id);
	const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;

	try {
		const result = db.prepare(sql).run(...params);

		if (result.changes === 0) {
		return reply.code(404).send({ message: 'User not found or no changes made' });
		}

		// Return updated user
		const updatedUser = db.prepare(`
		SELECT 
			id, username, display_name, email, bio,
			avatar_url, cover_photo_url, join_date,
			has_two_factor_auth, status, last_active, created_at
		FROM users 
		WHERE id = ?
		`).get(id);

		reply.send(updatedUser);
	} catch (err) {
		if (err.message.includes('UNIQUE constraint failed: users.username')) {
		reply.code(409).send({ message: 'Username already exists' });
		} else if (err.message.includes('UNIQUE constraint failed: users.email')) {
		reply.code(409).send({ message: 'Email already exists' });
		} else {
		throw err;
		}
	}
	} catch (error) {
	req.log.error(error);
	reply.code(500).send({ message: 'Error updating user' });
	}
};

const updateUserProfile = async (req, reply) => {
	try {
	const { id } = req.params;
	const { display_name, bio, avatar_url, cover_photo_url } = req.body;
	const db = req.server.betterSqlite3;

	// Validate at least one field is being updated
	if (!display_name && !bio && !avatar_url && !cover_photo_url) {
		return reply.code(400).send({ message: 'No profile updates provided' });
	}

	const setClauses = [];
	const params = [];
	
	if (display_name) {
		setClauses.push('display_name = ?');
		params.push(display_name);
	}
	if (bio !== undefined) {
		setClauses.push('bio = ?');
		params.push(bio);
	}
	if (avatar_url !== undefined) {
		setClauses.push('avatar_url = ?');
		params.push(avatar_url);
	}
	if (cover_photo_url !== undefined) {
		setClauses.push('cover_photo_url = ?');
		params.push(cover_photo_url);
	}

	params.push(id);
	const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;

	const result = db.prepare(sql).run(...params);

	if (result.changes === 0) {
		return reply.code(404).send({ message: 'User not found or no changes made' });
	}

	// Return updated user profile
	const updatedUser = db.prepare(`
		SELECT 
		id, username, display_name, email, bio,
		avatar_url, cover_photo_url, join_date,
		status, last_active
		FROM users 
		WHERE id = ?
	`).get(id);

	reply.send(updatedUser);
	} catch (error) {
	req.log.error(error);
	reply.code(500).send({ message: 'Error updating user profile' });
	}
};

const deleteUser = async (req, reply) => {
	try {
	const { id } = req.params;
	const db = req.server.betterSqlite3;
	
	const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

	if (result.changes === 0) {
		reply.code(404).send({ message: 'User not found' });
	} else {
		reply.send({ message: `User ${id} has been removed` });
	}
	} catch (error) {
	req.log.error(error);
	reply.code(500).send({ message: 'Error deleting user' });
	}
};

module.exports = {
	getUsers,
	getUser,
	getUserProfile,
	addUser,
	deleteUser,
	updateUser,
	updateUserProfile
};
