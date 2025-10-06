// const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');



// Import models
const Appointment = require('./Appointment');
const Blacklist = require('./Blacklist');
const CheckinCheckout = require('./CheckinCheckout');
const Department = require('./Department');
const Location = require('./Location');
const Notification = require('./Notification');
const Permission = require('./Permission');
const PermissionHasUser = require('./PermissionHasUser');
const RestrictedAccessAttempt = require('./RestrictedAccessAttempt');
const RestrictNotification = require('./RestrictNotification');
const User = require('./User');
const UserNotification = require('./UserNotification');
const UserType = require('./UserType');
const Visitor = require('./Visitor');
const VisitorRestriction = require('./VisitorRestriction');
const RFIDToken = require('./RFIDToken');
const Otp = require('./Otp')
const UserDepartment = require('./UserDepartment');
const Access = require('./Access')
const UserRoles = require('./UserRoles');

// In your Sequelize models associations, it should be like:
Visitor.hasMany(Blacklist, { foreignKey: 'visitor_id' });
Blacklist.belongsTo(Visitor, { foreignKey: 'visitor_id' });

User.belongsToMany(Department, {
    through: UserDepartment,
    foreignKey: 'user_id',
    otherKey: 'department_id',
});

Department.belongsToMany(User, {
    through: UserDepartment,
    foreignKey: 'department_id',
    otherKey: 'user_id',
});
// CheckinCheckout
CheckinCheckout.belongsTo(Appointment, {
    foreignKey: 'appointment_id',
    as: 'appointment'
});


// Appointment
Appointment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// One department has many appointments
Department.hasMany(Appointment, {
    foreignKey: 'department_id'
});

UserRoles.belongsTo(UserType, { foreignKey: 'user_type_id', as: 'userType' });
UserType.hasMany(UserRoles, { foreignKey: 'user_type_id', as: 'userRoles' });

Access.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
// RFIDToken belongs to Appointment and Visitor

RFIDToken.belongsTo(Visitor, { foreignKey: 'visitor_id' });

// Appointment belongs to Location
Appointment.belongsTo(Location, { foreignKey: 'location_id' });

// VisitorRestriction belongs to RFIDToken and RestrictedAccessAttempt and Visitor
VisitorRestriction.belongsTo(RFIDToken, { foreignKey: 'token_id' });
VisitorRestriction.belongsTo(RestrictedAccessAttempt, { foreignKey: 'restricted_attempt_id' });
VisitorRestriction.belongsTo(Visitor, { foreignKey: 'visitor_id' });

// One visitor has many appointments
Visitor.hasMany(Appointment, {
    foreignKey: 'visitor_id',
});
//
// One user has many appointments
User.hasMany(Appointment, {
    foreignKey: 'user_id',
});

// One appointment belongs to one visitor
Appointment.belongsTo(Visitor, {
    foreignKey: 'visitor_id'
});

// One appointment belongs to one token
Appointment.belongsTo(RFIDToken, {
    foreignKey: 'token_id'
});


// One appointment belongs to one user
Appointment.belongsTo(User, {
    foreignKey: 'user_id',
});





// CheckinCheckout - RFIDToken
CheckinCheckout.belongsTo(RFIDToken, {
    foreignKey: 'token_id'
});
RFIDToken.hasMany(CheckinCheckout, {
    foreignKey: 'token_id'
});

// CheckinCheckout - Visitor
CheckinCheckout.belongsTo(Visitor, {
    foreignKey: 'visitor_id'
});
Visitor.hasMany(CheckinCheckout, {
    foreignKey: 'visitor_id'
});

// Location - RFIDToken
Location.belongsTo(RFIDToken, {
    foreignKey: 'token_id'
});
RFIDToken.hasMany(Location, {
    foreignKey: 'token_id'
});

// Location - Visitor
Location.belongsTo(Visitor, {
    foreignKey: 'visitor_id'
});
Visitor.hasMany(Location, {
    foreignKey: 'visitor_id'
});

// User.js
User.belongsToMany(UserType, {
  through: 'user_roles',
  foreignKey: 'user_id',
  otherKey: 'user_type_id',
  as: 'roles',
  timestamps: false
});

