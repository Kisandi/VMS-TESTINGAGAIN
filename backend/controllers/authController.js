const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Visitor, UserRoles } = require('../models');
const sendEmail = require('../utils/sendEmail');
const Otp = require('../models/Otp');  // adjust path if needed
const crypto = require('crypto');
const { Op } = require('sequelize');
const { isStrongPassword } = require('../utils/validators/authValidators');
const { isValidEmail } = require('../utils/validators/authValidators');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';


exports.forgotPassword = async (req, res) => {
  const { email, role } = req.body;
  console.log('Received:', { email, role });
  if (!email || !role || !isValidEmail(email))
    return res.status(400).json({ success: false, message: 'Email is required' });

  const roleMap = {
    admin: 'UTI03',
    host: 'UTI01',
    receptionist: 'UTI02'
  };

  const userTypeId = roleMap[role.toLowerCase()];
  if (!userTypeId) {
    return res.status(400).json({ success: false, message: 'Invalid role specified' });
  }

  try {
    const user = await User.findOne({ where: { email },
      include: {
        model: UserRoles,
        as: 'userRoles',
        where: { user_type_id: userTypeId },
        required: true
      }
    });

    if (!user)
      return res.status(404).json({ success: false, message: `No ${role} account found with that email`  });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      reset_password_token: token,
      reset_password_expires: expires,
    });

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      html: `
        <p>Hello,</p>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    res.json({ success: true, message: 'Password reset link sent to email' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// controllers/authController.js
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password  || !isStrongPassword(password))
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.' });

  try {
    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() },
      }
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    // Hash new password (replace this with your actual hash logic)

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null,
    });

    await sendEmail({
      to: user.email,
      subject: 'Password Successfully Reset',
      html: '<p>Your password has been reset successfully. If this was not you, please contact support immediately.</p>'
    });

    res.json({ success: true, message: 'Password has been reset successfully' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ============================
// 🧑 Staff User Registration
// ============================
exports.register = async (req, res) => {
  try {
    const { name, username, password, first_name, last_name, email, contact, role } = req.body;

    if (!name || !username || !password || !first_name || !last_name || !email || !contact) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      username,
      password: hashedPassword,
      email,
      contact,
      first_name,
      last_name,
      role: role || 'staff',
    });

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({ message: 'Registration successful.', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};

// ============================
// 🧑 Staff User Login
// ============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ message: 'Login successful.', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};

// ============================
// 🧾 Get Logged-in User Profile
// ============================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};

// ============================
// 📨 Visitor: Send OTP (Email/SMS)
// ============================
exports.sendOtp = async (req, res) => {
  try {
    const { method, value } = req.body; // method: 'email' or 'phone'

    if (!method || !value) {
      return res.status(400).json({ message: 'Method and value are required.' });
    }

    if (method !== 'email') {
      return res.status(400).json({ message: 'Only email OTP is supported on backend. Use Firebase for phone OTP.' });
    }

    const visitor = await Visitor.findOne({ where: { email: value } });

    if (!visitor) {
      return res.status(404).json({ message: 'Your email address is not registered.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

    await Otp.create({
      code: otpCode,
      expiresAt,
      verified: false,
      visitor_id: visitor.visitor_id,
    });

    await sendEmail({
      to: value,
      subject: 'Your OTP Code',
      html: `<p>Your OTP is <b>${otpCode}</b>. It will expire in 5 minutes.</p>`,
    });


    res.json({
      message: 'OTP sent successfully.',

        visitor_id: visitor.visitor_id,

        email: visitor.email,


    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};


// ============================
// 🔐 Visitor: Verify OTP
// ============================
exports.verifyOtp = async (req, res) => {
  try {
    const { method, value, otp } = req.body;

    console.log("✅ Received OTP verification request");
    console.log("METHOD:", method);
    console.log("VALUE:", value);
    console.log("OTP:", otp);

    // ✅ Validate input
    if (!method || !value || !otp) {
      return res.status(400).json({ message: 'Method, value, and OTP are required.' });
    }

    // ✅ Find the visitor by email or phone
    const whereClause = method === 'email' ? { email: value } : { contact_number: value };
    const visitor = await Visitor.findOne({ where: whereClause });

    if (!visitor) {
      console.warn("⚠️ Visitor not found");
      return res.status(404).json({ message: 'Visitor not found.' });
    }

    // ✅ Fetch the latest unverified OTP for this visitor
    const otpRecord = await Otp.findOne({
      where: {
        visitor_id: visitor.visitor_id,
        code: otp,
        verified: false,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRecord) {
      console.warn("⚠️ Invalid or already used OTP");
      return res.status(400).json({ message: 'OTP not found or already used.' });
    }

    // ✅ Check OTP expiration
    if (otpRecord.expiresAt < new Date()) {
      console.warn("⚠️ OTP expired");
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // ✅ Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // ✅ Generate JWT for successful login
    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const token = jwt.sign(
        { id: visitor.visitor_id, role: 'visitor' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    console.log("✅ OTP verified and token generated");

    res.status(200).json({
      message: 'OTP verified. Login successful.',
      token
    });
  } catch (err) {
    console.error("❌ VERIFY OTP ERROR:", err);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};
