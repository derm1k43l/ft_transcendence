const hexColorPattern = '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$';

const GameSetting = {
	type: 'object',
	additionalProperties: false,
	properties: {
		user_id: { type: 'integer' },
		board_color: { type: 'string', pattern: hexColorPattern },
		paddle_color: { type: 'string', pattern: hexColorPattern },
		ball_color: { type: 'string', pattern: hexColorPattern },
		score_color: { type: 'string', pattern: hexColorPattern },
	},
};

module.exports = {
	GameSetting,
};
