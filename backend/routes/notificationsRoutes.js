const {
	getNotifications,
	createNotification,
	markNotificationAsRead,
} = require('../controllers/notificationsController');

const {
	NotificationDetails,
	CreateNotificationBody,
	MarkAsReadBody,
} = require('../schemas/notificationsSchema');

const authPreHandler = require('./authPreHandlerRoutes');

const getNotificationsOpts = {
	// user specific notifications, needs auth
	preHandler: [authPreHandler],
	schema: {
		response: {
			200: {
				type: 'array',
				items: NotificationDetails
			},
			401: {
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
		}
	},
	handler: getNotifications,
};

const createNotificationOpts = {
	// we need to know user is auth'd to make notifications
	preHandler: [authPreHandler],
	schema: {
		body: CreateNotificationBody,
		response: {
			201: NotificationDetails,
			400: {
				type: 'object',
				properties: {
					message: { type: 'string' },
					errors: {
						type: 'array',
						items: { type: 'object' }
					}
				}
			},
			401: {
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
		}
	},
	handler: createNotification,
};

const markAsReadOpts = {
	// users only have to be able to mark their own notifications as read
	preHandler: [authPreHandler],
	schema: {
		params: {
			type: 'object',
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		},
		body: MarkAsReadBody,
		response: {
			// 204 has no content, so schema is just null
			204: {
				type: 'null'
			},
			400: {
				type: 'object',
				properties: {
					message: { type: 'string' },
					errors: {
						type: 'array',
						items: { type: 'object' }
					}
				}
			},
			401: {
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
		}
	},
	handler: markNotificationAsRead,
};

function notificationsRoutes(fastify, options, done) {
	// GET /api/notifications - Get notifications for the authenticated user
	fastify.get('/', getNotificationsOpts);

	// POST /api/notifications - Create a new notification
	fastify.post('/', createNotificationOpts);

	// PATCH /api/notifications/:id/read - Mark a specific notification as read
	fastify.patch('/:id/read', markAsReadOpts);

	done();
}

module.exports = notificationsRoutes;
