const MatchHistoryItem = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		user_id: { type: 'integer' },
		opponent_id: { type: 'integer' },
		opponent_name: { type: 'string' },
		result: { type: 'string' }, //win/loss/draw
		score: { type: 'string' }, // e.g., 5-3
		date: { type: 'string' },
		duration: { type: 'string' },
		game_mode: { type: 'string' },
	},
};

module.exports = {
	MatchHistoryItem,
};
