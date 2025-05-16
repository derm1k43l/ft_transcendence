const {
	getUserStat,
	updateUserStat,
} = require('../controllers/userStatsController');

const { UserStat } = require('../schemas/userStatsSchema');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
	UnauthorizedErrorSchema,
	ForbiddenErrorSchema,
} = require('../schemas/errorSchema');

const authPreHandler = require('./authPreHandlerRoutes');

// Options for get single User Stat by user_id (Requires AUTH + Matching User ID Check)
const getUserStatOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				userId: { type: 'integer' }
			},
			required: ['userId']
		},
		response: {
			200: UserStat,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getUserStat,
};

// Options for update User Stat (Requires AUTH + Matching User ID Check)
const updateUserStatOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				userId: { type: 'integer' }
			},
			required: ['userId']
		},
		body: {
			type: 'object',
			// None are strictly required for update, but at least one should be provided
			properties: {
				wins: { type: 'integer', minimum: 0 },
				losses: { type: 'integer', minimum: 0 },
				rank: { type: 'string', minLength: 1 },
				level: { type: 'integer', minimum: 0 },
			},
			minProperties: 1,
			additionalProperties: false
		},
		response: {
			200: UserStat,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateUserStat,
};

function userStatsRoutes (fastify, options, done) {
	// Get user stats by user ID (Authenticated + Matching User ID)
	fastify.get('/:userId', getUserStatOpts);

	// Update user stats by user ID (Authenticated + Matching User ID)
	fastify.put('/:userId', updateUserStatOpts);

	// Delete user stats when deleting user

	done();
}

module.exports = userStatsRoutes;
