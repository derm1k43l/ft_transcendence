const {
	getTournaments,
	getTournamentItem,
	getTournamentsWonByUser,
	addTournament,
	updateTournament,
	deleteTournament,
} = require('../controllers/tournamentController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
	UnauthorizedErrorSchema,
	ForbiddenErrorSchema,
} = require('../schemas/errorSchema');

const {
	TournamentSchema,
	TournamentMatchItem,
} = require('../schemas/tournamentSchema');

const authPreHandler = require('./authPreHandlerRoutes');

// Schema for POST body
const addTournamentBodySchema = {
	type: 'object',
	required: ['tournament_name', 'player_amount', 'players'],
	properties: {
		tournament_name: { type: 'string', minLength: 1 },
		player_amount: { type: 'integer', minimum: 1 },
		players: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
		},
	},
	additionalProperties: false
};

// Schema for PUT body
const updateTournamentBodySchema = {
	type: 'object',
	properties: {
		tournament_name: { type: 'string', minLength: 1 },
		player_amount: { type: 'integer', minimum: 1 },
		status: { type: 'string', enum: ['pending', 'running', 'finished'] },
		winner_name: { type: 'string', minLength: 1, nullable: true },
		players: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
		},
		matches: {
			type: 'array',
			items: TournamentMatchItem,
		}
	},
	minProperties: 1,
	additionalProperties: false
};

// Options for get all Tournaments (Assuming AUTH - get only MY tournaments)
const getTournamentsOpts = {
	preHandler: [authPreHandler],
	schema: {
		response: {
			200: {
				type: 'array',
				items: TournamentSchema,
			},
			401: UnauthorizedErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getTournaments,
};

// Options for get single Tournament by ID (Requires AUTH + CREATOR CHECK)
const getTournamentItemOpts = {
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
			200: TournamentSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getTournamentItem,
};

// Options for get Tournaments won by a specific user (Requires AUTH + MATCHING ID CHECK)
const getTournamentsWonByUserOpts = {
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
				items: TournamentSchema,
			},
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getTournamentsWonByUser,
};

// Options for add New Tournament (Requires AUTH)
const addTournamentOpts = {
	preHandler: [authPreHandler],
	schema: {
		body: addTournamentBodySchema,
		response: {
			201: TournamentSchema,
			401: UnauthorizedErrorSchema,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addTournament,
};

// Options for update Tournament by ID (Requires AUTH + CREATOR CHECK)
const updateTournamentOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		body: updateTournamentBodySchema,
		response: {
			200: TournamentSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateTournament,
};

// Options for delete Tournament by ID (Requires AUTH + CREATOR CHECK)
const deleteTournamentOpts = {
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
					message: { type: 'string' }
				}
			},
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: deleteTournament,
};

function tournamentRoutes (fastify, options, done) {
	// Get all tournaments (for authenticated user)
	fastify.get('/', getTournamentsOpts);

	// Get single tournament by ID (for authenticated user, must be creator)
	fastify.get('/:id', getTournamentItemOpts);

	// Get tournaments won by a specific user (must be authenticated user)
	fastify.get('/users/:userId/won', getTournamentsWonByUserOpts);

	// Add new tournament (authenticated user is creator)
	fastify.post('/', addTournamentOpts);

	// Update tournament by ID (authenticated user must be creator)
	fastify.put('/:id', updateTournamentOpts);

	// Delete tournament by ID (authenticated user must be creator)
	fastify.delete('/:id', deleteTournamentOpts);

	done();
}

module.exports = tournamentRoutes;
