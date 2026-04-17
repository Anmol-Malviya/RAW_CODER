import { createContext, useContext, useReducer } from 'react';

const AssessmentContext = createContext(null);

const initialState = {
  sessionId: null,
  jobRole: '',
  questions: [],
  rawQuestions: [],
  currentQuestion: 0,
  answers: {},
  score: null,
  tabSwitchCount: 0,
  status: 'idle', // idle | loading | ready | active | completed
  resumeSnippet: '',
};

function assessmentReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, status: 'loading' };
    case 'SET_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        questions: action.payload.questions,
        rawQuestions: action.payload.rawQuestions || [],
        jobRole: action.payload.jobRole,
        resumeSnippet: action.payload.resumeSnippet || '',
        status: 'ready',
      };
    case 'INITIALIZE':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        questions: action.payload.questions,
        rawQuestions: action.payload.rawQuestions || [],
        jobRole: action.payload.jobRole || '',
        resumeSnippet: action.payload.resumeSnippet || '',
        status: 'active',
        currentQuestion: 0,
        answers: {},
      };
    case 'START_ASSESSMENT':
      return { ...state, status: 'active', currentQuestion: 0 };
    case 'SELECT_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answer,
        },
      };
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestion: Math.min(state.currentQuestion + 1, state.questions.length - 1),
      };
    case 'PREV_QUESTION':
      return {
        ...state,
        currentQuestion: Math.max(state.currentQuestion - 1, 0),
      };
    case 'GO_TO_QUESTION':
      return { ...state, currentQuestion: action.payload };
    case 'TAB_SWITCH':
      return { ...state, tabSwitchCount: state.tabSwitchCount + 1 };
    case 'COMPLETE':
      return {
        ...state,
        status: 'completed',
        score: action.payload.score,
        tabSwitchCount: action.payload.tabSwitchCount ?? state.tabSwitchCount,
        questions: action.payload.questions || state.rawQuestions || state.questions,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function AssessmentProvider({ children }) {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}
