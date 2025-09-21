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

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
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
    }
  };



  const startNewStory = async (firstSentence) => {
    if (!firstSentence.trim()) {
      alert('Please enter a sentence to start the story.');
      return;
    }
    
    try {
      const newStory = {
        sentences: [firstSentence.trim()],
        createdAt: new Date()
      };
      
      console.log('Creating new story:', newStory);
      await addDoc(collection(db, 'stories'), newStory);
      setNewSentence('');
      setView('home');
      loadStories();
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Error creating story. Please try again.');
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
        loadStories();
      }
    } catch (error) {
      console.error('Error adding sentence:', error);
      alert('Error adding sentence. Please try again.');
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
        <h1>📖 Story Weaver</h1>
        <p>Collaborative storytelling, one sentence at a time</p>
      </header>

      {view === 'home' && (
        <div className="home">
          <div className="actions">
            <button onClick={() => setView('newStory')} className="primary">
              Start New Story
            </button>
          </div>

          <div className="stories">
            <h2>Active Stories</h2>
            {stories.length === 0 ? (
              <p>No stories yet. Start the first one!</p>
            ) : (
              stories.map(story => (
                <div key={story.id} className="story-card">
                  <h3>Story #{story.id.slice(-6)}</h3>
                  <p>{story.sentences.length} sentences</p>
                  <div className="story-actions">
                    <button onClick={() => selectStory(story.id)}>
                      Add Sentence
                    </button>
                    <button onClick={() => viewFullStory(story.id)}>
                      Read Full Story
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
          <h2>Start a New Story</h2>
          <textarea
            placeholder="Write the opening sentence of your story..."
            onChange={(e) => setNewSentence(e.target.value)}
            value={newSentence}
          />
          <div className="actions">
            <button onClick={() => startNewStory(newSentence)} className="primary">
              Start Story
            </button>
            <button onClick={() => setView('home')}>Cancel</button>
          </div>
        </div>
      )}

      {view === 'contribute' && (
        <div className="contribute">
          <h2>Continue the Story</h2>
          <div className="latest-sentence">
            <h3>Latest sentence:</h3>
            <p>"{latestSentence}"</p>
          </div>
          <textarea
            placeholder="Write the next sentence..."
            value={newSentence}
            onChange={(e) => setNewSentence(e.target.value)}
          />
          <div className="actions">
            <button onClick={addSentence} className="primary">
              Add Sentence
            </button>
            <button onClick={() => setView('home')}>Cancel</button>
          </div>
        </div>
      )}

      {view === 'fullStory' && fullStory && (
        <div className="full-story">
          <h2>Story #{fullStory.id.slice(-6)}</h2>
          <div className="story-content">
            {fullStory.sentences.map((sentence, index) => (
              <p key={index}>{sentence}</p>
            ))}
          </div>
          <button onClick={() => setView('home')}>Back to Home</button>
        </div>
      )}
    </div>
  );
}

export default App;