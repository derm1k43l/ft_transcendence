const Achievement = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		user_id: { type: 'integer' },
		name: { type: 'string' },
		description: { type: 'string' },
		icon: { type: 'string' },
		completed: { type: 'integer' }, // 0 or 1
		date_completed: { type: 'string' },
	},
};

module.exports = {
	Achievement,
};
