const {
	getUsers,
	getUser,
	addUser,
	deleteUser,
	updateUser,
	getUserProfile,
	updateUserProfile
} = require('../controllers/userController');

const { User } = require('../schemas/userSchema');

// Options for get all Users
const getUsersOpts = {
	schema: {
	response: {
		200: {
		type: 'array',
		items: User
		}
	}
	},
	handler: getUsers
};

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
	}
	},
	handler: getUser
};

const getUserProfileOpts = {
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
	}
	},
	handler: getUserProfile
};

const postUserOpts = {
	schema: {
	body: {
		type: 'object',
		required: ['username', 'password', 'display_name'],
		properties: {
		username: { type: 'string' },
		password: { type: 'string' },
		display_name: { type: 'string' },
		email: { type: 'string' },
		bio: { type: 'string' },
		avatar_url: { type: 'string' },
		cover_photo_url: { type: 'string' }
		}
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
	}
	},
	handler: addUser
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
		properties: {
		username: { type: 'string' },
		display_name: { type: 'string' },
		email: { type: 'string' },
		bio: { type: 'string' },
		avatar_url: { type: 'string' },
		cover_photo_url: { type: 'string' },
		has_two_factor_auth: { type: 'integer' },
		status: { type: 'string' }
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
	}
	},
	handler: updateUser
};

const updateUserProfileOpts = {
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
		properties: {
		display_name: { type: 'string' },
		bio: { type: 'string' },
		avatar_url: { type: 'string' },
		cover_photo_url: { type: 'string' }
		}
	},
	response: {
		200: User,
		404: {
		type: 'object',
		properties: {
			message: { type: 'string' }
		}
		}
	}
	},
	handler: updateUserProfile
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
			message: { type: 'string' }
		}
		},
		404: {
		type: 'object',
		properties: {
			message: { type: 'string' }
		}
		}
	}
	},
	handler: deleteUser
};

function userRoutes(fastify, options, done) {
	// Get all Users
	fastify.get('/users', getUsersOpts);

	// Get single User
	fastify.get('/users/:id', getUserOpts);

	// Get user profile (same as getUser but might include more data in future)
	fastify.get('/users/:id/profile', getUserProfileOpts);

	// Add User
	fastify.post('/users', postUserOpts);

	// Update User (full update)
	fastify.put('/users/:id', updateUserOpts);

	// Update User Profile (partial update)
	fastify.patch('/users/:id/profile', updateUserProfileOpts);

	// Delete User
	fastify.delete('/users/:id', deleteUserOpts);

	done();
}

module.exports = userRoutes;