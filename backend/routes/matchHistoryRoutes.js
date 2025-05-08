const {
	getMatchHistory,
	getMatchHistoryItem,
	getMatchHistoryForUser,
	addMatchHistoryItem,
	updateMatchHistoryItem,
	deleteMatchHistoryItem,
} = require('../controllers/matchHistoryController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
} = require('../schemas/errorSchema');

const { MatchHistoryItem } = require('../schemas/matchHistorySchema');

// Options for get all Match History
const getMatchHistoryOpts = {
	schema: {
		response: {
			200: {
				type: 'array',
				items: MatchHistoryItem,
			},
			500: BasicErrorSchema
		},
	},
	handler: getMatchHistory,
};

// Options for get single Match History Item
const getMatchHistoryItemOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		response: {
			200: MatchHistoryItem,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getMatchHistoryItem,
};

// Options for get Match History for a specific user
const getMatchHistoryForUserOpts = {
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
				type: 'array',
				items: MatchHistoryItem,
			},
			500: BasicErrorSchema
		},
	},
	handler: getMatchHistoryForUser,
};

// Options for add Match History Item
const addMatchHistoryItemOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['user_id', 'opponent_id', 'opponent_name', 'result', 'score', 'date'],
			properties: {
				user_id: { type: 'integer'},
				opponent_id: { type: 'integer'},
				opponent_name: { type: 'string'},
				result: { type: 'string'}, // Add validation for enum 'win', 'loss', 'draw' maybe
				score: { type: 'string'},
				date: { type: 'string'},
				duration: { type: 'string'},
				game_mode: { type: 'string'},
			},
		},
		response: {
			201: MatchHistoryItem,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addMatchHistoryItem,
};

// Options for update Match History Item
const updateMatchHistoryItemOpts = {
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
				user_id: { type: 'integer'},
				opponent_id: { type: 'integer'},
				opponent_name: { type: 'string'},
				result: { type: 'string'},
				score: { type: 'string'},
				date: { type: 'string'},
				duration: { type: 'string'},
				game_mode: { type: 'string'},
			}
		},
		response: {
			200: MatchHistoryItem,
			400: ValidationErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateMatchHistoryItem,
};

// Options for delete Match History Item
const deleteMatchHistoryItemOpts = {
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
					message: {type: 'string'}
				},
			},
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: deleteMatchHistoryItem,
};

function matchHistoryRoutes (fastify, options, done) {
	// Get all match history
	fastify.get('/', getMatchHistoryOpts);

	// Get single match history item by ID
	fastify.get('/:id', getMatchHistoryItemOpts);

	// Get match history for a specific user
	fastify.get('/users/:userId', getMatchHistoryForUserOpts);

	// Add match history item
	fastify.post('/', addMatchHistoryItemOpts);

	// Update match history item by ID
	fastify.put('/:id', updateMatchHistoryItemOpts);

	// Delete match history item by ID
	fastify.delete('/:id', deleteMatchHistoryItemOpts);

	done();
}

module.exports = matchHistoryRoutes;
