const argon2 = require('argon2');
const { pipeline } = require('stream/promises');
const path = require('path');
const fs = require('fs');

const AVATAR_UPLOAD_DIR = path.join(__dirname, '../uploads/avatars');
const COVER_UPLOAD_DIR = path.join(__dirname, '../uploads/covers');

if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
	fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(COVER_UPLOAD_DIR)) {
	fs.mkdirSync(COVER_UPLOAD_DIR, { recursive: true });
}

// Controller for GET / (Get all Users - Public)
const getUsers = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;
		const users = db.prepare(`
			SELECT 
			id, username, display_name, email, bio,
			avatar_url, cover_photo_url, join_date,
			status, last_active
			FROM users
		`).all();
		reply.code(200).send(users);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving users' });
	}
};

// Controller for GET /current (Get current User - Requires AUTH)
const getCurrentUser = async (req, reply) => {
	// const decodedToken = await req.jwtVerify();
	// if (!decodedToken || !decodedToken.id) {
	// 	return reply.code(401).send({ message: 'Invalid or missing token' });
	// }
	// const { id } = decodedToken;

	const authenticatedUserId = req.user.id;
	try {

		const db = req.server.betterSqlite3;

		const user = db.prepare(`
			SELECT 
			id, username, display_name, email, bio,
			avatar_url, cover_photo_url, join_date,
			has_two_factor_auth, status, last_active, created_at
			FROM users 
			WHERE id = ?
		`).get(authenticatedUserId);

		if (!user) {
			return reply.code(404).send({ message: 'User not found' });
		}

		const { password, ...userResponse } = user;
		reply.code(200).send(userResponse);

		reply.send(user);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user' });
	}
};

// Controller for GET /:id (Get single User by ID - Public)
const getUser = async (req, reply) => {
	try {
		const targetUserId = parseInt(req.params.id, 10);
		const db = req.server.betterSqlite3;
		
		const user = db.prepare(`
			SELECT 
			id, username, display_name, bio,
			avatar_url, cover_photo_url, join_date,
			status, last_active
			FROM users 
			WHERE id = ?
		`).get(targetUserId);

		if (!user) {
			reply.code(404).send({ message: 'User not found' });
		} else {
			reply.code(200).send(user);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user' });
	}
};

// Controller for GET /byname/:username (Get User by Username - Public)
const getUserByName = async (req, reply) => {
	try {
		const { username } = req.params;
		const db = req.server.betterSqlite3;
		
		const user = db.prepare(`
			SELECT 
			id, username, display_name, bio,
			avatar_url, cover_photo_url, join_date,
			status, last_active
			FROM users 
			WHERE username = ?
		`).get(username);

		if (!user) {
			reply.code(404).send({ message: 'User not found' });
		} else {
			reply.code(200).send(user);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user' });
	}
};

// Controller for GET /byemail/:email (Get User by Email - Requires AUTH + MATCHING ID CHECK)
const getUserByEmail = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const { email } = req.params;
	try {
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
			return;
		}

		// AUTHORIZATION CHECK: Ensure the authenticated user is the owner of this email
		if (user.id !== authenticatedUserId) {
			reply.code(403).send({ message: 'Forbidden: You can only look up your own email address.' });
			return;
		}

		const { password, ...userResponse } = user;
		reply.code(200).send(userResponse);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user' });
	}
};

