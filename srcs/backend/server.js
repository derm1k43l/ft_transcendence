/*
TODO: 
	password not hashed yet!
*/

const fastify = require('fastify')( {logger: true} );
const fs = require('fs'); //optional
const path = require('path'); //optional

const dbDir = path.resolve(__dirname, './db');
if (!fs.existsSync(dbDir)) {
	console.log('Setting up dbDir!');
	fs.mkdirSync(dbDir, { recursive: true });
}

// SQLite plugin
fastify.register(require('@punkish/fastify-better-sqlite3'), {
	database: path.resolve(dbDir, 'mydb.sqlite')
});

fastify.register(require('./routes/userRoutes'));
fastify.register(require('./routes/userStatsRoutes'));
fastify.register(require('./routes/gameSettingsRoutes'));
fastify.register(require('./routes/matchHistoryRoutes'));
fastify.register(require('./routes/achievementsRoutes'));
fastify.register(require('./routes/friendsRoutes'));
fastify.register(require('./routes/friendRequestsRoutes'));

const PORT = process.env.PORT ||  3000;

// This hook runs after plugins are registered
fastify.after((err) => {
	if (err) console.error(err);

	try {
		// Access database instance
		const db = fastify.betterSqlite3;
		//Initialize the database: Create the table if it doesn't exist
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
			sound_enabled INTEGER DEFAULT 1,
			vibration_enabled INTEGER DEFAULT 1,
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS match_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			opponent_id INTEGER NOT NULL,
			opponent_name TEXT NOT NULL,
			result TEXT NOT NULL CHECK(result IN ('win', 'loss', 'draw')),
			score TEXT NOT NULL,
			date TEXT NOT NULL,
			duration TEXT,
			game_mode TEXT,
			FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
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
		`);
		fastify.log.info('Database initialized (tables checked/created).');

	} catch(dbERR) {
		fastify.log.error('Database initialization failed: ', dbERR);
		// process.exit(1); //might wanna exit here
	}
});


const start = async() => {
	try {
		// Wait for 'after' hook
		await fastify.ready();

		await fastify.listen({ port: PORT, host: '0.0.0.0' });
	} catch(error) {
		fastify.log.error(error);
		process.exit(1);
	}
};

start();