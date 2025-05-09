const Achievement = {
	type: 'object',
	additionalProperties: false, // Reject any properties not explicitly defined in the schema
	properties: {
		id: { type: 'integer' },
		user_id: { type: 'integer' },
		name: { type: 'string', minLength: 1 },
		description: { type: 'string', minLength: 1 },
		icon: { type: 'string', format: 'uri-reference' },
		completed: { type: 'integer', enum: [0, 1] },
		date_completed: { type: 'string', format: 'date-time', nullable: true },
	},
};

module.exports = {
	Achievement,
};