// Controller for GET /:id/profile (Get user profile by ID - Public)
const getUserProfile = async (req, reply) => {
	try {
		const targetUserId = parseInt(req.params.id, 10);
		const db = req.server.betterSqlite3;
		
		const user = db.prepare(`
			SELECT 
			id, username, display_name, bio,
			avatar_url, cover_photo_url, join_date,
			status, last_active
			FROM users 
			WHERE id = ?
		`).get(targetUserId);

		if (!user) {
			reply.code(404).send({ message: 'User not found' });
		} else {
			reply.code(200).send(user);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user profile' });
	}
};

// Controller for POST / (Add User - Public), we hash the password now
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

		const paswordHash = await argon2.hash(password);

		const newUserResponse = db.transaction(() => {
			const userResult = db.prepare(`
			INSERT INTO users (
				username, password, display_name, email, bio, avatar_url, cover_photo_url,
				join_date, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).run(
				username,
				paswordHash,
				display_name,
				email,
				bio || null,
				avatar_url,
				cover_photo_url,
				new Date().toISOString(),
				new Date().toISOString()
			);

			const newUserId = userResult.lastInsertRowid;

			// Insert initial game settings
			db.prepare(
				'INSERT INTO game_settings (user_id, board_color, paddle_color, ball_color, score_color) VALUES (?, ?, ?, ?, ?)'
			).run(newUserId, '#000000', '#FFFFFF', '#FFFFFF', '#FFFFFF');

			// Insert initial user stats
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

// Controller for PUT /:id (Update User - Requires AUTH + MATCHING ID CHECK)
const updateUser = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.id, 10);

	if (isNaN(targetUserId)) {
		req.log.warn(`Invalid user ID parameter received for updateUser: ${req.params.id}`);
		return reply.code(400).send({ message: 'Invalid user ID format in URL.' });
	}

	// AUTHORIZATION CHECK: Ensure authenticated user is updating their OWN account
	if (targetUserId !== authenticatedUserId) {
		return reply.code(403).send({ message: 'Forbidden: You can only update your own profile.' });
	}

	const updates = req.body;
	const db = req.server.betterSqlite3;

	if (Object.keys(updates).length === 0) {
		return reply.code(400).send({ message: 'No valid updates provided' });
	}

	if (updates.hasOwnProperty('password')) {
		return reply.code(400).send({ message: 'Password cannot be updated via this endpoint. Use the dedicated password update route.' });
	}

	if (updates.hasOwnProperty('join_date') || updates.hasOwnProperty('created_at')) {
		return reply.code(400).send({ message: 'Join date and creation date cannot be updated.' });
	}

	const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(authenticatedUserId);
	if (!userExists) {
		req.log.error(`Authenticated user ID ${authenticatedUserId} not found in DB during updateUser existence check.`);
		return reply.code(404).send({ message: 'User not found.' });
	}

	const setClauses = [];
	const params = [];

	const allowedFields = [
		'username', 'display_name', 'email', 'bio',
		'avatar_url', 'cover_photo_url', 'has_two_factor_auth', 'status'
	];

	Object.entries(updates).forEach(([key, value]) => {
		const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

		if (allowedFields.includes(key)) {
			setClauses.push(`${dbKey} = ?`);
			params.push(value);
		} else {
			req.log.warn(`Ignoring disallowed update field "${key}" for user ${authenticatedUserId}`);
		}
	});

	if (setClauses.length === 0) {
		return reply.code(400).send({ message: 'No valid fields provided for update.' });
	}

	const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
	params.push(authenticatedUserId);

	try {
		const result = db.prepare(sql).run(...params);

		if (result.changes === 0) {
			return reply.code(200).send({ message: 'No changes made to user (values were already the same).' });
		}

		// Return updated user
		const updatedUser = db.prepare(`
		SELECT 
			id, username, display_name, email, bio,
			avatar_url, cover_photo_url, join_date,
			has_two_factor_auth, status, last_active, created_at
		FROM users 
		WHERE id = ?
		`).get(authenticatedUserId);

		const { password: _, ...userResponse } = updatedUser;
		reply.code(200).send(userResponse);
	} catch (err) {
		if (err.message && err.message.includes('UNIQUE constraint failed: users.username')) {
			reply.code(409).send({ message: 'Username already exists' });
		} else if (err.message && err.message.includes('UNIQUE constraint failed: users.email')) {
			reply.code(409).send({ message: 'Email already exists' });
		} else {
			req.log.error('Error updating user:', err);
			reply.code(500).send({ message: 'Error updating user' });
		}
	}
};

// Controller for PATCH /:id/profile (Update User Profile - Requires AUTH + MATCHING ID CHECK)
const updateUserProfile = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.id, 10);

	if (isNaN(targetUserId)) {
		req.log.warn(`Invalid user ID parameter received for updateUserProfile: ${req.params.id}`);
		return reply.code(400).send({ message: 'Invalid user ID format in URL.' });
	}

	// AUTHORIZATION CHECK: Ensure authenticated user is updating their OWN profile
	if (targetUserId !== authenticatedUserId) {
		return reply.code(403).send({ message: 'Forbidden: You can only update your own profile.' });
	}

	const updates = req.body;
	const db = req.server.betterSqlite3;

	if (Object.keys(updates).length === 0) {
		return reply.code(400).send({ message: 'No profile updates provided' });
	}

	const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(authenticatedUserId);
	if (!userExists) {
		req.log.error(`Authenticated user ID ${authenticatedUserId} not found in DB during updateUserProfile existence check.`);
		return reply.code(404).send({ message: 'User not found.' });
	}

	const setClauses = [];
	const params = [];

	const allowedFields = ['display_name', 'bio', 'avatar_url', 'cover_photo_url'];

	Object.entries(updates).forEach(([key, value]) => {
		const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

		if (allowedFields.includes(key)) {
			setClauses.push(`${dbKey} = ?`);
			params.push(value);
		} else {
			req.log.warn(`Ignoring disallowed profile update field "${key}" for user ${authenticatedUserId}`);
		}
	});

	if (setClauses.length === 0) {
		return reply.code(400).send({ message: 'No valid profile updates provided.' });
	}

	const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
	params.push(authenticatedUserId);

	try {
		const result = db.prepare(sql).run(...params);

		if (result.changes === 0) {
			return reply.code(200).send({ message: 'No changes made to user profile (values were already the same).' });
		}

		// Return updated user profile
		const updatedUser = db.prepare(`
			SELECT 
			id, username, display_name, email, bio,
			avatar_url, cover_photo_url, join_date,
			status, last_active
			FROM users 
			WHERE id = ?
		`).get(authenticatedUserId);

		reply.code(200).send(updatedUser);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating user profile' });
	}
};

// Controller for DELETE /:id (Delete User - Requires AUTH + MATCHING ID CHECK)
const deleteUser = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.id, 10);

	// AUTHORIZATION CHECK: Ensure authenticated user is deleting their OWN account
	if (targetUserId !== authenticatedUserId) {
		return reply.code(403).send({ message: 'Forbidden: You can only delete your own account.' });
	}
	try {
		const db = req.server.betterSqlite3;
		// Make sure we don't delete the wrong user
		const sql = 'DELETE FROM users WHERE id = ?';

		const result = db.prepare(sql).run(authenticatedUserId);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'User not found or does not match authenticated user.' });
		} else {
			reply.code(200).send({ message: `User ${authenticatedUserId} has been removed` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error deleting user' });
	}
};

//frontend code must immediately clear the JWT from localStorage after logging out
// Controller for POST /login (Login User - Public)
const loginUser = async (req, reply) => {
	try {
		const { username, password } = req.body;

		const db = req.server.betterSqlite3;
	
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

// Controller for POST /log-out (Log out User - Requires AUTH)
const logoutUser = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	try {
		const db = req.server.betterSqlite3;

		const userStatus = db.prepare('SELECT status FROM users WHERE id = ?').get(authenticatedUserId);
		if (!userStatus) {
			req.log.error(`User ID ${authenticatedUserId} not found during logout.`);
			return reply.code(404).send({ message: 'User not found.' });
		}
		if (userStatus.status === 'offline') {
			req.log.info(`Logout attempted for user ${authenticatedUserId} but they are already offline.`);
			return reply.code(200).send({ message: 'User is already logged out.' });
		}

		// update status
		const result = db.prepare('UPDATE users SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?').run('offline', authenticatedUserId);

		if (result.changes > 0) {
			req.log.info(`User ${authenticatedUserId} status updated to offline.`);
		} else {
			req.log.warn(`Logout attempted for user ${authenticatedUserId} but no changes were made.`);
		}

		reply.code(200).send({ message: 'Logged out successfully' });

	} catch (error) {
		req.log.error(error, 'Logout error details:');
		reply.code(500).send({ message: 'Logout failed' });
	}
};

// Controller for PUT /:userId/avatar (Upload Avatar - Requires AUTH + MATCHING USER ID CHECK)
const uploadAvatar = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.userId, 10);

	// AUTHORIZATION CHECK: Ensure authenticated user is uploading for their OWN account
	if (authenticatedUserId !== targetUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only upload your own avatar.' });
		return;
	}

	try {
		// Process the file upload
		const file = await req.file(); // Get the file from the request (returns a stream)

		if (!file) {
			reply.code(400).send({ message: 'No file uploaded' });
			return;
		}

		// maybe implement stricter validation
		if (!file.mimetype.startsWith('image/')) {
			reply.code(400).send({ message: 'Invalid file type. Only image files are allowed.' });
			return;
		}
		// Generate a unique filename to avoid collisions
		const fileExtension = path.extname(file.filename);
		const uniqueFilename = `${targetUserId}-${Date.now()}${fileExtension}`;
		const filePath = path.join(AVATAR_UPLOAD_DIR, uniqueFilename);
		// const fileUrl = `/uploads/avatars/${uniqueFilename}`; // Public URL path relative to static root
	
		const fileUrl = `http://localhost:3000/uploads/avatars/${uniqueFilename}`; // Full URL.
		// not clean but the only way that will work with our current setup
		// CHANGE TO HTTPS ONCE WE HAVE HTTPS!

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

		// optionally we could fetch and delete the old file
		const result = db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(fileUrl, authenticatedUserId);

		if (result.changes === 0) {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
			reply.code(404).send({ message: 'User not found or no changes made' });
		} else {
			// maybe delete old avatar
			reply.code(200).send({ message: 'Avatar uploaded successfully', avatar_url: fileUrl });
			console.log(avatar_url);
			console.log(fileUrl);
		}

	} catch (error) {
		req.log.error(error);
		if (error.message === 'Reach file size limit') {
			reply.code(413).send({ message: 'File size exceeds limit.' });
		} else if (error.message.includes('Failed to save file to disk.')) {
			reply.code(500).send({ message: 'Error saving uploaded file.' });
		} else {
			reply.code(500).send({ message: 'Error uploading avatar' });
		}
	}
};

// Controller for PUT /:userId/cover (Upload Cover Photo - Requires AUTH + MATCHING USER ID CHECK)
const uploadCover = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.userId, 10);

	// AUTHORIZATION CHECK: Ensure authenticated user is uploading for their OWN account
	if (authenticatedUserId !== targetUserId) {
		reply.code(403).send({ message: 'Forbidden: You can only upload your own cover photo.' });
		return;
	}

	try {
		// Process the file upload
		const file = await req.file(); // Get the file from the request (returns a stream)

		if (!file) {
			reply.code(400).send({ message: 'No file uploaded' });
			return;
		}

		// maybe implement stricter validation
		if (!file.mimetype.startsWith('image/')) {
			reply.code(400).send({ message: 'Invalid file type. Only image files are allowed.' });
			return;
		}

		// Generate a unique filename to avoid collisions
		const fileExtension = path.extname(file.filename);
		const uniqueFilename = `${targetUserId}-${Date.now()}${fileExtension}`;
		const filePath = path.join(COVER_UPLOAD_DIR, uniqueFilename);
		// const fileUrl = `/uploads/covers/${uniqueFilename}`; // Public URL path relative to static root
	
		const fileUrl = `http://localhost:3000/uploads/covers/${uniqueFilename}`; // Full URL.
		// not clean but the only way that will work with our current setup
		// CHANGE TO HTTPS ONCE WE HAVE HTTPS!

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

		// optionally delete old cover photo
		const result = db.prepare('UPDATE users SET cover_photo_url = ? WHERE id = ?').run(fileUrl, authenticatedUserId);

		if (result.changes === 0) {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
			reply.code(404).send({ message: 'User not found or no changes made' });
		} else {
			// maybe delete old cover
			reply.code(200).send({ message: 'Cover Photo uploaded successfully', cover_photo_url: fileUrl });
			console.log(cover_photo_url);
			console.log(fileUrl);
		}

	} catch (error) {
		req.log.error(error);
		if (error.message === 'Reach file size limit') {
			reply.code(413).send({ message: 'File size exceeds limit.' });
		} else if (error.message.includes('Failed to save file to disk.')) {
			reply.code(500).send({ message: 'Error saving uploaded file.' });
		}
		else {
			reply.code(500).send({ message: 'Error uploading cover' });
		}
	}
};

