const scorePattern = '^\\d+-\\d+$';

const TournamentMatchItem = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		round: { type: 'integer', minimum: 1 },
		player1_name: { type: 'string', nullable: true },
		player2_name: { type: 'string', nullable: true },
		score: { type: 'string', pattern: scorePattern, nullable: true },
		winner_name: { type: 'string', minLength: 1, nullable: true },
		status: { type: 'string', enum: ['pending', 'running', 'finished'] },

		// Fields for bracket progression:
		next_match_id: { type: 'integer', nullable: true }, //winner proceeds to id (null for the final match)
		next_match_player_slot: { type: 'integer', nullable: true}, // Which slot the winner takes in the next match (null for the final match)
	},
	required: ['id', 'round', 'status'],
	additionalProperties: false
};

const TournamentSchema = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		tournament_name: { type: 'string', minLength: 1 },
		creator_id: { type: 'integer' },
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
	required: [
		'id',
		'tournament_name',
		'creator_id',
		'player_amount',
		'status',
		'players',
		'matches',
	],
	additionalProperties: false
};

module.exports = {
	TournamentSchema,
	TournamentMatchItem
};
