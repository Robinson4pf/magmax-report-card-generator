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
    const { reportData } = await req.json();
    
    if (!reportData) {
      throw new Error('Report data is required');
    }

    const { student, scores, attendance, comments, grandTotal, rank, totalStudents } = reportData;

    // Create HTML content for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563EB;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563EB;
            margin: 0 0 10px 0;
          }
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
          }
          .info-box h3 {
            color: #2563EB;
            margin: 0 0 10px 0;
            font-size: 14px;
          }
          .info-box p {
            margin: 5px 0;
            font-size: 13px;
          }
          .scores-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .scores-table th {
            background: #2563EB;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 13px;
          }
          .scores-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
          }
          .scores-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .summary-box {
            background: linear-gradient(135deg, #2563EB, #10B981);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .summary-box h3 {
            margin: 0 0 15px 0;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          .summary-item {
            background: rgba(255, 255, 255, 0.2);
            padding: 10px;
            border-radius: 4px;
          }
          .summary-item .label {
            font-size: 11px;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          .summary-item .value {
            font-size: 20px;
            font-weight: bold;
          }
          .comments-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .comments-section h3 {
            color: #2563EB;
            margin: 0 0 15px 0;
          }
          .comment-item {
            margin-bottom: 10px;
          }
          .comment-item strong {
            color: #2563EB;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 50px;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-top: 2px solid #2563EB;
            padding-top: 10px;
            margin-top: 40px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>STUDENT REPORT CARD</h1>
          <p style="color: #6b7280; margin: 5px 0;">Academic Performance Report</p>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>STUDENT INFORMATION</h3>
            <p><strong>Name:</strong> ${student.name}</p>
            <p><strong>Class:</strong> ${student.class}</p>
          </div>
          <div class="info-box">
            <h3>ATTENDANCE</h3>
            ${attendance ? `
              <p><strong>Present:</strong> ${attendance.present_days} of ${attendance.total_days} days</p>
              <p><strong>Percentage:</strong> ${((attendance.present_days / attendance.total_days) * 100).toFixed(2)}%</p>
            ` : '<p>No attendance data available</p>'}
          </div>
        </div>

        <div class="summary-box">
          <h3>PERFORMANCE SUMMARY</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">Grand Total</div>
              <div class="value">${grandTotal.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="label">Class Position</div>
              <div class="value">${rank} of ${totalStudents}</div>
            </div>
            <div class="summary-item">
              <div class="label">Total Subjects</div>
              <div class="value">${scores.length}</div>
            </div>
          </div>
        </div>

        ${scores.length > 0 ? `
          <h3 style="color: #2563EB; margin-bottom: 15px;">ACADEMIC PERFORMANCE</h3>
          <table class="scores-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Mid-Term</th>
                <th>End-Term</th>
                <th>Mid-Term 50%</th>
                <th>End-Term 50%</th>
                <th>Total (100%)</th>
              </tr>
            </thead>
            <tbody>
              ${scores.map((score: any) => `
                <tr>
                  <td><strong>${score.subjects.name}</strong></td>
                  <td>${score.mid_term_score.toFixed(2)}</td>
                  <td>${score.end_term_score.toFixed(2)}</td>
                  <td>${(score.mid_term_score / 2).toFixed(2)}</td>
                  <td>${(score.end_term_score / 2).toFixed(2)}</td>
                  <td><strong>${(score.mid_term_score / 2 + score.end_term_score / 2).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${comments ? `
          <div class="comments-section">
            <h3>TEACHER'S COMMENTS</h3>
            ${comments.interest ? `
              <div class="comment-item">
                <strong>Student Interest:</strong> ${comments.interest}
              </div>
            ` : ''}
            ${comments.conduct ? `
              <div class="comment-item">
                <strong>Conduct:</strong> ${comments.conduct}
              </div>
            ` : ''}
            ${comments.behavior ? `
              <div class="comment-item">
                <strong>Behavior:</strong> ${comments.behavior}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">Class Teacher</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Headmaster</div>
          </div>
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
