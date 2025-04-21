const {
	getUsers,
	getUser,
	addUser,
	deleteUser,
	updateUser,
	} = require('../controllers/userController')

// User schema
const User = {
	type: 'object',
	properties: {
		id: {type: 'integer'},
		username: {type: 'string'},
		created_at: { type: 'string' },
	},
};

// Options for get all Users
const getUsersOpts = {
	schema: {
		response: {
			200: {
				type: 'array',
				items: User,
			},
		},
	},
	handler: getUsers,
}

const getUserOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		response: {
			200: User,
			404: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: getUser,
};

const postUserOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['username'],
			properties: {
				username: { type: 'string'},
			},
		},
		response: {
			201: User,
			400: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			409: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: addUser,
};

const deleteUserOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		response: {
			200: {
				type: 'object',
				properties: {
					message: {type: 'string'}
				},
			},
			404: {
				 type: 'object',
				 properties: {
					 message: { type: 'string' }
				 }
			 }
		},
	},
	handler: deleteUser,
};

const updateUserOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		 body: {
			type: 'object',
			required: ['username'],
			properties: {
				username: { type: 'string'}
			}
		 },
		response: {
			200: User,
			 404: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			409: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: updateUser,
};

function userRoutes (fastify, options, done) {
	// Get all Users
	fastify.get('/users', getUsersOpts);

	// Get single User
	fastify.get('/users/:id', getUserOpts);

	// Add User
	fastify.post('/users', postUserOpts);

	// Delete User
	fastify.delete('/users/:id', deleteUserOpts);

	// Update User
	fastify.put('/users/:id', updateUserOpts);

	done();
}

module.exports = userRoutes;
