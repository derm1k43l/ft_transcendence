const Notification = {
	type: 'object',
	additionalProperties: false,
	properties: {
		id: { type: 'integer', minimum: 1 },
		user_id: { type: 'integer', minimum: 1 },
		type: {
			type: 'string',
			enum: ['friendRequest', 'gameInvite', 'achievement', 'system'],
			minLength: 1
		},
		message: { type: 'string', minLength: 1 },
		read: {
			type: 'integer',
			enum: [0, 1],
		},
		timestamp: {
			type: 'string',
			format: 'date-time',
		},
		action_url: { type: 'string', format: 'uri-reference', nullable: true },
		related_user_id: { type: 'integer', minimum: 1, nullable: true },
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
	additionalProperties: false,
	properties: {
		...Notification.properties, // Include all properties from the base Notification schema
		related_username: { type: 'string', minLength: 1, nullable: true },
		related_display_name: { type: 'string', minLength: 1, nullable: true },
		related_avatar_url: { type: 'string', format: 'uri-reference', nullable: true },
	},
	required: [
		...Notification.required, // Include all required fields from the base schema
	],
};

// Schema for the request body when creating a notification
const CreateNotificationBody = {
	type: 'object',
	additionalProperties: false,
	properties: {
		user_id: { type: 'integer', minimum: 1 },
		type: {
			type: 'string',
			enum: ['friendRequest', 'gameInvite', 'achievement', 'system'],
			minLength: 1
		},
		message: { type: 'string', minLength: 1 },
		action_url: { type: 'string', format: 'uri-reference', nullable: true }, // Optional
		related_user_id: { type: 'integer', minimum: 1, nullable: true }, // Optional
	},
	required: ['user_id', 'type', 'message'],
};

// Schema for the request body when marking a notification as read
const MarkAsReadBody = {
	type: 'object',
	additionalProperties: false,
	properties: {
		read: { type: 'integer', const: 1 } // Must be integer 1
	},
	required: ['read'],
};

module.exports = {
	Notification,
	NotificationDetails,
	CreateNotificationBody,
	MarkAsReadBody,
};
