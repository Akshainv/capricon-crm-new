import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Injectable({
    providedIn: 'root'
})
export class PdfGenerationService {
    private templatePath = 'assets/templates/capricon.pdf';

    constructor() { }

    async generateOfficialPdf(data: any, options: { page9Image?: string | null, page4Image?: string | null, page1Image?: string | null } = {}): Promise<Uint8Array> {
        try {
            const { page9Image, page4Image, page1Image } = options;

            // 1. Fetch the existing PDF bytes
            const response = await fetch(this.templatePath);
            if (!response.ok) {
                throw new Error(`Failed to load PDF template from ${this.templatePath}`);
            }
            const existingPdfBytes = await response.arrayBuffer();

            // 2. Load the document
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const { height } = pages[0].getSize();

            // --- PAGE 1: COVER PAGE (TEXT INJECTION) ---
            if (pages.length >= 1) {
                const page1 = pages[0];
                await this.drawPage1Details(page1, data, font, boldFont, height);
                console.log('Successfully injected details into Page 1');
            }

            // --- PAGE 4: TECHNICAL SPECIFICATIONS (DYNAMIC REPLACEMENT) ---
            if (pages.length >= 4) {
                const page4 = pages[3];

                if (page4Image) {
                    try {
                        const base64Data = page4Image.includes('base64,')
                            ? page4Image.split('base64,')[1]
                            : page4Image;

                        const image = await pdfDoc.embedPng(base64Data);
                        const { width: pWidth, height: pHeight } = page4.getSize();
                        page4.drawImage(image, {
                            x: 0,
                            y: 0,
                            width: pWidth,
                            height: pHeight
                        });
                        console.log('Successfully replaced Page 4 with dynamic image');
                    } catch (imageError) {
                        console.error('Error embedding Page 4 image:', imageError);
                    }
                }
            }

            // --- PAGE 9: DETAILED PRICING TABLE (DYNAMIC REPLACEMENT) ---
            if (pages.length >= 9) {
                const page9 = pages[8];

                if (page9Image) {
                    try {
                        const base64Data = page9Image.includes('base64,')
                            ? page9Image.split('base64,')[1]
                            : page9Image;

                        const image = await pdfDoc.embedPng(base64Data);
                        const { width: pWidth, height: pHeight } = page9.getSize();
                        page9.drawImage(image, {
                            x: 0,
                            y: 0,
                            width: pWidth,
                            height: pHeight
                        });
                        console.log('Successfully replaced Page 9 with dynamic image');
                    } catch (imageError) {
                        console.error('Error embedding Page 9 image, falling back to manual draw:', imageError);
                        this.drawPage9Manually(page9, data, font, boldFont, height);
                    }
                } else {
                    this.drawPage9Manually(page9, data, font, boldFont, height);
                }
            }

            // 3. Save the PDF and return bytes
            return await pdfDoc.save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    public drawPage9Manually(page9: any, data: any, font: any, boldFont: any, height: number): void {
        const pricingItems = data.pricingItems || [];
        const startY = height - 310;
        const rowSpacing = 18.5;

        pricingItems.forEach((item: any, index: number) => {
            const y = startY - (index * rowSpacing);
            const stdText = item.isNA ? 'NA' : this.formatCurrency(item.standard);
            page9.drawText(stdText, { x: 350, y: y, size: 9, font: font });

            let launchText = '';
            if (item.isNA) launchText = 'NA';
            else if (item.isComplimentary) launchText = 'Complimentary';
            else launchText = this.formatCurrency(item.launch);

            page9.drawText(launchText, {
                x: 480,
                y: y,
                size: 9,
                font: item.isComplimentary ? boldFont : font,
                color: item.isComplimentary ? rgb(0.1, 0.5, 0.1) : rgb(0, 0, 0)
            });
        });

        const totalY = startY - (11 * rowSpacing);
        page9.drawText(this.formatCurrency(data.standardSubtotal || 0), { x: 350, y: totalY, size: 10, font: boldFont });
        page9.drawText(this.formatCurrency(data.launchSubtotal || 0), { x: 480, y: totalY, size: 10, font: boldFont });

        const gstY = startY - (12 * rowSpacing);
        page9.drawText(this.formatCurrency(data.standardTax || 0), { x: 350, y: gstY, size: 10, font: font });
        page9.drawText(this.formatCurrency(data.launchTax || 0), { x: 480, y: gstY, size: 10, font: font });

        const grandY = startY - (13 * rowSpacing);
        page9.drawText(this.formatCurrency(data.standardGrandTotal || 0), { x: 350, y: grandY, size: 11, font: boldFont });
        page9.drawText(this.formatCurrency(data.launchGrandTotal || 0), { x: 480, y: grandY, size: 11, font: boldFont });

        const amountInWords = this.numberToWords(data.launchGrandTotal || 0);
        page9.drawText(amountInWords, { x: 100, y: height - 565, size: 10, font: boldFont });

        const startSpecsY = height - 610;
        const specLineHeight = 15;
        if (data.productName) page9.drawText(`Product: ${data.productName}`, { x: 100, y: startSpecsY, size: 10, font: font });
        if (data.elevationType) page9.drawText(`Type: ${data.elevationType}`, { x: 100, y: startSpecsY - specLineHeight, size: 10, font: font });
        if (data.numberOfFloors !== undefined) page9.drawText(`Floors: ${data.numberOfFloors}`, { x: 300, y: startSpecsY, size: 10, font: font });
        if (data.capacity) page9.drawText(`Capacity: ${data.capacity}`, { x: 300, y: startSpecsY - specLineHeight, size: 10, font: font });
        if (data.speed !== undefined) page9.drawText(`Speed: ${data.speed}`, { x: 300, y: startSpecsY - (2 * specLineHeight), size: 10, font: font });
    }

    private async drawPage1Details(page1: any, data: any, font: any, boldFont: any, height: number): Promise<void> {
        const customer = data.customer || {};
        console.log('📄 PDF Gen - Page 1 Data:', {
            name: customer.name,
            email: customer.email,
            address: customer.address,
            quoteNo: data.quoteNumber
        });
        const textColor = rgb(0.1, 0.1, 0.1);

        // --- POSITION CALIBRATION ---
        // Placing details in a clean footer-like block near the bottom
        const footerY = 140; // Lowered from 200 to move closer to the absolute bottom
        const leftX = 75;
        const rightX = 360;
        const lineSpacing = 15;
        const fontSize = 10;
        const labelSize = 8;
        let currentLeftY = footerY;
        let currentRightY = footerY;

        // --- LEFT COLUMN: CLIENT DETAILS ---
        page1.drawText('PREPARED FOR', {
            x: leftX,
            y: currentLeftY + 15,
            size: labelSize,
            font: boldFont,
            color: textColor
        });

        page1.drawText(String(customer.name || '').toUpperCase(), {
            x: leftX,
            y: currentLeftY,
            size: 11,
            font: boldFont,
            color: textColor
        });
        currentLeftY -= lineSpacing + 2;

        if (customer.company) {
            page1.drawText(customer.company, { x: leftX, y: currentLeftY, size: fontSize, font: font, color: textColor });
            currentLeftY -= lineSpacing;
        }

        page1.drawText(`Email: ${customer.email || 'N/A'}`, { x: leftX, y: currentLeftY, size: 9, font: font, color: textColor });
        currentLeftY -= lineSpacing;

        page1.drawText(`Phone: ${customer.phone || 'N/A'}`, { x: leftX, y: currentLeftY, size: 9, font: font, color: textColor });
        currentLeftY -= lineSpacing + 5;

        // ADDR WRAPPER
        const address = customer.address || data.customerAddress || data.address || data.customer?.address || '';
        console.log('📍 PDF Gen - Final Address used:', address);

        if (address) {
            page1.drawText('SITE ADDRESS:', { x: leftX, y: currentLeftY, size: labelSize, font: boldFont, color: textColor });
            currentLeftY -= lineSpacing - 2;

            const maxWidth = 250;
            const words = String(address).split(' ');
            let line = '';

            for (const word of words) {
                const testLine = line + word + ' ';
                const width = font.widthOfTextAtSize(testLine, 9);
                if (width > maxWidth && line !== '') {
                    page1.drawText(line, { x: leftX, y: currentLeftY, size: 9, font: font, color: textColor });
                    line = word + ' ';
                    currentLeftY -= 12;
                } else {
                    line = testLine;
                }
            }
            if (line.trim()) {
                page1.drawText(line, { x: leftX, y: currentLeftY, size: 9, font: font, color: textColor });
            }
        } else {
            console.warn('⚠️ PDF Gen - Address is empty or missing in data!');
        }

        // --- RIGHT COLUMN: QUOTATION STATUS ---
        // Aligning this to the same baseline as the left column
        page1.drawText('QUOTATION DETAILS', { x: rightX, y: currentRightY + 15, size: labelSize, font: boldFont, color: textColor });

        // Row: Quote Number
        page1.drawText('REFERENCE NO:', { x: rightX, y: currentRightY, size: labelSize, font: boldFont, color: textColor });
        page1.drawText(data.quoteNumber || 'Draft', {
            x: rightX + 85,
            y: currentRightY,
            size: 10,
            font: font,
            color: textColor
        });
        currentRightY -= lineSpacing;

        // Row: Date
        page1.drawText('DATE:', { x: rightX, y: currentRightY, size: labelSize, font: boldFont, color: textColor });
        page1.drawText(this.formatDate(data.quoteDate), {
            x: rightX + 85,
            y: currentRightY,
            size: 10,
            font: font,
            color: textColor
        });
        currentRightY -= lineSpacing;

        // Row: Valid Until
        page1.drawText('VALID UNTIL:', { x: rightX, y: currentRightY, size: labelSize, font: boldFont, color: textColor });
        page1.drawText(this.formatDate(data.validUntil), {
            x: rightX + 85,
            y: currentRightY,
            size: 10,
            font: font,
            color: textColor
        });

        console.log('✅ Page 1 professional layout complete');
    }

    private formatDate(dateString: any): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return String(dateString);
        }
    }

    private formatCurrency(amount: number): string {
        if (!amount || amount === 0) return ''; // Hide redundant 0s
        return amount.toLocaleString('en-IN');
    }

    private numberToWords(num: number): string {
        if (!num || num === 0) return '';
        return num.toLocaleString('en-IN');
    }
}
