const Notification = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		user_id: { type: 'integer' },
		type: {
			type: 'string',
			enum: ['friendRequest', 'gameInvite', 'achievement', 'system'],
		},
		message: { type: 'string' },
		read: {
			type: 'integer',
			enum: [0, 1],
		},
		timestamp: {
			type: 'string',
			format: 'date-time',
		},
		action_url: { type: 'string', nullable: true },
		related_user_id: { type: 'integer', nullable: true },
	},
	required: [
		'id',
		'user_id',
		'type',
		'message',
		'read',
		'timestamp',
	],
};

// Schema for notification objects when retrieved, including related user details
const NotificationDetails = {
	type: 'object',
	properties: {
		...Notification.properties, // Include all properties from the base Notification schema
		related_username: { type: 'string', nullable: true },
		related_display_name: { type: 'string', nullable: true },
		related_avatar_url: { type: 'string', nullable: true },
	},
	required: [
		...Notification.required, // Include all required fields from the base schema
	],
};

// Schema for the request body when creating a notification
const CreateNotificationBody = {
	type: 'object',
	properties: {
		user_id: { type: 'integer' }, // Required: recipient user ID
		type: { // Required: notification type from enum
			type: 'string',
			enum: ['friendRequest', 'gameInvite', 'achievement', 'system'],
		},
		message: { type: 'string' }, // Required: notification message
		action_url: { type: 'string', nullable: true }, // Optional
		related_user_id: { type: 'integer', nullable: true }, // Optional
	},
	required: ['user_id', 'type', 'message'],
	additionalProperties: false,
};

// Schema for the request body when marking a notification as read
const MarkAsReadBody = {
	type: 'object',
	properties: {
		read: { type: 'integer', const: 1 } // Must be integer 1
	},
	required: ['read'],
	additionalProperties: false, // Only allow the 'read' field
};

module.exports = {
	Notification,
	NotificationDetails,
	CreateNotificationBody,
	MarkAsReadBody,
};
