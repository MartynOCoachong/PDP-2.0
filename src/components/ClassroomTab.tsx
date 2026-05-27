/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Video, Award, CheckCircle, ArrowRight, HelpCircle, GraduationCap, Calendar, Send } from 'lucide-react';
import { EducationalModule, ModuleCompletion, UserProfile, Assignment } from '../types';

interface ClassroomTabProps {
  modules: EducationalModule[];
  completions: ModuleCompletion[];
  onCompleteModule: (moduleId: string, quizScore?: { score: number; total: number }) => void;
  currentProfile?: UserProfile;
  onAddAssignment?: (assignment: Omit<Assignment, 'id' | 'completedByPlayerIds'>) => void;
  assignments?: Assignment[];
}

export default function ClassroomTab({ modules, completions, onCompleteModule, currentProfile, onAddAssignment, assignments }: ClassroomTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModule, setActiveModule] = useState<EducationalModule | null>(null);
  
  // Ref for smooth scrolling to content viewer
  const detailsRef = useRef<HTMLDivElement>(null);
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);

  // Coach / Player Assignment State
  const [dueDate, setDueDate] = useState('2026-05-26');
  const [customTitle, setCustomTitle] = useState('');
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Smoothly scroll active module panel into view on mobile/desktop selection
  useEffect(() => {
    if (activeModule && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeModule?.id]);

  const categories = ['All', 'Nutrition & Cooking', 'Strength & Conditioning', 'Mental Health', 'Stretching & Yoga', 'Injury Prevention'];

  const filteredModules = selectedCategory === 'All' 
    ? modules 
    : modules.filter(m => m.category === selectedCategory);

  const isCompleted = (moduleId: string) => {
    return completions.some(c => c.moduleId === moduleId);
  };

  const getCompletionDetails = (moduleId: string) => {
    return completions.find(c => c.moduleId === moduleId);
  };

  const isAssigned = (moduleId: string) => {
    if (currentProfile?.role !== 'player') return false;
    return assignments?.some(a => a.type === 'module' && a.moduleId === moduleId) || false;
  };

  const getAssignmentInfo = (moduleId: string) => {
    return assignments?.find(a => a.type === 'module' && a.moduleId === moduleId);
  };

  const pendingRequiredList = modules.filter(m => isAssigned(m.id) && !isCompleted(m.id));

  const handleSelectModule = (mod: EducationalModule) => {
    setActiveModule(mod);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setCustomTitle(`Required Session: ${mod.title}`);
    setAssignSuccess(false);
  };

  const selectQuizAnswer = (qId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const submitQuiz = () => {
    if (!activeModule || !activeModule.quizQuestions) return;
    
    let scored = 0;
    const questions = activeModule.quizQuestions;
    
    questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswerIndex) {
        scored++;
      }
    });

    const finalScore = { score: scored, total: questions.length };
    setQuizScore(finalScore);
    setQuizSubmitted(true);
    
    // Auto-save completion
    onCompleteModule(activeModule.id, finalScore);
  };

  const completeStandardModule = () => {
    if (!activeModule) return;
    onCompleteModule(activeModule.id);
    // Go back or state update
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative">
          <span className="p-1 px-2.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-mono font-medium">
            LEARNING ACADEMY
          </span>
          <h1 className="text-2xl font-sans font-bold text-slate-100 mt-2">Classroom Sessions</h1>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 mt-6">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (activeModule && activeModule.category !== cat && cat !== 'All') {
                    setActiveModule(null);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-medium font-sans border transition ${
                  isSelected
                    ? `bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 active-tab`
                    : 'bg-slate-950/60 border-slate-800 text-slate-350 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {pendingRequiredList.length > 0 && (
        <div className="bg-[#00bbff]/5 border border-[#00bbff]/30 p-4 rounded-2xl flex items-start gap-3 relative overflow-hidden animate-pulse shadow-[0_0_15px_rgba(0,187,255,0.15)]">
          <div className="p-2 rounded-lg bg-[#00bbff]/10 text-[#00bbff]">
            <Award className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <h4 className="text-sm font-sans font-bold text-slate-100 flex items-center gap-1.5">
              <span>Required Training Session Pending</span>
              <span className="h-2 w-2 rounded-full bg-[#00bbff] inline-block" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Your coach has assigned <span className="text-[#00bbff] font-bold">"{pendingRequiredList[0].title}"</span> as a mandatory session. Please select and complete the module below to update your Academy performance metrics.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Module List panel */}
        <div id="classroom-modules-list" className={`space-y-3 ${activeModule ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono text-slate-400">Available Modules ({filteredModules.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
            {filteredModules.map((mod) => {
              const comp = getCompletionDetails(mod.id);
              const assigned = isAssigned(mod.id);
              const isComp = !!comp;
              return (
                <div
                  key={mod.id}
                  onClick={() => handleSelectModule(mod)}
                  className={`p-4 rounded-xl border transition cursor-pointer text-left relative flex flex-col justify-between ${
                    activeModule?.id === mod.id
                      ? assigned && !isComp
                        ? 'bg-indigo-500/15 border-[#00bbff] shadow-[0_0_15px_rgba(0,187,255,0.35)] font-bold'
                        : 'bg-indigo-500/10 border-indigo-500 shadow-indigo-500/5'
                      : assigned && !isComp
                        ? 'bg-slate-900 border-[#00bbff] shadow-[0_0_12px_rgba(0,187,255,0.25)] hover:shadow-[0_0_18px_rgba(0,187,255,0.4)] hover:border-[#00bbff] animate-[pulse_3s_infinite]'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                        mod.category === 'Nutrition & Cooking' ? 'bg-amber-500/10 text-amber-400' :
                        mod.category === 'Strength & Conditioning' ? 'bg-rose-500/10 text-rose-400' :
                        mod.category === 'Mental Health' ? 'bg-sky-500/10 text-sky-400' :
                        mod.category === 'Stretching & Yoga' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-violet-500/10 text-violet-400'
                      }`}>
                        {mod.category}
                      </span>
                      {assigned && !isComp ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#00bbff]/10 text-[#00bbff] border border-[#00bbff]/30 animate-pulse uppercase">
                          Required
                        </span>
                      ) : assigned && isComp ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-750 uppercase">
                          Required (Done)
                        </span>
                      ) : isComp ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Done
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-sans font-semibold text-slate-200 mt-2.5 text-sm line-clamp-2">
                      {mod.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      {mod.type === 'youtube' ? <Video className="w-3 h-3 text-red-400" /> : <BookOpen className="w-3 h-3 text-indigo-400" />}
                      {mod.type.toUpperCase()}
                    </span>
                    <span>{mod.durationMinutes} mins</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main session content viewer */}
        {activeModule ? (
          <div ref={detailsRef} id="classroom-module-details" className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 scroll-mt-24 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
              <div>
                <span className="text-xs text-indigo-400 font-mono font-bold tracking-wider">{activeModule.category}</span>
                <h2 className="text-lg font-sans font-bold text-slate-100 mt-1">{activeModule.title}</h2>
              </div>
              <button
                onClick={() => setActiveModule(null)}
                className="self-start sm:self-center text-slate-400 hover:text-slate-200 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 transition"
              >
                Close View
              </button>
            </div>

            {currentProfile?.role === 'coach' && (
              <div className="bg-indigo-950/20 border border-indigo-500/20 p-5 rounded-xl space-y-4 relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-sans font-bold text-slate-100">Coach Dispatch Controls</h3>
                    <p className="text-[11px] text-slate-400">Select options below to dispatch this learning session as a required module in players' dashboard.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5 uppercase">Assignment Roster Title</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      placeholder="e.g. Mandatory Nutrition Build Video"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5 uppercase">Submission Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-4">
                  <button
                    onClick={() => {
                      if (!onAddAssignment) return;
                      onAddAssignment({
                        coachId: currentProfile.coachId || currentProfile.id || 'coach-system',
                        teamId: currentProfile.teamId || '',
                        type: 'module',
                        title: customTitle || `Required Session: ${activeModule.title}`,
                        dueDate: dueDate,
                        moduleId: activeModule.id
                      });
                      setAssignSuccess(true);
                      setTimeout(() => setAssignSuccess(false), 4000);
                    }}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/10"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit to Players' Schedule
                  </button>
                </div>

                {assignSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 animate-bounce" />
                    <span>Learning assignment dispatched successfully! Connected roster players can now review and complete this session under their logs.</span>
                  </div>
                )}
              </div>
            )}

            {/* Renderer based on Module Type */}
            {activeModule.type === 'youtube' ? (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <iframe
                    src={activeModule.content}
                    title={activeModule.title}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                  <h4 className="text-xs font-semibold text-slate-300 font-mono mb-1">COACHING OUTLINES</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Watch this routine and mimic the positions securely in your training environment. Consistent daily practice creates elastic resistance.
                  </p>
                </div>
              </div>
            ) : activeModule.type === 'quiz' ? (
              <div className="space-y-6">
                <div className="p-4 bg-indigo-950/20 border border-indigo-500/25 rounded-xl flex gap-3 items-start">
                  <GraduationCap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-0.5">Interactive Validation Quiz</h3>
                    <p className="text-xs text-indigo-300/80 leading-relaxed">
                      Complete this quiz to demonstrate comprehension of the active module.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {activeModule.quizQuestions?.map((q, idx) => {
                    const answered = quizAnswers[q.id] !== undefined;
                    const isCorrect = quizAnswers[q.id] === q.correctAnswerIndex;
                    return (
                      <div key={q.id} className="p-5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
                        <div className="flex gap-2.5 items-start">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-850 text-indigo-300">
                            Q{idx + 1}
                          </span>
                          <h4 className="text-sm font-medium text-slate-200 leading-relaxed">
                            {q.question}
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 pt-2">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = quizAnswers[q.id] === oIdx;
                            let optionStyles = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850';
                            
                            if (quizSubmitted) {
                              if (oIdx === q.correctAnswerIndex) {
                                optionStyles = 'bg-emerald-500/10 border-emerald-500 text-emerald-400';
                              } else if (isSelected && !isCorrect) {
                                optionStyles = 'bg-rose-500/10 border-rose-500 text-rose-400';
                              } else {
                                optionStyles = 'bg-slate-950/40 border-slate-900 text-slate-500 cursor-not-allowed';
                              }
                            } else if (isSelected) {
                              optionStyles = 'bg-indigo-500/20 border-indigo-400 text-indigo-200 font-medium';
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={quizSubmitted}
                                onClick={() => selectQuizAnswer(q.id, oIdx)}
                                className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between ${optionStyles}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && oIdx === q.correctAnswerIndex && (
                                  <span className="text-[10px] font-mono font-semibold text-emerald-400 px-1.5 py-0.5 bg-emerald-500/5 rounded border border-emerald-500/20">CORRECT ANSWER</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length !== (activeModule.quizQuestions?.length || 0)}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold p-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                  >
                    Submit Quiz & Log Progress
                  </button>
                ) : (
                  <div className="p-5 bg-slate-950 border border-emerald-500/20 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-semibold text-slate-200">Results Recorded!</span>
                      </div>
                      <div className="text-base font-mono font-bold text-emerald-400">
                        Score: {quizScore?.score} / {quizScore?.total}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Great effort! Your performance results have been synced safely down to your development reports and your training coach will be updated.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Document / Markdown or printable Article text rendering
              <div className="space-y-6">
                <div className="prose prose-invert max-w-full text-slate-300 text-sm leading-relaxed space-y-4 font-sans bg-slate-950/60 p-6 rounded-xl border border-slate-850">
                  {activeModule.content.split('\n\n').map((para, pIdx) => {
                    if (para.trim().startsWith('#')) {
                      // Simple match header
                      const cleanHeader = para.replace(/#/g, '').trim();
                      return <h3 key={pIdx} className="text-lg font-bold text-indigo-300 font-sans border-b border-slate-800 pb-1 mt-4">{cleanHeader}</h3>;
                    }
                    if (para.trim().startsWith('-')) {
                      // List render
                      return (
                        <ul key={pIdx} className="list-disc pl-5 space-y-1.5 text-xs text-slate-400 font-mono">
                          {para.split('\n').map((li, lIdx) => (
                            <li key={lIdx}>{li.replace(/^-/, '').trim()}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={pIdx} className="whitespace-pre-line leading-relaxed">{para}</p>;
                  })}
                </div>

                {!isCompleted(activeModule.id) ? (
                  <button
                    onClick={completeStandardModule}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold p-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    Mark Module Complete
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5 justify-center">
                    <CheckCircle className="w-4 h-4" />
                    You completed this learning session on {getCompletionDetails(activeModule.id)?.dateCompleted}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
            <div className="p-4 rounded-full bg-slate-950 border border-slate-800 text-indigo-400">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No Active Classroom Selection</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Select one of the educational cards on the left panel to begin reviewing and testing learning progress.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
