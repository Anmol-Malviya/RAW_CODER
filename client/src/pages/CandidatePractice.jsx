import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Code2, BrainCircuit, Play, CheckCircle2, ChevronRight, Lock, FileUp, FileText, X, Loader2 } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';
import { generatePracticeSession } from '../services/api';
const mockChallenges = [
  { 
    id: 1, 
    title: 'Two Sum', 
    category: 'Algorithms', 
    difficulty: 'Easy', 
    status: 'completed',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    starterCode: 'function twoSum(nums, target) {\n  // Your implementation here\n}',
    tags: 'Easy · Hash Tables'
  },
  { 
    id: 2, 
    title: 'Reverse a Linked List', 
    category: 'Data Structures', 
    difficulty: 'Easy', 
    status: 'completed',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    starterCode: 'function reverseList(head) {\n  // Your implementation here\n}',
    tags: 'Easy · Linked List'
  },
  { 
    id: 3, 
    title: 'Merge Intervals', 
    category: 'Algorithms', 
    difficulty: 'Medium', 
    status: 'unattempted',
    description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.',
    starterCode: 'function merge(intervals) {\n  // Your implementation here\n}',
    tags: 'Medium · Sorting'
  },
  { 
    id: 4, 
    title: 'Valid Parentheses', 
    category: 'Data Structures', 
    difficulty: 'Easy', 
    status: 'unattempted',
    description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
    starterCode: 'function isValid(s) {\n  // Your implementation here\n}',
    tags: 'Easy · String'
  },
  { 
    id: 5, 
    title: 'Longest Palindromic Substring', 
    category: 'Strings', 
    difficulty: 'Medium', 
    status: 'unattempted',
    description: 'Given a string s, return the longest palindromic substring in s.',
    starterCode: 'function longestPalindrome(s) {\n  // Your implementation here\n}',
    tags: 'Medium · Dynamic Programming'
  },
  { 
    id: 6, 
    title: 'LRU Cache Design', 
    category: 'System Design', 
    difficulty: 'Hard', 
    status: 'locked',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
    starterCode: 'class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n  }\n}',
    tags: 'Hard · Design'
  }
];

const getDifficultyColor = (diff) => {
  switch(diff) {
    case 'Easy': return { text: '#10B981', bg: '#D1FAE5' };
    case 'Medium': return { text: '#F59E0B', bg: '#FEF3C7' };
    case 'Hard': return { text: '#F43F5E', bg: '#FFE4E6' };
    default: return { text: '#64748B', bg: '#F1F5F9' };
  }
};

