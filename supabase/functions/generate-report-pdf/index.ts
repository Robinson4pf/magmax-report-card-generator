import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating PDF report for authenticated user');
    
    const { reportData } = await req.json();
    
    if (!reportData) {
      throw new Error('Report data is required');
    }

    const { student, scores, attendance, comments, grandTotal, rank } = reportData;

    const generateRemark = (total: number): string => {
      if (total >= 80) return 'HIGHLY PROFICIENT';
      if (total >= 70) return 'PROFICIENT';
      if (total >= 60) return 'APPROACHING PROFICIENCY';
      if (total >= 50) return 'DEVELOPING';
      return 'NEEDS IMPROVEMENT';
    };

    const generateTeacherRemark = (percentage: number): string => {
      if (percentage >= 90) return "An outstanding performance! Keep up the excellent work and continue to inspire others.";
      if (percentage >= 80) return "Very good effort this term. Your dedication is commendable. Keep striving for excellence.";
      if (percentage >= 70) return "Good performance. With a little more effort, you can achieve even greater results.";
      if (percentage >= 60) return "Fair performance. Focus more on your studies and you will see improvement.";
      if (percentage >= 50) return "You passed, but there is room for improvement. Work harder next term.";
      return "More effort is needed. Do not give up; with determination, you can improve.";
    };

    const generateHeadmasterRemark = (percentage: number): string => {
      if (percentage >= 90) return "Exceptional achievement! You are a role model for your peers. Keep excelling.";
      if (percentage >= 80) return "Commendable performance. Continue with this positive attitude towards learning.";
      if (percentage >= 70) return "A good result. Push yourself further and aim for excellence next term.";
      if (percentage >= 60) return "Satisfactory progress. With better focus and commitment, you can do better.";
      if (percentage >= 50) return "You have the potential to do better. Apply yourself more diligently.";
      return "Improvement is needed. Stay encouraged and work harder next term.";
    };

    const termCloses = new Date();
    termCloses.setDate(termCloses.getDate() + 30);
    const nextTermStarts = new Date(termCloses);
    nextTermStarts.setDate(nextTermStarts.getDate() + 14);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    let yPos = height - 60;

    // Header - School Logo Box
    page.drawRectangle({
      x: margin,
      y: yPos - 70,
      width: 70,
      height: 70,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95),
    });
    
    page.drawText('School', {
      x: margin + 20,
      y: yPos - 30,
      size: 8,
      font: normalFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    page.drawText('Logo', {
      x: margin + 24,
      y: yPos - 40,
      size: 8,
      font: normalFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // School Details
    const schoolName = 'MagMax Educational Centre';
    page.drawText(schoolName, {
      x: width - margin - boldFont.widthOfTextAtSize(schoolName, 14),
      y: yPos,
      size: 14,
      font: boldFont,
    });
    
    yPos -= 20;
    const address1 = 'P. O. Box NB 481 - NII BOIMAH';
    page.drawText(address1, {
      x: width - margin - normalFont.widthOfTextAtSize(address1, 9),
      y: yPos,
      size: 9,
      font: normalFont,
    });
    
    yPos -= 14;
    const address2 = '10TH AVENUE, MCCARTHY HILL, ACCRA';
    page.drawText(address2, {
      x: width - margin - normalFont.widthOfTextAtSize(address2, 9),
      y: yPos,
      size: 9,
      font: normalFont,
    });
    
    yPos -= 14;
    const phones = '0244126130 / 0594738900 / 0544263109';
    page.drawText(phones, {
      x: width - margin - normalFont.widthOfTextAtSize(phones, 9),
      y: yPos,
      size: 9,
      font: normalFont,
    });

    yPos -= 20;
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Report Title
    yPos -= 30;
    const title = 'Academic Report Sheet';
    const titleWidth = boldFont.widthOfTextAtSize(title, 13);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: yPos,
      size: 13,
      font: boldFont,
    });
    
    page.drawLine({
      start: { x: (width - titleWidth) / 2, y: yPos - 2 },
      end: { x: (width + titleWidth) / 2, y: yPos - 2 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Student Information
    yPos -= 30;
    const infoStartY = yPos;
    const fontSize = 10;
    const lineHeight = 18;
    const colWidth = (width - 2 * margin) / 2;

    page.drawText('Name:', { x: margin, y: yPos, size: fontSize, font: boldFont });
    page.drawText(student.name, { x: margin + 100, y: yPos, size: fontSize, font: normalFont });
    
    yPos -= lineHeight;
    page.drawText('Class:', { x: margin, y: yPos, size: fontSize, font: boldFont });
    page.drawText(student.class, { x: margin + 100, y: yPos, size: fontSize, font: normalFont });
    
    yPos -= lineHeight;
    page.drawText('Attendance:', { x: margin, y: yPos, size: fontSize, font: boldFont });
    page.drawText(
      attendance ? `${attendance.present_days}/${attendance.total_days}` : 'N/A',
      { x: margin + 100, y: yPos, size: fontSize, font: normalFont }
    );

    yPos = infoStartY;
    const rightColX = margin + colWidth;
    
    page.drawText('No. on Roll:', { x: rightColX, y: yPos, size: fontSize, font: boldFont });
    page.drawText(String(rank), { x: rightColX + 100, y: yPos, size: fontSize, font: normalFont });
    
    yPos -= lineHeight;
    page.drawText('Term:', { x: rightColX, y: yPos, size: fontSize, font: boldFont });
    page.drawText('3', { x: rightColX + 100, y: yPos, size: fontSize, font: normalFont });
    
    yPos -= lineHeight;
    page.drawText('Term Closes:', { x: rightColX, y: yPos, size: fontSize, font: boldFont });
    page.drawText(formatDate(termCloses), { x: rightColX + 100, y: yPos, size: fontSize, font: normalFont });
    
    yPos -= lineHeight;
    page.drawText('Next Term:', { x: rightColX, y: yPos, size: fontSize, font: boldFont });
    page.drawText(formatDate(nextTermStarts), { x: rightColX + 100, y: yPos, size: fontSize, font: normalFont });

    // Scores Table
    yPos -= 35;
    const tableHeaders = ['Subject', 'Class Score (50)', 'Exam Score (50)', 'Total (100)', 'Remarks'];
    const colWidths = [180, 70, 70, 60, 115];
    const rowHeight = 20;
    const cellPadding = 5;
    
    // Header row
    let xPos = margin;
    page.drawRectangle({
      x: margin,
      y: yPos - rowHeight,
      width: width - 2 * margin,
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    
    tableHeaders.forEach((header, i) => {
      page.drawText(header, {
        x: xPos + cellPadding,
        y: yPos - rowHeight + 7,
        size: 9,
        font: boldFont,
      });
      
      if (i < tableHeaders.length - 1) {
        xPos += colWidths[i];
        page.drawLine({
          start: { x: xPos, y: yPos },
          end: { x: xPos, y: yPos - rowHeight },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
    });
    
    yPos -= rowHeight;

    // Data rows
    scores.forEach((score: any, rowIndex: number) => {
      const midTerm = Number(score.mid_term_score);
      const endTerm = Number(score.end_term_score);
      const total = midTerm + endTerm;
      
      const rowData = [
        score.subjects?.name || 'Unknown Subject',
        midTerm.toFixed(1),
        endTerm.toFixed(1),
        total.toFixed(1),
        generateRemark(total)
      ];
      
      if (rowIndex % 2 === 0) {
        page.drawRectangle({
          x: margin,
          y: yPos - rowHeight,
          width: width - 2 * margin,
          height: rowHeight,
          color: rgb(0.97, 0.97, 0.97),
        });
      }
      
      page.drawRectangle({
        x: margin,
        y: yPos - rowHeight,
        width: width - 2 * margin,
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      
      xPos = margin;
      rowData.forEach((cell, i) => {
        const textX = i === 0 ? xPos + cellPadding : xPos + colWidths[i] / 2 - normalFont.widthOfTextAtSize(cell, 9) / 2;
        page.drawText(cell, {
          x: textX,
          y: yPos - rowHeight + 7,
          size: 9,
          font: normalFont,
        });
        
        if (i < rowData.length - 1) {
          xPos += colWidths[i];
          page.drawLine({
            start: { x: xPos, y: yPos },
            end: { x: xPos, y: yPos - rowHeight },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        }
      });
      
      yPos -= rowHeight;
    });

    // Grand Total Row
    page.drawRectangle({
      x: margin,
      y: yPos - rowHeight,
      width: width - 2 * margin,
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    
    xPos = margin;
    const grandTotalRow = ['GRAND TOTAL', '', '', grandTotal.toFixed(1), generateRemark(grandTotal / scores.length)];
    
    grandTotalRow.forEach((cell, i) => {
      if (cell) {
        const textX = i === 0 ? xPos + cellPadding : xPos + colWidths[i] / 2 - boldFont.widthOfTextAtSize(cell, 9) / 2;
        page.drawText(cell, {
          x: textX,
          y: yPos - rowHeight + 7,
          size: 9,
          font: boldFont,
        });
      }
      
      if (i < grandTotalRow.length - 1) {
        xPos += colWidths[i];
        page.drawLine({
          start: { x: xPos, y: yPos },
          end: { x: xPos, y: yPos - rowHeight },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
    });
    
    yPos -= rowHeight + 20;

    // Footer
    page.drawText('Conduct:', { x: margin, y: yPos, size: 10, font: boldFont });
    page.drawText(comments?.conduct || 'N/A', { x: margin + 70, y: yPos, size: 10, font: normalFont });
    
    yPos -= 18;
    page.drawText('Interest:', { x: margin, y: yPos, size: 10, font: boldFont });
    page.drawText(comments?.interest || 'N/A', { x: margin + 70, y: yPos, size: 10, font: normalFont });

    // Remarks
    yPos -= 30;
    const averageScore = grandTotal / scores.length;
    const teacherRemark = generateTeacherRemark(averageScore);
    const headmasterRemark = generateHeadmasterRemark(averageScore);
    
    page.drawText("Class Teacher's Remarks:", { x: margin, y: yPos, size: 9, font: boldFont });
    yPos -= 15;
    page.drawText(teacherRemark, { x: margin, y: yPos, size: 9, font: normalFont, maxWidth: width - 2 * margin });

    yPos -= 25;
    page.drawText("Headmaster's Remarks:", { x: margin, y: yPos, size: 9, font: boldFont });
    yPos -= 15;
    page.drawText(headmasterRemark, { x: margin, y: yPos, size: 9, font: normalFont, maxWidth: width - 2 * margin });

    // Signatures
    yPos -= 50;
    
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: margin + 200, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText('Class Teacher', {
      x: margin + 70,
      y: yPos - 15,
      size: 9,
      font: boldFont,
    });

    const rightSigX = width - margin - 200;
    page.drawLine({
      start: { x: rightSigX, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText('Head Teacher', {
      x: rightSigX + 65,
      y: yPos - 15,
      size: 9,
      font: boldFont,
    });

    // Footer note
    yPos -= 40;
    const footerText = `School resumes on ${formatDate(nextTermStarts)}`;
    const footerWidth = normalFont.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: yPos,
      size: 9,
      font: normalFont,
    });

    const pdfBytes = await pdfDoc.save();
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    console.log('PDF generated successfully');

    return new Response(
      JSON.stringify({ pdf: base64Pdf }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
