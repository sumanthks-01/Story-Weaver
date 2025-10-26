import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, orderBy, query } from 'firebase/firestore';

// Fallback to localStorage if Firebase fails
const useLocalStorage = () => {
  const getStories = () => {
    const saved = localStorage.getItem('storyWeaverStories');
    return saved ? JSON.parse(saved) : [];
  };
  
  const saveStories = (stories) => {
    localStorage.setItem('storyWeaverStories', JSON.stringify(stories));
  };
  
  return { getStories, saveStories };
};

const { getStories: getLocalStories, saveStories: saveLocalStories } = useLocalStorage();

// Story starter prompts
const storyStarters = [
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
  "The new neighbor claimed to be delivering mail to the previous residents who had moved out decades ago.",
  "Every photo he took showed people who weren't there when he took the picture.",
  "The GPS kept giving directions to places that only existed in her childhood memories.",
  "She found a key in her pocket that she'd never seen before, but it unlocked everything."
];

const getRandomStarter = () => {
  return storyStarters[Math.floor(Math.random() * storyStarters.length)];
};

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
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  useEffect(() => {
    // Test Firebase connection
    const testConnection = async () => {
      try {
        await getDocs(query(collection(db, 'stories')));
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };
    testConnection();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      // Try Firebase first
      const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const storiesData = [];
      querySnapshot.forEach((doc) => {
        storiesData.push({ id: doc.id, ...doc.data() });
      });
      console.log('Loaded stories from Firebase:', storiesData);
      setStories(storiesData);
    } catch (error) {
      console.error('Firebase error, using localStorage:', error);
      // Fallback to localStorage
      const localStories = getLocalStories();
      console.log('Loaded stories from localStorage:', localStories);
      setStories(localStories);
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
        id: Date.now().toString(),
        sentences: [firstSentence.trim()],
        createdAt: new Date()
      };
      
      console.log('Creating new story:', newStory);
      
      try {
        // Try Firebase first
        await addDoc(collection(db, 'stories'), newStory);
        console.log('Story saved to Firebase');
      } catch (firebaseError) {
        console.log('Firebase failed, using localStorage:', firebaseError);
        // Fallback to localStorage
        const currentStories = getLocalStories();
        const updatedStories = [newStory, ...currentStories];
        saveLocalStories(updatedStories);
        console.log('Story saved to localStorage');
      }
      
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
      try {
        // Try Firebase first
        const docRef = doc(db, 'stories', storyId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const story = docSnap.data();
          setCurrentStory(storyId);
          setLatestSentence(story.sentences[story.sentences.length - 1]);
          setView('contribute');
          return;
        }
      } catch (firebaseError) {
        console.log('Firebase failed, checking localStorage:', firebaseError);
      }
      
      // Fallback to localStorage
      const localStories = getLocalStories();
      const story = localStories.find(s => s.id === storyId);
      if (story) {
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
      
      try {
        // Try Firebase first
        const docRef = doc(db, 'stories', currentStory);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const story = docSnap.data();
          const updatedSentences = [...story.sentences, newSentence.trim()];
          
          await updateDoc(docRef, {
            sentences: updatedSentences
          });
          console.log('Sentence added to Firebase');
        }
      } catch (firebaseError) {
        console.log('Firebase failed, using localStorage:', firebaseError);
        // Fallback to localStorage
        const localStories = getLocalStories();
        const updatedStories = localStories.map(story => 
          story.id === currentStory 
            ? { ...story, sentences: [...story.sentences, newSentence.trim()] }
            : story
        );
        saveLocalStories(updatedStories);
        console.log('Sentence added to localStorage');
      }
      
      setNewSentence('');
      setView('home');
      await loadStories();
    } catch (error) {
      console.error('Error adding sentence:', error);
      alert('Error adding sentence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewFullStory = async (storyId) => {
    try {
      try {
        // Try Firebase first
        const docRef = doc(db, 'stories', storyId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const story = { id: storyId, ...docSnap.data() };
          setFullStory(story);
          setView('fullStory');
          return;
        }
      } catch (firebaseError) {
        console.log('Firebase failed, checking localStorage:', firebaseError);
      }
      
      // Fallback to localStorage
      const localStories = getLocalStories();
      const story = localStories.find(s => s.id === storyId);
      if (story) {
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
            {!isOnline && (
              <div className="offline-notice">
                📱 Offline Mode - Stories saved locally
              </div>
            )}
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
          <div className="story-input-section">
            <textarea
              placeholder="Write an intriguing opening sentence that will hook other writers..."
              onChange={(e) => setNewSentence(e.target.value)}
              value={newSentence}
              disabled={loading}
            />
            <div className="dice-section">
              <button 
                className="dice-button"
                onClick={() => setNewSentence(getRandomStarter())}
                disabled={loading}
                title="Get a random story starter"
              >
                🎲
              </button>
              <span className="dice-label">Random Starter</span>
            </div>
          </div>
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