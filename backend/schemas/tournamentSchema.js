const scorePattern = '^\\d+-\\d+$';

const TournamentPlayerItem = {
	type: 'object',
	additionalProperties: false,
	properties: {
		id: { type: 'integer' },
		username: { type: 'string', minLength: 1 },
	},
	required: ['id', 'username'],
};

const TournamentMatchItem = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		user_id: { type: 'integer' },
		opponent_id: { type: 'integer' },
		opponent_name: { type: 'string', minLength: 1 },
		result: { type: 'string', enum: ['win', 'loss', 'draw'] },
		score: { type: 'string', pattern: scorePattern },
		date: { type: 'string', format: 'date-time' },
		status: { type: 'string', enum: ['pending', 'running', 'finished'] },
	},
	required: ['id', 'user_id', 'opponent_id', 'opponent_name', 'result', 'score', 'date', 'status'],
	additionalProperties: false
};

const TournamentSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		id: { type: 'integer' },
		tournament_name: { type: 'string', minLength: 1 },
		player_amount: { type: 'integer', minimum: 1 },
		status: { type: 'string', enum: ['pending', 'running', 'finished'] },
		start_date: { type: 'string', format: 'date' },
		end_date: { type: 'string', format: 'date', nullable: true },
		winner_user_id: { type: 'integer', nullable: true },
		players: {
			type: 'array',
			items: TournamentPlayerItem,
			readOnly: true // Indicates this is for response only
		},
		matches: {
			type: 'array',
			items: TournamentMatchItem,
			readOnly: true // Indicates this is for response only
		}
	},
	required: [
		'id',
		'tournament_name',
		'player_amount',
		'status',
		'start_date',
	],
};

const AddRemovePlayerSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		player_id: { type: 'integer' },
	},
	required: ['player_id'],
};

module.exports = {
	TournamentSchema,
	TournamentPlayerItem,
	TournamentMatchItem,
	AddRemovePlayerSchema
};
