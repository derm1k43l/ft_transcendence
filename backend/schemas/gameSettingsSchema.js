const GameSetting = {
	type: 'object',
	properties: {
		user_id: { type: 'integer' },
		board_color: { type: 'string' },
		paddle_color: { type: 'string' },
		ball_color: { type: 'string' },
		score_color: { type: 'string' },
		sound_enabled: { type: 'integer' }, // 0 or 1
		vibration_enabled: { type: 'integer' }, // 0 or 1
	},
};

module.exports = {
	GameSetting,
};
