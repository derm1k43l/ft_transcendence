const {
	getTournaments,
	getTournamentItem,
	getTournamentsWonByUser,
	addTournament,
	updateTournament,
	deleteTournament,
	addPlayerToTournament,
	removePlayerFromTournament,
	getPlayersInTournament,
} = require('../controllers/tournamentController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
} = require('../schemas/errorSchema');

const { TournamentSchema, TournamentPlayerItem, AddRemovePlayerSchema } = require('../schemas/tournamentSchema');

// Options for get all Tournaments
const getTournamentsOpts = {
	schema: {
		response: {
			200: {
				type: 'array',
				items: TournamentSchema,
			},
			500: BasicErrorSchema
		},
	},
	handler: getTournaments,
};

// Options for get single Tournament Item
const getTournamentItemOpts = {
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
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getTournamentItem,
};

// Options for get Tournaments won by a specific user
const getTournamentsWonByUserOpts = {
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
			500: BasicErrorSchema
		},
	},
	handler: getTournamentsWonByUser,
};

// Options for add Tournament
const addTournamentOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['tournament_name', 'player_amount', 'status', 'start_date'],
			properties: {
				tournament_name: { type: 'string', minLength: 1 },
				player_amount: { type: 'integer', minimum: 1 },
				status: { type: 'string', enum: ['pending', 'running', 'finished'] },
				start_date: { type: 'string', format: 'date' },
				end_date: { type: 'string', format: 'date', nullable: true },
				winner_user_id: { type: 'integer', nullable: true },
			},
			additionalProperties: false
		},
		response: {
			201: TournamentSchema,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addTournament,
};

// Options for update Tournament Item
const updateTournamentOpts = {
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
				tournament_name: { type: 'string', minLength: 1 },
				player_amount: { type: 'integer', minimum: 1 },
				status: { type: 'string', enum: ['pending', 'running', 'finished'] },
				start_date: { type: 'string', format: 'date' },
				end_date: { type: 'string', format: 'date', nullable: true },
				winner_user_id: { type: 'integer', nullable: true },
			},
			additionalProperties: false
		},
		response: {
			200: TournamentSchema,
			400: ValidationErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateTournament,
};

// Options for delete Tournament Item
const deleteTournamentOpts = {
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
					message: {type: 'string' }
				},
			},
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: deleteTournament,
};

// Options for adding a player to a tournament
const addPlayerToTournamentOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		body: AddRemovePlayerSchema,
		response: {
			201: {
				type: 'array',
				items: TournamentPlayerItem,
			},
			400: ValidationErrorSchema,
			404: BasicErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addPlayerToTournament,
};

// Options for removing a player from a tournament
const removePlayerFromTournamentOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer'},
				playerId: { type: 'integer' }
			},
			required: ['id', 'playerId']
		},
		response: {
			200: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: removePlayerFromTournament,
};

// Options for getting players in a specific tournament
const getPlayersInTournamentOpts = {
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
				type: 'array',
				items: TournamentPlayerItem,
			},
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getPlayersInTournament,
};


function tournamentRoutes (fastify, options, done) {
	// Get all tournaments
	fastify.get('/', getTournamentsOpts);

	// Get single tournament item by ID
	fastify.get('/:id', getTournamentItemOpts);

	// Get tournaments won by a specific user
	fastify.get('/users/:userId/won', getTournamentsWonByUserOpts);

	// Add new tournament
	fastify.post('/', addTournamentOpts);

	// Update tournament item by ID
	fastify.put('/:id', updateTournamentOpts);

	// Delete tournament item by ID
	fastify.delete('/:id', deleteTournamentOpts);

	// Tournament Player Management
	fastify.post('/:id/players', addPlayerToTournamentOpts); // Add a player to a tournament
	fastify.delete('/:id/players/:playerId', removePlayerFromTournamentOpts); // Remove a player from a tournament
	fastify.get('/:id/players', getPlayersInTournamentOpts); // Get all players in a tournament

	done();
}

module.exports = tournamentRoutes;
