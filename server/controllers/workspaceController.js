import Job from '../models/Job.js';
import Session from '../models/Session.js';
import nodemailer from 'nodemailer';

// Reuse the same transporter config as emailController
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

/* ─── HTML Email Templates ─── */

function shortlistedEmailHTML(candidateName, sessionTitle) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <tr><td style="background:linear-gradient(135deg,#6366F1,#7C3AED);padding:40px 40px 32px;text-align:center;">
        <div style="width:56px;height:56px;margin:0 auto 16px;background:rgba(255,255,255,0.2);border-radius:14px;line-height:56px;text-align:center;">
          <span style="font-size:28px;">🎉</span>
        </div>
        <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:700;">Congratulations!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:16px;">You have been shortlisted</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <p style="margin:0 0 16px;color:#0F172A;font-size:16px;line-height:1.6;">Dear <strong>${candidateName}</strong>,</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
          We are thrilled to inform you that after careful evaluation of your interview${sessionTitle ? ` for <strong>${sessionTitle}</strong>` : ''},
          you have been <span style="color:#059669;font-weight:700;">shortlisted</span> for the next stage of our hiring process.
        </p>
        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0;color:#065F46;font-size:14px;font-weight:600;">📋 What's next?</p>
          <p style="margin:8px 0 0;color:#047857;font-size:14px;line-height:1.6;">
            Our hiring team will reach out to you shortly with further details about the next steps, including scheduling and any additional requirements.
          </p>
        </div>
        <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">
          If you have any questions, please don't hesitate to reach out. We look forward to the next stage!
        </p>
      </td></tr>
      <tr><td style="padding:24px 40px;border-top:1px solid #F1F5F9;text-align:center;">
        <p style="margin:0;color:#94A3B8;font-size:13px;">
          Sent via <strong style="color:#6366F1;">VyorAI</strong> — Intelligent Hiring Platform
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function rejectionEmailHTML(candidateName, sessionTitle) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <tr><td style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:40px 40px 32px;text-align:center;">
        <div style="width:56px;height:56px;margin:0 auto 16px;background:rgba(255,255,255,0.08);border-radius:14px;line-height:56px;text-align:center;">
          <span style="font-size:28px;">📝</span>
        </div>
        <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:700;">Application Update</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.65);font-size:16px;">Thank you for your effort</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <p style="margin:0 0 16px;color:#0F172A;font-size:16px;line-height:1.6;">Dear <strong>${candidateName}</strong>,</p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
          Thank you for taking the time to complete the interview${sessionTitle ? ` for <strong>${sessionTitle}</strong>` : ''}.
          We appreciate the effort you put into the process.
        </p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
          After careful consideration, we regret to inform you that we have decided to move forward with other candidates at this time.
          This decision does not diminish the value of your skills and experience.
        </p>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0;color:#334155;font-size:14px;font-weight:600;">💡 Keep going!</p>
          <p style="margin:8px 0 0;color:#64748B;font-size:14px;line-height:1.6;">
            We encourage you to apply for future openings that match your profile. Your skills are valuable and the right opportunity is out there.
          </p>
        </div>
        <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">
          We wish you the very best in your career journey.
        </p>
      </td></tr>
      <tr><td style="padding:24px 40px;border-top:1px solid #F1F5F9;text-align:center;">
        <p style="margin:0;color:#94A3B8;font-size:13px;">
          Sent via <strong style="color:#6366F1;">VyorAI</strong> — Intelligent Hiring Platform
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/* ─── Controllers ─── */

