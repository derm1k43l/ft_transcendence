const {
	getUserFriends,
	checkFriendship,
	addFriendship,
	removeFriendship,
} = require('../controllers/friendsController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
} = require('../schemas/errorSchema');

const { Friend, FriendDetails } = require('../schemas/friendsSchema');

// Options for get friends for a specific user
const getUserFriendsOpts = {
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
			500: BasicErrorSchema
		},
	},
	handler: getUserFriends,
};

// Options for checking if two users are friends
const checkFriendshipOpts = {
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
			500: BasicErrorSchema
		},
	},
	handler: checkFriendship,
};

// Options for add friendship
const addFriendshipOpts = {
	schema: {
		body: {
			...Friend,
			required: ['user_id', 'friend_id'],
		},
		response: {
			201: BasicErrorSchema, // it's fine for just a message
			400: ValidationErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addFriendship,
};

// Options for remove friendship
const removeFriendshipOpts = {
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
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: removeFriendship,
};

function friendsRoutes (fastify, options, done) {
	// Get friends for a specific user
	fastify.get('/users/:userId', getUserFriendsOpts);

	// Check if two users are friends
	fastify.get('/users/:userId/:friendId', checkFriendshipOpts);

	// Add friendship (requires user_id and friend_id in body)
	fastify.post('/', addFriendshipOpts);

	// Remove friendship between two users
	fastify.delete('/users/:userId/:friendId', removeFriendshipOpts);

	done();
}

module.exports = friendsRoutes;
