const argon2 = require('argon2');
const { pipeline } = require('stream/promises');
const path = require('path');
const fs = require('fs');

const AVATAR_UPLOAD_DIR = path.join(__dirname, '../uploads/avatars');

if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
	fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

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

const getCurrentUser = async (req, reply) => {
	try {
		const decodedToken = await req.jwtVerify();
		if (!decodedToken || !decodedToken.id) {
			return reply.code(401).send({ message: 'Invalid or missing token' });
		}

		const { id } = decodedToken;
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

const getUserByName = async (req, reply) => {
	try {
		const { username } = req.params;
		const db = req.server.betterSqlite3;
		
		const user = db.prepare(`
			SELECT 
			id, username, display_name, email, bio,
			avatar_url, cover_photo_url, join_date,
			has_two_factor_auth, status, last_active, created_at
			FROM users 
			WHERE username = ?
		`).get(username);

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

const getUserByEmail = async (req, reply) => {
	try {
		const { email } = req.params;
		const db = req.server.betterSqlite3;
		
		const user = db.prepare(`
			SELECT 
			id, username, display_name, email, bio,
			avatar_url, cover_photo_url, join_date,
			has_two_factor_auth, status, last_active, created_at
			FROM users 
			WHERE email = ?
		`).get(email);

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

// we hash the password now
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

		const paswordHash = await argon2.hash(password);

		const newUserResponse = db.transaction(() => {
			const userResult = db.prepare(`
			INSERT INTO users (
				username, password, display_name, email, bio,
				avatar_url, cover_photo_url, join_date
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`).run(
				username,
				paswordHash,
				display_name,
				email || null,
				bio || null,
				avatar_url || null,
				cover_photo_url || null,
				new Date().toISOString()
			);

			const newUserId = userResult.lastInsertRowid;

			db.prepare(
				'INSERT INTO game_settings (user_id, board_color, paddle_color, ball_color, score_color) VALUES (?, ?, ?, ?, ?)'
			).run(newUserId, '#000000', '#FFFFFF', '#FFFFFF', '#FFFFFF');

			db.prepare(
				'INSERT INTO user_stats (user_id, wins, losses, rank, level) VALUES (?, ?, ?, ?, ?)'
			).run(newUserId, 0, 0, 'Bronze', 1);

			const newUser = db.prepare(`
			SELECT
				id, username, display_name, email, bio,
				avatar_url, cover_photo_url, join_date,
				has_two_factor_auth, status, last_active, created_at
			FROM users
			WHERE id = ?
			`).get(newUserId);

			const { password: _, ...userResponse } = newUser;

			return userResponse;
		})();

		reply.code(201).send(newUserResponse);

	} catch (error) {
		if (error.message && error.message.includes('UNIQUE constraint failed: users.username')) {
			reply.code(409).send({ message: 'Username already exists' });
		} else if (error.message && error.message.includes('UNIQUE constraint failed: users.email')) {
			reply.code(409).send({ message: 'Email already exists' });
		}
		else if (error.message && error.message.includes('UNIQUE constraint failed: user_stats.user_id')) {
			req.log.error('Unexpected UNIQUE constraint failure on user_stats:', error);
			reply.code(500).send({ message: 'Error creating user stats (duplicate entry)' });
		}
		else if (error.message && error.message.includes('UNIQUE constraint failed: game_settings.user_id')) {
			req.log.error('Unexpected UNIQUE constraint failure on game_settings:', error);
			reply.code(500).send({ message: 'Error creating game settings (duplicate entry)' });
		}
		else {
			req.log.error('Error adding user (transaction catch):', error);
			reply.code(500).send({ message: 'Error adding user' });
		}
	}
};

const updateUser = async (req, reply) => {
	try {
		const { id } = req.params; // target user ID
		const authenticatedUserId = req.user.id; // Authenticated user ID from JWT (user not showing up)

		if (parseInt(id, 10) !== authenticatedUserId) {
			return reply.code(403).send({ message: 'Unauthorized: You can only update your own profile.' });
		}

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

		const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ? AND id = ?`; // updated
		params.push(id); // param ID
		params.push(authenticatedUserId); // auth ID

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
			if (err.message && err.message.includes('UNIQUE constraint failed: users.username')) {
				reply.code(409).send({ message: 'Username already exists' });
			} else if (err.message && err.message.includes('UNIQUE constraint failed: users.email')) {
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
		const authenticatedUserId = req.user.id;

		// Auth check
		if (parseInt(id, 10) !== authenticatedUserId) {
			return reply.code(403).send({ message: 'Unauthorized: You can only update your own profile.' });
		}

		const { display_name, bio, avatar_url, cover_photo_url } = req.body;
		const db = req.server.betterSqlite3;

		// Validate at least one field is being updated
		if (!display_name && bio === undefined && avatar_url === undefined && cover_photo_url === undefined) {
			return reply.code(400).send({ message: 'No profile updates provided' });
		}

		const setClauses = [];
		const params = [];
		
		if (display_name !== undefined) {
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

		const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ? AND id = ?`;
		params.push(id); // param ID
		params.push(authenticatedUserId); // auth ID

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

		const authenticatedUserId = req.user.id; // auth id from JWT
		// Auth check
		if (parseInt(id, 10) !== authenticatedUserId) {
			return reply.code(403).send({ message: 'Unauthorized: You can only delete your own account.' }); // 403 Forbidden
		}

		const db = req.server.betterSqlite3;
		// Make sure we don't delete the wrong user
		const sql = 'DELETE FROM users WHERE id = ? AND id = ?';

		const result = db.prepare(sql).run(id, authenticatedUserId);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'User not found or does not match authenticated user.' });
		} else {
			reply.send({ message: `User ${id} has been removed` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error deleting user' });
	}
};

//frontend code must immediately clear the JWT from localStorage after logging out
// user is logged in when they have a valid JWT token, this is mostly aesthetic
const loginUser = async (req, reply) => {
	try {
		const { username, password } = req.body;

		const db = req.server.betterSqlite3;

		if (!username || !password) {
			return reply.code(400).send({ message: 'Username and password required' });
		}

		const user = db.prepare(`
			SELECT id, username, password, display_name, status FROM users WHERE username = ?
		`).get(username);

		if (!user) { // user not found, we don't reveal that much for security
			return reply.code(401).send({ message: 'Invalid credentials' });
		}

		const isPasswordValid = await argon2.verify(user.password, password);

		if (!isPasswordValid) { // invalid pass
			return reply.code(401).send({ message: 'Invalid credentials' });
		}

		// if (user.status === 'online') {
		// 	req.log.info(`Login attempted for user ${user.id} but they are already online.`);
		// 	// just issue a new token
		// 	const token = req.server.jwt.sign({ id: user.id, username: user.username });
 		// 	// send the same response structure as a fresh login
		// 	return reply.code(200).send({ token: token, user: { id: user.id, username: user.username, display_name: user.display_name} });
		// }

		// update user status
		db.prepare('UPDATE users SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?').run('online', user.id);

		// generate JWT if credentials are valid
		const token = req.server.jwt.sign({ id: user.id, username: user.username });

		reply.code(200).send({ token: token, user: { id: user.id, username: user.username, display_name: user.display_name} });
	} catch (error) {
		req.log.error(error, 'Login error details:');
		reply.code(500).send({ message: 'Login failed' });
	}
};

// user is logged out when they don' have a valid JWT token, this is mostly aesthetic
const logoutUser = async (req, reply) => {
	try {
		const authenticatedUserId = req.user.id;

		const db = req.server.betterSqlite3; // Access the database connection

		const userStatus = db.prepare('SELECT status FROM users WHERE id = ?').get(authenticatedUserId);
		if (!userStatus || userStatus.status === 'offline') {
			req.log.info(`Logout attempted for user ${authenticatedUserId} but they are already offline.`);
			return reply.code(200).send({ message: 'User is already logged out.' });
		}

		// update status
		db.prepare('UPDATE users SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?').run('offline', authenticatedUserId);

		req.log.info(`User ${authenticatedUserId} status updated to offline.`);

		reply.code(200).send({ message: 'Logged out successfully' });

	} catch (error) {
		req.log.error(error, 'Logout error details:');
		reply.code(500).send({ message: 'Logout failed' });
	}
};

const uploadAvatar = async (req, reply) => {
	try {
		const authenticatedUserId = req.user ? req.user.id : null; // Get user ID from token

		// Get the target user ID from the route parameters
		const targetUserId = parseInt(req.params.userId, 10);

		// If user is not authenticated OR authenticated user ID does not match the target ID
		if (!authenticatedUserId || authenticatedUserId !== targetUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only upload your own avatar.' });
			return;
		}

		// Ensure the request is multipart/form-data
		if (!req.isMultipart()) {
			reply.code(415).send({ message: 'Unsupported Media Type: Must be multipart/form-data' });
			return;
		}

		// Process the file upload
		const file = await req.file(); // Get the file from the request (returns a stream)

		if (!file) {
			reply.code(400).send({ message: 'No file uploaded' });
			return;
		}

		// maybe implement stricter validation
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
		if (!allowedTypes.includes(file.mimetype)) {
			reply.code(400).send({ message: `Invalid file type. Only ${allowedTypes.join(', ')} are allowed.` });
			return;
		}

		// Generate a unique filename to avoid collisions
		const fileExtension = path.extname(file.filename);
		const uniqueFilename = `${targetUserId}-${Date.now()}${fileExtension}`;
		const filePath = path.join(AVATAR_UPLOAD_DIR, uniqueFilename);
		const fileUrl = `/uploads/avatars/${uniqueFilename}`; // Public URL path relative to static root

		// Save the file to disk
		const writeStream = fs.createWriteStream(filePath);
		try {
			await pipeline(file.file, writeStream); // Pipe the incoming file stream to the file on disk
		} catch (pipelineError) {
			req.log.error('Error writing file to disk:', pipelineError);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
			throw pipelineError;
		}

		const db = req.server.betterSqlite3;

		const result = db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(fileUrl, targetUserId);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'User not found or no changes made' });
		} else {
			// maybe delete old avatar
			reply.code(200).send({ message: 'Avatar uploaded successfully', avatar_url: fileUrl });
		}

	} catch (error) {
		req.log.error(error);
		if (error.message === 'Reach file size limit') {
			reply.code(413).send({ message: 'File size exceeds limit.' });
		} else {
			reply.code(500).send({ message: 'Error uploading avatar' });
		}
	}
};

module.exports = {
	getUsers,
	getCurrentUser,
	getUser,
	getUserByName,
	getUserByEmail,
	getUserProfile,
	addUser,
	deleteUser,
	updateUser,
	updateUserProfile,
	loginUser,
	logoutUser,
	uploadAvatar
};
