import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Verify connection once on startup
transporter.verify().then(() => {
  console.log('📧 Email transporter ready');
}).catch((err) => {
  console.error('📧 Email transporter error:', err.message);
});

/* ─── Beautiful HTML email templates ─── */

function selectedTemplate(candidateName, jobTitle) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#6366F1,#7C3AED);padding:40px 40px 32px;text-align:center;">
        <div style="width:56px;height:56px;margin:0 auto 16px;background:rgba(255,255,255,0.2);border-radius:14px;line-height:56px;text-align:center;">
          <span style="font-size:28px;">🎉</span>
        </div>
        <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:700;letter-spacing:-0.02em;">Congratulations!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:16px;">You've been selected</p>
      </td></tr>
      
      <!-- Body -->
      <tr><td style="padding:40px;">
        <p style="margin:0 0 16px;color:#0F172A;font-size:16px;line-height:1.6;">Dear <strong>${candidateName}</strong>,</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
          We are thrilled to inform you that after a thorough review of your interview assessment${jobTitle ? ` for the <strong>${jobTitle}</strong> position` : ''}, 
          you have been <span style="color:#059669;font-weight:700;">selected</span> for the next stage of our hiring process.
        </p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
          Your performance during the assessment was impressive, and we are excited about the possibility of having you join our team.
        </p>
        
        <!-- Highlight box -->
        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0;color:#065F46;font-size:14px;font-weight:600;">📋 What's next?</p>
          <p style="margin:8px 0 0;color:#047857;font-size:14px;line-height:1.6;">
            Our hiring team will reach out to you shortly with further details about the next steps, including scheduling and any additional requirements.
          </p>
        </div>
        
        <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">
          If you have any questions in the meantime, please don't hesitate to reach out.
        </p>
      </td></tr>
      
      <!-- Footer -->
      <tr><td style="padding:24px 40px;border-top:1px solid #F1F5F9;text-align:center;">
        <p style="margin:0;color:#94A3B8;font-size:13px;">
          Sent via <strong style="color:#6366F1;">AI Interviewer</strong> — Intelligent Hiring Platform
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function rejectedTemplate(candidateName, jobTitle) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:40px 40px 32px;text-align:center;">
        <div style="width:56px;height:56px;margin:0 auto 16px;background:rgba(255,255,255,0.08);border-radius:14px;line-height:56px;text-align:center;">
          <span style="font-size:28px;">📝</span>
        </div>
        <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:700;letter-spacing:-0.02em;">Application Update</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.65);font-size:16px;">Thank you for your effort</p>
      </td></tr>
      
      <!-- Body -->
      <tr><td style="padding:40px;">
        <p style="margin:0 0 16px;color:#0F172A;font-size:16px;line-height:1.6;">Dear <strong>${candidateName}</strong>,</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
          Thank you for taking the time to complete the interview assessment${jobTitle ? ` for the <strong>${jobTitle}</strong> position` : ''}.
          We appreciate the effort you put into the process.
        </p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
          After careful consideration, we regret to inform you that we have decided to move forward with other candidates at this time.
          This was a competitive process and this decision does not diminish the value of your skills and experience.
        </p>
        
        <!-- Encouragement box -->
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0;color:#334155;font-size:14px;font-weight:600;">💡 Keep going!</p>
          <p style="margin:8px 0 0;color:#64748B;font-size:14px;line-height:1.6;">
            We encourage you to apply for future openings that match your profile.
            Your skills are valuable, and the right opportunity is out there.
          </p>
        </div>
        
        <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">
          We wish you the very best in your career journey and future endeavors.
        </p>
      </td></tr>
      
      <!-- Footer -->
      <tr><td style="padding:24px 40px;border-top:1px solid #F1F5F9;text-align:center;">
        <p style="margin:0;color:#94A3B8;font-size:13px;">
          Sent via <strong style="color:#6366F1;">AI Interviewer</strong> — Intelligent Hiring Platform
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/* ─── Controller ─── */

export const sendCandidateEmail = async (req, res) => {
  try {
    const { candidateEmail, candidateName, jobTitle, type } = req.body;

    if (!candidateEmail || !type) {
      return res.status(400).json({ error: 'candidateEmail and type (selected|rejected) are required.' });
    }

    const isSelected = type === 'selected';
    const subject = isSelected
      ? `🎉 Congratulations! You've been selected${jobTitle ? ` — ${jobTitle}` : ''}`
      : `Application Update${jobTitle ? ` — ${jobTitle}` : ''}`;

    const html = isSelected
      ? selectedTemplate(candidateName || 'Candidate', jobTitle)
      : rejectedTemplate(candidateName || 'Candidate', jobTitle);

    await transporter.sendMail({
      from: `"AI Interviewer" <${process.env.EMAIL_USER}>`,
      to: candidateEmail,
      subject,
      html,
    });

    console.log(`📧 ${isSelected ? 'Selection' : 'Rejection'} email sent to ${candidateEmail}`);
    res.json({ success: true, message: `Email sent to ${candidateEmail}` });
  } catch (err) {
    console.error('📧 Email send error:', err);
    res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
};

export const sendBulkEmails = async (req, res) => {
  try {
    const { candidates, type } = req.body;
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0 || !type) {
      return res.status(400).json({ error: 'Valid candidates array and type are required.' });
    }

    const isSelected = type === 'selected';

    const promises = candidates.map((cand) => {
      const candidateEmail = cand.email;
      const candidateName = cand.name || 'Candidate';
      const jobTitle = cand.jobTitle || '';

      if (!candidateEmail) return Promise.resolve({ error: 'No email' });

      const subject = isSelected
        ? `🎉 Congratulations! You've been selected${jobTitle ? ` — ${jobTitle}` : ''}`
        : `Application Update${jobTitle ? ` — ${jobTitle}` : ''}`;

      const html = isSelected
        ? selectedTemplate(candidateName, jobTitle)
        : rejectedTemplate(candidateName, jobTitle);

      return transporter.sendMail({
        from: `"AI Interviewer" <${process.env.EMAIL_USER}>`,
        to: candidateEmail,
        subject,
        html,
      }).then(() => {
        console.log(`📧 Bulk ${type} email sent to ${candidateEmail}`);
        return { email: candidateEmail, success: true };
      }).catch(err => {
        console.error(`📧 Bulk ${type} email failed for ${candidateEmail}:`, err.message);
        return { email: candidateEmail, success: false, error: err.message };
      });
    });

    const results = await Promise.all(promises);
    res.json({ success: true, results });
  } catch (err) {
    console.error('📧 Bulk email send error:', err);
    res.status(500).json({ error: 'Failed to send bulk emails', details: err.message });
  }
};
