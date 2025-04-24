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