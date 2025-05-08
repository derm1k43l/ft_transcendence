const BasicErrorSchema = {
	type: 'object',
	properties: {
		message: { type: 'string' }
	},
	required: ['message']
};

const UnauthorizedErrorSchema = {
	type: 'object',
	properties: {
		message: { type: 'string' }
	},
	required: ['message']
};

const ForbiddenErrorSchema = {
	type: 'object',
	properties: {
		message: { type: 'string' }
	},
	required: ['message']
};

const ValidationErrorSchema = {
	type: 'object',
	properties: {
		message: { type: 'string' },
		errors: {
			type: 'array',
			items: { type: 'string' }
		}
	},
	required: ['message']
};

module.exports = {
	BasicErrorSchema,
	ValidationErrorSchema,
	UnauthorizedErrorSchema,
	ForbiddenErrorSchema,
};

// 400, Validation error
// 401, Unauthorized ErrorSchema
// 403, Forbidden ErrorSchema
// 404, BasicErrorSchema
// 409, BasicErrorSchema
// 500, BasicError
