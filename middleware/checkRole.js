module.exports = (requiredRole) => {
  
    return (req, res, next) => {
      console.log("👤 User from token:", req.user);
      if (!req.user || req.user.role !== requiredRole) {
        return res.status(403).json({ message: 'Access denied: Superadmin only' });
        console.log("⛔️ Unauthorized role:", req.user.role);
      }
      next();
    };
  };