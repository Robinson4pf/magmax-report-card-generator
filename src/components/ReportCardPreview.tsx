interface ReportCardPreviewProps {
  reportData: {
    student: { name: string; class: string };
    scores: Array<{
      id: string;
      mid_term_score: number;
      end_term_score: number;
      subjects: { name: string };
    }>;
    attendance?: { present_days: number; total_days: number };
    comments?: {
      interest?: string;
      conduct?: string;
      behavior?: string;
    };
    grandTotal: number;
    rank: number;
  };
}

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

export default function ReportCardPreview({ reportData }: ReportCardPreviewProps) {
  const termCloses = new Date();
  termCloses.setDate(termCloses.getDate() + 30);
  const nextTermStarts = new Date(termCloses);
  nextTermStarts.setDate(nextTermStarts.getDate() + 14);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const averageScore = reportData.grandTotal / reportData.scores.length;

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto shadow-2xl" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-black">
        <div className="w-20 h-20 border-2 border-gray-300 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-xs text-gray-400">
            <div>School</div>
            <div>Logo</div>
          </div>
        </div>
        
        <div className="text-right">
          <h1 className="text-xl font-bold">MagMax Educational Centre</h1>
          <p className="text-sm mt-1">P. O. Box NB 481 - NII BOIMAH</p>
          <p className="text-sm">10TH AVENUE, MCCARTHY HILL, ACCRA</p>
          <p className="text-sm">0244126130 / 0594738900 / 0544263109</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold border-b border-black inline-block pb-1">
          Academic Report Sheet
        </h2>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div className="space-y-2">
          <div className="flex">
            <span className="font-bold w-32">Name:</span>
            <span>{reportData.student.name}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-32">Class:</span>
            <span>{reportData.student.class}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-32">Attendance:</span>
            <span>
              {reportData.attendance
                ? `${reportData.attendance.present_days}/${reportData.attendance.total_days}`
                : 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex">
            <span className="font-bold w-32">No. on Roll:</span>
            <span>{reportData.rank}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-32">Term:</span>
            <span>3</span>
          </div>
          <div className="flex">
            <span className="font-bold w-32">Term Closes:</span>
            <span>{formatDate(termCloses)}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-32">Next Term:</span>
            <span>{formatDate(nextTermStarts)}</span>
          </div>
        </div>
      </div>

      {/* Scores Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-white">
              <th className="border border-black p-2 text-left font-bold">Subject</th>
              <th className="border border-black p-2 text-center font-bold">Class Score (50)</th>
              <th className="border border-black p-2 text-center font-bold">Exam Score (50)</th>
              <th className="border border-black p-2 text-center font-bold">Total (100)</th>
              <th className="border border-black p-2 text-center font-bold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {reportData.scores.map((score, index) => {
              const total = score.mid_term_score + score.end_term_score;
              return (
                <tr key={score.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-black p-2">{score.subjects.name}</td>
                  <td className="border border-black p-2 text-center">{score.mid_term_score.toFixed(1)}</td>
                  <td className="border border-black p-2 text-center">{score.end_term_score.toFixed(1)}</td>
                  <td className="border border-black p-2 text-center">{total.toFixed(1)}</td>
                  <td className="border border-black p-2 text-center">{generateRemark(total)}</td>
                </tr>
              );
            })}
            <tr className="font-bold">
              <td className="border border-black p-2">GRAND TOTAL</td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2 text-center">{reportData.grandTotal.toFixed(1)}</td>
              <td className="border border-black p-2 text-center">{generateRemark(averageScore)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comments Section */}
      <div className="mb-6 text-sm space-y-2">
        <div className="flex">
          <span className="font-bold w-20">Conduct:</span>
          <span>{reportData.comments?.conduct || 'N/A'}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-20">Interest:</span>
          <span>{reportData.comments?.interest || 'N/A'}</span>
        </div>
      </div>

      {/* Remarks */}
      <div className="mb-6 text-sm space-y-4">
        <div>
          <p className="font-bold mb-2">Class Teacher's Remarks:</p>
          <p>{generateTeacherRemark((averageScore / 100) * 100)}</p>
        </div>
        
        <div>
          <p className="font-bold mb-2">Headmaster's Remarks:</p>
          <p>{generateHeadmasterRemark((averageScore / 100) * 100)}</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <div className="border-t border-black pt-2 text-center">
            <p className="font-bold text-sm">Class Teacher</p>
          </div>
        </div>
        <div>
          <div className="border-t border-black pt-2 text-center">
            <p className="font-bold text-sm">Head Teacher</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm">
        <p>School resumes on {formatDate(nextTermStarts)}</p>
      </div>
    </div>
  );
}