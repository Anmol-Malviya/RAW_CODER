import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchQuestions, addQuestion, deleteQuestion } from '../services/api';
import {
  Plus, Trash2, Database, Search, Filter, 
  MessageSquare, Mic, List, CheckCircle, X, Loader2
} from 'lucide-react';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newQ, setNewQ] = useState({
    text: '',
    category: 'General',
    difficulty: 'intermediate',
    type: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: ''
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (newQ.type === 'voice') {
          // Clean up options for voice
          const { options, correctAnswer, ...voiceQ } = newQ;
          await addQuestion(voiceQ);
      } else {
          await addQuestion(newQ);
      }
      setShowModal(false);
      setNewQ({
        text: '',
        category: 'General',
        difficulty: 'intermediate',
        type: 'mcq',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: ''
      });
      loadQuestions();
    } catch (e) {
      alert('Failed to add question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await deleteQuestion(id);
      loadQuestions();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const filtered = questions.filter(q => {
    const matchSearch = q.text.toLowerCase().includes(search.toLowerCase()) || 
                      q.category.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || q.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
            <Database size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Question Bank</h1>
            <p style={{ color: '#64748B', fontSize: 14 }}>Manage and curate your interview question library.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '10px 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}
        >
          <Plus size={18} /> Add Question
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            type="text" 
            placeholder="Search questions or categories..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 14 }}
          />
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '0 16px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', background: 'white', fontSize: 14, cursor: 'pointer' }}
        >
          <option value="all">All Types</option>
          <option value="mcq">MCQ / Written</option>
          <option value="voice">Voice / Spoken</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', background: '#F8FAFC', borderRadius: 24, border: '1px dashed #E2E8F0' }}>
            <Database size={48} style={{ margin: '0 auto 16px', color: '#CBD5E1' }} />
            <p style={{ fontWeight: 600, color: '#64748B' }}>No questions found.</p>
            <p style={{ color: '#94A3B8', fontSize: 14 }}>Try adjusting your search or add a new question.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
          {filtered.map((q) => (
            <div key={q._id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                  padding: '4px 8px', borderRadius: 6, 
                  background: q.type === 'mcq' ? '#EEF2FF' : '#ECFDF5', 
                  color: q.type === 'mcq' ? '#4F46E5' : '#059669',
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  {q.type === 'mcq' ? <List size={10} /> : <Mic size={10} />} {q.type}
                </span>
                <button 
                  onClick={() => handleDelete(q._id)}
                  style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 4 }}
                  onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseOut={e => e.currentTarget.style.color = '#CBD5E1'}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', lineHeight: 1.5, margin: 0 }}>{q.text}</p>
              
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>{q.category}</span>
                <span style={{ 
                    fontSize: 12, padding: '2px 8px', borderRadius: 4,
                    color: q.difficulty === 'advanced' ? '#BE123C' : q.difficulty === 'intermediate' ? '#B45309' : '#047857',
                    background: q.difficulty === 'advanced' ? '#FFF1F2' : q.difficulty === 'intermediate' ? '#FFFBEB' : '#F0FDF4'
                }}>{q.difficulty}</span>
              </div>

              {q.type === 'mcq' && q.options && (
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                   <p style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>Options:</p>
                   <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {q.options.map((opt, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <div style={{ width: 6, height: 6, borderRadius: '50%', background: opt === q.correctAnswer ? '#10B981' : '#E2E8F0' }} />
                           {opt}
                        </li>
                      ))}
                   </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && createPortal(
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 540, padding: 0, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
               <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add New Question</h2>
               <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: 4 }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAdd} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
              <div>
                <label className="field-label">Question Text</label>
                <textarea 
                  required 
                  value={newQ.text}
                  onChange={e => setNewQ({...newQ, text: e.target.value})}
                  className="input-soft" 
                  rows={3} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="field-label">Category</label>
                  <input 
                    required 
                    value={newQ.category}
                    onChange={e => setNewQ({...newQ, category: e.target.value})}
                    className="input-soft" 
                  />
                </div>
                <div>
                  <label className="field-label">Difficulty</label>
                  <select 
                    value={newQ.difficulty}
                    onChange={e => setNewQ({...newQ, difficulty: e.target.value})}
                    className="input-soft"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Question Type</label>
                <div style={{ display: 'flex', gap: 12 }}>
                   <button 
                    type="button"
                    onClick={() => setNewQ({...newQ, type: 'mcq'})}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: `2px solid ${newQ.type === 'mcq' ? '#4F46E5' : '#E2E8F0'}`, background: newQ.type === 'mcq' ? '#EEF2FF' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                   >
                     <List size={16} /> MCQ
                   </button>
                   <button 
                    type="button"
                    onClick={() => setNewQ({...newQ, type: 'voice'})}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: `2px solid ${newQ.type === 'voice' ? '#4F46E5' : '#E2E8F0'}`, background: newQ.type === 'voice' ? '#EEF2FF' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                   >
                     <Mic size={16} /> Spoken
                   </button>
                </div>
              </div>

              {newQ.type === 'mcq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px', background: '#F8FAFC', borderRadius: 12 }}>
                   <label className="field-label">Options & Correct Answer</label>
                   {newQ.options.map((opt, i) => (
                     <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input 
                          type="radio" 
                          name="correct" 
                          checked={newQ.correctAnswer === opt && opt !== ''} 
                          onChange={() => setNewQ({...newQ, correctAnswer: opt})}
                          disabled={opt === ''}
                        />
                        <input 
                          required
                          placeholder={`Option ${i+1}`}
                          value={opt}
                          onChange={e => {
                            const copy = [...newQ.options];
                            copy[i] = e.target.value;
                            setNewQ({...newQ, options: copy});
                          }}
                          className="input-soft"
                        />
                     </div>
                   ))}
                   <p style={{ fontSize: 11, color: '#94A3B8' }}>Select the radio button next to the correct answer.</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                 <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                 <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? <Loader2 size={18} className="spin" /> : 'Save Question'}
                 </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
