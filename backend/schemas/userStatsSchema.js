const UserStat = {
	type: 'object',
	additionalProperties: false,
	properties: {
		user_id: { type: 'integer', minimum: 1 },
		wins: { type: 'integer', minimum: 0 },
		losses: { type: 'integer', minimum: 0 },
		rank: { type: 'string', minLength: 1, nullable: true },
		level: { type: 'integer', minimum: 1 },
	},
};

module.exports = {
	UserStat,
};
