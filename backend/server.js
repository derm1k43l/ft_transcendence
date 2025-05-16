/*
TODO: 
	add authentication to many schemas (add forbidden(when in controllers) and unauth errors(ALWAYS) to protected schemas)
			general rule of thumb: Any route that deals with user-specific data or
				performs an action on behalf of a specific authenticated user should require authentication.
	so far achievements, chatMessages, friends & friend requests, game settings done
	figure out how to make http into https (reverse proxy container, Caddy or Nginx?)
	change tournament as requested (done?)
	Look into simplifying match history, no longer needs tournament
*/

const fastify = require('fastify')( {logger: true} );
const fs = require('fs'); //optional
const path = require('path'); //optional
const Database = require('better-sqlite3');
const jwt = require('@fastify/jwt');
const fastifyMultipart = require('@fastify/multipart');
const fastifyStatic = require('@fastify/static');

const dbDir = path.resolve(__dirname, './db');

if (!fs.existsSync(dbDir)) {
	console.log('Setting up dbDir!');
	fs.mkdirSync(dbDir, { recursive: true });
}

const dbFilePath = path.resolve(dbDir, 'mydb.sqlite'); // Store the resolved path
console.log(`Attempting to use database file at: ${dbFilePath}`);

// Create the database instance directly and globally accessible
let db; // Uses 'let' so it can be assigned
try {
	db = new Database(dbFilePath);
	console.log("Database is correctly running in file-backed mode."); // debugging log
	if (db.memory) {
		console.error("CRITICAL ERROR: Database is running IN-MEMORY despite file path being provided!");
		process.exit(1); // Exit if it's unexpectedly in-memory
	}

	db.exec('PRAGMA foreign_keys = ON;'); // should be on by default
	db.exec('PRAGMA journal_mode = DELETE;');
	db.exec('PRAGMA synchronous = FULL;');
} catch (err) {
	console.error(`Error opening database at ${dbFilePath}:`, err);
	process.exit(1); // Exit if database connection fails
}

// decorate fastify instance with db connection
fastify.decorate('betterSqlite3', db);

fastify.register(fastifyMultipart, {
	limits: {
		fileSize: 10 * 1024 * 1024, // max 10 MB to upload
		files: 1 // max 1 file to upload
	}
});

