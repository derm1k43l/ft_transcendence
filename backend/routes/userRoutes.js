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
	uploadCover,
	updatePassword,
	gameStart,
	gameEnd
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

const updateOnlineStatusPreHandler = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	try {
		const db = req.server.betterSqlite3;
		const result = db.prepare(`
			UPDATE users
			SET status = 'online', last_active = CURRENT_TIMESTAMP
			WHERE id = ? AND status != 'ingame'
		`).run(authenticatedUserId);

		if (result.changes > 0) {
			req.log.debug(`User ${authenticatedUserId} status updated to online and last_active.`);
		} else {
			req.log.debug(`User ${authenticatedUserId} status not updated (already ingame or not found).`);
		}
	} catch (error) {
		req.log.error('Error updating online status in pre-handler:', error);
	}
};

// Options for get all Users (Public route - adjust if privacy needed)
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

// Options for get current User (Requires AUTH)
const getCurrentUserOpts = {
	preHandler: [authPreHandler, updateOnlineStatusPreHandler],
	schema: {
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

// Options for get single User by ID (Public route)
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
			404: BasicErrorSchema,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: getUser
};

// Options for get User by Username (Public route)
const getUserByNameOpts = {
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

// Options for get User by Email (Requires AUTH + MATCHING ID CHECK in controller)
const getUserByEmailOpts = {
	preHandler: [authPreHandler, normalizeEmail, updateOnlineStatusPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				email: { type: 'string', format: 'email' }
			},
			required: ['email']
		},
		response: {
			200: User,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: getUserByEmail
};

// Options for get user profile by ID (Public route)
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
			400: ValidationErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: getUserProfile
};

// Options for add User (Public route - account creation)
const postUserOpts = {
	preHandler: [normalizeEmail],
	schema: {
		body: {
			type: 'object',
			required: ['username', 'password', 'display_name'],
			properties: {
				username: { type: 'string', minLength: 1 },
				password: { type: 'string', minLength: 4 },
				display_name: { type: 'string', minLength: 1 },
				email: { type: 'string', format: 'email' },
				bio: { type: 'string', nullable: true },
				avatar_url: { type: 'string' },
				cover_photo_url: { type: 'string' }
			},
			additionalProperties: false
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

// Options for update User (full update) (Requires AUTH + MATCHING ID CHECK)
const updateUserOpts = {
	preHandler: [authPreHandler, updateOnlineStatusPreHandler],
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
				username: { type: 'string', minLength: 1 },
				display_name: { type: 'string', minLength: 1 },
				email: { type: 'string', format: 'email', nullable: true },
				bio: { type: 'string', nullable: true },
				avatar_url: { type: 'string', nullable: true, format: 'uri-reference' },
				cover_photo_url: { type: 'string', nullable: true, format: 'uri-reference' },
				has_two_factor_auth: { type: 'integer', enum: [0, 1] }, // could be changed to bool
				status: { type: 'string', enum: ['online', 'offline', 'ingame', 'invisible'] }
			},
			minProperties: 1, // must provide at least one field to update
			additionalProperties: false
		},
		response: {
			200: User,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: updateUser
};

// Options for update User Profile (partial update) (Requires AUTH + MATCHING ID CHECK)
const updateUserProfileOpts = {
	preHandler: [authPreHandler, updateOnlineStatusPreHandler],
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
				display_name: { type: 'string', minLength: 1 },
				bio: { type: 'string', nullable: true },
				avatar_url: { type: 'string', nullable: true, format: 'uri-reference' },
				cover_photo_url: { type: 'string', nullable: true, format: 'uri-reference' }
			},
			minProperties: 1, // at least 1
			additionalProperties: false
		},
		response: {
			200: User,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: updateUserProfile
};

// Options for delete User (Requires AUTH + MATCHING ID CHECK)
const deleteUserOpts = {
	preHandler: [authPreHandler, updateOnlineStatusPreHandler],
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
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: deleteUser
};

// Options for login User (Public route)
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

// Options for log out User (Requires AUTH)
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

// Options for upload Avatar (Requires AUTH + MATCHING USER ID CHECK)
const uploadAvatarOpts = {
	preHandler: [authPreHandler, updateOnlineStatusPreHandler],
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

// Options for upload Cover Photo (Requires AUTH + MATCHING USER ID CHECK)
const uploadCoverOpts = {
	preHandler: [authPreHandler, updateOnlineStatusPreHandler],
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
					cover_photo_url: { type: 'string', format: 'uri-reference' } // Return the new URL
				},
				required: ['message', 'cover_photo_url']
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
	handler: uploadCover,
};

// Options for update password (Requires AUTH + MATCHING ID CHECK)
const updatePasswordOpts = {
	preHandler: [authPreHandler, updateOnlineStatusPreHandler],
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

// Options for game-start route (Requires AUTH + Matching ID in URL)
const gameStartOpts = {
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
			200: BasicErrorSchema,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: gameStart,
};

// Options for game-end route (Requires AUTH + Matching ID in URL)
const gameEndOpts = {
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
			200: BasicErrorSchema,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		}
	},
	handler: gameEnd,
};

function userRoutes(fastify, options, done) {
	// Get all Users (Public route by default)
	fastify.get('/', getUsersOpts);

	// Get current User - Requires AUTH
	fastify.get('/current', getCurrentUserOpts);

	// Get single User - Public
	fastify.get('/:id', getUserOpts);
	// Get single User by Username - Public
	fastify.get('/byname/:username', getUserByNameOpts);
	// Get single User by Email - Requires AUTH + MATCHING ID CHECK in controller
	fastify.get('/byemail/:email', getUserByEmailOpts);

	// Get user profile by ID (Public route by default)
	fastify.get('/:id/profile', getUserProfileOpts);

	// Update User (full update) - Requires AUTH + MATCHING ID CHECK
	fastify.put('/:id', updateUserOpts);
	
	// Update User Profile (partial update) - Requires AUTH + MATCHING ID CHECK
	fastify.patch('/:id/profile', updateUserProfileOpts);
	
	// Update password - Requires AUTH + MATCHING ID CHECK + OLD PASSWORD CHECK
	fastify.put('/:id/password', updatePasswordOpts);
	
	// Delete User - Requires AUTH + MATCHING ID CHECK
	fastify.delete('/:id', deleteUserOpts);

	// Add User - Public (Account creation)
	fastify.post('/', postUserOpts);
	
	// Login User - Public
	fastify.post('/login', loginUserOpts);

	// Log out User - Requires AUTH
	fastify.post('/log-out', logoutUserOpts);

	// Upload Avatar - Requires AUTH + MATCHING USER ID CHECK
	fastify.put('/:userId/avatar', uploadAvatarOpts);

	// Upload Cover Photo - Requires AUTH + MATCHING USER ID CHECK
	fastify.put('/:userId/cover', uploadCoverOpts);

	// Game start -- requires AUTH
	fastify.post('/:id/status/game-start', gameStartOpts);
	// Game end -- requires AUTH
	fastify.post('/:id/status/game-end', gameEndOpts);

	done();
}

module.exports = userRoutes;
