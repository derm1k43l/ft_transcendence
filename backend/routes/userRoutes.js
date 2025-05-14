const {
	getUsers,
	getCurrentUser,
	getUser,
	getUserByName,
	getUserByEmail,
	addUser,
	deleteUser,
	updateUser,
	getUserProfile,
	updateUserProfile,
	loginUser,
	logoutUser,
	uploadAvatar,
	updatePassword
} = require('../controllers/userController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
	UnauthorizedErrorSchema,
	ForbiddenErrorSchema,
} = require('../schemas/errorSchema');

const { User, loginBody, loginResponse, updatePasswordBody } = require('../schemas/userSchema');

const authPreHandler = require('./authPreHandlerRoutes');

const normalizeEmail = async (req, reply) => {
	if (req.body && req.body.email) {
		req.body.email = req.body.email.toLowerCase();
	}
	if (req.params && req.params.email) {
		req.params.email = req.params.email.toLowerCase();
	}
};

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

const getCurrentUserOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object'
		},
		response: {
			200: User,
			404: BasicErrorSchema,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: getCurrentUser
};

const getUserOpts = {
	// preHandler: [authPreHandler],
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

const getUserByNameOpts = {
	// preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				username: { type: 'string' }
			},
			required: ['username']
		},
		response: {
			200: User,
			404: BasicErrorSchema,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: getUserByName
};

const getUserByEmailOpts = {
	// preHandler: [authPreHandler],
	preHandler: [normalizeEmail],
	schema: {
		params: {
			type: 'object',
			properties: {
				email: { type: 'string' }
			},
			required: ['email']
		},
		response: {
			200: User,
			404: BasicErrorSchema,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: getUserByEmail
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
	preHandler: [normalizeEmail],
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

const uploadAvatarOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				userId: { type: 'integer', minimum: 1 }
			},
			required: ['userId']
		},
		response: {
			200: {
				type: 'object',
				properties: {
					message: { type: 'string' },
					avatar_url: { type: 'string', format: 'uri-reference' } // Return the new URL
				},
				required: ['message', 'avatar_url']
			},
			400: BasicErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			413: BasicErrorSchema,
			415: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: uploadAvatar,
};

const updatePasswordOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		body: updatePasswordBody,
		response: {
			200: BasicErrorSchema, // fine for message
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updatePassword,
};

function userRoutes(fastify, options, done) {
	// Get all Users (verify if auth is needed)
	fastify.get('/', getUsersOpts);

	// Get current User - Private
	fastify.get('/current', getCurrentUserOpts);

	// Get single User - Public
	fastify.get('/:id', getUserOpts);
	fastify.get('/byname/:username', getUserByNameOpts);
	fastify.get('/byemail/:email', getUserByEmailOpts);

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

	// Upload Avatar - Protected + Authorized
	fastify.put('/:userId/avatar', uploadAvatarOpts);

	// Update password
	fastify.put('/:id/password', updatePasswordOpts);

	// Delete User - protected, should only delete authenticated user's account
	fastify.delete('/:id', deleteUserOpts);

	done();
}

module.exports = userRoutes;
