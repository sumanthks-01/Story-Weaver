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
    () => JSON.parse(localStorage.getItem('darkMode') ?? 'true')
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
          const userData = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email.split('@')[0],
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
    if (u.email) return u.email.split('@')[0];
    if (u.uid) return u.uid.slice(0, 8);
    return 'user';
  };

  // Returns stories the current user has contributed to
  const getMyContributions = () => {
    if (!user) return [];
    const handle = getUserHandle(user);
    return stories.filter(story =>
      (story.authorIds || []).includes(handle) ||
      (story.authors || []).includes(user.name)
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
      const author = user ? user.name : 'Anonymous';
      const authorId = getUserHandle(user);
      const story = {
        sentences: [trimmed],
        authors: [author],
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
      const author = user ? user.name : 'Anonymous';
      const authorId = getUserHandle(user);
      try {
        const docRef = doc(db, 'stories', currentStory);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          const existingAuthors = existingData.authors || [];
          const existingAuthorIds = existingData.authorIds || [];
          await updateDoc(docRef, {
            sentences: [...existingData.sentences, trimmed],
            authors: [...existingAuthors, author],
            authorIds: [...existingAuthorIds, authorId]
          });
        }
      } catch {
        saveLocalStories(
          getLocalStories().map(s =>
            s.id === currentStory ? {
              ...s,
              sentences: [...s.sentences, trimmed],
              authors: [...(s.authors || []), author],
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
              <h1>📖 Story Weaver</h1>
              <p>Collaborative storytelling, one sentence at a time</p>
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
            <div className="empty-icon lock-icon"></div>
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
                    <div className="empty-icon"></div>
                    <h3>No stories yet</h3>
                    <p>Be the first to start a collaborative story.</p>
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
                {fullStory.authors && fullStory.authors.length > 0 && (
                  <span className="meta-authors">• Authors: {Array.from(new Set(fullStory.authors)).join(', ')}</span>
                )}
              </div>
              <div className="story-scroll">
                {fullStory.sentences.map((sentence, i) => (
                  <div key={i} className="story-line">
                    <span className="line-num">{i + 1}</span>
                    <div className="line-content">
                      <p>{sentence}</p>
                      <div className="line-meta">
                        {fullStory.authors && fullStory.authors[i] && (
                          <span className="line-author">— {fullStory.authors[i]}</span>
                        )}
                        {fullStory.authorIds && fullStory.authorIds[i] && (
                          <span className="line-author-id">@{fullStory.authorIds[i]}</span>
                        )}
                      </div>
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
                    <div className="empty-icon"></div>
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

