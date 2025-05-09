const ChatMessage = {
	additionalProperties: false,
	type: 'object',
	properties: {
		id: { type: 'integer' },
		sender_id: { type: 'integer' },
		receiver_id: { type: 'integer' },
		content: { type: 'string', minLength: 1 },
		timestamp: { type: 'string', format: 'date-time' },
		read: { type: 'integer', enum: [0, 1] },
	},
};

// Schema for returning messages with sender/receiver details (joining with users table)
const ChatMessageDetails = {
	type: 'object',
	additionalProperties: false,
	properties: {
		id: { type: 'integer' },
		sender_id: { type: 'integer' },
		receiver_id: { type: 'integer' },
		content: { type: 'string' },
		timestamp: { type: 'string', format: 'date-time' },
		read: { type: 'integer', enum: [0, 1] },

		// Properties from joined users table
		sender_username: { type: 'string' },
		sender_display_name: { type: 'string' },
		sender_avatar_url: { type: 'string', format: 'uri-reference' },
		receiver_username: { type: 'string' },
		receiver_display_name: { type: 'string' },
		receiver_avatar_url: { type: 'string', format: 'uri-reference' },
	},
};

module.exports = {
	ChatMessage,
	ChatMessageDetails,
};
