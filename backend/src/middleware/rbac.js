/**
 * Role-Based Access Control Middleware
 * Roles: 'Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User', 'Employee'
 */

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admin always has full access
    if (req.user.role === 'Admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: '${req.user.role}' does not have permission to perform this action.`
      });
    }

    next();
  };
}

// Allows access if user has one of allowed roles OR is acting on their own employee record
function requireSelfOrRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role === 'Admin') {
      return next();
    }

    const targetEmployeeId = parseInt(req.params.id || req.params.employeeId || req.query.employee_id, 10);
    const isSelf = req.user.employee_id && req.user.employee_id === targetEmployeeId;

    if (isSelf || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only access your own records.'
    });
  };
}

module.exports = {
  requireRole,
  requireSelfOrRole
};
