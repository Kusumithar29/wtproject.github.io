const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const signupRules = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isAlpha().withMessage('Name can only contain alphabets (A-Z, a-z). No numbers, spaces, or special characters.'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address (something@something.com)'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'manager', 'owner', 'tenant']).withMessage('Invalid role selected'),
  body('phone')
    .optional()
    .isString().withMessage('Phone must be a string'),
  body('flatNumber')
    .custom((value, { req }) => {
      const { role } = req.body;
      if (role === 'tenant' && (!value || value.trim() === '')) {
        throw new Error('Flat number is required for tenants (current rental unit)');
      }
      return true;
    }),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 7 }).withMessage('Password must be greater than 6 characters')
    .isAlphanumeric().withMessage('Password must be alphanumeric only')
    .custom((value, { req }) => {
      const { role } = req.body;
      if (role === 'admin' && !/^ADM\d+$/.test(value)) {
        throw new Error('Admin password must start with "ADM" followed by digits (e.g. ADM123456)');
      }
      if (role === 'manager' && !/^MNG\d+$/.test(value)) {
        throw new Error('Manager password must start with "MNG" followed by digits (e.g. MNG123456)');
      }
      if (role === 'owner' && !/^OWN\d+$/.test(value)) {
        throw new Error('Owner password must start with "OWN" followed by digits (e.g. OWN123456)');
      }
      if (role === 'tenant' && !/^TEN\d+$/.test(value)) {
        throw new Error('Tenant password must start with "TEN" followed by digits (e.g. TEN123456)');
      }
      return true;
    })
];

const loginRules = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'manager', 'owner', 'tenant']).withMessage('Invalid role selected')
];

module.exports = {
  validate,
  signupRules,
  loginRules
};
