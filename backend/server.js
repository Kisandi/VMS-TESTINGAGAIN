// IMPORT REQUIRED MODULES

const express = require('express'); //TO CREATE SERVER AND APIs
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

//const bodyParser = require("body-parser");
const morgan = require('morgan'); //SHOW LOGS OF HTTP REQUESTS IN THE CONSOLE
const dotenv = require('dotenv'); //READ SECRET KEYS FROM .ENV FILE
const {sequelize, AdminRoutes} = require('./models');
const errorHandler = require('./middlewares/errorHandler');
const http = require('http');
const socketIo = require('socket.io');
const { validateVisitorInput } = require("./validators/visitorSignInVaildator");
const cookieParser = require('cookie-parser');
//LOAD ENVIRONMENT VARIABLES (PORT) FROM .ENV FILE
dotenv.config();


//CREATE EXPRESS APPLICATION
const app = express();
const server = http.createServer(app);


// TO READ JSON DATA FROM INCOMING REQUESTS
app.use(express.json());
app.use(cookieParser());
// LOGS REQUEST DETAILS ( METHOD, URL, TIME ) IN THE CONSOLE
app.use(morgan('dev'));
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000', // your React frontend URL
        methods: ['GET', 'POST']
    }
});
app.use(cors({
    origin: 'http://localhost:3000',  // React app URL
    credentials: true
}));

//app.use(bodyParser.json());

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Attach io instance to app for later use
app.set('io', io);
require('./swagger')(app);
// ROUTES
const protectedRoutes = require('./routes/protectedRoutes');

app.use("/api/v1/visitor", require("./routes/visitorRoutes")); //1
app.use("/api/v1/department", require("./routes/departmentRoutes"));
app.use("/api/v1/rfid", require("./routes/rfidTokenRoutes"));
app.use("/api/v1/checkInOut", require("./routes/checkInOutRoutes"));
app.use("/api/v1/appointment", require("./routes/appointmentRoutes"));  //5
app.use("/api/v1/notification", require("./routes/notificationRoutes"));
app.use('/api/v1/admin/blacklist', require("./routes/blacklistRoutes")); 
app.use("/api/v1/restrictedAccessAttempt", require("./routes/restrictedAccessAttemptRoutes"));
app.use("/api/v1/visitorRestriction", require("./routes/visitorRestrictionRoutes"));
app.use("/api/v1/restrictedNotification", require("./routes/restrictedNotificationRoutes"));  //10
app.use("/api/v1/userTypes", require("./routes/userTypeRoutes"));
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/user", require("./routes/userRoutes"));
app.use("/api/v1/checkin", require("./routes/checkinRoutes"));
app.use("/api/v1/location", require("./routes/locationRoutes"));
app.use('/api/v1/user-department', require("./routes/userDepartmentRoutes"));
app.use("/api/v1/permission", require("./routes/permissionRoutes"));
app.use("/api/v1/permissionHasUser", require("./routes/permissionHasUserRoutes"));
app.use("/api/v1/access", require("./routes/accessRoutes"));
app.use("/api/v1/visit", require("./routes/visitRoutes"));
app.use("/api/v1/admin", require('./routes/adminRoutes'));

app.use('/api/v1/user', protectedRoutes);

app.post("/submit", (req, res) => {
    const { mode, value } = req.body;

    // Use the validator here
    const validationResult = validateVisitorInput({ mode, value });

    if (!validationResult.valid) {
        return res.status(400).json({ error: validationResult.error });
    }

    // If valid
    res.json({ message: `Received valid ${mode}`, data: { mode, value } });
});


//  TO CHECK WHETHER SERVER IS WORKING
app.get('/test',  (req, res) => {
    res.status(200).send('Hello World')
});



// Swagger UI endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, {
    swaggerOptions: { url: '/api-docs' }
}));


// 404 handler for unknown endpoints
app.use((req, res, next) => {
    res.status(404).json({ error: true, message: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);


const PORT = process.env.PORT || 8080;




(async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        server.listen(PORT, () => {
            console.log(`Server + WebSocket running on port ${PORT}`);
        });


    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
})();
