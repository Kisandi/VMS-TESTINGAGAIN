// validators/userValidator.js

const validateEmail = (email) => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
};

const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};

const validateVisitorInput = ({ mode, value }) => {
    if (!mode || !value) {
        return { valid: false, error: "Mode and value are required" };
    }

    if (mode === "email") {
        if (!validateEmail(value)) {
            return { valid: false, error: "Invalid email address" };
        }
    } else if (mode === "phone") {
        if (!validatePhone(value)) {
            return { valid: false, error: "Phone number must be 10 digits" };
        }
    } else {
        return { valid: false, error: "Invalid mode" };
    }

    return { valid: true };
};

module.exports = { validateVisitorInput };