// Controller for PUT /:id/password (Update password - Requires AUTH + MATCHING ID CHECK + OLD PASSWORD CHECK)
const updatePassword = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.id, 10);

	// AUTHORIZATION CHECK: Ensure user is updating their own password
	if (targetUserId !== authenticatedUserId) {
		return reply.code(403).send({ message: 'Forbidden: You can only update your own password.' });
	}

	const { old_password, new_password } = req.body;

	try {
		const db = req.server.betterSqlite3;

		const user = db.prepare('SELECT id, password FROM users WHERE id = ?').get(authenticatedUserId);

		if (!user) {
			req.log.error(`User ID ${authenticatedUserId} not found after JWT verification.`);
			return reply.code(500).send({ message: 'Internal server error: User data not found.' });
		}

		const isOldPasswordValid = await argon2.verify(user.password, old_password);

		if (!isOldPasswordValid) {
			// SECURITY: Incorrect old password
			return reply.code(409).send({ message: 'Incorrect old password.' });
		}

		// Hash the new password
		const newPasswordHash = await argon2.hash(new_password);

		// Update the password in the database
		const result = db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPasswordHash, authenticatedUserId);

		if (result.changes === 0) {
			req.log.warn(`Password update attempted for user ${authenticatedUserId} but no changes were made.`);
			return reply.code(500).send({ message: 'Error updating password.' });
		}

		reply.code(200).send({ message: 'Password updated successfully.' });

	} catch (error) {
		req.log.error('Error updating password:', error);
		reply.code(500).send({ message: 'Error updating password.' });
	}
};

