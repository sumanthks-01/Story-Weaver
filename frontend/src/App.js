import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ThemeToggle from './ThemeToggle';
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';

const MAX_SENTENCE_LENGTH = 500;

const getLocalStories = () => {
  try { return JSON.parse(localStorage.getItem('storyWeaverStories')) || []; }
  catch { return []; }
};
const saveLocalStories = (stories) =>
  localStorage.setItem('storyWeaverStories', JSON.stringify(stories));

const getRandomStarter = () => {
  const starters = [
    "The last person on Earth sat alone in a room when suddenly there was a knock at the door.",
    "She found the old diary in her grandmother's attic, but the entries were dated fifty years in the future.",
    "The coffee shop appeared overnight, and everyone who entered came out speaking a different language.",
    "He woke up to find that gravity had stopped working, but only in his house.",
    "The mirror showed her reflection doing things she wasn't doing.",
    "Every night at 3:33 AM, the same stranger called asking for someone who didn't exist.",
    "The library book was due back in 1987, but she had just checked it out yesterday.",
    "His shadow started walking in the opposite direction.",
    "The elevator only had buttons for floors that didn't exist in the building.",
    "She received a text message from her own phone number.",
    "The street that led to his house disappeared every Tuesday.",
    "Everyone in town had the same dream last night, except for her.",
    "The antique music box played a song that wouldn't be written for another century.",
    "He found a door in his basement that opened to someone else's basement.",
    "The weather forecast predicted emotions instead of temperatures.",
    "She discovered that her houseplants had been rearranging themselves when she wasn't looking.",
    "Every photo he took showed people who weren't there when he took the picture.",
    "The GPS kept giving directions to places that only existed in her childhood memories.",
    "She found a key in her pocket that she'd never seen before, but it unlocked everything.",
  ];
  return starters[Math.floor(Math.random() * starters.length)];
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`toast toast-${type}`}>{message}</div>;
}

function CharCounter({ value, max }) {
  const remaining = max - value.length;
  const pct = value.length / max;
  return (
    <span className={`char-counter ${pct > 0.9 ? 'danger' : pct > 0.75 ? 'warn' : ''}`}>
      {remaining} characters left
    </span>
  );
}

