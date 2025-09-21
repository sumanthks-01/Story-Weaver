import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, orderBy, query } from 'firebase/firestore';

function App() {
  const [view, setView] = useState('home');
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [latestSentence, setLatestSentence] = useState('');
  const [newSentence, setNewSentence] = useState('');
  const [fullStory, setFullStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const storiesData = [];
      querySnapshot.forEach((doc) => {
        storiesData.push({ id: doc.id, ...doc.data() });
      });
      console.log('Loaded stories:', storiesData);
      setStories(storiesData);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };



  const startNewStory = async (firstSentence) => {
    if (!firstSentence.trim()) {
      alert('Please enter a sentence to start the story.');
      return;
    }
    
    try {
      setLoading(true);
      const newStory = {
        sentences: [firstSentence.trim()],
        createdAt: new Date()
      };
      
      console.log('Creating new story:', newStory);
      await addDoc(collection(db, 'stories'), newStory);
      setNewSentence('');
      setView('home');
      await loadStories();
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Error creating story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectStory = async (storyId) => {
    try {
      const docRef = doc(db, 'stories', storyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const story = docSnap.data();
        setCurrentStory(storyId);
        setLatestSentence(story.sentences[story.sentences.length - 1]);
        setView('contribute');
      }
    } catch (error) {
      console.error('Error selecting story:', error);
    }
  };

  const addSentence = async () => {
    if (!newSentence.trim()) {
      alert('Please enter a sentence.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Adding sentence to story:', currentStory);
      const docRef = doc(db, 'stories', currentStory);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const story = docSnap.data();
        const updatedSentences = [...story.sentences, newSentence.trim()];
        
        await updateDoc(docRef, {
          sentences: updatedSentences
        });
        
        setNewSentence('');
        setView('home');
        await loadStories();
      }
    } catch (error) {
      console.error('Error adding sentence:', error);
      alert('Error adding sentence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewFullStory = async (storyId) => {
    try {
      const docRef = doc(db, 'stories', storyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const story = { id: storyId, ...docSnap.data() };
        setFullStory(story);
        setView('fullStory');
      }
    } catch (error) {
      console.error('Error viewing story:', error);
    }
  };

  return (
    <div className="App">
      <header>
        <div className="header-content">
          <div className="title-section">
            <h1>📖 Story Weaver</h1>
            <p>Collaborative storytelling, one sentence at a time</p>
          </div>
          <button className="theme-toggle" onClick={toggleDarkMode}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {view === 'home' && (
        <div className="home">
          <div className="actions">
            <button onClick={() => setView('newStory')} className="primary">
              ✨ Start New Story
            </button>
          </div>

          <div className="stories">
            <h2>Active Stories</h2>
            {loading ? (
              <div className="loading">Loading stories...</div>
            ) : stories.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px', color: '#6c757d'}}>
                <p style={{fontSize: '1.2rem', marginBottom: '10px'}}>No stories yet!</p>
                <p>Be the first to start a collaborative story.</p>
              </div>
            ) : (
              stories.map(story => (
                <div key={story.id} className="story-card">
                  <h3>📖 Story #{story.id.slice(-6)}</h3>
                  <p>📝 {story.sentences.length} sentence{story.sentences.length !== 1 ? 's' : ''}</p>
                  <div className="story-actions">
                    <button onClick={() => selectStory(story.id)} className="primary">
                      ✍️ Continue Story
                    </button>
                    <button onClick={() => viewFullStory(story.id)}>
                      📚 Read Story
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'newStory' && (
        <div className="new-story">
          <h2>✨ Start a New Story</h2>
          <textarea
            placeholder="Write an intriguing opening sentence that will hook other writers..."
            onChange={(e) => setNewSentence(e.target.value)}
            value={newSentence}
            disabled={loading}
          />
          <div className="actions">
            <button 
              onClick={() => startNewStory(newSentence)} 
              className="primary"
              disabled={loading || !newSentence.trim()}
            >
              {loading ? '🔄 Creating...' : '🚀 Start Story'}
            </button>
            <button onClick={() => setView('home')} disabled={loading}>
              ← Back
            </button>
          </div>
        </div>
      )}

      {view === 'contribute' && (
        <div className="contribute">
          <h2>✍️ Continue the Story</h2>
          <div className="latest-sentence">
            <h3>💭 Latest sentence:</h3>
            <p>"{latestSentence}"</p>
          </div>
          <textarea
            placeholder="What happens next? Write a sentence that builds on the story..."
            value={newSentence}
            onChange={(e) => setNewSentence(e.target.value)}
            disabled={loading}
          />
          <div className="actions">
            <button 
              onClick={addSentence} 
              className="primary"
              disabled={loading || !newSentence.trim()}
            >
              {loading ? '🔄 Adding...' : '📝 Add Sentence'}
            </button>
            <button onClick={() => setView('home')} disabled={loading}>
              ← Back
            </button>
          </div>
        </div>
      )}

      {view === 'fullStory' && fullStory && (
        <div className="full-story">
          <h2>📚 Story #{fullStory.id.slice(-6)}</h2>
          <div className="story-content">
            {fullStory.sentences.map((sentence, index) => (
              <p key={index}>
                <span style={{color: '#6c757d', fontSize: '0.9rem', marginRight: '10px'}}>
                  {index + 1}.
                </span>
                {sentence}
              </p>
            ))}
          </div>
          <div className="actions">
            <button onClick={() => selectStory(fullStory.id)} className="primary">
              ✍️ Add to This Story
            </button>
            <button onClick={() => setView('home')}>
              ← Back to Stories
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;