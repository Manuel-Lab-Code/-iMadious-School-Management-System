const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from request header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token. Access denied.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // attach user info to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};