export default function App() {
  const [view, setView] = useState('home');
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [latestSentence, setLatestSentence] = useState('');
  const [newSentence, setNewSentence] = useState('');
  const [fullStory, setFullStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => JSON.parse(localStorage.getItem('darkMode') ?? 'false')
  );

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsOnline(true);
    } catch {
      setStories(getLocalStories());
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStories(); }, [loadStories]);

  const startNewStory = async () => {
    const trimmed = newSentence.trim();
    if (!trimmed) return showToast('Please write an opening sentence.');
    if (trimmed.length > MAX_SENTENCE_LENGTH)
      return showToast(`Keep it under ${MAX_SENTENCE_LENGTH} characters.`);

    setLoading(true);
    try {
      const story = { sentences: [trimmed], createdAt: serverTimestamp() };
      try {
        await addDoc(collection(db, 'stories'), story);
      } catch {
        saveLocalStories([{ ...story, id: Date.now().toString(), createdAt: new Date() }, ...getLocalStories()]);
      }
      setNewSentence('');
      showToast('Story started! 🎉', 'success');
      setView('home');
      await loadStories();
    } catch {
      showToast('Failed to create story. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectStory = async (storyId) => {
    try {
      const docSnap = await getDoc(doc(db, 'stories', storyId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentStory(storyId);
        setLatestSentence(data.sentences[data.sentences.length - 1]);
        setView('contribute');
        return;
      }
    } catch { /* fall through */ }
    const story = getLocalStories().find(s => s.id === storyId);
    if (story) {
      setCurrentStory(storyId);
      setLatestSentence(story.sentences[story.sentences.length - 1]);
      setView('contribute');
    }
  };

  const addSentence = async () => {
    const trimmed = newSentence.trim();
    if (!trimmed) return showToast('Please write a sentence.');
    if (trimmed.length > MAX_SENTENCE_LENGTH)
      return showToast(`Keep it under ${MAX_SENTENCE_LENGTH} characters.`);

    setLoading(true);
    try {
      try {
        const docRef = doc(db, 'stories', currentStory);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await updateDoc(docRef, { sentences: [...docSnap.data().sentences, trimmed] });
        }
      } catch {
        saveLocalStories(
          getLocalStories().map(s =>
            s.id === currentStory ? { ...s, sentences: [...s.sentences, trimmed] } : s
          )
        );
      }
      setNewSentence('');
      showToast('Sentence added! ✍️', 'success');
      setView('home');
      await loadStories();
    } catch {
      showToast('Failed to add sentence. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewFullStory = async (storyId) => {
    try {
      const docSnap = await getDoc(doc(db, 'stories', storyId));
      if (docSnap.exists()) {
        setFullStory({ id: storyId, ...docSnap.data() });
        setView('fullStory');
        return;
      }
    } catch { /* fall through */ }
    const story = getLocalStories().find(s => s.id === storyId);
    if (story) { setFullStory(story); setView('fullStory'); }
  };

  const goHome = () => { setView('home'); setNewSentence(''); };

  return (
    <div className="App">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <header>
        <div className="header-content">
          <div className="title-section">
            <h1>📖 Story Weaver</h1>
            <p>Collaborative storytelling, one sentence at a time</p>
          </div>
          <div className="header-right">
            {!isOnline && <span className="offline-badge">📴 Offline</span>}
            <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode(d => !d)} />
          </div>
        </div>
      </header>

      <main>
        {view === 'home' && (
          <div className="view-home">
            <div className="home-hero">
              <button className="btn btn-primary btn-lg" onClick={() => setView('newStory')}>
                ✨ Start New Story
              </button>
            </div>

            <section className="stories-section">
              <div className="section-header">
                <h2>Active Stories</h2>
                <button className="btn btn-ghost btn-sm" onClick={loadStories} disabled={loading}>
                  {loading ? '⏳' : '↻ Refresh'}
                </button>
              </div>

              {loading ? (
                <div className="state-box">
                  <div className="spinner" />
                  <p>Loading stories…</p>
                </div>
              ) : stories.length === 0 ? (
                <div className="state-box empty-state">
                  <div className="empty-icon">📜</div>
                  <h3>No stories yet</h3>
                  <p>Be the first to start a collaborative story.</p>
                  <button className="btn btn-primary" onClick={() => setView('newStory')}>
                    ✨ Start the first story
                  </button>
                </div>
              ) : (
                <div className="story-grid">
                  {stories.map(story => (
                    <div key={story.id} className="story-card">
                      <div className="story-card-header">
                        <span className="story-id">Story #{story.id.slice(-6).toUpperCase()}</span>
                        <span className="sentence-badge">
                          {story.sentences.length} {story.sentences.length === 1 ? 'sentence' : 'sentences'}
                        </span>
                      </div>
                      <p className="story-preview">
                        "{story.sentences[story.sentences.length - 1].slice(0, 100)}{story.sentences[story.sentences.length - 1].length > 100 ? '…' : ''}"
                      </p>
                      <div className="story-card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => selectStory(story.id)}>
                          ✍️ Continue
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => viewFullStory(story.id)}>
                          📚 Read
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {view === 'newStory' && (
          <div className="view-panel">
            <div className="panel-header">
              <button className="btn btn-ghost btn-sm" onClick={goHome}>← Back</button>
              <h2>✨ Start a New Story</h2>
            </div>
            <p className="panel-hint">Write an opening sentence that will hook other writers.</p>
            <div className="textarea-wrap">
              <textarea
                placeholder="Once upon a time…"
                value={newSentence}
                onChange={e => setNewSentence(e.target.value)}
                disabled={loading}
                maxLength={MAX_SENTENCE_LENGTH}
                autoFocus
              />
              <div className="textarea-footer">
                <button
                  className="btn btn-ghost btn-sm dice-btn"
                  onClick={() => setNewSentence(getRandomStarter())}
                  disabled={loading}
                  title="Random starter"
                >
                  🎲 Random starter
                </button>
                <CharCounter value={newSentence} max={MAX_SENTENCE_LENGTH} />
              </div>
            </div>
            <div className="panel-actions">
              <button
                className="btn btn-primary"
                onClick={startNewStory}
                disabled={loading || !newSentence.trim()}
              >
                {loading ? <><span className="spinner-sm" /> Creating…</> : '🚀 Start Story'}
              </button>
            </div>
          </div>
        )}

        {view === 'contribute' && (
          <div className="view-panel">
            <div className="panel-header">
              <button className="btn btn-ghost btn-sm" onClick={goHome}>← Back</button>
              <h2>✍️ Continue the Story</h2>
            </div>
            <div className="prompt-box">
              <span className="prompt-label">Last sentence</span>
              <p className="prompt-text">"{latestSentence}"</p>
            </div>
            <p className="panel-hint">What happens next?</p>
            <div className="textarea-wrap">
              <textarea
                placeholder="Write the next sentence…"
                value={newSentence}
                onChange={e => setNewSentence(e.target.value)}
                disabled={loading}
                maxLength={MAX_SENTENCE_LENGTH}
                autoFocus
              />
              <div className="textarea-footer">
                <span />
                <CharCounter value={newSentence} max={MAX_SENTENCE_LENGTH} />
              </div>
            </div>
            <div className="panel-actions">
              <button
                className="btn btn-primary"
                onClick={addSentence}
                disabled={loading || !newSentence.trim()}
              >
                {loading ? <><span className="spinner-sm" /> Adding…</> : '📝 Add Sentence'}
              </button>
            </div>
          </div>
        )}

        {view === 'fullStory' && fullStory && (
          <div className="view-panel">
            <div className="panel-header">
              <button className="btn btn-ghost btn-sm" onClick={goHome}>← Back</button>
              <h2>📚 Story #{fullStory.id.slice(-6).toUpperCase()}</h2>
            </div>
            <div className="full-story-meta">
              {fullStory.sentences.length} sentences
            </div>
            <div className="story-scroll">
              {fullStory.sentences.map((sentence, i) => (
                <div key={i} className="story-line">
                  <span className="line-num">{i + 1}</span>
                  <p>{sentence}</p>
                </div>
              ))}
            </div>
            <div className="panel-actions">
              <button className="btn btn-primary" onClick={() => selectStory(fullStory.id)}>
                ✍️ Add to This Story
              </button>
              <button className="btn btn-secondary" onClick={goHome}>
                ← All Stories
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
