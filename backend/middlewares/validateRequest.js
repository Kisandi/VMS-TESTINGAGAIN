// middlewares/validateRequest.js
const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        const formattedErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg
        }));
        return res.status(400).json({ error: true, errors: formattedErrors });
    }
    next();
};
