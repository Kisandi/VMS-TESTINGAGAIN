const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Visitor Management System API',
            version: '1.0.0',
            description: 'Auto-generated API documentation for your project',
        },
        servers: [
            { url: 'http://localhost:8080' } // your server URL
        ],
    },
    // Paths to files containing JSDoc comments
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = (app) => {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs', (req, res) => res.json(swaggerSpec));
};
