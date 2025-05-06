// User schema
const User = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		username: { type: 'string' },
		display_name: { type: 'string' },
		email: { type: 'string' },
		bio: { type: 'string', nullable: true },
		avatar_url: { type: 'string', nullable: true },
		cover_photo_url: { type: 'string', nullable: true },
		join_date: { type: 'string' },
		has_two_factor_auth: { type: 'integer', enum: [0, 1] },
		status: { type: 'string' },
		last_active: { type: 'string', nullable: true },
		created_at: { type: 'string' }
	}
};

const loginBody = {
	type: 'object',
	required: ['username', 'password'],
	properties: {
		username: { type: 'string' },
		password: { type: 'string' },
	}
};

const loginResponse = {
	type: 'object',
	required: ['token', 'user'],
	properties: {
		token: { type: 'string' },
		user: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				username: { type: 'string' },
				display_name: { type: 'string' },
			},
			required: ['id', 'username', 'display_name']
		}
	}
};

module.exports = {
	User,
	loginBody,
	loginResponse
};
