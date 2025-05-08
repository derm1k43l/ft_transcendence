const {
	getUsers,
	getUser,
	addUser,
	deleteUser,
	updateUser,
	getUserProfile,
	updateUserProfile,
	loginUser,
	logoutUser
} = require('../controllers/userController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
	UnauthorizedErrorSchema,
} = require('../schemas/errorSchema');

const { User, loginBody, loginResponse } = require('../schemas/userSchema');

const authPreHandler = require('./authPreHandlerRoutes');

// Options for get all Users, not sure if it should be protected with auth
const getUsersOpts = {
	schema: {
		response: {
			200: {
				type: 'array',
				items: User
			},
			500: BasicErrorSchema
		}
	},
	handler: getUsers
};

const getUserOpts = {
	preHandler: [authPreHandler],
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
			404: BasicErrorSchema,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: getUser
};

const getUserProfileOpts = { //not sure if this should be protected with auth
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
			400: ValidationErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
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
				bio: { type: 'string', nullable: true },
				avatar_url: { type: 'string', nullable: true }, //check these if they are required
				cover_photo_url: { type: 'string', nullable: true }
			}
		},
		response: {
			201: User,
			400: ValidationErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: addUser
};

//controller needs to check if req.user.id matches req.params.id., so only the req user can update itself
const updateUserOpts = {
	preHandler: [authPreHandler],
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
				username: { type: 'string' }, // not sure if username update should be allowed UNIQUE constraints could have problems
				display_name: { type: 'string' },
				email: { type: 'string' }, // not sure if email update should be allowed UNIQUE constraints could have problems
				bio: { type: 'string', nullable: true },
				avatar_url: { type: 'string', nullable: true },
				cover_photo_url: { type: 'string', nullable: true },
				has_two_factor_auth: { type: 'integer', enum: [0, 1] }, // has to be 0 or 1
				status: { type: 'string' }
			},
			minProperties: 1 // must provide at least one field to update
		},
		response: {
			200: User,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			404: BasicErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: updateUser
};

const updateUserProfileOpts = {
	preHandler: [authPreHandler],
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
				bio: { type: 'string', nullable: true },
				avatar_url: { type: 'string', nullable: true },
				cover_photo_url: { type: 'string', nullable: true }
			},
			minProperties: 1 // at least 1
		},
		response: {
			200: User,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: updateUserProfile
};

const deleteUserOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		response: {
			200: BasicErrorSchema, // fine for just the message
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: deleteUser
};

const loginUserOpts = {
	schema: {
		body: loginBody,
		response: {
			200: loginResponse,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: loginUser,
};

const logoutUserOpts = {
	preHandler: [authPreHandler],
	schema: {
		response: {
			200: BasicErrorSchema,
			401: UnauthorizedErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: logoutUser,
};

function userRoutes(fastify, options, done) {
	// Get all Users (verify if auth is needed)
	fastify.get('/', getUsersOpts);

	// Get single User - Protected
	fastify.get('/:id', getUserOpts);

	// Get user profile (same as getUser but might include more data in future) - (verify if auth is needed)
	fastify.get('/:id/profile', getUserProfileOpts);

	// Add User - Public
	fastify.post('/', postUserOpts);

	// Login User - Public
	fastify.post('/login', loginUserOpts);

	// Log out User
	fastify.post('/log-out', logoutUserOpts);

	// Update User (full update) - Protected, make sure only authenticated user's data can be updated
	fastify.put('/:id', updateUserOpts);

	// Update User Profile (partial update) - Protected, make sure only authenticated user's data can be updated
	fastify.patch('/:id/profile', updateUserProfileOpts);

	// Delete User - protected, should only delete authenticated user's account
	fastify.delete('/:id', deleteUserOpts);

	done();
}

module.exports = userRoutes;
