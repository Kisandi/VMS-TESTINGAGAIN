const { Visitor, Appointment, RFIDToken, CheckinCheckout } = require('../models');

// Receptionist check-in: given appointment ID, assign first available token
async function checkInVisitor(appointmentId) {
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    if (appointment.approval_status !== 'approved') throw new Error('Appointment not approved');

    // Find first available token
    const token = await RFIDToken.findOne({ where: { status: 'Available' } });
    if (!token) throw new Error('No available RFID tokens');

    // Update token to assigned
    await token.update({ status: 'Assigned', visitor_id: appointment.visitor_id, issued_at: new Date() });

    // Create checkin record
    const checkin = await CheckinCheckout.create({
        visitor_id: appointment.visitor_id,
        token_id: token.token_id,
        checkin_time: new Date(),
        checkout_time: null
    });

    // Link token_id in appointment (optional)
    await appointment.update({ token_id: token.token_id });

    return { checkin, token };
}

async function checkOutVisitor(tokenId) {
    // Find token with assigned/active status
    const token = await RFIDToken.findByPk(tokenId);

    if (!token) {
        throw new Error('Token not found');
    }

    if (token.status !== 'active') {
        throw new Error('Token is not assigned to any visitor');
    }

    // Find latest active check-in
    const checkin = await CheckinCheckout.findOne({
        where: { token_id: tokenId, checkout_time: null },
        order: [['checkin_time', 'DESC']]
    });

    if (!checkin) {
        throw new Error('Visitor has already checked out or no active check-in found');
    }

    // Update checkout time
    await checkin.update({ checkout_time: new Date() });

    // Mark token available again
    await token.update({
        status: 'Available',
        visitor_id: null,
        issued_at: null
    });

    return checkin;
}

module.exports = { checkInVisitor, checkOutVisitor };