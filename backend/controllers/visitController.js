const { Appointment, CheckinCheckout, DeniedLocation } = require('../models'); // adjust imports

// End Visit handler
const endVisit = async (req, res) => {
    try {
        const { tokenId, locationId } = req.body;

        
        if (!tokenId || !locationId) {
            return res.status(400).json({ success: false, message: 'tokenId and locationId are required.' });
        }

        // 2. Set checkout time in CheckinCheckout table
        const checkinRecord = await CheckinCheckout.findOne({
            where: { token_id: tokenId, checkout_time: null },
        });

        if (checkinRecord && !checkinRecord.checkout_time) {
            checkinRecord.checkout_time = new Date();
            await checkinRecord.save();
        }

        res.json({ success: true, message: 'Visit ended successfully.' });
    } catch (error) {
        console.error('endVisit error:', error);
        res.status(500).json({ success: false, message: 'Server error ending visit.' });
    }
};

// Extend Stay handler
const extendStay = async (req, res) => {
    try {
        const { tokenId, additionalMinutes } = req.body;
        if (!tokenId || !additionalMinutes || isNaN(additionalMinutes)) {
            return res.status(400).json({ success: false, message: 'Valid tokenId and additionalMinutes are required.' });
        }

        const appointment = await Appointment.findOne({ where: { token_id: tokenId } });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        // Assuming `duration` is stored as string of minutes; convert and update
        const currentDuration = parseInt(appointment.duration, 10) || 0;
        appointment.duration = (currentDuration + parseInt(additionalMinutes)).toString();
        await appointment.save();

        res.json({ success: true, message: 'Stay extended.', newDuration: appointment.duration });
    } catch (error) {
        console.error('extendStay error:', error);
        res.status(500).json({ success: false, message: 'Server error extending stay.' });
    }
};

module.exports = { endVisit, extendStay };
