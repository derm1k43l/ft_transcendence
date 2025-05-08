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
} = require('../schemas/errorSchema');

const { FriendRequest, FriendRequestDetails } = require('../schemas/friendRequestsSchema');

// Options for get all Friend Requests
const getFriendRequestsOpts = {
	schema: {
		response: {
			200: {
				type: 'array',
				items: FriendRequestDetails, // Return detailed request objects
			},
			500: BasicErrorSchema
		},
	},
	handler: getFriendRequests,
};

// Options for get single Friend Request
const getFriendRequestOpts = {
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
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getFriendRequest,
};

// Options for get Sent Friend Requests for a user
const getSentFriendRequestsOpts = {
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
			500: BasicErrorSchema
		},
	},
	handler: getSentFriendRequests,
};

// Options for get Received Friend Requests for a user (usually pending)
const getReceivedFriendRequestsOpts = {
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
			500: BasicErrorSchema
		},
	},
	handler: getReceivedFriendRequests,
};

// Options for add Friend Request
const addFriendRequestOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['from_user_id', 'to_user_id'],
			properties: {
				from_user_id: { type: 'integer'},
				to_user_id: { type: 'integer'},
			},
		},
		response: {
			201: FriendRequest, // Return the basic request object on creation
			400: ValidationErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addFriendRequest,
};

// Options for update Friend Request Status
const updateFriendRequestStatusOpts = {
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
			}
		},
		response: {
			200: BasicErrorSchema,
			400: ValidationErrorSchema,
			404: BasicErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateFriendRequestStatus,
};

// Options for delete Friend Request
const deleteFriendRequestOpts = {
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
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: deleteFriendRequest,
};

function friendRequestsRoutes (fastify, options, done) {
	// Get all friend requests
	fastify.get('/', getFriendRequestsOpts);

	// Get single friend request by ID
	fastify.get('/:id', getFriendRequestOpts);

	// Get friend requests sent by a user
	fastify.get('/sent/users/:userId', getSentFriendRequestsOpts);

	// Get friend requests received by a user (pending)
	fastify.get('/received/users/:userId', getReceivedFriendRequestsOpts);

	// Add friend request
	fastify.post('/', addFriendRequestOpts);

	// Update friend request status (accept/reject)
	fastify.put('/status/:id', updateFriendRequestStatusOpts);

	// Delete friend request
	fastify.delete('/:id', deleteFriendRequestOpts);

	done();
}

module.exports = friendRequestsRoutes;
