import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleAlert,
  Flame,
  ImagePlus,
  LibraryBig,
  Menu,
  MessageCircleQuestion,
  Paperclip,
  PanelLeft,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetDashboardQueryKey,
  getHealthCheckQueryKey,
  useGeneratePracticeQuestion,
  useGetDashboard,
  useHealthCheck,
  useSendChatMessage,
} from '@workspace/api-client-react';
import type {
  ChatHistoryItem,
  DashboardSummary,
  PracticeQuestion,
  PracticeQuestionInput,
} from '@workspace/api-client-react';
import 'katex/dist/katex.min.css';

type ChatMessage = ChatHistoryItem;

function TutorRichText({ content }: { content: string }) {
  return (
    <div className="g-richtext">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

const initialMessages: ChatMessage[] = [
  {
    role: 'assistant',
    content: 'I’m here for the part that feels stuck. Bring me a question, a screenshot, or just the step where the logic gets fuzzy.',
  },
];

function BrandMark() {
  return (
    <div className="g-mark" aria-hidden="true">
      <BrainCircuit size={18} strokeWidth={2.2} />
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <aside className={`g-sidebar ${open ? 'g-sidebar-open' : ''}`} data-testid="navigation-sidebar">
      <div className="g-brand">
        <BrandMark />
        <div className="g-brand-name">ganjedi <span>ai</span></div>
        {open && (
          <button className="ml-auto text-[#78988c] md:hidden" onClick={onClose} data-testid="button-close-menu" aria-label="Close navigation">
            <X size={16} />
          </button>
        )}
      </div>
      <div>
        <div className="g-overline mb-3 px-3">Your study room</div>
        <nav className="g-nav" aria-label="Primary navigation">
          <a className="g-nav-link active" href="#overview" data-testid="link-overview">
            <PanelLeft size={15} /><span>Overview</span>
          </a>
          <a className="g-nav-link" href="#practice" data-testid="link-practice">
            <Target size={15} /><span>Practice lab</span>
          </a>
          <a className="g-nav-link" href="#tutor" data-testid="link-tutor">
            <MessageCircleQuestion size={15} /><span>Doubt solver</span>
          </a>
        </nav>
      </div>
      <div className="g-sidebar-bottom">
        <div className="g-session" data-testid="card-study-session">
          <div className="flex items-center justify-between">
            <span className="g-overline">Today’s focus</span>
            <Zap size={14} color="#86efbe" />
          </div>
          <strong>One clear step at a time.</strong>
          <p>Build the habit that turns hard questions into familiar ones.</p>
          <div className="g-session-line" aria-label="Study session progress" />
        </div>
        <div className="mt-4 flex items-center gap-2 px-3 text-[10px] text-[#5e7c70]" data-testid="text-app-version">
          <span className="h-1.5 w-1.5 rounded-full bg-[#86efbe]" /> Digital SAT workspace
        </div>
      </div>
    </aside>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon,
  highlight,
  trend,
  testId,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: ReactNode;
  highlight?: boolean;
  trend?: string;
  testId: string;
}) {
  return (
    <div className={`g-card g-metric ${highlight ? 'g-metric-highlight' : ''}`} data-testid={testId}>
      <div className="g-metric-title"><span>{label}</span>{icon}</div>
      <div className="g-metric-value">{value}{suffix && <small>{suffix}</small>}</div>
      {trend && <div className="g-metric-trend"><b>+{trend}</b> this week</div>}
    </div>
  );
}

function Metrics({ data, loading }: { data?: DashboardSummary; loading: boolean }) {
  if (loading) {
    return (
      <div className="g-metrics" data-testid="dashboard-loading">
        {[1, 2, 3, 4].map((item) => <div className="g-card g-metric" key={item}><div className="g-skeleton g-loading-block w-2/3" /><div className="g-skeleton g-loading-block mt-5 w-1/2" /></div>)}
      </div>
    );
  }
  return (
    <div className="g-metrics">
      <MetricCard label="Current streak" value={data?.streakDays ?? 0} suffix=" days" icon={<Flame size={15} />} highlight trend="2" testId="metric-streak" />
      <MetricCard label="Questions solved" value={data?.questionsSolved ?? 0} icon={<Check size={15} />} trend="14" testId="metric-questions" />
      <MetricCard label="Accuracy" value={data?.accuracy ?? 0} suffix="%" icon={<BarChart3 size={15} />} trend="3.8%" testId="metric-accuracy" />
      <MetricCard label="Focus time" value={data?.focusMinutes ?? 0} suffix=" min" icon={<TimerReset size={15} />} trend="18 min" testId="metric-focus" />
    </div>
  );
}

function PracticeLab() {
  const [subject, setSubject] = useState<PracticeQuestionInput['subject']>('math');
  const [module, setModule] = useState<PracticeQuestionInput['module']>('module-2-hard');
  const [skill, setSkill] = useState<PracticeQuestionInput['skill']>('heart-of-algebra');
  const [difficulty, setDifficulty] = useState<PracticeQuestionInput['difficulty']>('hard');
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const practice = useGeneratePracticeQuestion();

  const generate = () => {
    setSelected(null);
    setQuestion(null);
    practice.mutate({
      data: { subject, module, skill, difficulty },
    }, {
      onSuccess: (result) => setQuestion(result),
    });
  };

  return (
    <section className="g-card g-panel" id="practice" data-testid="section-practice">
      <div className="g-panel-heading">
        <div>
          <div className="g-kicker">Adaptive practice</div>
          <h2 className="mt-2">Make the next question count.</h2>
          <p>Choose a lane. I’ll meet you at the edge of your ability.</p>
        </div>
        <Sparkles size={17} color="#86efbe" />
      </div>
      <div className="g-form-grid">
        <div>
          <label className="g-field-label" htmlFor="practice-subject">Subject</label>
          <select id="practice-subject" className="g-select" value={subject} onChange={(event) => setSubject(event.target.value as PracticeQuestionInput['subject'])} data-testid="select-practice-subject">
            <option value="math">Math</option>
            <option value="reading-writing">Reading &amp; Writing</option>
          </select>
        </div>
        <div>
          <label className="g-field-label" htmlFor="practice-module">Module</label>
          <select id="practice-module" className="g-select" value={module} onChange={(event) => setModule(event.target.value as PracticeQuestionInput['module'])} data-testid="select-practice-module">
            <option value="module-1">Module 1</option>
            <option value="module-2-easy">Module 2 · easier</option>
            <option value="module-2-hard">Module 2 · harder</option>
          </select>
        </div>
        <div>
          <label className="g-field-label" htmlFor="practice-skill">Skill</label>
          <select id="practice-skill" className="g-select" value={skill} onChange={(event) => setSkill(event.target.value as PracticeQuestionInput['skill'])} data-testid="select-practice-skill">
            <option value="heart-of-algebra">Heart of Algebra</option>
            <option value="problem-solving-data-analysis">Problem Solving &amp; Data Analysis</option>
            <option value="command-of-evidence">Command of Evidence</option>
            <option value="craft-and-structure">Craft &amp; Structure</option>
          </select>
        </div>
        <div>
          <label className="g-field-label" htmlFor="practice-difficulty">Difficulty</label>
          <select id="practice-difficulty" className="g-select" value={difficulty} onChange={(event) => setDifficulty(event.target.value as PracticeQuestionInput['difficulty'])} data-testid="select-practice-difficulty">
            <option value="easy">Warm-up</option>
            <option value="standard">Standard</option>
            <option value="hard">Stretch</option>
          </select>
        </div>
      </div>
      <button className="g-action g-form-action" onClick={generate} disabled={practice.isPending} data-testid="button-generate-practice">
        {practice.isPending ? <><RefreshCw size={14} className="animate-spin" /> Building your question</> : <><Sparkles size={14} /> Generate a question <ChevronRight size={14} /></>}
      </button>
      {practice.isError && (
        <div className="g-error" data-testid="status-practice-error">
          <span><CircleAlert size={13} className="mr-1 inline" /> Couldn’t build that question right now.</span>
          <button onClick={generate} data-testid="button-retry-practice">Retry</button>
        </div>
      )}
      {practice.isPending && <div className="g-question" data-testid="practice-loading"><div className="g-skeleton g-loading-block w-1/3" /><div className="g-skeleton g-loading-block mt-5 w-full" /><div className="g-skeleton g-loading-block mt-3 w-4/5" /></div>}
      {question && (
        <div className="g-question" data-testid={`practice-question-${question.id}`}>
          <div className="g-question-meta"><span className="g-pill">{question.subject === 'math' ? 'Math' : 'Reading & Writing'}</span><span className="g-pill">{question.skill}</span><span className="g-pill">{question.difficulty}</span></div>
          <p className="g-question-text" data-testid="text-practice-question">{question.question}</p>
          <div className="g-options">
            {question.options.map((option) => {
              const isCorrect = option.label === question.correctAnswer;
              const isWrong = selected === option.label && !isCorrect;
              return (
                <button
                  className={`g-option ${selected === option.label ? 'selected' : ''} ${selected ? (isCorrect ? 'correct' : isWrong ? 'wrong' : '') : ''}`}
                  key={option.label}
                  onClick={() => setSelected(option.label)}
                  data-testid={`button-option-${option.label}`}
                >
                  <span className="g-option-label">{option.label}</span><span>{option.text}</span>
                  {selected && isCorrect && <Check size={13} className="ml-auto" />}
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="g-explanation" data-testid="practice-explanation">
              <strong>{selected === question.correctAnswer ? 'That’s it.' : 'Not quite — keep the idea.'}</strong>
              <TutorRichText content={question.explanation} />
              <div className="g-strategy"><span className="text-[#86efbe]">Strategy: </span>{question.strategy}</div>
            </div>
          )}
        </div>
      )}
      {!practice.isPending && !question && !practice.isError && (
        <div className="g-empty" data-testid="practice-empty"><LibraryBig size={22} className="mb-2 text-[#72ad91]" /><span>Your next focused rep is one click away.</span></div>
      )}
    </section>
  );
}

function ActivityPanel({ data, loading }: { data?: DashboardSummary; loading: boolean }) {
  return (
    <section className="g-card g-panel" data-testid="section-activity">
      <div className="g-panel-heading">
        <div><div className="g-kicker">Your trail</div><h2 className="mt-2">Recent activity</h2><p>Small wins, stacked deliberately.</p></div>
        <Activity size={17} color="#86efbe" />
      </div>
      {loading ? <div className="space-y-4" data-testid="activity-loading">{[1, 2, 3].map((item) => <div className="flex gap-3" key={item}><div className="g-skeleton h-7 w-7 rounded-lg" /><div className="flex-1"><div className="g-skeleton g-loading-block w-4/5" /><div className="g-skeleton mt-2 h-2 w-1/2 rounded" /></div></div>)}</div> : data?.recentActivity?.length ? (
        <div className="g-activity-list">
          {data.recentActivity.map((item, index) => (
            <div className="g-activity" key={`${item.title}-${index}`} data-testid={`activity-item-${index}`}>
              <div className={`g-activity-icon ${item.tone}`}><BookOpen size={13} /></div>
              <div><div className="g-activity-title">{item.title}</div><div className="g-activity-meta">{item.meta}</div></div>
              <div className="g-activity-score">{item.score} pts</div>
            </div>
          ))}
        </div>
      ) : <div className="g-empty" data-testid="activity-empty">Your solved questions will land here.</div>}
    </section>
  );
}

function TutorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState<'math' | 'reading-writing'>('math');
  const [module, setModule] = useState<'module-1' | 'module-2-easy' | 'module-2-hard'>('module-2-hard');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [streamReply, setStreamReply] = useState<string | null>(null);
  const [streamText, setStreamText] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const chat = useSendChatMessage();

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  useEffect(() => {
    if (streamReply === null) return;
    let index = 0;
    setStreamText('');
    const timer = window.setInterval(() => {
      index += 2;
      setStreamText(streamReply.slice(0, index));
      if (index >= streamReply.length) {
        window.clearInterval(timer);
        setMessages((current) => [...current, { role: 'assistant', content: streamReply }]);
        setStreamReply(null);
      }
    }, 17);
    return () => window.clearInterval(timer);
  }, [streamReply]);

  const readImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setAttachment(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      setImageBase64(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.readAsDataURL(file);
  };
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readImage(file);
    event.target.value = '';
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) readImage(file);
  };
  const submit = () => {
    const trimmed = message.trim();
    if (!trimmed && !imageBase64) return;
    const userContent = trimmed || 'Can you walk me through this screenshot?';
    const history = messages.map((item) => ({ role: item.role, content: item.content }));
    setMessages((current) => [...current, { role: 'user', content: userContent }]);
    setMessage('');
    chat.mutate({
      data: {
        message: userContent,
        subject,
        module,
        history,
        imageBase64,
        imageMimeType: attachment?.type ?? null,
      },
    }, {
      onSuccess: (response) => {
        setStreamReply(response.reply);
        setAttachment(null);
        setImageBase64(null);
      },
    });
  };

  return (
    <section className="g-card g-panel g-chat-panel" id="tutor" data-testid="section-tutor">
      <div className="g-panel-heading">
        <div><div className="g-kicker">Doubt solver</div><h2 className="mt-2">Talk it through.</h2><p>No judgment. Just the next useful step.</p></div>
        <div className="g-avatar" aria-label="Ganjedi tutor avatar">G</div>
      </div>
      <div className="g-chat-messages" aria-live="polite" data-testid="chat-messages">
        {messages.map((item, index) => (
          <div className={`g-chat-message ${item.role}`} key={`${item.role}-${index}`} data-testid={`chat-message-${index}`}>
            <div className="g-chat-avatar">{item.role === 'assistant' ? 'G' : 'Y'}</div>
            <div><div className="g-chat-label">{item.role === 'assistant' ? 'GANJEDI AI' : 'YOU'}</div><div className="g-chat-bubble">{item.role === 'assistant' ? <TutorRichText content={item.content} /> : item.content}</div></div>
          </div>
        ))}
        {chat.isPending && <div className="g-chat-message" data-testid="chat-loading"><div className="g-chat-avatar">G</div><div><div className="g-chat-label">GANJEDI AI</div><div className="g-chat-bubble"><span className="g-typing"><i /><i /><i /></span></div></div></div>}
        {streamReply !== null && !chat.isPending && <div className="g-chat-message" data-testid="chat-streaming"><div className="g-chat-avatar">G</div><div><div className="g-chat-label">GANJEDI AI · THINKING OUT LOUD</div><div className="g-chat-bubble">{streamText}<span className="ml-1 inline-block h-3 w-px animate-pulse bg-[#86efbe]" /></div></div></div>}
        <div ref={messagesEnd} />
      </div>
      {chat.isError && <div className="g-error" data-testid="status-chat-error"><span><CircleAlert size={13} className="mr-1 inline" /> I couldn’t reach the tutor.</span><button onClick={submit} data-testid="button-retry-chat">Retry</button></div>}
      <div className="mt-3" onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <div className="g-chat-input-wrap">
          <textarea className="g-textarea" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder="Ask about a step, not just an answer…" data-testid="input-chat-message" />
        </div>
        {attachment && <div className="g-attachment-preview" data-testid="attachment-preview"><ImagePlus size={13} /><span>{attachment.name}</span><button className="g-remove" onClick={() => { setAttachment(null); setImageBase64(null); }} data-testid="button-remove-attachment" aria-label="Remove attachment"><Trash2 size={13} /></button></div>}
        <div className="g-chat-tools">
          <div className="g-chat-context">
            <select className="g-mini-select" value={subject} onChange={(event) => setSubject(event.target.value as typeof subject)} data-testid="select-chat-subject" aria-label="Chat subject"><option value="math">Math</option><option value="reading-writing">Reading &amp; Writing</option></select>
            <select className="g-mini-select" value={module} onChange={(event) => setModule(event.target.value as typeof module)} data-testid="select-chat-module" aria-label="Chat module"><option value="module-1">Module 1</option><option value="module-2-easy">Module 2 · easier</option><option value="module-2-hard">Module 2 · harder</option></select>
          </div>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFileChange} data-testid="input-image-file" />
          <button className={`g-attach ${dragging ? 'dragging' : ''}`} onClick={() => fileInput.current?.click()} data-testid="button-attach-image"><Paperclip size={13} /> {dragging ? 'Drop image' : 'Attach'}</button>
          <button className="g-send" onClick={submit} disabled={chat.isPending || (!message.trim() && !imageBase64)} data-testid="button-send-chat" aria-label="Send message"><Send size={14} /></button>
        </div>
      </div>
    </section>
  );
}

export function GanjediDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dashboardQuery = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const healthQuery = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });
  const today = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()), []);

  return (
    <div className="g-app" id="overview">
      <div className="g-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        {menuOpen && <button className="fixed inset-0 z-30 bg-[#06130f]/70 md:hidden" onClick={() => setMenuOpen(false)} aria-label="Close navigation overlay" data-testid="button-menu-overlay" />}
        <main className="g-main">
          <div className="g-topbar">
            <button className="g-mobile-menu" onClick={() => setMenuOpen(true)} data-testid="button-open-menu" aria-label="Open navigation"><Menu size={16} /></button>
            <div className="g-status" data-testid="status-health">
              <span className={`g-status-dot ${healthQuery.isError ? 'off' : ''}`} />
              {healthQuery.isLoading ? 'CONNECTING TO TUTOR' : healthQuery.isError ? 'TUTOR OFFLINE' : `TUTOR ${healthQuery.data?.status?.toUpperCase() ?? 'READY'}`}
            </div>
            <div className="g-profile"><span>Good study, A.</span><div className="g-avatar" data-testid="avatar-user">AR</div></div>
          </div>
          <div className="g-content">
            <header className="g-hero">
              <div>
                <div className="g-overline">Focused preparation / 01</div>
                <h1>Make hard questions feel <em>solvable.</em></h1>
                <p className="g-hero-copy">Your calm corner for Digital SAT Math and Reading &amp; Writing. Start with the move that makes everything after it easier.</p>
              </div>
              <div className="g-date" data-testid="text-today">{today.toUpperCase()}</div>
            </header>
            {dashboardQuery.isError && <div className="g-error mb-4" data-testid="status-dashboard-error"><span><CircleAlert size={13} className="mr-1 inline" /> Dashboard metrics are taking a breather.</span><button onClick={() => dashboardQuery.refetch()} data-testid="button-retry-dashboard">Retry</button></div>}
            <Metrics data={dashboardQuery.data} loading={dashboardQuery.isLoading} />
            <div className="g-grid">
              <PracticeLab />
              <ActivityPanel data={dashboardQuery.data} loading={dashboardQuery.isLoading} />
              <TutorChat />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}