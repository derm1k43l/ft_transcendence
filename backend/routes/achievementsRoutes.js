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
	UnauthorizedErrorSchema,
	ForbiddenErrorSchema,
} = require('../schemas/errorSchema');

const { Achievement } = require('../schemas/achievementsSchema');

const authPreHandler = require('./authPreHandlerRoutes');

// Options for get all Achievements (Public route)
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

// Options for get single Achievement (Requires AUTH + Ownership Check)
const getAchievementOpts = {
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
			200: Achievement,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getAchievement,
};

// Options for get Achievements for a specific user (Requires AUTH + Matching User ID Check)
const getUserAchievementsOpts = {
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
				items: Achievement,
			},
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: getUserAchievements,
};

// Options for add Achievement (Requires AUTH - adding for themselves)
const addAchievementOpts = {
	preHandler: [authPreHandler],
	schema: {
		body: {
			type: 'object',
			required: ['name', 'description', 'icon'],
			properties: {
				name: { type: 'string', minLength: 1 },
				description: { type: 'string', minLength: 1},
				icon: { type: 'string', minLength: 1},
				completed: { type: 'integer', default: 0 },
				date_completed: { type: 'string', format: 'date-time', nullable: true},
			},
			additionalProperties: false
		},
		response: {
			201: Achievement,
			400: ValidationErrorSchema,
			401: UnauthorizedErrorSchema,
			409: BasicErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: addAchievement,
};

// Options for update Achievement (Requires AUTH + Ownership Check)
const updateAchievementOpts = {
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
			properties: {
				// user_id: { type: 'integer'}, // prevent changing ownership
				name: { type: 'string', minLength: 1},
				description: { type: 'string', minLength: 1},
				icon: { type: 'string', minLength: 1},
				completed: { type: 'integer'},
				date_completed: { type: 'string', format: 'date-time', nullable: true},
			},
			minProperties: 1,
			additionalProperties: false
		},
		response: {
			200: Achievement,
			401: UnauthorizedErrorSchema,
			403: ForbiddenErrorSchema,
			404: BasicErrorSchema,
			400: ValidationErrorSchema,
			500: BasicErrorSchema
		},
	},
	handler: updateAchievement,
};

// Options for delete Achievement (Requires AUTH + Ownership Check)
const deleteAchievementOpts = {
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
	handler: deleteAchievement,
};

function achievementsRoutes (fastify, options, done) {
	// Get all achievements (Public route)
	fastify.get('/', getAchievementsOpts);

	// Get single achievement by ID (Authenticated + Ownership)
	fastify.get('/:id', getAchievementOpts);

	// Get achievements for a specific user (Authenticated + Matching User ID)
	fastify.get('/users/:userId', getUserAchievementsOpts);

	// Add achievement (Authenticated - adds for themselves)
	fastify.post('/', addAchievementOpts);

	// Update achievement by ID (Authenticated + Ownership)
	fastify.put('/:id', updateAchievementOpts);

	// Delete achievement by ID (Authenticated + Ownership)
	fastify.delete('/:id', deleteAchievementOpts);

	done();
}

module.exports = achievementsRoutes;
