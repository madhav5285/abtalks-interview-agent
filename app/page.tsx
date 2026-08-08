'use client';
import { useState } from 'react';

export default function InterviewDashboard() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; day?: number }>>([
    {
      role: 'assistant',
      content: "Welcome Madhav! Let's kick off with Day 5. When enforcing structured outputs in production, how do you handle cases where an LLM returns unexpected keys outside your defined JSON schema?",
      day: 5
    }
  ]);
  const [input, setInput] = useState('');
  const [turn, setTurn] = useState(1);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user' as const, content: input };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: 'cand-001', history: updatedHistory })
      });
      const data = await res.json();

      if (data.status === 'COMPLETED') {
        setEvaluation(data.evaluation);
      } else {
        setMessages([
          ...updatedHistory,
          { role: 'assistant', content: data.question, day: data.dayCovered }
        ]);
        setTurn(data.turnCount);
      }
    } catch (e) {
      console.error("Error communicating with interview engine:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar: Candidate Profile & Interview Progress */}
      <aside className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-blue-400">AI Interview Agent</h1>
          <p className="text-xs text-slate-400 mt-1">ABTalks AI Engineering Cohort</p>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate Profile</h2>
          <p className="text-base font-semibold mt-1 text-white">Madhav Sharma</p>
          <span className="inline-block mt-2 text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-mono border border-blue-500/20">
            Target Role: AI Product Engineer
          </span>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interview Status</h3>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-300">Question Progress</span>
            <span className="text-sm font-bold text-emerald-400">{Math.min(turn, 8)} / 8</span>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${(Math.min(turn, 8) / 8) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-auto bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">Contract Compliance:</p>
          <p>✓ Multi-turn Adaptive Logic</p>
          <p>✓ Minimum 8 Turns Preserved</p>
          <p>✓ Spans ≥4 Curriculum Days</p>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-300">Live Technical Assessment</span>
          <span className="text-xs text-slate-500 font-mono">POST /api/interview</span>
        </header>

        {evaluation ? (
          /* Final Evaluation Scorecard View */
          <div className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto w-full">
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Technical Assessment Scorecard</h2>
                  <p className="text-sm text-slate-400 mt-1">Structured Assessment Completed</p>
                </div>
                <div className="text-center bg-emerald-500/10 border border-emerald-500/30 px-6 py-3 rounded-xl">
                  <span className="text-3xl font-extrabold text-emerald-400">{evaluation.overallScore}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">/ 100</span>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Summary Feedback</h3>
                  <p className="text-slate-300 text-sm bg-slate-800/40 p-4 rounded-lg border border-slate-800">{evaluation.summary}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-emerald-400 mb-2">Key Strengths</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                    {evaluation.strengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">Areas for Growth</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                    {evaluation.areasForImprovement.map((a: string, i: number) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                  <span>Coverage: {evaluation.curriculumCoverage}</span>
                  <span>Evaluated via Standardized API Engine</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Live Chat View */
          <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.day && (
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded mb-1 border border-blue-500/20">
                    Curriculum Day {m.day}
                  </span>
                )}
                <div
                  className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {!evaluation && (
          <footer className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your technical answer..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Send'}
              </button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}