const UPLOAD_DIR = path.join(__dirname, './uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
	fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

fastify.register(fastifyStatic, {
	root: UPLOAD_DIR,
	prefix: '/uploads/', // /uploads url
	immutable: true,
});

// create secret key (only need to run it once and copy the output and it's useable as the secret)
const crypto = require('crypto'); // built into node.js
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log("Generated JWT Secret:", jwtSecret); //not used yet

// adding JWT registration
fastify.register(jwt, {
	secret: 'notsurehowthisworksyet!', // should be a secure random key (for testing for now)
	// secret: jwtSecret, // like this?
});

const cors = require('@fastify/cors');

// register CORS
fastify.register(cors, {
	origin: ['http://127.0.0.1:8080', 'http://localhost:8080', 'http://10.12.5.1:8080'], //temporary solution. we might have to setup a proxy in frontend to forwards api requests through the docker network
	// origin: 'http://localhost:8080',
	// origin: 'http://localhost:3000 //dev

	// Optionally allow requests from multiple specific origins
	// origin: ['http://localhost:8080', 'https://your-production-frontend.com'],

	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Specify allowed methods
	allowedHeaders: ['Origin', 'X-Requested-With', 'Accept', 'Content-Type', 'Authorization'], // Specify allowed headers
	credentials: true //for authorization headers
});

fastify.register(require('./routes/userRoutes'), { prefix: '/api/users' });
fastify.register(require('./routes/userStatsRoutes'), { prefix: 'api/users/stats' });
fastify.register(require('./routes/gameSettingsRoutes'), { prefix: '/api/game-settings' });
fastify.register(require('./routes/matchHistoryRoutes'), { prefix: '/api/match-history' });
fastify.register(require('./routes/achievementsRoutes'), { prefix: '/api/achievements' });
fastify.register(require('./routes/friendsRoutes'), { prefix: '/api/friends' });
fastify.register(require('./routes/friendRequestsRoutes'), { prefix: '/api/friend-requests' });
fastify.register(require('./routes/chatMessagesRoutes'), { prefix: 'api/chat-messages' });
fastify.register(require('./routes/notificationsRoutes'), { prefix: '/api/notifications' });
fastify.register(require('./routes/tournamentRoutes'), { prefix: '/api/tournament' });

const PORT = process.env.PORT || 3000;

// This hook runs after plugins are registered
fastify.after((err) => {
	if (err) console.error(err);

	try {
		db.exec(`
			CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			display_name TEXT NOT NULL,
			email TEXT UNIQUE,
			bio TEXT,
			avatar_url TEXT,
			cover_photo_url TEXT,
			join_date TEXT,
			has_two_factor_auth INTEGER DEFAULT 0,
			status TEXT DEFAULT 'offline',
			last_active TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS user_stats (
			user_id INTEGER PRIMARY KEY,
			wins INTEGER DEFAULT 0,
			losses INTEGER DEFAULT 0,
			rank TEXT,
			level INTEGER DEFAULT 1,
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS game_settings (
			user_id INTEGER PRIMARY KEY,
			board_color TEXT DEFAULT '#000000',
			paddle_color TEXT DEFAULT '#FFFFFF',
			ball_color TEXT DEFAULT '#FFFFFF',
			score_color TEXT DEFAULT '#FFFFFF',
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS match_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			opponent_id INTEGER,
			opponent_name TEXT NOT NULL,
			result TEXT NOT NULL CHECK(result IN ('win', 'loss', 'draw')),
			score TEXT NOT NULL,
			date TEXT NOT NULL,
			duration TEXT,
			game_mode TEXT,
			status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'finished')),
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
			FOREIGN KEY (opponent_id) REFERENCES users (id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS achievements (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			description TEXT NOT NULL,
			icon TEXT NOT NULL,
			completed INTEGER DEFAULT 0,
			date_completed TEXT,
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS friends (
			user_id INTEGER NOT NULL,
			friend_id INTEGER NOT NULL,
			PRIMARY KEY (user_id, friend_id),
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
			FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS friend_requests (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			from_user_id INTEGER NOT NULL,
			to_user_id INTEGER NOT NULL,
			status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')),
			date TEXT NOT NULL,
			FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE CASCADE,
			FOREIGN KEY (to_user_id) REFERENCES users (id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS chat_messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			sender_id INTEGER NOT NULL,
			receiver_id INTEGER NOT NULL,
			content TEXT NOT NULL,
			timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
			read INTEGER DEFAULT 0,
			FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
			FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS notifications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			type TEXT NOT NULL CHECK(type IN ('friendRequest', 'gameInvite', 'achievement', 'system')),
			message TEXT NOT NULL,
			read INTEGER DEFAULT 0,
			timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
			action_url TEXT,
			related_user_id INTEGER,
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
			FOREIGN KEY (related_user_id) REFERENCES users (id) ON DELETE SET NULL
			);

			CREATE TABLE IF NOT EXISTS tournaments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tournament_name TEXT NOT NULL,
			creator_id INTEGER NOT NULL,
			player_amount INTEGER NOT NULL,
			status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'finished')),
			winner_name TEXT,
			player_names TEXT,
			matches_data TEXT,
			FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
			);
		`);
		fastify.log.info('Database initialized (tables checked/created).');
		console.log('Database connection appears successful.');
	} catch(dbERR) {
		fastify.log.error('Database initialization failed: ', dbERR);
		process.exit(1);
	}
});

// Register the database close logic with Fastify's onClose hook
fastify.addHook('onClose', (instance, done) => {
	console.log('Fastify shutting down, closing database connection...');
	const db = instance.betterSqlite3; // Access the db instance
	if (db && typeof db.close === 'function') {
		try {
			db.close();
			console.log('Database connection closed cleanly.');
			done(); // Signal the hook is complete
		} catch (closeErr) {
			console.error('Error closing database connection:', closeErr);
			done(closeErr); // Signal hook complete with error
		}
	} else {
		console.warn('Database instance not found or cannot be closed on shutdown.');
		done(); // Nothing to close
	}
});

// These handlers will catch signals like Ctrl+C and explicitly call fastify.close()
process.on('SIGINT', () => { // SIGINT is Ctrl+C
	console.log('SIGINT received, ensuring database connection is closed directly...'); // Log this
	const db = fastify.betterSqlite3; // Access the db instance
	if (db && typeof db.close === 'function') {
		try {
			 db.close(); // Close the connection synchronously
			 console.log('Database connection closed cleanly directly from SIGINT handler.'); // Log this
		} catch (closeErr) {
			 console.error('Error closing database connection directly from SIGINT handler:', closeErr); // Log this
		}
	} else {
		console.warn('Database instance not found for final close attempt in SIGINT handler.'); // Log this
	}
	process.exit(0); // Exit cleanly
});

process.on('SIGTERM', () => { // SIGTERM is sent by process managers like Docker, PM2
	console.log('SIGTERM received, ensuring database connection is closed directly...'); // Log this
	const db = fastify.betterSqlite3;
	if (db && typeof db.close === 'function') {
		try {
			db.close();
			console.log('Database connection closed cleanly directly from SIGTERM handler.');
		} catch (closeErr) {
			console.error('Error closing database connection directly from SIGTERM handler:', closeErr);
		}
	} else {
		console.warn('Database instance not found for final close attempt in SIGTERM handler.');
	}
	process.exit(0);
});

const start = async() => {
	try {
		// Wait for 'after' hook
		await fastify.ready();

		await fastify.listen({ port: PORT, host: '0.0.0.0' });

		// Log listening addresses after server starts
		console.log(`Server listening on ${PORT}`);
		console.log('Server listening at', fastify.addresses());
	} catch(error) {
		fastify.log.error('Error starting server:', error);
		process.exit(1);
	}
};

start();
