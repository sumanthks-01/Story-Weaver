import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import ThemeToggle from './ThemeToggle';
import LoginPage from './LoginPage';
import { db, auth, signOut, onAuthStateChanged } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, setDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';

const MAX_SENTENCE_LENGTH = 500;

const getLocalStories = () => {
  try { return JSON.parse(localStorage.getItem('storyWeaverStories')) || []; }
  catch { return []; }
};
const saveLocalStories = (stories) =>
  localStorage.setItem('storyWeaverStories', JSON.stringify(stories));

const getSavedUser = () => {
  try { return JSON.parse(localStorage.getItem('storyWeaverUser')) || null; }
  catch { return null; }
};

// Generate or retrieve a persistent sw-prefixed user ID
const getOrCreateSwId = (uid) => {
  const storageKey = `swId_${uid || 'anon'}`;
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const newId = 'sw' + Math.floor(10000 + Math.random() * 90000);
  localStorage.setItem(storageKey, newId);
  return newId;
};

const _usedStarterIndices = new Set();

const getRandomStarter = () => {
  const starters = [
    // ── Mystery & Thriller ──────────────────────────────────────
    "The detective had solved 247 cases — but none of them had started with a victim who was still breathing when she arrived.",
    "On the morning of her retirement, Officer Lena Park received a letter sealed with her own fingerprint.",
    "The town of Hollow Creek had not reported a single crime in thirty years — until the mayor went missing the night of the centennial celebration.",
    "Marcus didn't believe in ghosts until the voicemail from his dead sister arrived at 3:47 AM.",
    "She'd been hired to find a missing painting, but the moment she stepped into the gallery, she realized the painting had found her.",
    "The only witness to the crime was a seven-year-old who insisted the killer had no shadow.",
    "Every door in the abandoned hotel was locked from the inside.",
    "The ransom note was written in a language no linguist had ever seen — yet somehow, Elena could read every word.",

    // ── Science Fiction ─────────────────────────────────────────
    "Earth received its first alien transmission on a Tuesday, and it was a complaint.",
    "In 2187, memories could be bought and sold at a weekly market on the corner of Fifth and Bloom.",
    "The colony ship had been traveling for forty years when the navigation system announced they were already home.",
    "Dr. Yuen's time machine worked perfectly — the problem was it only moved backward by exactly one minute.",
    "The last human on a planet of androids had one rule: never let them know you dream.",
    "When the government outlawed sleep, Nora became the most wanted criminal alive — and the most well-rested.",
    "The stars had been going out one by one for a decade, and tonight it was our sun's turn.",
    "She was the first person cloned from a historical figure — and Mary Shelley had opinions about the modern world.",

    // ── Fantasy & Adventure ─────────────────────────────────────
    "The map ended at the edge of the known world, but someone had drawn a single road beyond it in fresh ink.",
    "On the night of her sixteenth birthday, Aria discovered that every fairy tale her grandmother had told her was a warning.",
    "The dragon hadn't breathed fire in a century — not since it had learned to read.",
    "Every wish the old well granted came true, but only for someone other than the person who'd made it.",
    "The war had ended two hundred years ago, but the enchanted forest was still fighting it.",
    "He pulled a sword from a stone — the problem was it was the wrong sword, and now its owner wanted it back.",
    "The kingdom's most powerful wizard was also its most notorious liar, and today he was telling the truth.",
    "She'd trained her whole life to slay the beast, and now that she stood before it, she realized she recognized its eyes.",

    // ── Romance & Drama ─────────────────────────────────────────
    "They met every Tuesday in the same coffee shop for three years before either of them admitted they'd been there on purpose.",
    "The night before her wedding, Clara found a love letter in her dress pocket — and it wasn't from her fiancé.",
    "He had exactly one hour to stop a funeral that everyone else believed was necessary.",
    "She'd sworn off love after the incident in Paris, but nobody had warned her about the bookshop in Dublin.",
    "The rival families had feuded for generations, and their children had just accidentally fallen in love at the same support group.",
    "She returned to her hometown for the first time in ten years and found a stranger living in her childhood bedroom — her own name carved above the door.",

    // ── Horror & Suspense ───────────────────────────────────────
    "The new neighbors moved in on a Sunday, and by Monday, every dog on the street had stopped barking.",
    "The cabin looked abandoned, but the firewood on the porch had been stacked that morning.",
    "She'd lived in the house for a year before she noticed the basement door that wasn't on any blueprint.",
    "The children's laughter coming from the old playground was strange — the playground had been demolished in 1994.",
    "He'd been warned not to read the last page of the book first — but of course, he had.",
    "The small coastal town had a beautiful lighthouse with one problem: the light always pointed inland.",

    // ── Historical & Literary ───────────────────────────────────
    "In the summer of 1912, a young woman booked passage on a ship everyone told her was unsinkable, because she intended to make it sink.",
    "The emperor's food taster was the only person in the palace who knew the truth — and she was running out of time to tell it.",
    "He survived the Great War only to discover that everything he'd been fighting for had changed while he was away.",
    "The letter had traveled across four continents and two world wars to deliver a single, devastating sentence.",

    // ── Quirky & Whimsical ──────────────────────────────────────
    "The bakery at the end of Fern Street sold one item: a pie that tasted exactly like your happiest memory.",
    "The city's most beloved librarian had one secret: she had read every book ever written, and she remembered all of them.",
    "The inventor's greatest creation wasn't a machine — it was a color no one had ever seen before.",
    "Every person in the village of Thistlewick was born knowing one thing they were absolutely never supposed to know.",
    "The talking cat at the shelter had been passed over for adoption forty-three times — not because nobody wanted her, but because her references were too good.",
    "He'd built a machine to find the meaning of life and it had given him a receipt.",

    // ── Coming-of-Age ───────────────────────────────────────────
    "It was the summer nothing was supposed to change, which is exactly when everything did.",
    "She'd kept the secret for twelve years — but now that she was eighteen, she was finally allowed to ask the question.",
    "The first day of senior year, he arrived at school with a new name, a new jacket, and a plan that was already falling apart.",
    "They'd been best friends since kindergarten, and tonight one of them would have to choose.",

    // ── Psychological ───────────────────────────────────────────
    "Dr. Reeves had treated hundreds of patients who believed they were living in a simulation — until the day the code appeared in her own handwriting.",
    "The therapist's newest client had no memories before last Thursday and an unusually detailed knowledge of everyone in the waiting room.",
    "She'd been writing in her journal every night for a year; this morning, she found entries she had no memory of writing.",
    "The trial lasted three weeks, and by the end, no one in the courtroom — including the defendant — was certain of the truth.",
  ];

  // Avoid immediate repeats
  let idx;
  do {
    idx = Math.floor(Math.random() * starters.length);
  } while (starters.length > 1 && _usedStarterIndices.has(idx));

  // Keep only the last 8 used to allow cycling through the full list
  _usedStarterIndices.add(idx);
  if (_usedStarterIndices.size > 8) {
    _usedStarterIndices.delete(_usedStarterIndices.values().next().value);
  }

  return starters[idx];
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

const shareStory = (storyId) => {
  const url = `${window.location.origin}?story=${storyId}`;
  if (navigator.share) {
    navigator.share({ title: 'Story Weaver', text: 'Continue this collaborative story!', url });
  } else {
    navigator.clipboard.writeText(url);
  }
};

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
  const [user, setUser] = useState(getSavedUser);
  const [darkMode, setDarkMode] = useState(
    () => JSON.parse(localStorage.getItem('darkMode') ?? 'false')
  );

  const mainSectionRef = useRef(null);
  const loginSectionRef = useRef(null);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  // Create / Update User Table in Database (Firestore + LocalStorage)
  const saveUserToDatabase = async (userData) => {
    try {
      if (db) {
        const userDocRef = doc(db, 'users', userData.email);
        await setDoc(userDocRef, {
          email: userData.email,
          name: userData.name,
          swId: userData.swId,
          provider: userData.provider || 'email',
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('User table update in Firestore skipped or offline:', err);
    }
  };

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const swId = getOrCreateSwId(fbUser.uid);
          const userData = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email.split('@')[0],
            swId,
            provider: fbUser.providerData[0]?.providerId || 'firebase'
          };
          setUser(userData);
          localStorage.setItem('storyWeaverUser', JSON.stringify(userData));
          saveUserToDatabase(userData);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleUserLogin = async (userData) => {
    setUser(userData);
    localStorage.setItem('storyWeaverUser', JSON.stringify(userData));
    await saveUserToDatabase(userData);
    loadStories();
    setTimeout(() => {
      mainSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('Signout warning:', err);
    }
    setUser(null);
    localStorage.removeItem('storyWeaverUser');
    setStories([]);
    showToast('Signed out. Please sign in to view stories.', 'success');
    loginSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMain = () => {
    mainSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStories = useCallback(async () => {
    if (!getSavedUser() && !user) {
      setStories([]);
      return;
    }
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
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user, loadStories]);

  const getUserHandle = (u) => {
    if (!u) return 'anon';
    if (u.swId) return u.swId;
    // Fallback: generate one on the fly from uid and cache it
    return getOrCreateSwId(u.uid || u.email || 'anon');
  };

  // Returns stories the current user has contributed to
  const getMyContributions = () => {
    if (!user) return [];
    const handle = getUserHandle(user);
    return stories.filter(story =>
      (story.authorIds || []).includes(handle)
    );
  };

  const startNewStory = async () => {
    if (!user) return showToast('Please sign in to create a story.', 'error');
    const trimmed = newSentence.trim();
    if (!trimmed) return showToast('Please write an opening sentence.');
    if (trimmed.length > MAX_SENTENCE_LENGTH)
      return showToast(`Keep it under ${MAX_SENTENCE_LENGTH} characters.`);

    setLoading(true);
    try {
      const authorId = getUserHandle(user);
      const story = {
        sentences: [trimmed],
        authorIds: [authorId],
        createdAt: serverTimestamp()
      };
      try {
        await addDoc(collection(db, 'stories'), story);
      } catch {
        saveLocalStories([{ ...story, id: Date.now().toString(), createdAt: new Date() }, ...getLocalStories()]);
      }
      setNewSentence('');
      showToast('Story started!', 'success');
      setView('home');
      await loadStories();
    } catch {
      showToast('Failed to create story. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectStory = async (storyId) => {
    if (!user) return showToast('Please sign in to edit or contribute to stories.', 'error');
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
    if (!user) return showToast('Please sign in to contribute a sentence.', 'error');
    const trimmed = newSentence.trim();
    if (!trimmed) return showToast('Please write a sentence.');
    if (trimmed.length > MAX_SENTENCE_LENGTH)
      return showToast(`Keep it under ${MAX_SENTENCE_LENGTH} characters.`);

    setLoading(true);
    try {
      const authorId = getUserHandle(user);
      try {
        const docRef = doc(db, 'stories', currentStory);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          const existingAuthorIds = existingData.authorIds || [];
          await updateDoc(docRef, {
            sentences: [...existingData.sentences, trimmed],
            authorIds: [...existingAuthorIds, authorId]
          });
        }
      } catch {
        saveLocalStories(
          getLocalStories().map(s =>
            s.id === currentStory ? {
              ...s,
              sentences: [...s.sentences, trimmed],
              authorIds: [...(s.authorIds || []), authorId]
            } : s
          )
        );
      }
      setNewSentence('');
      showToast('Sentence added!', 'success');
      setView('home');
      await loadStories();
    } catch {
      showToast('Failed to add sentence. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewFullStory = async (storyId) => {
    if (!user) return showToast('Please sign in to read full stories.', 'error');
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

      {/* Top Section: Login Page */}
      <section ref={loginSectionRef} className="login-hero-section">
        {!user ? (
          <LoginPage onLogin={handleUserLogin} showToast={showToast} />
        ) : (
          <div className="logged-in-banner-card">
            <div className="user-avatar-badge">
              <span>{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="logged-in-info">
              <h3>Welcome back, {user.name}!</h3>
              <p>{user.email}</p>
            </div>
            <div className="logged-in-actions">
              <button className="btn btn-primary" onClick={scrollToMain}>
                Scroll to Stories ↓
              </button>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Main Page Section (Scroll Target) */}
      <section ref={mainSectionRef} className="main-app-section">
        <header>
          <div className="header-content">
            <div className="title-section">
              <h1>
                <span className="title-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </span>
                Story Weaver
              </h1>
              <p>Collaborative storytelling, <span className="highlight-wash">one sentence at a time</span></p>
            </div>
            <div className="header-right">
              {user && (
                <div className="header-user-pill" title={`Logged in as ${user.email}`}>
                  <span className="user-dot"></span>
                  <span className="user-name-text">{user.name}</span>
                  <span className="user-id-tag">@{getUserHandle(user)}</span>
                </div>
              )}
              {user && (
                <button
                  className="btn btn-ghost btn-sm header-profile-btn"
                  onClick={() => setView(view === 'profile' ? 'home' : 'profile')}
                  title="My Profile & Contributions"
                >
                  My Profile
                </button>
              )}
              {!isOnline && <span className="offline-badge">Offline</span>}
              <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode(d => !d)} />
            </div>
          </div>
        </header>

        {!user ? (
          <div className="state-box locked-state-box">
            <div className="empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3>Authentication Required</h3>
            <p>You must sign in above to view, read, or write stories.</p>
            <button className="btn btn-primary" onClick={() => loginSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              ↑ Go to Sign In
            </button>
          </div>
        ) : (
          <main>
            {view === 'home' && (
              <div className="view-home">
                <div className="home-hero">
                  <button className="btn btn-primary btn-lg" onClick={() => setView('newStory')}>
                    Start New Story
                  </button>
                </div>

              <section className="stories-section">
                <div className="section-header">
                  <h2>Active Stories</h2>
                  <button className="btn btn-ghost btn-sm" onClick={loadStories} disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {loading ? (
                  <div className="state-box">
                    <div className="spinner" />
                    <p>Loading stories…</p>
                  </div>
                ) : stories.length === 0 ? (
                  <div className="state-box empty-state">
                    <div className="empty-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                    </div>
                    <h3>No stories yet</h3>
                    <p>Be the first to start a <span className="highlight-wash">collaborative story</span>.</p>
                    <button className="btn btn-primary" onClick={() => setView('newStory')}>
                      Start the first story
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
                        {story.authors && story.authors.length > 0 && (
                          <div className="story-authors-tag">
                            {Array.from(new Set(story.authors)).join(', ')}
                          </div>
                        )}
                        <div className="story-card-actions">
                          <button className="btn btn-primary btn-sm" onClick={() => selectStory(story.id)}>
                            Continue
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => viewFullStory(story.id)}>
                            Read
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { shareStory(story.id); showToast('Link copied!', 'success'); }} title="Share this story">
                            Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="ad-banner">
                <p className="ad-label">Advertisement</p>
                <ins
                  className="adsbygoogle"
                  style={{ display: 'inline-block', width: '728px', height: '80px' }}
                  data-ad-client="ca-pub-7200157855781527"
                  data-ad-slot="6943770802"
                ></ins>
              </div>
            </div>
          )}

          {view === 'newStory' && (
            <div className="view-panel">
              <div className="panel-header">
                <button className="btn btn-ghost btn-sm" onClick={goHome}>← Back</button>
                <h2>Start a New Story</h2>
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
                    Random starter
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
                  {loading ? <><span className="spinner-sm" /> Creating…</> : 'Start Story'}
                </button>
              </div>
            </div>
          )}

          {view === 'contribute' && (
            <div className="view-panel">
              <div className="panel-header">
                <button className="btn btn-ghost btn-sm" onClick={goHome}>← Back</button>
                <h2>Continue the Story</h2>
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
                  {loading ? <><span className="spinner-sm" /> Adding…</> : 'Add Sentence'}
                </button>
              </div>
            </div>
          )}

          {view === 'fullStory' && fullStory && (
            <div className="view-panel">
              <div className="panel-header">
                <button className="btn btn-ghost btn-sm" onClick={goHome}>← Back</button>
                <h2>Story #{fullStory.id.slice(-6).toUpperCase()}</h2>
              </div>
              <div className="full-story-meta">
                {fullStory.sentences.length} sentences
                {fullStory.authorIds && fullStory.authorIds.length > 0 && (
                  <span className="meta-authors">• Contributors: {Array.from(new Set(fullStory.authorIds)).join(', ')}</span>
                )}
              </div>
              <div className="story-scroll">
                {fullStory.sentences.map((sentence, i) => (
                  <div key={i} className="story-line">
                    <span className="line-num">{i + 1}</span>
                    <div className="line-content">
                      <p>{sentence}</p>
                      {fullStory.authorIds && fullStory.authorIds[i] && (
                        <span className="line-author-id">@{fullStory.authorIds[i]}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel-actions">
                <button className="btn btn-primary" onClick={() => selectStory(fullStory.id)}>
                  Add to This Story
                </button>
                <button className="btn btn-ghost" onClick={() => { shareStory(fullStory.id); showToast('Link copied!', 'success'); }}>
                  Share Story
                </button>
                <button className="btn btn-secondary" onClick={goHome}>
                  ← All Stories
                </button>
              </div>
            </div>
          )}
          {view === 'profile' && user && (() => {
            const myStories = getMyContributions();
            return (
              <div className="view-panel profile-panel">
                <div className="panel-header">
                  <button className="btn btn-ghost btn-sm" onClick={goHome}>← Back</button>
                  <h2>My Profile</h2>
                </div>

                <div className="profile-info-card">
                  <div className="profile-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-details">
                    <h3>{user.name}</h3>
                    <p className="profile-email">{user.email}</p>
                    <span className="profile-uid-badge">@{getUserHandle(user)}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm profile-signout" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>

                <div className="profile-stats-row">
                  <div className="profile-stat-card">
                    <span className="stat-num">{myStories.length}</span>
                    <span className="stat-label">Stories</span>
                  </div>
                  <div className="profile-stat-card">
                    <span className="stat-num">
                      {myStories.reduce((acc, s) => {
                        const handle = getUserHandle(user);
                        return acc + (s.authorIds || []).filter(id => id === handle).length;
                      }, 0)}
                    </span>
                    <span className="stat-label">Sentences Added</span>
                  </div>
                  <div className="profile-stat-card">
                    <span className="stat-num">{stories.length}</span>
                    <span className="stat-label">Total Stories</span>
                  </div>
                </div>

                <div className="section-header" style={{marginTop:'24px'}}>
                  <h3>Stories I've Contributed To</h3>
                </div>
                {myStories.length === 0 ? (
                  <div className="state-box empty-state">
                    <div className="empty-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h3>No contributions yet</h3>
                    <p>Start or add to a story to see it here.</p>
                    <button className="btn btn-primary" onClick={goHome}>Browse Stories</button>
                  </div>
                ) : (
                  <div className="contributions-table-wrap">
                    <table className="contributions-table">
                      <thead>
                        <tr>
                          <th>Story ID</th>
                          <th>My Lines</th>
                          <th>Total Lines</th>
                          <th>Last Line Preview</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myStories.map(story => {
                          const handle = getUserHandle(user);
                          const myLineCount = (story.authorIds || []).filter(id => id === handle).length;
                          const lastLine = story.sentences[story.sentences.length - 1];
                          return (
                            <tr key={story.id}>
                              <td>
                                <span className="story-id-badge">#{story.id.slice(-6).toUpperCase()}</span>
                              </td>
                              <td><span className="my-lines-pill">{myLineCount}</span></td>
                              <td>{story.sentences.length}</td>
                              <td className="preview-cell">
                                "{lastLine.slice(0, 60)}{lastLine.length > 60 ? '…' : ''}"
                              </td>
                              <td>
                                <div style={{display:'flex',gap:'6px'}}>
                                  <button className="btn btn-secondary btn-sm" onClick={() => viewFullStory(story.id)}>Read</button>
                                  <button className="btn btn-primary btn-sm" onClick={() => selectStory(story.id)}>Add</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

        </main>
        )}
      </section>
    </div>
  );
}

