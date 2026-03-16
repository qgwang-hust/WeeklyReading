/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  FileText, 
  Users, 
  Bell, 
  Plus, 
  MessageSquare, 
  Download, 
  Tag, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  Search,
  BookOpen,
  UserPlus,
  Mail,
  Phone,
  Hash,
  Trash2,
  Edit,
  GraduationCap,
  AlertCircle,
  User,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface User {
  id: number;
  name: string;
  student_id: string;
  role: 'student' | 'supervisor';
  email?: string;
  phone?: string;
}

interface Paper {
  id: number;
  title: string;
  abstract: string;
  pdf_url: string;
  slides_url: string;
  tags: string;
  author_name: string;
  meeting_date: string;
  publisher_email: string;
  conference: string;
  created_at: string;
  comments?: Comment[];
}

interface Comment {
  id: number;
  user_name: string;
  content: string;
  created_at: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  is_read: number;
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-academic-navy text-white hover:bg-academic-navy/90 shadow-md',
      secondary: 'bg-white text-academic-navy border border-academic-navy/20 hover:bg-academic-paper shadow-sm',
      ghost: 'bg-transparent text-academic-slate hover:bg-academic-navy/5',
      danger: 'bg-academic-crimson text-white hover:bg-academic-crimson/90 shadow-sm',
      gold: 'bg-academic-gold text-white hover:bg-academic-gold/90 shadow-md',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'px-6 py-3 rounded-lg font-medium transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full px-5 py-3 rounded-lg border border-academic-navy/10 focus:outline-none focus:ring-2 focus:ring-academic-navy/5 focus:border-academic-navy transition-all bg-white placeholder:text-academic-ink/30',
      className
    )}
    {...props}
  />
));

const Card = ({ children, className, onClick, ...props }: any) => (
  <div 
    className={cn('bg-white border border-academic-navy/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300', className)}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  variant = "danger"
}: { 
  isOpen: boolean, 
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel: () => void,
  confirmText?: string,
  cancelText?: string,
  variant?: 'primary' | 'danger'
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-academic-navy/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-academic-navy/10"
      >
        <div className="p-8">
          <h3 className="text-2xl font-serif font-bold text-academic-ink mb-4">{title}</h3>
          <p className="text-academic-ink/60 leading-relaxed">{message}</p>
        </div>
        <div className="bg-academic-paper p-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} className="h-12 px-6">
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} className="h-12 px-6">
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Pages ---

