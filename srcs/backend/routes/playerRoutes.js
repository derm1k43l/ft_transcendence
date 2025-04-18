const {
	getPlayers,
	getPlayer,
	addPlayer,
	deletePlayer,
	updatePlayer,
	} = require('../controllers/playerController')

// Player schema
const Player = {
	type: 'object',
	properties: {
		id: {type: 'integer'},
		username: {type: 'string'},
		created_at: { type: 'string' },
	},
};

// Options for get all Players
const getPlayersOpts = {
	schema: {
		response: {
			200: {
				type: 'array',
				items: Player,
			},
		},
	},
	handler: getPlayers,
}

const getPlayerOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		response: {
			200: Player,
			404: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: getPlayer,
};

const postPlayerOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['username'],
			properties: {
				username: { type: 'string'},
			},
		},
		response: {
			201: Player,
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
			}
		},
	},
	handler: addPlayer,
};

const deletePlayerOpts = {
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
			 }
		},
	},
	handler: deletePlayer,
};

const updatePlayerOpts = {
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
			required: ['username'],
			properties: {
				username: { type: 'string'}
			}
		 },
		response: {
			200: Player,
			 404: {
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
			}
		},
	},
	handler: updatePlayer,
};

function playerRoutes (fastify, options, done) {
	// Get all Players
	fastify.get('/players', getPlayersOpts);

	// Get single Player
	fastify.get('/players/:id', getPlayerOpts);

	// Add Player
	fastify.post('/players', postPlayerOpts);

	// Delete Player
	fastify.delete('/players/:id', deletePlayerOpts);

	// Update Player
	fastify.put('/players/:id', updatePlayerOpts);

	done();
}

module.exports = playerRoutes;
