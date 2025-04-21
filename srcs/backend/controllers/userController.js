
// Controller functions are async Fastify handlers
const getUsers = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;
		const users = db.prepare('SELECT * FROM users').all();
		reply.send(users);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving users '});
	}
}

const getUser = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;
		const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

		if (!user) {
			reply.code(404).send({ message: 'user not found' });
		} else {
			reply.send(user);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user' });
	}
}

const addUser = async (req, reply) => {
	try {
		const { username } = req.body;
		const db = req.server.betterSqlite3;

		if (!username) {
			reply.code(400).send({ message: 'Username is required' });
			return;
		}

		try {
			const result = db.prepare('INSERT INTO users (username) VALUES (?)').run(username);
			const newUserId = result.lastInsertedRowid;
			const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId);
			reply.code(201).send(newUser);
		} catch (err) {
			if (err.message.includes('UNIQUE constraint failed')) {
				reply.code(409).send({ message: 'Username already exists' });
			} else {
				throw err;
			}
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error adding user' });
	}
}

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
		reply.log.error(error);
		reply.code(500).send({ message: 'Error deleting user '});
	}
}

const updateUser = async (req, reply) => {
	try {
		const { id } = req.params;
		const { username } = req.body;
	
		const db = req.server.betterSqlite3;
	
		if (!username) {
			reply.code(400).send({ message: 'Username is required for update' });
			return;
		}
	
		try {
			const result = db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, id);
	
			if (result.changes === 0) {
				reply.code(404).send({ message: 'User not found' });
			} else {
				const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
				reply.send(updatedUser);
			}
		} catch (err) {
			if (err.message.includes('UNIQUE constraint failed')) {
				reply.code(409).send({ message: 'Username already exists' });
			} else {
				throw err;
			}
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating user '});
	}
}

module.exports = {
	getUsers,
	getUser,
	addUser,
	deleteUser,
	updateUser,
};
