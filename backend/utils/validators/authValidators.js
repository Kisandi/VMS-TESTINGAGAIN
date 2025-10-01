// utils/validators/authValidators.js

// ---------------- Existing Validators ----------------
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

// ---------------- Sri Lankan ID Validation ----------------
const NIC_RE = /^(?:\d{9}[VvXx]|(19|20)\d{10})$/; // old 9+V/X or new 12
const PASSPORT_RE = /^[A-Za-z]\d{7}$/;            // 1 letter + 7 digits
const DL_RE = /^[A-Za-z]\d{7}[A-Za-z]?$/;         // letter + 7 digits + optional letter

// Normalizers
function normalizeNic(raw) {
    return String(raw || '')
        .trim()
        .replace(/\s+/g, '')
        .replace(/([vx])$/, (m) => m.toUpperCase());
}
function normalizePassport(raw) {
    return String(raw || '').trim().replace(/\s+/g, '').toUpperCase();
}
function normalizeDL(raw) {
    return String(raw || '').trim().replace(/[\s\-\/]+/g, '').toUpperCase();
}

// Helpers
function detectNicKind(nic) {
    if (/^\d{9}[VvXx]$/.test(nic)) return 'old';
    if (/^(19|20)\d{10}$/.test(nic)) return 'new';
    return null;
}
function nicLogicalCheck(nic) {
    const kind = detectNicKind(nic);
    if (!kind) return false;
    const ddd = parseInt(kind === 'old' ? nic.slice(2, 5) : nic.slice(4, 7), 10);
    return (ddd >= 1 && ddd <= 366) || (ddd >= 501 && ddd <= 866);
}
function doyToMonthDay(year, day) {
    const d = new Date(year, 0, 1);
    d.setDate(d.getDate() + (day - 1));
    return { month: d.getMonth() + 1, day: d.getDate() };
}
function decodeNicDob(nic, dobISO) {
    const kind = detectNicKind(nic);
    if (!kind) return null;
    const dob = dobISO ? new Date(dobISO) : null;
    if (!dob || Number.isNaN(dob.getTime())) return null;

    const year = (kind === 'new') ? parseInt(nic.slice(0, 4), 10) : dob.getFullYear();
    let ddd = parseInt(kind === 'old' ? nic.slice(2, 5) : nic.slice(4, 7), 10);
    const female = ddd >= 500;
    const dayOfYear = female ? ddd - 500 : ddd;

    const { month, day } = doyToMonthDay(year, dayOfYear);
    return { year, month, day, female };
}

/**
 * Validate a Sri Lankan ID (NIC, Passport, Driving Licence).
 * Enforces NIC day-of-year logic and matches month/day with provided DOB.
 * For new NIC (12-digit), year must match DOB year.
 *
 * @param {'NIC'|'Passport'|'Driving License'} idType
 * @param {string} idNumber
 * @param {string} [dobISO] - 'YYYY-MM-DD' (required for NIC)
 * @param {'Female'|'Male'|'Other'} [gender]
 * @returns {{ok: true, value: string} | {ok: false, error: string}}
 */
function validateSriLankaId(idType, idNumber, dobISO, gender) {
    if (!idType) return { ok: false, error: 'Select a valid ID type.' };
    if (!idNumber) return { ok: false, error: 'ID number is required.' };

    let v = String(idNumber);

    if (idType === 'NIC') {
        v = normalizeNic(v);
        if (!NIC_RE.test(v)) return { ok: false, error: 'NIC must be 9 digits + V/X, or 12 digits.' };
        if (!nicLogicalCheck(v)) return { ok: false, error: 'NIC day-of-year segment is invalid.' };
        if (!dobISO) return { ok: false, error: 'Date of Birth is required for NIC validation.' };

        const decoded = decodeNicDob(v, dobISO);
        if (!decoded) return { ok: false, error: 'Unable to read date from NIC.' };
        const dob = new Date(dobISO);
        const dobMonth = dob.getMonth() + 1;
        const dobDay = dob.getDate();
        const dobYear = dob.getFullYear();

        const isNew = /^(19|20)\d{10}$/.test(v);
        if (isNew && decoded.year !== dobYear) {
            return { ok: false, error: 'NIC birth year does not match Date of Birth.' };
        }
        if (decoded.month !== dobMonth || decoded.day !== dobDay) {
            return { ok: false, error: 'NIC date segment (month/day) does not match Date of Birth.' };
        }

        // Optional gender strict check:
        // if (gender === 'Female' && !decoded.female) return { ok: false, error: 'NIC indicates male but gender is Female.' };
        // if (gender === 'Male' && decoded.female) return { ok: false, error: 'NIC indicates female but gender is Male.' };

        return { ok: true, value: v };
    }

    if (idType === 'Passport') {
        v = normalizePassport(v);
        if (!PASSPORT_RE.test(v)) return { ok: false, error: 'Passport must be 1 letter + 7 digits (e.g., N1234567).' };
        return { ok: true, value: v };
    }

    if (idType === 'Driving License') {
        v = normalizeDL(v);
        if (!DL_RE.test(v)) return { ok: false, error: 'Driving Licence must be letter + 7 digits (optional trailing letter).' };
        return { ok: true, value: v };
    }

    return { ok: false, error: 'Unsupported ID type.' };
}

// ---------------- Extra Helpers ----------------
function isValidSriLankaMobile9(x) {
    return /^7\d{8}$/.test(String(x || '').trim());
}
function isLettersMin3(x) {
    return /^[A-Za-z]{3,}$/.test(String(x || '').trim());
}

// ---------------- Exports ----------------
module.exports = {
    isValidEmail,
    isStrongPassword,
    validateSriLankaId,
    isValidSriLankaMobile9,
    isLettersMin3
};
