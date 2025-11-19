import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication - JWT verification is enabled by default for edge functions
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

    const { student, scores, attendance, comments, grandTotal, rank, totalStudents } = reportData;

    // Helper function to generate remark based on score
    const generateRemark = (total: number): string => {
      if (total >= 80) return 'HIGHLY PROFICIENT';
      if (total >= 70) return 'PROFICIENT';
      if (total >= 60) return 'APPROACHING PROFICIENCY';
      if (total >= 50) return 'DEVELOPING';
      return 'NEEDS IMPROVEMENT';
    };

    // Calculate next term date (assuming 3 months later)
    const termCloses = new Date();
    termCloses.setDate(termCloses.getDate() + 30); // 30 days from now
    const nextTermStarts = new Date(termCloses);
    nextTermStarts.setDate(nextTermStarts.getDate() + 14); // 2 weeks after term closes

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Create HTML content for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            max-width: 850px;
            margin: 0 auto;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .school-logo {
            width: 80px;
            height: 80px;
            background: #f0f0f0;
            border: 1px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #666;
          }
          .school-details {
            text-align: right;
            flex: 1;
            padding-left: 20px;
          }
          .school-details h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .school-details p {
            font-size: 10px;
            line-height: 1.4;
            margin: 2px 0;
          }
          .report-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0;
            text-decoration: underline;
          }
          .student-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 20px;
            margin-bottom: 20px;
            font-size: 12px;
          }
          .info-item {
            display: flex;
          }
          .info-item strong {
            min-width: 120px;
          }
          .scores-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
          }
          .scores-table th {
            background: #fff;
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
            font-weight: bold;
          }
          .scores-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
          }
          .scores-table td:first-child {
            text-align: left;
            padding-left: 10px;
          }
          .scores-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .footer-info {
            margin: 20px 0;
            font-size: 12px;
          }
          .footer-info p {
            margin: 8px 0;
          }
          .remarks-section {
            margin: 20px 0;
            font-size: 11px;
          }
          .remarks-section p {
            margin: 10px 0;
            line-height: 1.6;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            font-size: 11px;
          }
          .signature-box {
            text-align: center;
            width: 45%;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 8px;
            font-weight: bold;
          }
          .footer-note {
            text-align: center;
            margin-top: 30px;
            font-size: 11px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-logo">
            School<br>Logo
          </div>
          <div class="school-details">
            <h1>MagMax Educational Centre</h1>
            <p>P. O. Box NB 481 - NII BOIMAH</p>
            <p>10TH AVENUE, MCCARTHY HILL, ACCRA</p>
            <p>0244126130 / 0594738900 / 0544263109</p>
          </div>
        </div>

        <div class="report-title">Academic Report Sheet</div>

        <div class="student-info">
          <div class="info-item">
            <strong>Name:</strong>
            <span>${student.name}</span>
          </div>
          <div class="info-item">
            <strong>No. on Roll:</strong>
            <span>${rank}</span>
          </div>
          <div class="info-item">
            <strong>Class:</strong>
            <span>${student.class}</span>
          </div>
          <div class="info-item">
            <strong>Term:</strong>
            <span>3</span>
          </div>
          <div class="info-item">
            <strong>Attendance:</strong>
            <span>${attendance ? `${attendance.present_days}/${attendance.total_days}` : 'N/A'}</span>
          </div>
          <div class="info-item">
            <strong>Term Closes:</strong>
            <span>${formatDate(termCloses)}</span>
          </div>
          <div class="info-item"></div>
          <div class="info-item">
            <strong>Next Term:</strong>
            <span>${formatDate(nextTermStarts)}</span>
          </div>
        </div>

        <table class="scores-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Class Score</th>
              <th>Exam Score</th>
              <th>Total</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${scores.map((score: any) => {
              const midTerm = Number(score.mid_term_score);
              const endTerm = Number(score.end_term_score);
              const total = midTerm + endTerm;
              const remark = generateRemark(total);
              
              return `
                <tr>
                  <td>${score.subjects?.name || 'Unknown Subject'}</td>
                  <td>${midTerm}</td>
                  <td>${endTerm}</td>
                  <td>${total}</td>
                  <td>${remark}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer-info">
          <p><strong>Conduct:</strong> ${comments?.conduct || 'Not provided'}</p>
          <p><strong>Interest:</strong> ${comments?.interest || 'Not provided'}</p>
        </div>

        <div class="remarks-section">
          <p><strong>Class Teacher's Remarks:</strong> Good performance. Demonstrates solid understanding of most concepts.</p>
          <p><strong>Headmaster's Remarks:</strong> Good progress. Continue to work hard.</p>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Class Teacher</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Head Teacher</div>
          </div>
        </div>

        <div class="footer-note">
          School resumes on ${formatDate(nextTermStarts)} for the next term.
        </div>
      </body>
      </html>
    `;

    // Use a PDF generation service
    const pdfResponse = await fetch('https://api.html2pdf.app/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        format: 'A4',
        printBackground: true,
      }),
    });

    if (!pdfResponse.ok) {
      // Fallback: return HTML as base64 for client-side handling
      console.log('PDF service unavailable, returning HTML');
      const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
      return new Response(
        JSON.stringify({ 
          pdf: base64Html,
          isHtml: true,
          message: 'PDF generation service unavailable. Returning HTML content.'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    return new Response(
      JSON.stringify({ pdf: base64Pdf }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
