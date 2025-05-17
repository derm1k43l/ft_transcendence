const {
	getUserFriends,
	checkFriendship,
	addFriendship,
	removeFriendship,
} = require('../controllers/friendsController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
	UnauthorizedErrorSchema,
	ForbiddenErrorSchema,
} = require('../schemas/errorSchema');

const { Friend, FriendDetails } = require('../schemas/friendsSchema');

const authPreHandler = require('./authPreHandlerRoutes');

// Options for get friends for a specific user (Requires AUTH)
const getUserFriendsOpts = {
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
				items: FriendDetails, // Return friend details
			},
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getUserFriends,
};

// Options for checking if two users are friends (Requires AUTH + Participant Check)
const checkFriendshipOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				userId: { type: 'integer' },
				friendId: { type: 'integer' }
			},
			required: ['userId', 'friendId']
		},
		response: {
			200: {
				type: 'object',
				properties: {
					isFriend: { type: 'boolean' }
				}
			},
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: checkFriendship,
};

// Options for add friendship (Requires AUTH - user_id is authenticated user)
const addFriendshipOpts = {
	preHandler: [authPreHandler],
	schema: {
		body: {
			...Friend,
			required: ['friend_id'],
		},
		response: {
			201: BasicErrorSchema, // it's fine for just a message
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addFriendship,
};

// Options for remove friendship (Requires AUTH + Participant Check)
const removeFriendshipOpts = {
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				userId: { type: 'integer' },
				friendId: { type: 'integer' }
			},
			required: ['userId', 'friendId']
		},
		response: {
			200: {
				type: 'object',
				properties: {
					message: {type: 'string'}
				},
			},
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: removeFriendship,
};

function friendsRoutes (fastify, options, done) {
	// Get friends for a specific user (Authenticated)
	fastify.get('/users/:userId', getUserFriendsOpts);

	// Check if two users are friends (Authenticated + Participant)
	fastify.get('/users/:userId/:friendId', checkFriendshipOpts);

	// Add friendship (Authenticated - user_id is authenticated user)
	fastify.post('/', addFriendshipOpts);

	// Remove friendship between two users (Authenticated + Participant)
	fastify.delete('/users/:userId/:friendId', removeFriendshipOpts);

	done();
}

module.exports = friendsRoutes;
