const {
	getAchievements,
	getAchievement,
	getUserAchievements,
	addAchievement,
	updateAchievement,
	deleteAchievement,
} = require('../controllers/achievementsController');

const {
	BasicErrorSchema,
	ValidationErrorSchema,
} = require('../schemas/errorSchema');

const { Achievement } = require('../schemas/achievementsSchema');

// Options for get all Achievements
const getAchievementsOpts = {
	schema: {
		response: {
			200: {
				type: 'array',
				items: Achievement,
			},
			500: BasicErrorSchema
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
			404: BasicErrorSchema,
			500: BasicErrorSchema
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
			500: BasicErrorSchema
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
			400: ValidationErrorSchema,
			500: BasicErrorSchema
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
			404: BasicErrorSchema,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
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
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: deleteAchievement,
};

function achievementsRoutes (fastify, options, done) {
	// Get all achievements
	fastify.get('/', getAchievementsOpts);

	// Get single achievement by ID
	fastify.get('/:id', getAchievementOpts);

	// Get achievements for a specific user
	fastify.get('/users/:userId', getUserAchievementsOpts);

	// Add achievement
	fastify.post('/', addAchievementOpts);

	// Update achievement by ID
	fastify.put('/:id', updateAchievementOpts);

	// Delete achievement by ID
	fastify.delete('/:id', deleteAchievementOpts);

	done();
}

module.exports = achievementsRoutes;
