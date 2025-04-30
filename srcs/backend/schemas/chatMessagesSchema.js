const ChatMessage = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		sender_id: { type: 'integer' },
		receiver_id: { type: 'integer' },
		content: { type: 'string' },
		timestamp: { type: 'string' },
		read: { type: 'integer' }, // 0 or 1
	},
};

// Schema for returning messages with sender/receiver details (joining with users table)
const ChatMessageDetails = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		sender_id: { type: 'integer' },
		receiver_id: { type: 'integer' },
		content: { type: 'string' },
		timestamp: { type: 'string' },
		read: { type: 'integer' },
		sender_username: { type: 'string' },
		sender_display_name: { type: 'string' },
		sender_avatar_url: { type: 'string' },
		receiver_username: { type: 'string' },
		receiver_display_name: { type: 'string' },
		receiver_avatar_url: { type: 'string' },
	},
};

module.exports = {
	ChatMessage,
	ChatMessageDetails,
};
