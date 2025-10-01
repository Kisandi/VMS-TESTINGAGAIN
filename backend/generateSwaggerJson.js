const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Visitor Management System API',
            version: '1.0.0',
        },
        servers: [
            { url: 'http://localhost:8080' }
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

fs.writeFileSync('swagger.json', JSON.stringify(swaggerSpec, null, 2));
console.log('swagger.json has been generated!');
