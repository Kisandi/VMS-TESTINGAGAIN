const nodemailer = require('nodemailer');
// require('dotenv').config();
//
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });
//
// module.exports = async function sendEmail(to, otp) {
//     await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to,
//         subject: 'Your OTP Code',
//         text: `Your OTP is ${otp}. It will expire in 5 minutes.`
//     });
// };


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// utils/sendEmail.js
async function sendEmail({ to, subject, html }) {
    if (!to) {
        throw new Error("No recipient email defined in sendEmail()");
    }

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    });
}



module.exports = sendEmail;