// UserType.js
UserType.belongsToMany(User, {
  through: 'user_roles',
  foreignKey: 'user_type_id',
  otherKey: 'user_id',
  as: 'users',
   timestamps: false 
});

User.hasMany(UserRoles, { foreignKey: 'user_id', as: 'userRoles' });
UserRoles.belongsTo(User, { foreignKey: 'user_id', as: 'user' });


// Location - User
Location.belongsTo(User, {
    foreignKey: 'user_id'
});
User.hasMany(Location, {
    foreignKey: 'user_id'
});


// Notification - RFIDToken
Notification.belongsTo(RFIDToken, {
    foreignKey: 'token_id'
});
RFIDToken.hasMany(Notification, {
    foreignKey: 'token_id'
});

// Notification - Visitor
Notification.belongsTo(Visitor, {
    foreignKey: 'visitor_id'
});
Visitor.hasMany(Notification, {
    foreignKey: 'visitor_id'
});

// Notification - User
Notification.belongsTo(User, {
    foreignKey: 'user_id'
});
User.hasMany(Notification, {
    foreignKey: 'user_id'
});

// Notification - CheckinCheckout
Notification.belongsTo(CheckinCheckout, {
    foreignKey: 'checkin_id'
});
CheckinCheckout.hasMany(Notification, {
    foreignKey: 'checkin_id'
});

CheckinCheckout.hasMany(Access, {
    foreignKey: 'token_id',
    sourceKey: 'token_id',  // use CC.token_id to match Access.token_id
    as: 'accesses',
});

Access.belongsTo(CheckinCheckout, {
    foreignKey: 'token_id',
    targetKey: 'token_id',  // tell it which CC field Access.token_id points to
    as: 'checkin',          // alias optional; not used in your include
});

// Permission - User
Permission.belongsTo(User, {
    foreignKey: 'user_id'
});
User.hasMany(Permission, {
    foreignKey: 'user_id'
});

// Permission - Department
Permission.belongsTo(Department, {
    foreignKey: 'department_id'
});
Department.hasMany(Permission, {
    foreignKey: 'department_id'
});


// Many-to-many relationship between Permission and User through permission_has_user table
Permission.belongsToMany(User, {
    through: PermissionHasUser,
    foreignKey: 'permission_id',
    otherKey: 'user_id',
});

User.belongsToMany(Permission, {
    through: PermissionHasUser,
    foreignKey: 'user_id',
    otherKey: 'permission_id',
});

PermissionHasUser.belongsTo(Department, {
    foreignKey: 'department_id',
});
PermissionHasUser.belongsTo(UserType, {
    foreignKey: 'user_type_id',
});
Department.hasMany(PermissionHasUser, {
    foreignKey: 'department_id',
});
UserType.hasMany(PermissionHasUser, {
    foreignKey: 'user_type_id',
});


RestrictedAccessAttempt.belongsToMany(Notification, {
    through: 'restricted_notification',
    foreignKey: 'restricted_attempt_id',
    otherKey: 'notification_id'
});

Notification.belongsToMany(RestrictedAccessAttempt, {
    through: 'restricted_notification',
    foreignKey: 'notification_id',
    otherKey: 'restricted_attempt_id'
});

Access.belongsTo(RFIDToken, { foreignKey: 'token_id' });


RFIDToken.belongsTo(Visitor, {
    foreignKey: 'visitor_id',
});

RFIDToken.belongsTo(User, {
    foreignKey: 'user_id',
});

RFIDToken.belongsTo(RestrictedAccessAttempt, {
    foreignKey: 'attempt_id',
});

Visitor.hasMany(RFIDToken, {
    foreignKey: 'visitor_id',
});


User.hasMany(RFIDToken, {
    foreignKey: 'user_id',
});


RestrictedAccessAttempt.hasMany(RFIDToken, {
    foreignKey: 'attempt_id',
});

Visitor.hasOne(RFIDToken, { foreignKey: 'visitor_id' });



RFIDToken.belongsTo(Visitor, { foreignKey: 'visitor_id' });