// Controller for POST /game-start (Set user status to 'ingame')
const gameStart = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.id, 10);

	// AUTHORIZATION CHECK: Ensure user is updating their own status
	if (targetUserId !== authenticatedUserId) {
		return reply.code(403).send({ message: 'Forbidden: You can only update your own status.' });
	}

	try {
		const db = req.server.betterSqlite3;

		// update to ingame
		const result = db.prepare('UPDATE users SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?').run('ingame', authenticatedUserId);

		if (result.changes === 0) {
			req.log.warn(`Game start status update attempted for user ${authenticatedUserId}, but no changes made.`);
			return reply.code(200).send({ message: 'User status is already ingame or user not found.' });
		}

		req.log.info(`User ${authenticatedUserId} status set to ingame.`);
		reply.code(200).send({ message: 'User status set to ingame.' });
	} catch (error) {
		req.log.error('Error setting user status to ingame:', error);
		reply.code(500).send({ message: 'Failed to set user status to ingame.' });
	}
};

// Controller for POST /game-end (Set user status back to 'online')
const gameEnd = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetUserId = parseInt(req.params.id, 10);

	// AUTHORIZATION CHECK: Ensure user is updating their own status
	if (targetUserId !== authenticatedUserId) {
		return reply.code(403).send({ message: 'Forbidden: You can only update your own status.' });
	}

	try {
		const db = req.server.betterSqlite3;

		// Update user status back to 'online'
		const result = db.prepare('UPDATE users SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?').run('online', authenticatedUserId);

		if (result.changes === 0) {
			req.log.warn(`Game end status update attempted for user ${authenticatedUserId}, but no changes made.`);
			return reply.code(200).send({ message: 'User status is already online or user not found.' });
		}

		req.log.info(`User ${authenticatedUserId} status set to online.`);
		reply.code(200).send({ message: 'User status set to online.' });
	} catch (error) {
		req.log.error('Error setting user status to online:', error);
		reply.code(500).send({ message: 'Failed to set user status to online.' });
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
	uploadAvatar,
	uploadCover,
	updatePassword,
	gameStart,
	gameEnd
};
