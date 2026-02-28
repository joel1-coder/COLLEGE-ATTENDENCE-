const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization || req.headers.Authorization;
	if (!authHeader) {
		return res.status(401).json({ message: 'No token provided' });
	}

	// Expect header like: 'Bearer <token>'
	const parts = authHeader.split(' ');
	const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : authHeader;

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
		req.user = payload;
		next();
	} catch (err) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}

function requireRole(role) {
	return function (req, res, next) {
		console.log('[requireRole] checking role', role, 'req.user=', req.user);
		if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
		if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
		next();
	};
}

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
