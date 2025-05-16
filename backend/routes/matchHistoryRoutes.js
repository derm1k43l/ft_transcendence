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
	UnauthorizedErrorSchema,
	ForbiddenErrorSchema,
} = require('../schemas/errorSchema');

const { MatchHistoryItem } = require('../schemas/matchHistorySchema');

const authPreHandler = require('./authPreHandlerRoutes');

// Options for get all Match History (Requires AUTH + Filtering by User/Opponent)
const getMatchHistoryOpts = {
	preHandler: [authPreHandler],
	schema: {
		response: {
			200: {
				type: 'array',
				items: MatchHistoryItem,
			},
			401: UnauthorizedErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getMatchHistory,
};

// Options for get single Match History Item (Requires AUTH + Participant Check)
const getMatchHistoryItemOpts = {
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
			200: MatchHistoryItem,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getMatchHistoryItem,
};

// Options for get Match History for a specific user (Requires AUTH + Matching User ID Check)
const getMatchHistoryForUserOpts = {
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
			200: {
				type: 'array',
				items: MatchHistoryItem,
			},
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getMatchHistoryForUser,
};

// Options for add Match History Item (Requires AUTH - authenticated user is  'user_id')
const addMatchHistoryItemOpts = {
	preHandler: [authPreHandler],
	schema: {
		body: {
			type: 'object',
			required: ['opponent_name', 'result', 'score', 'date', 'status'],
			properties: {
				opponent_id: { type: 'integer', nullable: true },
				opponent_name: { type: 'string', minLength: 1 },
				result: { type: 'string', minLength: 1 },
				score: { type: 'string', minLength: 1 },
				date: { type: 'string', format: 'date-time' },
				duration: { type: 'string', nullable: true },
				game_mode: { type: 'string', minLength: 1 },
				status: { type: 'string', minLength: 1 },
			},
		},
		response: {
			201: MatchHistoryItem,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addMatchHistoryItem,
};

// Options for update Match History Item (Requires AUTH + Ownership Check - authenticated user is the 'user_id')
const updateMatchHistoryItemOpts = {
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
				opponent_name: { type: 'string', minLength: 1 },
				result: { type: 'string', minLength: 1 },
				score: { type: 'string', minLength: 1 },
				duration: { type: 'string', nullable: true },
				status: { type: 'string', minLength: 1 },
			},
			minProperties: 1,
			additionalProperties: false
		},
		response: {
			200: MatchHistoryItem,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateMatchHistoryItem,
};

// Options for delete Match History Item (Requires AUTH + Ownership Check - authenticated user is the 'user_id')
const deleteMatchHistoryItemOpts = {
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
			200: {
				type: 'object',
				properties: {
					message: {type: 'string'}
				},
			},
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: deleteMatchHistoryItem,
};

function matchHistoryRoutes (fastify, options, done) {
	// Get all match history (Requires AUTH + Filtering by User/Opponent)
	fastify.get('/', getMatchHistoryOpts);

	// Get single match history item by ID (Requires AUTH + Participant Check)
	fastify.get('/:id', getMatchHistoryItemOpts);

	// Get match history for a specific user (Requires AUTH + Matching User ID Check)
	fastify.get('/users/:userId', getMatchHistoryForUserOpts);

	// Add match history item (Requires AUTH - authenticated user is  'user_id')
	fastify.post('/', addMatchHistoryItemOpts);

	// Update match history item by ID (Requires AUTH + Ownership Check - authenticated user is the 'user_id')
	fastify.put('/:id', updateMatchHistoryItemOpts);

	// Delete match history item by ID (Requires AUTH + Ownership Check - authenticated user is the 'user_id')
	fastify.delete('/:id', deleteMatchHistoryItemOpts);

	done();
}

module.exports = matchHistoryRoutes;
