const {
	getScores,
	getPlayerScores,
	addScore,
	deleteScore,
	} = require('../controllers/scoreController');

// Score schema
const Score = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		player_id: { type: 'integer' },
		username: { type: 'string' },
		score: { type: 'integer' },
		game_date: { type: 'string' },
	},
};

const getScoresOpts = {
	schema: {
		response: {
			200: {
				type: 'array',
				items: Score,
			},
		},
	},
	handler: getScores,
};

const getPlayerScoresOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				player_id: { type: 'integer' }
			},
			required: ['player_id']
		},
		response: {
			200: {
				type: 'array',
				items: Score,
			},
			404: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: getPlayerScores,
};

const postScoreOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['player_id', 'score'],
			properties: {
				player_id: { type: 'integer' },
				score: { type: 'integer' },
			},
		},
		response: {
			201: Score,
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
			}
		},
	},
	handler: addScore,
};

const deleteScoreOpts = {
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
	handler: deleteScore,
};

function scoreRoutes(fastify, options, done) {
	// Get all scores
	fastify.get('/scores', getScoresOpts);

	// Get scores for a specific player
	fastify.get('/players/:player_id/scores', getPlayerScoresOpts);

	// Add score
	fastify.post('/scores', postScoreOpts);

	// Delete score
	fastify.delete('/scores/:id', deleteScoreOpts);

	done();
}

module.exports = scoreRoutes;