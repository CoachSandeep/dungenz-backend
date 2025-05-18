module.exports = (requiredRole) => {
  console.log("👤 User from token:", req.user);
    return (req, res, next) => {
      if (!req.user || req.user.role !== requiredRole) {
        console.log("⛔️ Unauthorized role:", req.user.role);
        return res.status(403).json({ message: 'Access denied: Superadmin only' });
        
      }
      next();
    };
  };