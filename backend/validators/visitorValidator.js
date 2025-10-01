// validators/visitorValidator.js
const {
    validateSriLankaId,
    isValidEmail,
    isValidSriLankaMobile9,
    isLettersMin3,
} = require('../utils/validators/authValidators');

async function validateCreateVisitor(req, res, next) {
    try {
        const {
            first_name, last_name, date_of_birth,
            address, id_type, nic: id_number,
            email, contact_number, gender,
        } = req.body;

        if (!first_name || !isLettersMin3(first_name)) {
            return res.status(400).json({ success: false, message: 'First name must be at least 3 letters.' });
        }
        if (!last_name || !isLettersMin3(last_name)) {
            return res.status(400).json({ success: false, message: 'Last name must be at least 3 letters.' });
        }
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }
        if (!contact_number || !isValidSriLankaMobile9(contact_number)) {
            return res.status(400).json({ success: false, message: 'Phone must start with 7 and be 9 digits.' });
        }
        if (!address || !String(address).trim()) {
            return res.status(400).json({ success: false, message: 'Address is required.' });
        }
        if (!date_of_birth) {
            return res.status(400).json({ success: false, message: 'Date of Birth is required.' });
        }

        const idResult = validateSriLankaId(id_type, id_number, date_of_birth, gender);
        if (!idResult.ok) {
            return res.status(400).json({ success: false, message: idResult.error });
        }

        // pass normalized ID to downstream handlers if you like:
        req.body.id_number_normalized = idResult.value;

        next();
    } catch (err) {
        console.error('validateCreateVisitor error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { validateCreateVisitor };
