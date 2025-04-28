const {
	getAchievements,
	getAchievement,
	getUserAchievements,
	addAchievement,
	updateAchievement,
	deleteAchievement,
} = require('../controllers/achievementsController');

const { Achievement } = require('../schemas/achievementsSchema');

// Options for get all Achievements
const getAchievementsOpts = {
	schema: {
		response: {
			200: {
				type: 'array',
				items: Achievement,
			},
			500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: getAchievements,
};

// Options for get single Achievement
const getAchievementOpts = {
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		response: {
			200: Achievement,
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
	handler: getAchievement,
};

// Options for get Achievements for a specific user
const getUserAchievementsOpts = {
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
				items: Achievement,
			},
			500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: getUserAchievements,
};

// Options for add Achievement
const addAchievementOpts = {
	schema: {
		body: {
			type: 'object',
			required: ['user_id', 'name', 'description', 'icon'],
			properties: {
				user_id: { type: 'integer'},
				name: { type: 'string'},
				description: { type: 'string'},
				icon: { type: 'string'},
				completed: { type: 'integer'},
				date_completed: { type: 'string'},
			},
		},
		response: {
			201: Achievement,
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
	handler: addAchievement,
};

// Options for update Achievement
const updateAchievementOpts = {
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
			properties: {
				user_id: { type: 'integer'},
				name: { type: 'string'},
				description: { type: 'string'},
				icon: { type: 'string'},
				completed: { type: 'integer'},
				date_completed: { type: 'string'},
			}
		 },
		response: {
			200: Achievement,
			 404: {
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
			 500: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		},
	},
	handler: updateAchievement,
};

// Options for delete Achievement
const deleteAchievementOpts = {
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
	handler: deleteAchievement,
};

function achievementsRoutes (fastify, options, done) {
	// Get all achievements
	fastify.get('/achievements', getAchievementsOpts);

	// Get single achievement by ID
	fastify.get('/achievements/:id', getAchievementOpts);

	// Get achievements for a specific user
	fastify.get('/users/:userId/achievements', getUserAchievementsOpts);

	// Add achievement
	fastify.post('/achievements', addAchievementOpts);

	// Update achievement by ID
	fastify.put('/achievements/:id', updateAchievementOpts);

	// Delete achievement by ID
	fastify.delete('/achievements/:id', deleteAchievementOpts);

	done();
}

module.exports = achievementsRoutes;
