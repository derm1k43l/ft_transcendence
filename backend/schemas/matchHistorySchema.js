const scorePattern = '^\\d+-\\d+$';

const MatchHistoryItem = {
	type: 'object',
	additionalProperties: false,
	properties: {
		id: { type: 'integer' },
		opponent_id: { type: 'integer' },
		opponent_name: { type: 'string', minLength: 1 },
		result: { type: 'string', enum: ['win', 'loss', 'draw'] },
		score: { type: 'string', pattern: scorePattern }, // e.g., 5-3
		date: { type: 'string', format: 'date-time' },
		duration: { type: 'string', minLength: 1, nullable: true },
		game_mode: { type: 'string', minLength: 1 }, // could be enum depending on the modes
		status: { type: 'string', enum: ['pending', 'running', 'finished'] },
	},
};

module.exports = {
	MatchHistoryItem,
};
