const FriendRequest = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		from_user_id: { type: 'integer' },
		to_user_id: { type: 'integer' },
		status: { type: 'string' }, // pending, accepted, or rejected
		date: { type: 'string' },
	},
};

// Schema for returning friend request details (joining with users table)
const FriendRequestDetails = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		from_user_id: { type: 'integer' },
		to_user_id: { type: 'integer' },
		status: { type: 'string' },
		date: { type: 'string' },
		from_username: { type: 'string' },
		from_display_name: { type: 'string' },
		from_avatar_url: { type: 'string' },
		to_username: { type: 'string' },
		to_display_name: { type: 'string' },
		to_avatar_url: { type: 'string' },
	}
}

module.exports = {
	FriendRequest,
	FriendRequestDetails,
};