// Get all sessions (Jobs act as sessions in this app)
export const getSessions = async (req, res) => {
  try {
    const sessions = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// Get candidates of a session
export const getSessionCandidates = async (req, res) => {
  try {
    const { id } = req.params;
    const dbSessions = await Session.find({ jobId: id }).populate('candidateId', 'name email').sort({ createdAt: -1 });
    // Transform to match what frontend expects
    const candidates = dbSessions.map(s => ({
      _id: s._id,
      name: s.candidateId ? s.candidateId.name : 'Unknown',
      email: s.candidateId ? s.candidateId.email : 'No email',
      resumeDetails: s.resumeText ? s.resumeText.substring(0, 200) + '...' : 'No resume uploaded',
      status: s.status || 'pending',
      sessionId: s.jobId,
      score: s.score,
      createdAt: s.createdAt,
    }));
    res.json(candidates);
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};

// Update candidate status
export const updateCandidateStatus = async (req, res) => {
  console.log(`Update status request: id=${req.params.id}, status=${req.body.status}`);
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: pending, shortlisted, or rejected.' });
    }

    const candidate = await Session.findByIdAndUpdate(id, { status }, { new: true });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({
      _id: candidate._id,
      status: candidate.status,
    });
  } catch (error) {
    console.error('Failed to update candidate status:', error);
    res.status(500).json({ error: 'Failed to update candidate status' });
  }
};

// Send shortlisted emails
export const sendShortlistedEmails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the job/session title
    const job = await Job.findById(id);
    const sessionTitle = job ? job.title : '';

    const candidates = await Session.find({ jobId: id, status: 'shortlisted' }).populate('candidateId', 'name email');
    if (candidates.length === 0) {
      return res.status(400).json({ error: 'No shortlisted candidates found in this session.' });
    }

    const emailResults = [];
    for (const c of candidates) {
      const name = c.candidateId?.name || 'Candidate';
      const email = c.candidateId?.email;
      if (!email) {
        emailResults.push({ name, email: 'N/A', success: false, error: 'No email address' });
        continue;
      }
      try {
        await transporter.sendMail({
          from: `"VyorAI Hiring" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `🎉 Congratulations! You've been shortlisted${sessionTitle ? ` — ${sessionTitle}` : ''}`,
          html: shortlistedEmailHTML(name, sessionTitle),
        });
        console.log(`📧 Shortlisted email sent to ${email}`);
        emailResults.push({ name, email, success: true });
      } catch (err) {
        console.error(`📧 Failed to send to ${email}:`, err.message);
        emailResults.push({ name, email, success: false, error: err.message });
      }
    }

    const sent = emailResults.filter(r => r.success).length;
    const failed = emailResults.filter(r => !r.success).length;

    res.json({
      message: `Successfully sent ${sent} shortlisted email(s).${failed > 0 ? ` ${failed} failed.` : ''}`,
      results: emailResults
    });
  } catch (error) {
    console.error('Shortlisted email error:', error);
    res.status(500).json({ error: 'Failed to send shortlisted emails' });
  }
};

// Send rejection emails
export const sendRejectionEmails = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    const sessionTitle = job ? job.title : '';

    const candidates = await Session.find({ jobId: id, status: 'rejected' }).populate('candidateId', 'name email');
    if (candidates.length === 0) {
      return res.status(400).json({ error: 'No rejected candidates found in this session.' });
    }

    const emailResults = [];
    for (const c of candidates) {
      const name = c.candidateId?.name || 'Candidate';
      const email = c.candidateId?.email;
      if (!email) {
        emailResults.push({ name, email: 'N/A', success: false, error: 'No email address' });
        continue;
      }
      try {
        await transporter.sendMail({
          from: `"VyorAI Hiring" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Application Update${sessionTitle ? ` — ${sessionTitle}` : ''}`,
          html: rejectionEmailHTML(name, sessionTitle),
        });
        console.log(`📧 Rejection email sent to ${email}`);
        emailResults.push({ name, email, success: true });
      } catch (err) {
        console.error(`📧 Failed to send to ${email}:`, err.message);
        emailResults.push({ name, email, success: false, error: err.message });
      }
    }

    const sent = emailResults.filter(r => r.success).length;
    const failed = emailResults.filter(r => !r.success).length;

    res.json({
      message: `Successfully sent ${sent} rejection email(s).${failed > 0 ? ` ${failed} failed.` : ''}`,
      results: emailResults
    });
  } catch (error) {
    console.error('Rejection email error:', error);
    res.status(500).json({ error: 'Failed to send rejection emails' });
  }
};
