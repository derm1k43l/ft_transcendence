// User schema
const User = {
	type: 'object',
	additionalProperties: false,
	properties: {
		id: { type: 'integer', minimum: 1 },
		username: { type: 'string', minLength: 1, maxLength: 50 },
		display_name: { type: 'string', minLength: 1, maxLength: 50 },
		email: { type: 'string', format: 'email', nullable: true },
		bio: { type: 'string', maxLength: 255, nullable: true },
		avatar_url: { type: 'string', format: 'uri-reference', nullable: true },
		cover_photo_url: { type: 'string', format: 'uri-reference', nullable: true },
		join_date: { type: 'string', format: 'date' },
		has_two_factor_auth: { type: 'integer', enum: [0, 1] },
		status: { type: 'string', enum: ['online', 'offline', 'ingame', 'invisible'] },
		last_active: { type: 'string', format: 'date-time', nullable: true },
		created_at: { type: 'string', format: 'date-time' },
		language: { type: 'string', enum: ['english', 'german', 'spanish']},
	},
	required: ['id', 'username', 'display_name' ], // could be less or more strict, not sure yet
};

const loginBody = {
	type: 'object',
	additionalProperties: false,
	required: ['username', 'password'],
	properties: {
		username: { type: 'string', minLength: 1 },
		password: { type: 'string', minLength: 4 },
	},
};

const loginResponse = {
	type: 'object',
	additionalProperties: false,
	required: ['token', 'user'],
	properties: {
		token: { type: 'string', minLength: 1 },
		user: {
			type: 'object',
			additionalProperties: false,
			properties: {
				id: { type: 'integer', minimum: 1 },
				username: { type: 'string', minLength: 1 },
				display_name: { type: 'string', minLength: 1 },
			},
			required: ['id', 'username', 'display_name'] // could be less or more strict, not sure yet
		}
	},
};

const updatePasswordBody = {
	type: 'object',
	required: ['old_password', 'new_password'],
	properties: {
		old_password: { type: 'string', minLength: 1 },
		new_password: { type: 'string', minLength: 4 },
	},
	additionalProperties: false
};

module.exports = {
	User,
	loginBody,
	loginResponse,
	updatePasswordBody
};
