const authPreHandler = async (request, reply) => {
	try {
		await request.jwtVerify();
	} catch (err) {
		//varification fails
		request.log.warn('JWT verification failed: ', err.message);
		reply.code(401).send({ message: 'Authentication failed: Invalid or missing token.' });
	}
};

module.exports = authPreHandler;