const EditPaper = ({ paper, token, onSuccess, onCancel }: { paper: Paper, token: string, onSuccess: () => void, onCancel: () => void }) => {
  const [title, setTitle] = useState(paper.title);
  const [abstract, setAbstract] = useState(paper.abstract);
  const [tags, setTags] = useState(paper.tags);
  const [meetingDate, setMeetingDate] = useState(paper.meeting_date);
  const [publisherEmail, setPublisherEmail] = useState(paper.publisher_email);
  const [conference, setConference] = useState(paper.conference || '');
  const [pdf, setPdf] = useState<File | null>(null);
  const [slides, setSlides] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('tags', tags);
    formData.append('meeting_date', meetingDate);
    formData.append('publisher_email', publisherEmail);
    formData.append('conference', conference);
    if (pdf) formData.append('pdf', pdf);
    if (slides) formData.append('slides', slides);

    try {
      const res = await fetch(`/api/papers/${paper.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 border-academic-navy/20">
        <h2 className="text-3xl font-serif font-bold mb-8 text-academic-ink">Edit Research Paper</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-academic-ink/60 mb-2 uppercase tracking-widest ml-1">Paper Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-academic-ink/60 mb-2 uppercase tracking-widest ml-1">Conference/Journal</label>
              <Input value={conference} onChange={e => setConference(e.target.value)} placeholder="e.g. CVPR 2024" />
            </div>
            <div>
              <label className="block text-xs font-bold text-academic-ink/60 mb-2 uppercase tracking-widest ml-1">Meeting Date</label>
              <Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-academic-ink/60 mb-2 uppercase tracking-widest ml-1">Publisher Email</label>
              <Input type="email" value={publisherEmail} onChange={e => setPublisherEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-academic-ink/60 mb-2 uppercase tracking-widest ml-1">Tags (comma separated)</label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="AI, NLP, CV" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-academic-ink/60 mb-2 uppercase tracking-widest ml-1">Abstract</label>
            <textarea 
              className="w-full p-6 rounded-lg border border-academic-navy/10 focus:outline-none focus:ring-4 focus:ring-academic-navy/10 focus:border-academic-navy transition-all min-h-[150px] bg-white/60"
              value={abstract}
              onChange={e => setAbstract(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border-2 border-dashed border-academic-navy/10 rounded-lg bg-academic-navy/5 hover:bg-academic-navy/10 transition-colors">
              <label className="block text-xs font-bold text-academic-ink/60 mb-2 uppercase tracking-widest ml-1">Update PDF (Optional)</label>
              <input type="file" accept=".pdf" onChange={e => setPdf(e.target.files?.[0] || null)} className="text-sm" />
            </div>
            <div className="p-6 border-2 border-dashed border-academic-navy/10 rounded-lg bg-academic-navy/5 hover:bg-academic-navy/10 transition-colors">
              <label className="block text-xs font-bold text-academic-ink/60 mb-2 uppercase tracking-widest ml-1">Update Slides (Optional)</label>
              <input type="file" accept=".pdf,.ppt,.pptx" onChange={e => setSlides(e.target.files?.[0] || null)} className="text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Update Paper'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const EditAnnouncement = ({ announcement, token, onSuccess, onCancel }: { announcement: Announcement, token: string, onSuccess: () => void, onCancel: () => void }) => {
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 border-academic-gold/30">
        <h2 className="text-3xl font-serif font-bold mb-8 text-academic-navy">Edit Announcement</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-academic-navy mb-2 uppercase tracking-widest">Notice Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-bold text-academic-navy mb-2 uppercase tracking-widest">Content</label>
            <textarea 
              className="w-full p-6 rounded-lg border border-academic-navy/10 focus:outline-none focus:ring-2 focus:ring-academic-gold/20 focus:border-academic-gold transition-all min-h-[200px] bg-white/80"
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Update Announcement'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: (user: User, token: string) => void }) => {
  const [studentId, setStudentId] = useState(localStorage.getItem('last_student_id') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!studentId && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('last_student_id', studentId);
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-academic-paper">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-xl bg-academic-navy text-white shadow-2xl mb-4"
          >
            <GraduationCap size={48} />
          </motion.div>
          <h1 className="text-5xl font-serif font-bold text-academic-ink tracking-tight">Weekly Reading</h1>
          <p className="text-academic-ink/40 font-medium italic text-lg">Research Group Management System</p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        >
          <Card className="p-10 border-academic-navy/5 shadow-2xl bg-white hover:translate-y-[-4px] transition-transform duration-500">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-academic-ink/40 uppercase tracking-widest ml-1">Student ID / Username</label>
                <div className="relative">
                  <Input 
                    ref={inputRef}
                    value={studentId} 
                    onChange={e => setStudentId(e.target.value)} 
                    placeholder="Enter your ID"
                    className="pl-12"
                    required 
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-academic-navy" size={20} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-bold text-academic-ink/40 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="pl-12"
                    required 
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-academic-navy" size={20} />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 text-lg" variant="primary" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </Card>
        </motion.div>

        <p className="text-center text-academic-ink/20 text-xs font-bold uppercase tracking-[0.2em]">
          Authorized Access Only
        </p>
      </div>
    </div>
  );
};

const Dashboard = ({ user, token }: { user: User, token: string }) => {
  const [view, setView] = useState<'papers' | 'announcements' | 'admin' | 'publish' | 'edit-paper' | 'edit-announcement'>('papers');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPapers = async () => {
    const res = await fetch('/api/papers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setPapers(data);
  };

  const fetchAnnouncements = async () => {
    const res = await fetch('/api/announcements', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setAnnouncements(data);
  };

  useEffect(() => {
    Promise.all([fetchPapers(), fetchAnnouncements()]).finally(() => setLoading(false));
  }, []);

  const handleMarkAsRead = async (id: number) => {
    await fetch(`/api/announcements/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchAnnouncements();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-academic-paper flex flex-col selection:bg-academic-navy/20">
      {/* Header */}
      <header className="bg-white border-b border-academic-navy/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-academic-navy text-white flex items-center justify-center shadow-lg">
              <BookOpen size={24} />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-academic-ink hidden sm:inline">Weekly Reading</span>
          </div>
          
          <nav className="flex items-center gap-2 sm:gap-6">
            <Button 
              variant="ghost" 
              className={cn(view === 'papers' && 'bg-academic-navy/10 text-academic-navy')}
              onClick={() => { setView('papers'); setSelectedPaper(null); }}
            >
              <FileText size={20} />
              <span className="hidden md:inline">Papers</span>
            </Button>
            <Button 
              variant="ghost" 
              className={cn(view === 'announcements' && 'bg-academic-navy/10 text-academic-navy')}
              onClick={() => setView('announcements')}
            >
              <div className="relative">
                <Bell size={20} />
                {announcements.some(a => !a.is_read) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-academic-crimson rounded-full border-2 border-white" />
                )}
              </div>
              <span className="hidden md:inline">Notices</span>
            </Button>
            {user.role === 'supervisor' && (
              <Button 
                variant="ghost" 
                className={cn(view === 'admin' && 'bg-academic-navy/10 text-academic-navy')}
                onClick={() => setView('admin')}
              >
                <Users size={20} />
                <span className="hidden md:inline">Admin</span>
              </Button>
            )}
          </nav>

          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-academic-ink">{user.name}</p>
              <p className="text-[10px] text-academic-navy font-bold uppercase tracking-widest">{user.role}</p>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="p-2.5 text-academic-ink/30 hover:text-academic-crimson hover:bg-academic-crimson/5">
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {view === 'papers' && !selectedPaper && (
            <motion.div 
              key="papers-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-5xl font-serif font-bold tracking-tight text-academic-ink">Paper Repository</h2>
                  <p className="text-academic-ink/40 italic text-lg mt-2">Curated research and academic discussions</p>
                </div>
                <Button variant="primary" onClick={() => setView('publish')} className="h-14 px-8 text-lg">
                  <Plus size={22} />
                  <span>Share New Paper</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {papers.map(paper => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isPast = paper.meeting_date < todayStr;
                  return (
                    <Card 
                      key={paper.id} 
                      className={cn(
                        "group relative border-academic-navy/5 hover:border-academic-navy/20 transition-all cursor-pointer bg-white",
                        !isPast && "ring-1 ring-academic-gold/20 shadow-lg shadow-academic-gold/5"
                      )} 
                      onClick={() => setSelectedPaper(paper)}
                    >
                      {!isPast && (
                        <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-academic-gold rounded-full shadow-[0_0_12px_rgba(197,160,89,0.6)] animate-pulse z-10" />
                      )}
                      <div className="p-8">
                        <div className="flex gap-2 mb-6 flex-wrap">
                          {paper.tags.split(',').filter(t => t.trim()).map((tag, idx) => {
                            const colors = [
                              'bg-academic-navy/10 text-academic-navy',
                              'bg-academic-gold/10 text-academic-gold',
                              'bg-academic-slate/10 text-academic-slate',
                              'bg-academic-crimson/10 text-academic-crimson'
                            ];
                            const colorClass = colors[idx % colors.length];
                            return (
                              <span key={`${tag.trim()}-${idx}`} className={cn("text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg", colorClass)}>
                                {tag.trim()}
                              </span>
                            );
                          })}
                        </div>
                        <h3 className="text-2xl font-serif font-bold leading-tight mb-3 text-academic-ink group-hover:text-academic-navy transition-colors">
                          {paper.title}
                        </h3>
                        {paper.conference && (
                          <p className="text-sm font-medium text-academic-gold mb-4 italic">
                            {paper.conference}
                          </p>
                        )}
                        <p className="text-academic-ink/60 line-clamp-3 mb-8 leading-relaxed">
                          {paper.abstract}
                        </p>
                        <div className="flex items-center justify-between pt-6 border-t border-academic-navy/5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-academic-navy text-white flex items-center justify-center text-sm font-bold shadow-md">
                              {paper.author_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-academic-ink">{paper.author_name}</p>
                              <p className="text-[10px] text-academic-ink/30 font-bold uppercase tracking-widest">{paper.meeting_date}</p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-academic-ink/20 group-hover:text-academic-navy group-hover:translate-x-2 transition-all" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {view === 'papers' && selectedPaper && (
            <motion.div 
              key={`paper-${selectedPaper.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PaperDetails 
                paper={selectedPaper} 
                user={user}
                token={token} 
                onBack={() => { setSelectedPaper(null); fetchPapers(); }} 
                onEdit={(p) => { setEditingPaper(p); setView('edit-paper'); }}
              />
            </motion.div>
          )}

          {view === 'edit-paper' && editingPaper && (
            <motion.div 
              key="edit-paper"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <EditPaper 
                paper={editingPaper}
                token={token} 
                onSuccess={() => { setView('papers'); setSelectedPaper(null); fetchPapers(); }} 
                onCancel={() => setView('papers')} 
              />
            </motion.div>
          )}

          {view === 'announcements' && (
            <motion.div 
              key="announcements-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AnnouncementsList 
                announcements={announcements} 
                user={user} 
                token={token} 
                onMarkRead={handleMarkAsRead}
                onRefresh={fetchAnnouncements}
                onEdit={(a) => { setEditingAnnouncement(a); setView('edit-announcement'); }}
              />
            </motion.div>
          )}

          {view === 'edit-announcement' && editingAnnouncement && (
            <motion.div 
              key="edit-announcement"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <EditAnnouncement 
                announcement={editingAnnouncement}
                token={token} 
                onSuccess={() => { setView('announcements'); fetchAnnouncements(); }} 
                onCancel={() => setView('announcements')} 
              />
            </motion.div>
          )}

          {view === 'publish' && (
            <motion.div 
              key="publish-paper"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <PublishPaper 
                token={token} 
                onSuccess={() => { setView('papers'); fetchPapers(); }} 
                onCancel={() => setView('papers')} 
              />
            </motion.div>
          )}

          {view === 'admin' && user.role === 'supervisor' && (
            <motion.div 
              key="admin-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdminPanel token={token} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const PaperDetails = ({ paper, user, token, onBack, onEdit }: { paper: Paper, user: User, token: string, onBack: () => void, onEdit: (p: Paper) => void }) => {
  const [details, setDetails] = useState<Paper | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchDetails = async () => {
    const res = await fetch(`/api/papers/${paper.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setDetails(data);
  };

  useEffect(() => {
    fetchDetails();
  }, [paper.id]);

  const handleDelete = async () => {
    const res = await fetch(`/api/papers/${paper.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) onBack();
    else alert('Failed to delete paper');
    setShowDeleteConfirm(false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paper_id: paper.id, content: comment }),
      });
      setComment('');
      fetchDetails();
    } finally {
      setSubmitting(false);
    }
  };

  if (!details) return <div className="flex items-center justify-center p-20 text-academic-navy font-serif italic">Loading research details...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="-ml-4">
          <ChevronRight className="rotate-180" size={20} />
          Back to Repository
        </Button>
        {user.role === 'supervisor' && (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => onEdit(details)}>
              Edit Paper
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} className="px-3">
              <Trash2 size={20} />
            </Button>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Delete Research Paper"
        message="Are you sure you want to delete this paper? This action cannot be undone and all associated comments will be removed."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="space-y-8">
        <div className="flex gap-2 flex-wrap">
          {details.tags.split(',').filter(t => t.trim()).map((tag, idx) => {
            const colors = [
              'bg-academic-navy text-white',
              'bg-academic-gold text-white',
              'bg-academic-slate text-white',
              'bg-academic-crimson text-white'
            ];
            const colorClass = colors[idx % colors.length];
            return (
              <span key={`${tag.trim()}-${idx}`} className={cn("text-xs font-bold uppercase tracking-[0.15em] px-5 py-2 rounded-lg shadow-md", colorClass)}>
                {tag.trim()}
              </span>
            );
          })}
        </div>
        <h1 className="text-6xl font-serif font-bold tracking-tight leading-tight text-academic-ink">{details.title}</h1>
        {details.conference && (
          <p className="text-3xl font-serif font-medium text-academic-gold italic">{details.conference}</p>
        )}
        <div className="flex flex-wrap items-center gap-8 text-academic-ink/40 pt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-academic-navy text-white flex items-center justify-center font-bold shadow-lg">
              {details.author_name[0]}
            </div>
            <span className="font-bold text-academic-ink text-lg">{details.author_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={22} className="text-academic-navy" />
            <span className="text-sm font-bold uppercase tracking-widest">Meeting: {details.meeting_date}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={22} className="text-academic-navy" />
            <span className="text-sm font-bold uppercase tracking-widest">{details.publisher_email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        <div className="md:col-span-2 space-y-16">
          <section>
            <h2 className="text-3xl font-serif font-bold mb-8 text-academic-ink border-b-2 border-academic-navy/10 pb-4">Abstract</h2>
            <p className="text-academic-ink/70 leading-relaxed whitespace-pre-wrap text-xl font-light">
              {details.abstract}
            </p>
          </section>

          <section className="space-y-8">
            <h2 className="text-3xl font-serif font-bold text-academic-ink border-b-2 border-academic-navy/10 pb-4">Discussion</h2>
            <Card className="p-10 bg-white">
              <form onSubmit={handleComment} className="space-y-6">
                <textarea 
                  className="w-full p-8 rounded-lg border border-academic-navy/10 focus:outline-none focus:ring-2 focus:ring-academic-navy/5 focus:border-academic-navy transition-all min-h-[150px] bg-white placeholder:text-academic-ink/20"
                  placeholder="Contribute to the academic discussion..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={submitting} className="h-14 px-8">
                    <MessageSquare size={20} />
                    Post Comment
                  </Button>
                </div>
              </form>

              <div className="mt-16 space-y-10">
                {details.comments?.map(c => (
                  <div key={c.id} className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-lg bg-academic-navy/10 flex-shrink-0 flex items-center justify-center font-bold text-academic-navy border border-academic-navy/10 shadow-inner">
                      {c.user_name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-academic-ink text-lg">{c.user_name}</span>
                        <span className="text-[10px] text-academic-ink/30 font-bold uppercase tracking-[0.2em]">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-academic-ink/60 bg-academic-paper/50 p-6 rounded-lg rounded-tl-none shadow-sm border border-academic-navy/5 leading-relaxed text-lg">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>

        <div className="space-y-10">
          <Card className="p-10 border-academic-navy/10 bg-academic-navy/5">
            <h3 className="font-serif font-bold text-2xl mb-8 text-academic-ink">Academic Resources</h3>
            <div className="space-y-6">
              {details.pdf_url && (
                <a 
                  href={details.pdf_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-6 rounded-lg bg-white hover:bg-academic-navy/5 transition-all group border border-academic-navy/5 hover:border-academic-navy/20 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shadow-inner">
                      <FileText size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-academic-ink">Research Paper</p>
                      <p className="text-[10px] text-academic-ink/30 font-bold uppercase tracking-widest">PDF Document</p>
                    </div>
                  </div>
                  <Download size={24} className="text-academic-ink/20 group-hover:text-academic-navy transition-colors" />
                </a>
              )}
              {details.slides_url && (
                <a 
                  href={details.slides_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-6 rounded-lg bg-white hover:bg-academic-navy/5 transition-all group border border-academic-navy/5 hover:border-academic-navy/20 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-academic-gold/10 text-academic-gold flex items-center justify-center shadow-inner">
                      <Layout size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-academic-ink">Presentation</p>
                      <p className="text-[10px] text-academic-ink/30 font-bold uppercase tracking-widest">Slides PDF/PPT</p>
                    </div>
                  </div>
                  <Download size={24} className="text-academic-ink/20 group-hover:text-academic-navy transition-colors" />
                </a>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AnnouncementsList = ({ announcements, user, token, onMarkRead, onRefresh, onEdit }: { 
  announcements: Announcement[], 
  user: User, 
  token: string, 
  onMarkRead: (id: number) => void,
  onRefresh: () => void,
  onEdit: (a: Announcement) => void
}) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [readStatus, setReadStatus] = useState<{ name: string, student_id: string, read_at: string }[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/announcements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content }),
      });
      setTitle('');
      setContent('');
      setShowForm(false);
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/announcements/${deleteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) onRefresh();
    else alert('Failed to delete notice');
    setDeleteId(null);
  };

  const fetchReadStatus = async (id: number) => {
    const res = await fetch(`/api/announcements/${id}/reads`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setReadStatus(data);
    setSelectedId(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-serif font-bold tracking-tight text-academic-ink">Notices & Updates</h2>
          <p className="text-academic-ink/40 italic text-lg mt-2">Official group communications</p>
        </div>
        {user.role === 'supervisor' && (
          <Button variant="primary" onClick={() => setShowForm(!showForm)} className="h-12 px-6">
            {showForm ? 'Cancel' : 'New Notice'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-10 border-academic-navy/10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-xs font-bold text-academic-ink/40 mb-3 uppercase tracking-widest ml-1">Notice Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Next Week's Meeting Schedule" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-academic-ink/40 mb-3 uppercase tracking-widest ml-1">Content</label>
              <textarea 
                className="w-full p-8 rounded-lg border border-academic-navy/10 focus:outline-none focus:ring-2 focus:ring-academic-navy/5 focus:border-academic-navy transition-all min-h-[200px] bg-white placeholder:text-academic-ink/20"
                placeholder="Write your announcement here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={submitting} className="h-14 px-8">Post Announcement</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-8">
        {announcements.map(a => (
          <Card key={a.id} className={cn('p-10 transition-all border-academic-navy/5', !a.is_read && 'border-l-8 border-l-academic-navy bg-academic-navy/5')}>
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-bold text-academic-ink">{a.title}</h3>
                <p className="text-[10px] text-academic-navy font-bold uppercase tracking-[0.2em]">
                  Posted by {a.author_name} • {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3">
                {user.role === 'supervisor' && (
                  <>
                    <Button variant="ghost" className="p-2.5 text-academic-ink/20 hover:text-academic-navy" onClick={() => onEdit(a)}>
                      <Edit size={20} />
                    </Button>
                    <Button variant="ghost" className="p-2.5 text-academic-ink/20 hover:text-academic-crimson" onClick={() => setDeleteId(a.id)}>
                      <Trash2 size={20} />
                    </Button>
                  </>
                )}
                {!a.is_read && (
                  <Button variant="secondary" className="text-xs h-10 px-4" onClick={() => onMarkRead(a.id)}>
                    Mark as Read
                  </Button>
                )}
                {a.is_read === 1 && (
                  <span className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-[0.2em] bg-emerald-50 px-4 py-2 rounded-lg">
                    <CheckCircle2 size={16} />
                    Read
                  </span>
                )}
              </div>
            </div>
            <p className="text-academic-ink/70 whitespace-pre-wrap text-xl font-light leading-relaxed mb-8">{a.content}</p>
            
            {user.role === 'supervisor' && (
              <div className="pt-8 border-t border-academic-navy/5">
                <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-[0.2em] h-10 text-academic-ink/40 hover:text-academic-navy" onClick={() => fetchReadStatus(a.id)}>
                  View Read Status
                </Button>
                {selectedId === a.id && readStatus && (
                  <div className="mt-8 bg-academic-navy/5 rounded-lg p-8 space-y-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-academic-navy">Read by ({readStatus.length} students):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {readStatus.map((r, idx) => (
                        <div key={`${r.student_id}-${idx}`} className="flex items-center justify-between text-xs bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-academic-navy/5 shadow-sm">
                          <span className="font-bold text-academic-ink">{r.name}</span>
                          <span className="text-academic-ink/30 font-bold uppercase tracking-widest">{new Date(r.read_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

const PublishPaper = ({ token, onSuccess, onCancel }: { token: string, onSuccess: () => void, onCancel: () => void }) => {
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [tags, setTags] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [publisherEmail, setPublisherEmail] = useState('');
  const [conference, setConference] = useState('');
  const [pdf, setPdf] = useState<File | null>(null);
  const [slides, setSlides] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('tags', tags);
    formData.append('meeting_date', meetingDate);
    formData.append('publisher_email', publisherEmail);
    formData.append('conference', conference);
    if (pdf) formData.append('pdf', pdf);
    if (slides) formData.append('slides', slides);

    try {
      const res = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to publish paper'}`);
      }
    } catch (err) {
      console.error('Publish error:', err);
      alert('Network error or server unavailable');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-10 border-academic-navy/10">
        <h2 className="text-3xl font-serif font-bold mb-10 text-academic-ink">Share New Research</h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-academic-ink/40 mb-3 uppercase tracking-widest ml-1">Paper Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Full title of the research paper" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-academic-ink/40 mb-3 uppercase tracking-widest ml-1">Conference / Journal</label>
              <Input value={conference} onChange={e => setConference(e.target.value)} placeholder="e.g. CVPR 2024, Nature, arXiv" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-academic-ink/40 mb-3 uppercase tracking-widest ml-1">Meeting Date</label>
                <Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-academic-ink/40 mb-3 uppercase tracking-widest ml-1">Your Email</label>
                <Input type="email" value={publisherEmail} onChange={e => setPublisherEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-academic-ink/40 mb-3 uppercase tracking-widest ml-1">Abstract / Summary</label>
              <textarea 
                className="w-full p-8 rounded-lg border border-academic-navy/10 focus:outline-none focus:ring-2 focus:ring-academic-navy/5 focus:border-academic-navy transition-all min-h-[150px] bg-white placeholder:text-academic-ink/20"
                placeholder="Briefly describe the core contributions..."
                value={abstract}
                onChange={e => setAbstract(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-academic-ink/40 mb-3 uppercase tracking-widest ml-1">Tags (comma separated)</label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. MoE, LLM, Computer Vision" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-8 border-2 border-dashed border-academic-navy/10 rounded-lg hover:border-academic-navy hover:bg-academic-navy/5 transition-all group">
              <label className="block cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                    <FileText className="text-academic-navy" size={28} />
                  </div>
                  <span className="text-sm font-bold text-academic-ink/60">{pdf ? pdf.name : 'Upload Paper PDF'}</span>
                  <input type="file" className="hidden" accept=".pdf" onChange={e => setPdf(e.target.files?.[0] || null)} />
                </div>
              </label>
            </div>
            <div className="p-8 border-2 border-dashed border-academic-navy/10 rounded-lg hover:border-academic-navy hover:bg-academic-navy/5 transition-all group">
              <label className="block cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                    <Layout className="text-academic-navy" size={28} />
                  </div>
                  <span className="text-sm font-bold text-academic-ink/60">{slides ? slides.name : 'Upload Slides'}</span>
                  <input type="file" className="hidden" accept=".pdf,.ppt,.pptx" onChange={e => setSlides(e.target.files?.[0] || null)} />
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex-1 h-14 text-lg" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish & Notify Group'}
            </Button>
            <Button variant="secondary" onClick={onCancel} disabled={submitting} className="h-14 px-8">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const AdminPanel = ({ token }: { token: string }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);

  const fetchUsers = async () => {
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, student_id: studentId, email, phone }),
      });
      setName('');
      setStudentId('');
      setEmail('');
      setPhone('');
      fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteId) return;
    await fetch(`/api/users/${deleteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchUsers();
    setDeleteId(null);
  };

  const handleResetPassword = async () => {
    if (!resetId) return;
    try {
      const res = await fetch(`/api/users/${resetId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) alert('Password reset successfully');
      else alert('Failed to reset password');
    } catch (e) {
      alert('An error occurred');
    }
    setResetId(null);
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-10">
          <Card className="p-8 border-academic-navy/10">
            <h3 className="text-2xl font-serif font-bold mb-8 flex items-center gap-3 text-academic-ink">
              <UserPlus size={24} className="text-academic-navy" />
              Add New Student
            </h3>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-academic-ink/30 mb-2 ml-1">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Zhang San" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-academic-ink/30 mb-2 ml-1">Student ID</label>
                <Input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="e.g. 2024001" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-academic-ink/30 mb-2 ml-1">Email Address</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="zhangsan@univ.edu" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-academic-ink/30 mb-2 ml-1">Phone Number</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="138..." required />
              </div>
              <Button type="submit" className="w-full h-12" disabled={submitting}>
                Add to System
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
            <h3 className="text-3xl font-serif font-bold text-academic-ink">Group Members ({users.length})</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-academic-ink/30" size={18} />
              <Input className="pl-12 text-sm h-12" placeholder="Search members..." />
            </div>
          </div>
          
          <div className="space-y-4">
            {users.map(u => (
              <Card key={u.id} className="p-6 flex items-center justify-between border-academic-navy/5 hover:border-academic-navy/20 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-lg bg-academic-navy/10 flex items-center justify-center font-bold text-academic-navy border border-academic-navy/10 shadow-inner">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-academic-ink">{u.name}</p>
                    <p className="text-xs text-academic-ink/30 font-bold uppercase tracking-widest flex flex-wrap items-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5"><Hash size={14} className="text-academic-navy" /> {u.student_id}</span>
                      <span className="flex items-center gap-1.5"><Mail size={14} className="text-academic-navy" /> {u.email}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-lg shadow-sm',
                    u.role === 'supervisor' ? 'bg-academic-ink text-white' : 'bg-academic-navy/10 text-academic-navy'
                  )}>
                    {u.role}
                  </span>
                  {u.role !== 'supervisor' && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        className="p-2.5 text-academic-ink/20 hover:text-academic-navy hover:bg-academic-navy/5"
                        onClick={() => setResetId(u.id)}
                        title="Reset Password to Student ID"
                      >
                        <Lock size={20} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="p-2.5 text-academic-ink/20 hover:text-academic-crimson hover:bg-academic-crimson/5"
                        onClick={() => setDeleteId(u.id)}
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone."
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal 
        isOpen={!!resetId}
        title="Reset Password"
        message="Are you sure you want to reset this student's password to their Student ID?"
        onConfirm={handleResetPassword}
        onCancel={() => setResetId(null)}
        confirmText="Reset"
        variant="primary"
      />
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const handleLogin = (user: User, token: string) => {
    try {
      setUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (err) {
      console.error('Failed to save login state:', err);
      // Even if localStorage fails, we still set the state so the user can enter the app
    }
  };

  if (!user || !token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard user={user} token={token} />;
}
