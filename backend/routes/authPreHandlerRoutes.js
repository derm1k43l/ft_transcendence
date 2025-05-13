const authPreHandler = async (request, reply) => {
	try {
		await request.jwtVerify();
		if (!request.user || !request.user.id) {
			reply.code(401).send({ message: 'Unauthorized: Invalid or missing token payload' });
		}
	} catch (err) {
		//varification fails
		request.log.warn('JWT verification failed: ', err.message);
		reply.code(401).send({ message: 'Authentication failed: Invalid or missing token.' });
	}
};

module.exports = authPreHandler;
