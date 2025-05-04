// User schema
const User = {
	type: 'object',
	properties: {
	id: { type: 'integer' },
	username: { type: 'string' },
	display_name: { type: 'string' },
	email: { type: 'string' },
	bio: { type: 'string' },
	avatar_url: { type: 'string' },
	cover_photo_url: { type: 'string' },
	join_date: { type: 'string' },
	has_two_factor_auth: { type: 'integer' },
	status: { type: 'string' },
	last_active: { type: 'string' },
	created_at: { type: 'string' }
	}
};

module.exports = {
	User,
};
