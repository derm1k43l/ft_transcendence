const {
	getUserGameSettings,
	updateGameSettings,
} = require('../controllers/gameSettingsController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
} = require('../schemas/errorSchema');

const { GameSetting } = require('../schemas/gameSettingsSchema');

// Options for get single User Game Settings by user_id
const getUserGameSettingsOpts = {
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
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getUserGameSettings,
};

// Options for update Game Settings
const updateGameSettingsOpts = {
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
			},
			minProperties: 1 // but should have something at least
		},
		response: {
			200: GameSetting,
			400: ValidationErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateGameSettings,
};

function gameSettingsRoutes (fastify, options, done) {
	// Get user game settings by user ID
	fastify.get('/users/:userId', getUserGameSettingsOpts);

	// Update game settings by user ID
	fastify.put('/users/:userId', updateGameSettingsOpts);

	// Delete only when user is deleted
	done();
}

module.exports = gameSettingsRoutes;
