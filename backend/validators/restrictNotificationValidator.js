const { body } = require('express-validator');

const restrictNotificationValidationRules = () => [
    body('restricted_attempt_id')
        .isString().withMessage('restricted_attempt_id must be a string')
        .notEmpty().withMessage('restricted_attempt_id is required'),

    body('notification_id')
        .isISO8601().toDate().withMessage('notification_id must be a valid date')
        .notEmpty().withMessage('notification_id is required'),


];

module.exports = restrictNotificationValidationRules;