export default function CandidatePractice() {
  const [activeTab, setActiveTab] = useState('coding');
  const navigate = useNavigate();
  const { dispatch } = useAssessment();

  // Custom Test Form State
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [interviewMode, setInterviewMode] = useState('mcq');
  const [dragOver, setDragOver] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleStartChallenge = (challenge) => {
    if (challenge.status === 'locked') return;
    navigate('/coding', { 
      state: { 
        problem: challenge,
        isPractice: true 
      } 
    });
  };

  const handleGenerateCustomTest = async (e) => {
    e.preventDefault();
    if (!file || !targetRole) {
      setError('Please provide a resume and target role.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const result = await generatePracticeSession(file, targetRole);
      
      dispatch({
        type: 'INITIALIZE',
        payload: {
          sessionId: result.sessionId,
          questions: result.questions,
          rawQuestions: result._rawQuestions || [],
          jobRole: result.jobRole || targetRole,
          hasCodingRound: false,
        },
      });
      // Navigate to the chosen practice format
      navigate(interviewMode === 'voice' ? '/voice-interview' : '/assessment');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate test');
    } finally {
      setGenerating(false);
    }
  };

  const parseError = error ? (typeof error === 'string' ? error : JSON.stringify(error)) : '';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
          <BookOpen size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Practice Area</h1>
          <p style={{ color: '#64748B' }}>Sharpen your skills with mock questions before taking the real interview.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>2 <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>/ 24</span></p>
          </div>
        </div>
        
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
            <BrainCircuit size={24} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Streak</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>3 <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>Days</span></p>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
            <Code2 size={24} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Rank</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>Top 15%</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <button 
            onClick={() => setActiveTab('coding')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px', background: activeTab === 'coding' ? 'white' : 'transparent', border: 'none', borderBottom: activeTab === 'coding' ? '2px solid #3B82F6' : '2px solid transparent', color: activeTab === 'coding' ? '#3B82F6' : '#64748B', fontWeight: 600, cursor: 'pointer' }}
          >
            <Code2 size={18} /> Mock Coding Assessments
          </button>
          <button 
            onClick={() => setActiveTab('mcq')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px', background: activeTab === 'mcq' ? 'white' : 'transparent', border: 'none', borderBottom: activeTab === 'mcq' ? '2px solid #3B82F6' : '2px solid transparent', color: activeTab === 'mcq' ? '#3B82F6' : '#64748B', fontWeight: 600, cursor: 'pointer' }}
          >
            <BookOpen size={18} /> AI Mock Interviews
          </button>
        </div>

        <div style={{ padding: 0 }}>
          {activeTab === 'coding' ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {mockChallenges.map((challenge, idx) => {
                const diffColor = getDifficultyColor(challenge.difficulty);
                const isLocked = challenge.status === 'locked';
                const isCompleted = challenge.status === 'completed';
                
                return (
                  <div 
                    key={challenge.id} 
                    onClick={() => handleStartChallenge(challenge)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', 
                      borderBottom: idx !== mockChallenges.length - 1 ? '1px solid #E2E8F0' : 'none', 
                      background: isLocked ? '#F8FAFC' : 'white', 
                      cursor: isLocked ? 'not-allowed' : 'pointer', 
                      transition: 'background 0.2s' 
                    }} 
                    onMouseOver={(e) => { if(!isLocked) e.currentTarget.style.background = '#F1F5F9'; }} 
                    onMouseOut={(e) => { if(!isLocked) e.currentTarget.style.background = 'white'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ color: isCompleted ? '#22C55E' : '#CBD5E1' }}>
                        <CheckCircle2 size={22} fill={isCompleted ? '#DCFCE7' : 'none'} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: isLocked ? '#94A3B8' : '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {challenge.title}
                          {isLocked && <Lock size={14} color="#94A3B8" />}
                        </h3>
                        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{challenge.category}</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: diffColor.bg, color: diffColor.text }}>
                        {challenge.difficulty}
                      </span>
                      
                      {isLocked ? (
                        <button disabled className="btn-outline" style={{ opacity: 0.5, border: 'none', background: 'transparent' }}>
                          Unlock at level 2
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStartChallenge(challenge); }}
                          className={isCompleted ? "btn-outline" : "btn-primary"} 
                          style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                        >
                          {isCompleted ? 'Review' : 'Solve'} <Play size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 40 }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: 32, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BrainCircuit size={28} color="#3B82F6" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>Generate Custom Practice Interview</h3>
                <p style={{ color: '#64748B', maxWidth: 450, margin: '0 auto', fontSize: 14 }}>
                  Upload a sample resume and enter a target role. Our AI will analyze your experience and generate a professional, tailored practice assessment.
                </p>
              </div>

              <form onSubmit={handleGenerateCustomTest} style={{ maxWidth: 500, margin: '0 auto' }}>
                <div style={{ marginBottom: 20 }}>
                  <label className="field-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Role</label>
                  <input 
                    type="text" 
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior React Developer"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: 'white', fontSize: 15 }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                   <label className="field-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resume (PDF)</label>
                   <label
                    htmlFor="practice-resume"
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); if(e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '30px 20px', borderRadius: 12, border: `2px dashed ${dragOver ? '#3B82F6' : file ? '#93C5FD' : '#E2E8F0'}`,
                      background: dragOver ? '#EFF6FF' : file ? '#FAFAFA' : '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                   >
                     <input type="file" id="practice-resume" accept=".pdf" style={{ display: 'none' }} onChange={e => { if(e.target.files[0]) setFile(e.target.files[0]); }} />
                     
                     {file ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DCFCE7', color: '#16A34A', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <FileText size={16} />
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                            <p style={{ fontSize: 12, color: '#64748B' }}>{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); }} className="btn-ghost" style={{ padding: 6 }}><X size={16} /></button>
                        </div>
                     ) : (
                        <>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', color: '#3B82F6', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
                            <FileUp size={20} />
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>Click or drop resume PDF here</p>
                        </>
                     )}
                   </label>
                </div>

                <div style={{ marginBottom: 24, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', padding: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interview Format</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setInterviewMode('mcq')}
                      style={{ padding: '12px', borderRadius: 10, border: `2px solid ${interviewMode === 'mcq' ? '#3B82F6' : '#E2E8F0'}`, background: interviewMode === 'mcq' ? '#EFF6FF' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>📝</div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: interviewMode === 'mcq' ? '#1D4ED8' : '#0F172A', margin: 0 }}>Written / MCQ</p>
                      <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>Multi-choice format</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterviewMode('voice')}
                      style={{ padding: '12px', borderRadius: 10, border: `2px solid ${interviewMode === 'voice' ? '#3B82F6' : '#E2E8F0'}`, background: interviewMode === 'voice' ? '#EFF6FF' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>🎙️</div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: interviewMode === 'voice' ? '#1D4ED8' : '#0F172A', margin: 0 }}>Voice AI Bot</p>
                      <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>Real-time voice agent</p>
                    </button>
                  </div>
                </div>

                {parseError && (
                  <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, marginBottom: 20 }}>
                    {parseError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={!file || !targetRole || generating}
                  className="btn-primary" 
                  style={{ width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {generating ? (
                    <><Loader2 size={16} className="spin" /> Generating Assessment...</>
                  ) : (
                    <>Generate Test & Start <ChevronRight size={16} /></>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style>

    </div>
  );
}
