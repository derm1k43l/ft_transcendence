const {
	getUserGameSettings,
	updateGameSettings,
} = require('../controllers/gameSettingsController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
	UnauthorizedErrorSchema,
	ForbiddenErrorSchema,
} = require('../schemas/errorSchema');

const { GameSetting } = require('../schemas/gameSettingsSchema');

const authPreHandler = require('./authPreHandlerRoutes');

// Options for get single User Game Settings by user_id (requires AUTH + Matching User ID Check)
const getUserGameSettingsOpts = {
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
			200: GameSetting,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getUserGameSettings,
};

// Options for update Game Settings (requires AUTH + Matching User ID Check)
const updateGameSettingsOpts = {
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
			// None are strictly required for update
			properties: {
				board_color: { type: 'string'},
				paddle_color: { type: 'string'},
				ball_color: { type: 'string'},
				score_color: { type: 'string'},
				powerup: { type: 'integer' },
			},
			minProperties: 1, // but should have something at least
			additionalProperties: false
		},
		response: {
			200: GameSetting,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateGameSettings,
};

function gameSettingsRoutes (fastify, options, done) {
	// Get user game settings by user ID (requires AUTH + Matching User ID Check)
	fastify.get('/users/:userId', getUserGameSettingsOpts);

	// Update game settings by user ID (requires AUTH + Matching User ID Check)
	fastify.put('/users/:userId', updateGameSettingsOpts);

	// Delete only when user is deleted
	done();
}

module.exports = gameSettingsRoutes;
