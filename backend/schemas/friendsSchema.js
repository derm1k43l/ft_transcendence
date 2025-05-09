const Friend = {
	type: 'object',
	additionalProperties: false,
	properties: {
		user_id: { type: 'integer' },
		friend_id: { type: 'integer' },
	},
};

// Schema for returning a list of friends (joining with users table)
const FriendDetails = {
	type: 'object',
	additionalProperties: false,
	properties: {
		user_id: { type: 'integer' }, // The ID of the user whose friends are being listed
		friend_id: { type: 'integer' }, // The ID of the friend
		friend_username: { type: 'string', minLength: 1 },
		friend_display_name: { type: 'string', minLength: 1 },
		friend_avatar_url: { type: 'string', format: 'uri-reference', nullable: true },
		friend_status: { type: 'string', enum: ['online', 'offline', 'ingame', 'invisible'] },
		friend_last_active: { type: 'string', format: 'date-time', nullable: true },
	}
}

module.exports = {
	Friend,
	FriendDetails,
};
