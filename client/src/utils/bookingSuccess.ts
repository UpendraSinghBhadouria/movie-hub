import { Booking } from "@/types/booking.types";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { getMoviePoster } from ".";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Using INR instead of ₹ because jsPDF's default Helvetica
 * font does not reliably support the rupee Unicode character.
 */
function formatCurrencyForPDF(value: number) {
  return `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function getPaymentStatus(status?: string | null) {
  switch (status?.toUpperCase()) {
    case "SUCCESS":
      return "Payment Successful";

    case "PENDING":
      return "Payment Pending";

    case "FAILED":
      return "Payment Failed";

    case "REFUNDED":
      return "Payment Refunded";

    default:
      return status || "Payment Status";
  }
}

export function getDisplayStatus(booking?: Booking) {
  if (!booking) return;
  const status = booking.status.toUpperCase();

  if (status === "CANCELLED" || status === "EXPIRED") {
    return "cancelled";
  }

  if (status === "CONFIRMED") {
    const showEnded = new Date(booking.show.endTime).getTime() < Date.now();

    return showEnded ? "completed" : "confirmed";
  }

  return "pending";
}

function getPdfImageUrl(url: string) {
  if (!url) return url;

  // Cloudinary URL:
  // /image/upload/m12_atveia.avif
  //
  // Convert to:
  // /image/upload/f_jpg/m12_atveia.jpg

  const moviePosterUrl = getMoviePoster(url);
  // if (url.includes("res.cloudinary.com")) {
  //   return url
  //     .replace("/image/upload/", "/image/upload/f_jpg/")
  //     .replace(/\.avif$/i, ".jpg");
  // }

  return moviePosterUrl;
}

export const handleDownloadTicket = async (booking: Booking) => {
  console.log("handleDownloadTicket called with booking:", booking);
  if (!booking) return;

  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    /*
     * ---------------------------------------------------------
     * COLORS
     * ---------------------------------------------------------
     */

    const pink = {
      r: 219,
      g: 39,
      b: 119,
    };

    const dark = {
      r: 30,
      g: 30,
      b: 35,
    };

    const muted = {
      r: 110,
      g: 110,
      b: 120,
    };

    const lightBg = {
      r: 248,
      g: 248,
      b: 250,
    };

    const green = {
      r: 22,
      g: 163,
      b: 74,
    };

    const greenBg = {
      r: 240,
      g: 253,
      b: 244,
    };

    const border = {
      r: 225,
      g: 225,
      b: 230,
    };

    /*
     * ---------------------------------------------------------
     * HELPERS
     * ---------------------------------------------------------
     */

    const roundedBox = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius = 4,
      fill = lightBg,
    ) => {
      pdf.setFillColor(fill.r, fill.g, fill.b);
      pdf.roundedRect(x, y, width, height, radius, radius, "F");
    };

    const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          return null;
        }

        const blob = await response.blob();

        return await new Promise<string | null>((resolve) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            resolve(typeof reader.result === "string" ? reader.result : null);
          };

          reader.onerror = () => resolve(null);

          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    };

    /*
     * ---------------------------------------------------------
     * HEADER
     * ---------------------------------------------------------
     */

    pdf.setFillColor(pink.r, pink.g, pink.b);
    pdf.rect(0, 0, pageWidth, 34, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text("MovieHub", 20, 17);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Movie Ticket", 20, 24);

    /*
     * ---------------------------------------------------------
     * BOOKING CONFIRMED
     * ---------------------------------------------------------
     */

    pdf.setTextColor(dark.r, dark.g, dark.b);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("Booking Confirmed", 20, 48);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(muted.r, muted.g, muted.b);

    pdf.text("Your movie tickets have been booked successfully.", 20, 55);

    /*
     * ---------------------------------------------------------
     * MOVIE INFORMATION
     * ---------------------------------------------------------
     */

    const posterX = 20;
    const posterY = 66;
    const posterWidth = 38;
    const posterHeight = 57;

    const posterUrl = booking.movie.posterUrl
      ? getPdfImageUrl(booking.movie.posterUrl)
      : null;

    const posterData = posterUrl ? await loadImageAsDataUrl(posterUrl) : null;

    if (posterData) {
      try {
        pdf.addImage(
          posterData,
          "JPEG",
          posterX,
          posterY,
          posterWidth,
          posterHeight,
        );
      } catch (error) {
        console.error("Failed to add poster to PDF:", error);

        roundedBox(posterX, posterY, posterWidth, posterHeight, 4);
      }
    } else {
      roundedBox(posterX, posterY, posterWidth, posterHeight, 4);
    }

    const infoX = 66;

    pdf.setTextColor(dark.r, dark.g, dark.b);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);

    const movieTitle =
      booking.movie.title.length > 32
        ? `${booking.movie.title.substring(0, 32)}...`
        : booking.movie.title;

    pdf.text(movieTitle, infoX, 75);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(muted.r, muted.g, muted.b);

    pdf.text(`${booking.movie.certificate}  •  2D`, infoX, 83);

    /*
     * Rating
     */

    pdf.setTextColor(245, 158, 11);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    pdf.text(`* ${booking.movie.rating}`, infoX, 91);

    /*
     * Theatre
     */

    pdf.setTextColor(dark.r, dark.g, dark.b);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);

    pdf.text("Theatre", infoX, 103);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(muted.r, muted.g, muted.b);

    pdf.text(booking.theatre.name, infoX, 110);

    pdf.text(`${booking.theatre.name}, ${booking.theatre.city}`, infoX, 116);

    /*
     * ---------------------------------------------------------
     * DIVIDER
     * ---------------------------------------------------------
     */

    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.line(20, 132, pageWidth - 20, 132);

    /*
     * ---------------------------------------------------------
     * SHOW DETAILS
     * ---------------------------------------------------------
     */

    pdf.setTextColor(dark.r, dark.g, dark.b);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);

    pdf.text("Show Details", 20, 145);

    const showY = 153;
    const columnWidth = 42;

    const showDetails = [
      {
        label: "DATE",
        value: formatDate(booking.show.startTime),
      },
      {
        label: "TIME",
        value: formatTime(booking.show.startTime),
      },
      {
        label: "SCREEN",
        value: booking.screen.name,
      },
      {
        label: "END TIME",
        value: formatTime(booking.show.endTime),
      },
    ];

    showDetails.forEach((item, index) => {
      const x = 20 + index * columnWidth;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(muted.r, muted.g, muted.b);

      pdf.text(item.label, x, showY);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(dark.r, dark.g, dark.b);

      pdf.text(item.value, x, showY + 7);
    });

    /*
     * ---------------------------------------------------------
     * SEATS
     * ---------------------------------------------------------
     */

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(dark.r, dark.g, dark.b);

    pdf.text("Seats", 20, 181);

    let seatX = 20;
    let seatY = 187;

    booking.seats.forEach((seat) => {
      const seatLabel = `${seat.row}${seat.number}`;

      pdf.setFillColor(253, 242, 248);

      pdf.roundedRect(seatX, seatY, 22, 12, 3, 3, "F");

      pdf.setTextColor(pink.r, pink.g, pink.b);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);

      pdf.text(seatLabel, seatX + 11, seatY + 8, {
        align: "center",
      });

      seatX += 26;

      /*
       * Properly wrap seats to another row.
       */
      if (seatX > pageWidth - 40) {
        seatX = 20;
        seatY += 16;
      }
    });

    /*
     * ---------------------------------------------------------
     * BOOKING NUMBER
     * ---------------------------------------------------------
     */

    const bookingTitleY = Math.max(216, seatY + 29);

    pdf.setTextColor(dark.r, dark.g, dark.b);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);

    pdf.text("Booking Number", 20, bookingTitleY);

    const bookingBoxY = bookingTitleY + 6;

    roundedBox(20, bookingBoxY, pageWidth - 40, 14, 3, lightBg);

    pdf.setTextColor(dark.r, dark.g, dark.b);
    pdf.setFont("courier", "bold");
    pdf.setFontSize(11);

    pdf.text(booking.bookingNumber, 25, bookingBoxY + 9);

    /*
     * ---------------------------------------------------------
     * QR CODE
     * ---------------------------------------------------------
     */

    const qrPayload = JSON.stringify({
      bookingNumber: booking.bookingNumber,
      movie: booking.movie.title,
      theatre: booking.theatre.name,
      screen: booking.screen.name,
      date: booking.show.startTime,
      seats: booking.seats.map((seat) => `${seat.row}${seat.number}`),
      amount: booking.amount.total,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    const qrSize = 42;

    /*
     * Keep QR above payment section.
     */
    pdf.addImage(
      qrDataUrl,
      "PNG",
      pageWidth - 20 - qrSize,
      176,
      qrSize,
      qrSize,
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(dark.r, dark.g, dark.b);

    pdf.text("Scan at theatre", pageWidth - 20 - qrSize / 2, 223, {
      align: "center",
    });

    /*
     * ---------------------------------------------------------
     * PAYMENT
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * Payment starts at 248 instead of 260.
     *
     * This leaves enough room for the footer below it.
     * ---------------------------------------------------------
     */

    const paymentTitleY = Math.max(bookingBoxY + 25, 245);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(dark.r, dark.g, dark.b);

    pdf.text("Payment", 20, paymentTitleY);

    /*
     * Payment boxes
     */

    const paymentBoxY = paymentTitleY + 7;
    const paymentBoxHeight = 27;

    const leftBoxWidth = 92;
    const rightBoxX = 116;
    const rightBoxWidth = pageWidth - 136;

    /*
     * Total amount
     */

    roundedBox(20, paymentBoxY, leftBoxWidth, paymentBoxHeight, 4, lightBg);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(muted.r, muted.g, muted.b);

    pdf.text("TOTAL AMOUNT", 26, paymentBoxY + 9);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(dark.r, dark.g, dark.b);

    pdf.text(formatCurrencyForPDF(booking.amount.total), 26, paymentBoxY + 20);

    /*
     * Payment status
     */

    roundedBox(
      rightBoxX,
      paymentBoxY,
      rightBoxWidth,
      paymentBoxHeight,
      4,
      greenBg,
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(muted.r, muted.g, muted.b);

    pdf.text("PAYMENT STATUS", rightBoxX + 6, paymentBoxY + 9);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(green.r, green.g, green.b);

    pdf.text(
      getPaymentStatus(booking.payment?.status),
      rightBoxX + 6,
      paymentBoxY + 20,
    );

    /*
     * ---------------------------------------------------------
     * FOOTER
     * ---------------------------------------------------------
     *
     * The footer is now explicitly positioned AFTER
     * the payment section.
     * ---------------------------------------------------------
     */

    const footerLineY = paymentBoxY + paymentBoxHeight + 7;
    const footerTextY = footerLineY + 7;

    /*
     * Safety check so footer never gets too close
     * to the bottom of the page.
     */
    if (footerTextY < pageHeight - 8) {
      pdf.setDrawColor(border.r, border.g, border.b);

      pdf.line(20, footerLineY, pageWidth - 20, footerLineY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(muted.r, muted.g, muted.b);

      pdf.text(
        "Please arrive at the theatre a few minutes before the show starts.",
        20,
        footerTextY,
      );

      pdf.text("MovieHub", pageWidth - 20, footerTextY, {
        align: "right",
      });
    }

    /*
     * ---------------------------------------------------------
     * DOWNLOAD
     * ---------------------------------------------------------
     */

    pdf.save(`MovieHub-Ticket-${booking.bookingNumber}.pdf`);
  } catch (error) {
    console.error("Failed to generate ticket PDF:", error);
  }
};
