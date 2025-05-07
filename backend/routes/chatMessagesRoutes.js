const {
	getChatMessagesBetweenUsers,
	getChatMessage,
	addChatMessage,
	markChatMessageAsRead,
	deleteChatMessage,
} = require('../controllers/chatMessagesController');

const { ChatMessage, ChatMessageDetails } = require('../schemas/chatMessagesSchema');

// Options for get chat messages between two users
const getChatMessagesBetweenUsersOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				userId1: { type: 'integer' },
				userId2: { type: 'integer' }
			},
			required: ['userId1', 'userId2']
		},
		response: {
			200: {
				type: 'array',
				items: ChatMessageDetails,
			},
			500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: getChatMessagesBetweenUsers,
};

// Options for get single Chat Message
const getChatMessageOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		response: {
			200: ChatMessageDetails,
			404: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: getChatMessage,
};

// Options for add Chat Message
const addChatMessageOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['sender_id', 'receiver_id', 'content'],
			properties: {
				sender_id: { type: 'integer'},
				receiver_id: { type: 'integer'},
				content: { type: 'string'},
			},
		},
		response: {
			201: ChatMessage, // Return the basic message object on creation
			400: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: addChatMessage,
};

// Options for marking a message as read
const markChatMessageAsReadOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		response: {
			200: {
				type: 'object',
				properties: {
					message: {type: 'string'}
				},
			},
			404: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: markChatMessageAsRead,
};

// Options for delete Chat Message
const deleteChatMessageOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		response: {
			200: {
				type: 'object',
				properties: {
					message: {type: 'string'}
				},
			},
			404: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: deleteChatMessage,
};

function chatMessagesRoutes (fastify, options, done) {
	// Get chat messages between two users
	fastify.get('/chat/users/:userId1/:userId2', getChatMessagesBetweenUsersOpts);

	// Get single chat message by ID
	fastify.get('/:id', getChatMessageOpts);

	// Add chat message
	fastify.post('/', addChatMessageOpts);

	// Mark a chat message as read
	fastify.put('/read/:id', markChatMessageAsReadOpts);

	// Delete chat message
	fastify.delete('/:id', deleteChatMessageOpts);

	done();
}

module.exports = chatMessagesRoutes;
