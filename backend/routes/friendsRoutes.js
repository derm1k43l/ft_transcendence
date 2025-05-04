const {
	getUserFriends,
	checkFriendship,
	addFriendship,
	removeFriendship,
} = require('../controllers/friendsController');

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
			500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
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
			500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: checkFriendship,
};

// Options for add friendship
const addFriendshipOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['user_id', 'friend_id'],
			properties: {
				user_id: { type: 'integer'},
				friend_id: { type: 'integer'},
			},
		},
		response: {
			201: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			400: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			},
			409: {
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
			400: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
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
	handler: removeFriendship,
};

function friendsRoutes (fastify, options, done) {
	// Get friends for a specific user
	fastify.get('/users/:userId/friends', getUserFriendsOpts);

	// Check if two users are friends
	fastify.get('/users/:userId/friends/:friendId', checkFriendshipOpts);

	// Add friendship (requires user_id and friend_id in body)
	fastify.post('/friends', addFriendshipOpts);

	// Remove friendship between two users
	fastify.delete('/users/:userId/friends/:friendId', removeFriendshipOpts);

	done();
}

module.exports = friendsRoutes;
