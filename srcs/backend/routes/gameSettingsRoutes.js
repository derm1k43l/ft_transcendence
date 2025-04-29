const {
	getUserGameSettings,
	addGameSettings,
	updateGameSettings,
} = require('../controllers/gameSettingsController');

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
			404: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			 500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: getUserGameSettings,
};

// Options for add Game Settings
const addGameSettingsOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['user_id'],
			properties: {
				user_id: { type: 'integer'},
				board_color: { type: 'string'},
				paddle_color: { type: 'string'},
				ball_color: { type: 'string'},
				score_color: { type: 'string'},
				sound_enabled: { type: 'integer'},
				vibration_enabled: { type: 'integer'},
			},
		},
		response: {
			201: GameSetting,
			400: {
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
			},
			409: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			 500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: addGameSettings,
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
				sound_enabled: { type: 'integer'},
				vibration_enabled: { type: 'integer'},
			}
		},
		response: {
			200: GameSetting,
			400: {
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
			},
			 500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: updateGameSettings,
};

function gameSettingsRoutes (fastify, options, done) {
	// Get user game settings by user ID
	fastify.get('/users/:userId/settings', getUserGameSettingsOpts);

	// Add game settings (requires user_id in body)
	fastify.post('/game-settings', addGameSettingsOpts);

	// Update game settings by user ID
	fastify.put('/users/:userId/settings', updateGameSettingsOpts);

	// Delete only when user is deleted
	done();
}

module.exports = gameSettingsRoutes;
