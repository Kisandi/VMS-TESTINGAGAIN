const { body } = require('express-validator');

const permissionValidationRules = () => [
    body('permission_id')
        .isString().withMessage('permission_id must be a string')
        .notEmpty().withMessage('permission_id is required'),

    body('permission_name')
        .isISO8601().toDate().withMessage('permission_name must be a valid date')
        .notEmpty().withMessage('permission_name is required'),

    body('created_at')
        .isISO8601().toDate().withMessage('created_at must be a valid date')
        .notEmpty().withMessage('created_at is required'),

    body('updated_at')
        .isString().withMessage('updated_at must be a string')
        .notEmpty().withMessage('updated_at is required')
        .isLength({ min: 3 }).withMessage('Purpose must be at least 3 characters long'),


];

module.exports = permissionValidationRules;
