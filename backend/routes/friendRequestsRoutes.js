const {
	getFriendRequests,
	getFriendRequest,
	getSentFriendRequests,
	getReceivedFriendRequests,
	addFriendRequest,
	updateFriendRequestStatus,
	deleteFriendRequest,
} = require('../controllers/friendRequestsController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
	UnauthorizedErrorSchema,
	ForbiddenErrorSchema,
} = require('../schemas/errorSchema');

const { FriendRequest, FriendRequestDetails } = require('../schemas/friendRequestsSchema');

const authPreHandler = require('./authPreHandlerRoutes');

// Options for get all Friend Requests (Requires AUTH)
const getFriendRequestsOpts = {
	preHandler: [authPreHandler],
	schema: {
		response: {
			200: {
				type: 'array',
				items: FriendRequestDetails, // Return detailed request objects
			},
			401: UnauthorizedErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getFriendRequests,
};

// Options for get single Friend Request (Requires AUTH + Participant Check)
const getFriendRequestOpts = {
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
			200: FriendRequestDetails, // Return detailed request object
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getFriendRequest,
};

// Options for get Sent Friend Requests for a user (Requires AUTH + Matching User ID Check)
const getSentFriendRequestsOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				userId: { type: 'integer' }
			},
			required: ['userId']
		},
		response: {
			200: {
				type: 'array',
				items: FriendRequestDetails,
			},
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getSentFriendRequests,
};

// Options for get Received Friend Requests for a user (usually pending) (Requires AUTH + Matching User ID Check)
const getReceivedFriendRequestsOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				userId: { type: 'integer' }
			},
			required: ['userId']
		},
		response: {
			200: {
				type: 'array',
				items: FriendRequestDetails,
			},
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getReceivedFriendRequests,
};

// Options for add Friend Request (Requires AUTH - sender is authenticated user)
const addFriendRequestOpts = {
	preHandler: [authPreHandler],
	schema: {
		body: {
			type: 'object',
			required: ['to_user_id'],
			properties: {
				// from_user_id: { type: 'integer'},
				to_user_id: { type: 'integer'},
			},
			additionalProperties: false
		},
		response: {
			201: FriendRequest, // Return the basic request object on creation
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addFriendRequest,
};

// Options for update Friend Request Status (accept/reject) (Requires AUTH + Receiver Check)
const updateFriendRequestStatusOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		body: {
			type: 'object',
			required: ['status'],
			properties: {
				status: { type: 'string', enum: ['accepted', 'rejected']},
			},
			additionalProperties: false
		},
		response: {
			200: BasicErrorSchema,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateFriendRequestStatus,
};

// Options for delete Friend Request (Requires AUTH + Participant Check)
const deleteFriendRequestOpts = {
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
	handler: deleteFriendRequest,
};

function friendRequestsRoutes (fastify, options, done) {
	// Get all friend requests (Authenticated)
	fastify.get('/', getFriendRequestsOpts);

	// Get single friend request by ID (Authenticated + Participant)
	fastify.get('/:id', getFriendRequestOpts);

	// Get friend requests sent by a user (Authenticated + Matching User ID)
	fastify.get('/sent/users/:userId', getSentFriendRequestsOpts);

	// Get friend requests received by a user (pending) (Authenticated + Matching User ID)
	fastify.get('/received/users/:userId', getReceivedFriendRequestsOpts);

	// Add friend request (Authenticated - sender is authenticated user)
	fastify.post('/', addFriendRequestOpts);

	// Update friend request status (accept/reject) (Authenticated + Receiver)
	fastify.put('/status/:id', updateFriendRequestStatusOpts);

	// Delete friend request (Authenticated + Participant)
	fastify.delete('/:id', deleteFriendRequestOpts);

	done();
}

module.exports = friendRequestsRoutes;
