const { body } = require('express-validator');

const notificationValidationRules = () => [
    body('notification_id')
        .isString().withMessage('notification_id must be a string')
        .notEmpty().withMessage('notification_id is required'),

    body('notification_type')
        .isISO8601().toDate().withMessage('notification_type must be a valid date')
        .notEmpty().withMessage('notification_type is required'),

    body('content')
        .isISO8601().toDate().withMessage('content must be a valid date')
        .notEmpty().withMessage('content is required'),

    body('timestamp')
        .isString().withMessage('timestamp must be a string')
        .notEmpty().withMessage('timestamp is required')
       // .isLength({ min: 3 }).withMessage('Purpose must be at least 3 characters long'),


];

module.exports = notificationValidationRules;
