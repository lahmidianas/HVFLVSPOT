import jwt from 'jsonwebtoken';

export const validateSystemToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No system token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SYSTEM_SECRET);
    
    if (decoded.type !== 'system') {
      return res.status(403).json({ message: 'Invalid token type' });
    }

    req.system = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid system token' });
  }
};

export const requireSystemPermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    const systemPermissions = req.system.permissions;

    const hasAllPermissions = requiredPermissions.every(
      permission => systemPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({ 
        message: 'Insufficient system permissions' 
      });
    }

    next();
  };
};