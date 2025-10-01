import jsPDF from 'jspdf';

function generateRFIDTokenPDF(visitor) {
    const doc = new jsPDF({
        format: 'a5',
        unit: 'mm',
        orientation: 'portrait'
    });

    // Header section with blue background
    doc.setFillColor(57, 100, 255); // Blue background
    doc.rect(0, 0, 148, 30, 'F');

    // White text for company
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Name', 74, 12, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Visitor Pass', 74, 20, { align: 'center' });

    // Reset text color to black
    doc.setTextColor(0, 0, 0);

    // Full Name in big bold
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(visitor.full_name || 'Full Name', 74, 45, { align: 'center' });


    const labels = ['Purpose', 'Host', 'Host Position', 'Meeting Point', 'Token ID', 'Issued At'];
    const values = [
        visitor.purpose || '',
        visitor.host || '',
        visitor.host_position || 'CEO',
        visitor.meeting_point || 'Client Meeting Room',
        visitor.token_id || '---',
        new Date().toLocaleString()
    ];

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let y = 60;
    for (let i = 0; i < labels.length; i++) {
        doc.text(`${labels[i]}:`, 20, y);
        doc.text(`${values[i]}`, 60, y);
        y += 8;
    }

    // Line
    doc.line(10, y + 4, 138, y + 4);

    // Save PDF
    doc.save(`RFID_Token_${visitor.full_name || 'visitor'}.pdf`);
}

export default generateRFIDTokenPDF;
