const UserStat = {
	type: 'object',
	properties: {
		user_id: { type: 'integer' },
		wins: { type: 'integer' },
		losses: { type: 'integer' },
		rank: { type: 'string' },
		level: { type: 'integer' },
	},
};

module.exports = {
	UserStat,
};