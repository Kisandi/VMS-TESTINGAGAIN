// middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
    console.error(err); // Log the full error stack (important for debugging)

    // Default to 500 Internal Server Error if no status code is provided
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const details = err.details || undefined;  // Additional error details, if available

    res.status(statusCode).json({
        error: true,
        message,
        details,
    });
};
