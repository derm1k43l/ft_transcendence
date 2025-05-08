const {
	getUserStat,
	addUserStat,
	updateUserStat,
	deleteUserStat,
} = require('../controllers/userStatsController');

const { UserStat } = require('../schemas/userStatsSchema');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
} = require('../schemas/errorSchema');

// Options for get single User Stat by user_id
const getUserStatOpts = {
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
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getUserStat,
};

// Options for add User Stat
const addUserStatOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['user_id'],
			properties: {
				user_id: { type: 'integer'},
				wins: { type: 'integer'},
				losses: { type: 'integer'},
				rank: { type: 'string'},
				level: { type: 'integer'},
			},
		},
		response: {
			201: UserStat,
			400: ValidationErrorSchema,
			404: BasicErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addUserStat,
};

// Options for update User Stat
const updateUserStatOpts = {
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
				wins: { type: 'integer'},
				losses: { type: 'integer'},
				rank: { type: 'string'},
				level: { type: 'integer'},
			}
		},
		response: {
			200: UserStat,
			400: ValidationErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateUserStat,
};

// Options for delete User Stat
const deleteUserStatOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				userId: { type: 'integer' }
			},
			required: ['userId']
		},
		response: {
			200: {
				type: 'object',
				properties: {
					message: {type: 'string'}
				},
			},
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: deleteUserStat,
};

function userStatsRoutes (fastify, options, done) {
	// Get user stats by user ID
	fastify.get('/:userId', getUserStatOpts);

	// Add user stats by user ID (currently expects ID in the body still in the logic)
	fastify.post('/:userId', addUserStatOpts);

	// Update user stats by user ID
	fastify.put('/:userId', updateUserStatOpts);

	// Delete user stats by user ID
	fastify.delete('/:userId', deleteUserStatOpts);

	done();
}

module.exports = userStatsRoutes;