VisitorRestriction.belongsTo(RFIDToken, {
    foreignKey: 'token_id',
});

VisitorRestriction.belongsTo(RestrictedAccessAttempt, {
    foreignKey: 'restricted_attempt_id',
});

VisitorRestriction.belongsTo(Visitor, {
    foreignKey: 'visitor_id',
});


RFIDToken.hasMany(VisitorRestriction, {
    foreignKey: 'token_id',
});

RestrictedAccessAttempt.hasMany(VisitorRestriction, {
    foreignKey: 'restricted_attempt_id',
});

Location.belongsTo(Department, {
    foreignKey: 'department_id',
    as: 'department'
});


Visitor.hasMany(VisitorRestriction, {
    foreignKey: 'visitor_id',
});


User.belongsToMany(Department, {
    through: UserDepartment,
    foreignKey: 'user_id',
    otherKey: 'department_id',
});

Department.belongsToMany(User, {
    through: UserDepartment,
    foreignKey: 'department_id',
    otherKey: 'user_id',
});

PermissionHasUser.belongsTo(User, { foreignKey: 'user_id', as: 'User'  });
PermissionHasUser.belongsTo(Location, { foreignKey: 'location_id', as: 'Location' });

Location.hasMany(PermissionHasUser, { foreignKey: 'location_id' });



// One Location can have many Appointments
Location.hasMany(Appointment, {
    foreignKey: 'location_id',
    as: 'appointments',
});
Location.hasMany(Access, { foreignKey: 'location_id', as: 'accesses' });

Visitor.hasMany(Otp, { foreignKey: 'visitor_id' });
Otp.belongsTo(Visitor, { foreignKey: 'visitor_id' });


// Appointment -> Token
Appointment.hasOne(RFIDToken, { foreignKey: 'appointment_id' });
RFIDToken.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// Token -> Check-in
RFIDToken.hasOne(CheckinCheckout, { foreignKey: 'token_id' });
CheckinCheckout.belongsTo(RFIDToken, { foreignKey: 'token_id' });

// Appointment -> Department
Appointment.belongsTo(Department, { foreignKey: 'department_id' , as: 'Department' });

// Token -> User (host)
RFIDToken.belongsTo(User, { foreignKey: 'user_id' });

CheckinCheckout.belongsTo(RFIDToken, { foreignKey: 'token_id', as: 'rfid_token' });
// Visitor.belongsTo(Department); // example
// Add this to link Appointment -> CheckinCheckout
Appointment.hasOne(CheckinCheckout, {
    foreignKey: 'appointment_id',
    as: 'checkinCheckout'
});

// Visitor - Appointment (1-to-many)
Visitor.hasMany(Appointment, { foreignKey: 'visitor_id' });
Appointment.belongsTo(Visitor, { foreignKey: 'visitor_id' });

// Appointment - RFIDToken (optional association)
RFIDToken.hasMany(Appointment, { foreignKey: 'token_id' });
Appointment.belongsTo(RFIDToken, { foreignKey: 'token_id' });

// Visitor - CheckinCheckout (1-to-many)
Visitor.hasMany(CheckinCheckout, { foreignKey: 'visitor_id' });
CheckinCheckout.belongsTo(Visitor, { foreignKey: 'visitor_id' });

// RFIDToken - CheckinCheckout (1-to-many)
RFIDToken.hasMany(CheckinCheckout, { foreignKey: 'token_id' });
CheckinCheckout.belongsTo(RFIDToken, { foreignKey: 'token_id' });

// Sync all models to the database
sequelize.sync()
    .then(() => {
        console.log('Database synced successfully!');
    })
    .catch((error) => {
        console.error('Error syncing database:', error);
    });



// Export sequelize instance and models
module.exports = {
    sequelize,
    Appointment,
    Blacklist,
    CheckinCheckout,
    Department,
    Location,
    Notification,
    Permission,
    User,
    Visitor,
    RFIDToken,
    PermissionHasUser,
    RestrictedAccessAttempt,
    RestrictNotification,
    UserNotification,
    UserType,
    VisitorRestriction,
    Otp,
    UserDepartment,
    Access,
    UserRoles,

};
