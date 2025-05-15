const {
	getChatMessagesBetweenUsers,
	getChatMessage,
	addChatMessage,
	markChatMessageAsRead,
	deleteChatMessage,
} = require('../controllers/chatMessagesController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
	ForbiddenErrorSchema,
	UnauthorizedErrorSchema,
} = require('../schemas/errorSchema');

const { ChatMessage, ChatMessageDetails } = require('../schemas/chatMessagesSchema');

const authPreHandler = require('./authPreHandlerRoutes');

// Options for get chat messages between two users (Requires AUTH + Participant Check)
const getChatMessagesBetweenUsersOpts = {
	preHandler: [authPreHandler],
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
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getChatMessagesBetweenUsers,
};

// Options for get single Chat Message (Requires AUTH + Ownership/Participant Check)
const getChatMessageOpts = {
	preHandler: [authPreHandler],
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
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getChatMessage,
};

// Options for add Chat Message (Requires AUTH - sender is authenticated user)
const addChatMessageOpts = {
	preHandler: [authPreHandler],
	schema: {
		body: {
			type: 'object',
			required: ['receiver_id', 'content'],
			properties: {
				receiver_id: { type: 'integer'},
				content: { type: 'string', minLength: 1},
			},
			additionalProperties: false
		},
		response: {
			201: ChatMessage, // Return the basic message object on creation
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addChatMessage,
};

// Options for marking a message as read (Requires AUTH + Receiver Check)
const markChatMessageAsReadOpts = {
	preHandler: [authPreHandler],
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
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: markChatMessageAsRead,
};

// Options for delete Chat Message (Requires AUTH + Sender Check)
const deleteChatMessageOpts = {
	preHandler: [authPreHandler],
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
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: deleteChatMessage,
};

function chatMessagesRoutes (fastify, options, done) {
	// Get chat messages between two users (Authenticated + Participant)
	fastify.get('/chat/users/:userId1/:userId2', getChatMessagesBetweenUsersOpts);

	// Get single chat message by ID (Authenticated + Ownership/Participant)
	fastify.get('/:id', getChatMessageOpts);

	// Add chat message (Authenticated - sender is authenticated user)
	fastify.post('/', addChatMessageOpts);

	// Mark a chat message as read (Authenticated + Receiver)
	fastify.put('/read/:id', markChatMessageAsReadOpts);

	// Delete chat message (Authenticated + Sender)
	fastify.delete('/:id', deleteChatMessageOpts);

	done();
}

module.exports = chatMessagesRoutes;
