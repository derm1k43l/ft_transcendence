const FriendRequest = {
	additionalProperties: false,
	type: 'object',
	properties: {
		id: { type: 'integer' },
		from_user_id: { type: 'integer' },
		to_user_id: { type: 'integer' },
		status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
		date: { type: 'string', format: 'date' },
	},
};

// Schema for returning friend request details (joining with users table)
const FriendRequestDetails = {
	type: 'object',
	additionalProperties: false,
	properties: {
		id: { type: 'integer' },
		from_user_id: { type: 'integer' },
		to_user_id: { type: 'integer' },
		status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
		date: { type: 'string', format: 'date' },

		// Properties from joined users table
		from_username: { type: 'string' },
		from_display_name: { type: 'string' },
		from_avatar_url: { type: 'string', format: 'uri-reference' },
		to_username: { type: 'string' },
		to_display_name: { type: 'string' },
		to_avatar_url: { type: 'string', format: 'uri-reference' },
	}
}

module.exports = {
	FriendRequest,
	FriendRequestDetails,
};
