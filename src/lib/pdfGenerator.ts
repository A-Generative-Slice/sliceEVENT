import { jsPDF } from 'jspdf';
import { EventItem, VendorBooking } from '../types';
import { calculateEventDashboardStats, formatDateRange } from './storage';

export interface LoadedImageInfo {
  dataUrl: string;
  width: number;
  height: number;
}

// Helper to convert image URL to base64 Data URL with natural dimensions for jsPDF embedding
export const loadImageDataUrl = (url: string): Promise<LoadedImageInfo> => {
  return new Promise((resolve, reject) => {
    if (!url) return reject('No URL provided');
    if (url.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl: url,
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
        });
      };
      img.onerror = () => resolve({ dataUrl: url, width: 800, height: 600 });
      img.src = url;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width || 800;
        const height = img.naturalHeight || img.height || 600;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/jpeg', 0.92),
            width,
            height,
          });
        } else {
          reject('Canvas context failed');
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

// 1-Click Formatted Text Generator for WhatsApp / Messages with Exact Stall Numbers
export const formatStallAvailabilityText = (
  event: EventItem,
  bookings: VendorBooking[]
): string => {
  const stats = calculateEventDashboardStats(event, bookings);
  const eventBookings = bookings.filter((b) => b.eventId === event.id);

  // F-Series breakdown
  const fBookings = eventBookings.filter((b) => b.series === 'F');
  const fBookedMap = new Map<string, string>(); // stallNumber -> exhibitor/stall name
  fBookings.forEach((b) => {
    const key = b.stallNumber.trim().toUpperCase();
    fBookedMap.set(key, `${b.exhibitorName}${b.stallName ? ` - ${b.stallName}` : ''}`);
  });

  const fVacant: string[] = [];
  const fBooked: string[] = [];
  for (let i = 1; i <= event.fSeriesLimit; i++) {
    const numPadded = `F-${String(i).padStart(2, '0')}`;
    const numUnpadded = `F-${i}`;
    if (fBookedMap.has(numPadded)) {
      fBooked.push(`${numPadded} (${fBookedMap.get(numPadded)})`);
    } else if (fBookedMap.has(numUnpadded)) {
      fBooked.push(`${numUnpadded} (${fBookedMap.get(numUnpadded)})`);
    } else {
      fVacant.push(numPadded);
    }
  }

  // S-Series breakdown
  const sBookings = eventBookings.filter((b) => b.series === 'S');
  const sBookedMap = new Map<string, string>(); // stallNumber -> exhibitor/stall name
  sBookings.forEach((b) => {
    const key = b.stallNumber.trim().toUpperCase();
    sBookedMap.set(key, `${b.exhibitorName}${b.stallName ? ` - ${b.stallName}` : ''}`);
  });

  const sVacant: string[] = [];
  const sBooked: string[] = [];
  for (let i = 1; i <= event.sSeriesLimit; i++) {
    const numPadded = `S-${String(i).padStart(2, '0')}`;
    const numUnpadded = `S-${i}`;
    if (sBookedMap.has(numPadded)) {
      sBooked.push(`${numPadded} (${sBookedMap.get(numPadded)})`);
    } else if (sBookedMap.has(numUnpadded)) {
      sBooked.push(`${numUnpadded} (${sBookedMap.get(numUnpadded)})`);
    } else {
      sVacant.push(numPadded);
    }
  }

  const formatList = (stalls: string[]) => {
    if (stalls.length === 0) return 'None';
    return stalls.join(', ');
  };

  return `✨ SLICEEVENT - EXHIBITION STALL AVAILABILITY UPDATE ✨

📌 Event: ${event.name}
📍 Location: ${event.location}
📅 Dates: ${formatDateRange(event.startDate, event.endDate)}${
    event.timing ? ` (${event.timing})` : ''
  }

📊 TOTAL OCCUPANCY SUMMARY:
• Total Exhibition Capacity: ${stats.totalStalls} Stalls
• Stalls Booked: ${stats.stallsBooked} Stalls
🟢 REMAINING AVAILABLE STALLS: ${stats.stallsAvailable} STALLS

----------------------------------------
🏷️ F-SERIES (FRONT PAVILION):
• Capacity: ${event.fSeriesLimit} Stalls (${fBooked.length} Booked | ${fVacant.length} Vacant)
🟢 VACANT STALLS AVAILABLE:
${formatList(fVacant)}
${fBooked.length > 0 ? `\n🔴 ALREADY BOOKED:\n${formatList(fBooked)}` : ''}

----------------------------------------
🏷️ S-SERIES (VIP SELECT):
• Capacity: ${event.sSeriesLimit} Stalls (${sBooked.length} Booked | ${sVacant.length} Vacant)
🟢 VACANT STALLS AVAILABLE:
${formatList(sVacant)}
${sBooked.length > 0 ? `\n🔴 ALREADY BOOKED:\n${formatList(sBooked)}` : ''}

----------------------------------------
🗺️ Match these stall numbers directly with the attached Layout Blueprint Floor Plan!
📞 For Stall Bookings & Reservations, contact the SliceEVENT Team!`;
};

// -----------------------------------------------------------------------------
// PDF EXPORT 1: VENDOR BLUEPRINT & AVAILABILITY PDF (FOR VENDORS - ZERO FINANCIAL DATA)
// -----------------------------------------------------------------------------
export const generateVendorBlueprintPDF = async (
  event: EventItem,
  bookings: VendorBooking[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const stats = calculateEventDashboardStats(event, bookings);
  const eventBookings = bookings.filter((b) => b.eventId === event.id);

  // Brand Colors
  const primaryColor = [194, 80, 10]; // #C2500A
  const darkTextColor = [28, 22, 18]; // #1c1612
  const lightBgColor = [255, 245, 238]; // #fff5ee

  // ── Header Banner ──────────────────────────────────────────────────────────
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Try to embed brand logo in top-right of header
  try {
    const logoInfo = await loadImageDataUrl('agenerativeslicelogo.jpg');
    // Draw a white rounded badge behind logo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(178, 4, 26, 26, 3, 3, 'F');
    doc.addImage(logoInfo.dataUrl, 'JPEG', 180, 6, 22, 22);
  } catch (_) {
    // Logo unavailable — skip silently
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(event.name.toUpperCase(), 14, 13);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SLICEEVENT  —  STALL AVAILABILITY REPORT (VENDOR COPY)', 14, 21);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })}`,
    14,
    28
  );

  let y = 42;

  // ── Event Meta Info ─────────────────────────────────────────────────────────
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.roundedRect(14, y, 182, 20, 2, 2, 'F');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Location:', 18, y + 6.5);
  doc.text('Exhibition Dates:', 18, y + 14);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(event.location, 48, y + 6.5);
  doc.text(
    `${formatDateRange(event.startDate, event.endDate)}${event.timing ? ` (${event.timing})` : ''}`,
    48,
    y + 14
  );

  y += 26;

  // ── Overall Occupancy Summary Cards ─────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('EXHIBITION STALL AVAILABILITY SUMMARY', 14, y);

  y += 4;

  const summaryCards = [
    { title: 'Total Capacity', val: `${stats.totalStalls} Stalls`, highlight: false },
    { title: 'Occupied / Booked', val: `${stats.stallsBooked} Stalls`, highlight: false },
    { title: 'VACANT NOW', val: `${stats.stallsAvailable} STALLS`, highlight: true },
  ];
  const cardW = 58;
  const cardGap = 4;

  summaryCards.forEach((card, idx) => {
    const x = 14 + idx * (cardW + cardGap);
    if (card.highlight) {
      doc.setFillColor(220, 252, 231); // light green
    } else {
      doc.setFillColor(255, 245, 238);
    }
    doc.roundedRect(x, y, cardW, 16, 2, 2, 'F');

    doc.setFontSize(6.5);
    doc.setTextColor(card.highlight ? 22 : 120, card.highlight ? 101 : 100, card.highlight ? 52 : 115);
    doc.setFont('helvetica', 'bold');
    doc.text(card.title.toUpperCase(), x + 4, y + 5);

    doc.setFontSize(8.5);
    doc.setTextColor(card.highlight ? 22 : primaryColor[0], card.highlight ? 101 : primaryColor[1], card.highlight ? 52 : primaryColor[2]);
    doc.text(card.val, x + 4, y + 12);
  });

  y += 22;

  // ── Per-Category Stall Breakdown ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('STALL CATEGORY BREAKDOWN', 14, y);

  y += 4;

  // Category table header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CATEGORY / ZONE', 18, y + 4.8);
  doc.text('TOTAL STALLS', 95, y + 4.8);
  doc.text('BOOKED', 130, y + 4.8);
  doc.text('AVAILABLE', 162, y + 4.8);

  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  stats.seriesStats.forEach((s, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(255, 248, 240);
      doc.rect(14, y, 182, 7, 'F');
    }
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(s.name, 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(String(s.limit), 95, y + 5);

    doc.setTextColor(s.booked > 0 ? 180 : 120, s.booked > 0 ? 20 : 120, s.booked > 0 ? 20 : 120);
    doc.text(String(s.booked), 130, y + 5);

    doc.setTextColor(s.available > 0 ? 22 : 180, s.available > 0 ? 101 : 20, s.available > 0 ? 52 : 20);
    doc.setFont('helvetica', 'bold');
    doc.text(String(s.available), 162, y + 5);

    y += 7;
  });

  y += 4;

  // ── Vendor Stall Allocations Table ───────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`CURRENT STALL ALLOCATIONS (${eventBookings.length} BOOKED)`, 14, y);

  y += 4;

  const drawVendorTableHeader = () => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(14, y, 182, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Stall No', 18, y + 5);
    doc.text('Exhibitor / Stall Name', 45, y + 5);
    doc.text('Category', 125, y + 5);
    doc.text('Status', 170, y + 5);
    y += 7.5;
  };

  drawVendorTableHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  if (eventBookings.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text('All stalls are currently open and available for booking.', 18, y + 6);
    y += 10;
  } else {
    eventBookings.forEach((b, index) => {
      if (y > 270) {
        doc.addPage();
        y = 15;
        drawVendorTableHeader();
      }

      if (index % 2 === 0) {
        doc.setFillColor(255, 248, 240);
        doc.rect(14, y, 182, 6.5, 'F');
      }

      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(b.stallNumber, 18, y + 4.5);

      doc.setFont('helvetica', 'normal');
      const displayName = `${b.exhibitorName}${b.stallName ? ` (${b.stallName})` : ''}`;
      const truncatedName = displayName.length > 38 ? displayName.substring(0, 36) + '..' : displayName;
      doc.text(truncatedName, 45, y + 4.5);

      const catText = String(b.stallCategory || 'General');
      doc.text(catText.length > 18 ? catText.substring(0, 17) + '.' : catText, 125, y + 4.5);

      doc.setTextColor(180, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.text('BOOKED', 170, y + 4.5);

      y += 6.5;
    });
  }

  // ── Page 2: Layout Blueprint Floor Plan ──────────────────────────────────────
  if (event.layoutImageUrl) {
    try {
      const imgInfo = await loadImageDataUrl(event.layoutImageUrl);
      doc.addPage();

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${event.name.toUpperCase()} - LAYOUT BLUEPRINT MAP`, 14, 13);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL EXHIBITION FLOOR PLAN & SEATING ARRANGEMENT', 14, 19);

      let pdfPageY = 28;

      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
      doc.roundedRect(14, pdfPageY, 182, 12, 2, 2, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(
        `Total Stalls: ${stats.totalStalls}  |  Booked: ${stats.stallsBooked}  |  VACANT NOW: ${stats.stallsAvailable} STALLS`,
        18,
        pdfPageY + 7.5
      );
      pdfPageY += 16;

      const maxBoxW = 182;
      const maxBoxH = 230;
      const imgAspect = imgInfo.width / imgInfo.height;
      let renderW = maxBoxW;
      let renderH = maxBoxW / imgAspect;
      if (renderH > maxBoxH) { renderH = maxBoxH; renderW = maxBoxH * imgAspect; }
      const renderX = 14 + (maxBoxW - renderW) / 2;
      const renderY = pdfPageY + (maxBoxH - renderH) / 2;
      doc.addImage(imgInfo.dataUrl, 'JPEG', renderX, renderY, renderW, renderH);
    } catch (err) {
      console.warn('Could not embed floor plan image in Vendor PDF:', err);
    }
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  y += 4;
  if (y > 275) { doc.addPage(); y = 15; }
  doc.setDrawColor(245, 201, 168);
  doc.line(14, y, 196, y);
  y += 5;
  doc.setTextColor(120, 110, 118);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `SliceEVENT  |  Vendor Stall Availability Report  |  Page ${doc.getNumberOfPages()}`,
    14, y
  );

  const filename = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_Vendor_Blueprint.pdf`;
  doc.save(filename);
};


// -----------------------------------------------------------------------------
// PDF EXPORT 2: FULL OWNER EXECUTIVE & FINANCIAL REPORT PDF (FOR OWNER / MANAGEMENT)
// -----------------------------------------------------------------------------
export const generateOwnerReportPDF = async (
  event: EventItem,
  bookings: VendorBooking[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const stats = calculateEventDashboardStats(event, bookings);
  const eventBookings = bookings.filter((b) => b.eventId === event.id);

  // Brand Colors
  const primaryColor = [194, 80, 10]; // #C2500A
  const secondaryColor = [232, 98, 26]; // #E8621A
  const darkTextColor = [28, 22, 18]; // #1c1612
  const lightBgColor = [255, 245, 238]; // #fff5ee

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Try to embed brand logo in top-right of header
  try {
    const logoInfo = await loadImageDataUrl('agenerativeslicelogo.jpg');
    // Draw a white rounded badge behind logo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(178, 4, 26, 26, 3, 3, 'F');
    doc.addImage(logoInfo.dataUrl, 'JPEG', 180, 6, 22, 22);
  } catch (_) {
    // Logo unavailable — skip silently
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(event.name.toUpperCase(), 14, 13);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SLICEEVENT - EVENT EXECUTIVE & FINANCIAL LEDGER REPORT', 14, 21);
  doc.text(
    `Date: ${new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`,
    14,
    28
  );

  let y = 42;

  // Event Meta Info Box
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'F');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Location:', 18, y + 7);
  doc.text('Exhibition Dates:', 18, y + 15);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(event.location, 48, y + 7);
  doc.text(
    `${formatDateRange(event.startDate, event.endDate)}${
      event.timing ? ` (${event.timing})` : ''
    }`,
    48,
    y + 15
  );

  y += 28;

  // Financial & Occupancy Section Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FINANCIAL & OCCUPANCY EXECUTIVE OVERVIEW', 14, y);

  y += 4;

  // 4 Financial Summary Stat Cards
  const cardWidth = 43;
  const cardGap = 3;
  const cards = [
    {
      title: 'Total Revenue Value',
      val: `Rs. ${stats.totalValue.toLocaleString('en-IN')}`,
    },
    {
      title: 'Advance Collected',
      val: `Rs. ${stats.totalCollected.toLocaleString('en-IN')}`,
    },
    {
      title: 'Pending Balance',
      val: `Rs. ${stats.totalPending.toLocaleString('en-IN')}`,
    },
    {
      title: 'Stall Occupancy',
      val: `${stats.stallsBooked} / ${stats.totalStalls} Booked`,
    },
  ];

  cards.forEach((card, idx) => {
    const x = 14 + idx * (cardWidth + cardGap);
    doc.setFillColor(255, 245, 238);
    doc.roundedRect(x, y, cardWidth, 16, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setTextColor(120, 100, 115);
    doc.setFont('helvetica', 'bold');
    doc.text(card.title.toUpperCase(), x + 3.5, y + 5);

    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(card.val, x + 3.5, y + 12);
  });

  y += 22;

  // Status breakdown row
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(
    `Payment Status:  Paid: ${stats.paidCount} vendors  |  Partial: ${stats.partialCount} vendors  |  Unpaid: ${stats.unpaidCount} vendors`,
    14,
    y
  );

  y += 7;

  // Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`VENDOR FINANCIAL LEDGER (${eventBookings.length} BOOKINGS)`, 14, y);

  y += 4;

  // Table Header Fill
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  doc.text('Stall No', 16, y + 5.5);
  doc.text('Exhibitor / Stall Name', 35, y + 5.5);
  doc.text('Mobile', 95, y + 5.5);
  doc.text('Rent (Rs.)', 125, y + 5.5);
  doc.text('Advance (Rs.)', 148, y + 5.5);
  doc.text('Status', 175, y + 5.5);

  y += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  if (eventBookings.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text('No vendor stall bookings recorded for this exhibition yet.', 16, y + 6);
    y += 10;
  } else {
    eventBookings.forEach((b, index) => {
      if (y > 270) {
        doc.addPage();
        y = 15;
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(14, y, 182, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Stall No', 16, y + 5.5);
        doc.text('Exhibitor / Stall Name', 35, y + 5.5);
        doc.text('Mobile', 95, y + 5.5);
        doc.text('Rent (Rs.)', 125, y + 5.5);
        doc.text('Advance (Rs.)', 148, y + 5.5);
        doc.text('Status', 175, y + 5.5);
        y += 8;
        doc.setFont('helvetica', 'normal');
      }

      if (index % 2 === 0) {
        doc.setFillColor(255, 248, 240);
        doc.rect(14, y, 182, 7, 'F');
      }

      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(b.stallNumber, 16, y + 5);

      doc.setFont('helvetica', 'normal');
      const displayName = `${b.exhibitorName} (${b.stallName})`;
      const truncatedName =
        displayName.length > 32 ? displayName.substring(0, 30) + '..' : displayName;
      doc.text(truncatedName, 35, y + 5);

      doc.text(b.mobileNumber, 95, y + 5);
      doc.text(b.stallRent.toLocaleString('en-IN'), 125, y + 5);
      doc.text(b.stallAdvance.toLocaleString('en-IN'), 148, y + 5);

      if (b.calculatedStatus === 'Paid') {
        doc.setTextColor(16, 122, 70);
      } else if (b.calculatedStatus === 'Partial') {
        doc.setTextColor(180, 100, 0);
      } else {
        doc.setTextColor(180, 20, 20);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(b.calculatedStatus, 175, y + 5);

      y += 7;
    });
  }

  // Embed Blueprint Floor Plan Image on Page 2 (Aspect Ratio strictly preserved!)
  if (event.layoutImageUrl) {
    try {
      const imgInfo = await loadImageDataUrl(event.layoutImageUrl);
      doc.addPage();

      // Blueprint Page Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${event.name.toUpperCase()} - FLOOR PLAN BLUEPRINT`, 14, 13);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('EXHIBITION STALL LAYOUT MAP & SEATING ARRANGEMENT', 14, 19);

      let pdfPageY = 28;

      // Status Badge Banner
      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
      doc.roundedRect(14, pdfPageY, 182, 12, 2, 2, 'F');

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(
        `Total Capacity: ${stats.totalStalls} Stalls  |  Booked: ${stats.stallsBooked}  |  AVAILABLE NOW: ${stats.stallsAvailable} STALLS`,
        18,
        pdfPageY + 7.5
      );

      pdfPageY += 16;

      // Calculate perfect aspect ratio to fit inside printable box (182mm wide x 230mm high)
      const maxBoxW = 182;
      const maxBoxH = 230;
      const imgAspect = imgInfo.width / imgInfo.height;

      let renderW = maxBoxW;
      let renderH = maxBoxW / imgAspect;

      if (renderH > maxBoxH) {
        renderH = maxBoxH;
        renderW = maxBoxH * imgAspect;
      }

      // Center horizontally in 182mm box
      const renderX = 14 + (maxBoxW - renderW) / 2;
      const renderY = pdfPageY + (maxBoxH - renderH) / 2;

      doc.addImage(imgInfo.dataUrl, 'JPEG', renderX, renderY, renderW, renderH);
    } catch (err) {
      console.warn('Could not embed floor plan image in Owner PDF:', err);
    }
  }

  // Footer divider line
  y += 4;
  if (y > 275) {
    doc.addPage();
    y = 15;
  }

  doc.setDrawColor(245, 201, 168);
  doc.line(14, y, 196, y);

  y += 5;
  doc.setTextColor(120, 110, 118);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `SliceEVENT  |  Event Executive & Financial Report  |  Page ${doc.getNumberOfPages()}`,
    14,
    y
  );

  // Save File
  const filename = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_Owner_Executive_Report.pdf`;
  doc.save(filename);
};

// Backwards compatibility default export
export const generateEventSummaryPDF = generateOwnerReportPDF;
