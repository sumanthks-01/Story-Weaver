import React, { useState, useEffect } from 'react';
import './App.css';

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

  const loadStories = () => {
    const saved = localStorage.getItem('storyWeaver');
    if (saved) {
      setStories(JSON.parse(saved));
    }
  };

  const saveStories = (updatedStories) => {
    localStorage.setItem('storyWeaver', JSON.stringify(updatedStories));
    setStories(updatedStories);
  };

  const startNewStory = (firstSentence) => {
    if (!firstSentence.trim()) return;
    
    const newStory = {
      id: Date.now(),
      sentences: [firstSentence],
      createdAt: new Date().toISOString()
    };
    
    const updatedStories = [...stories, newStory];
    saveStories(updatedStories);
    setNewSentence('');
    setView('home');
  };

  const selectStory = (storyId) => {
    const story = stories.find(s => s.id === storyId);
    if (story) {
      setCurrentStory(storyId);
      setLatestSentence(story.sentences[story.sentences.length - 1]);
      setView('contribute');
    }
  };

  const addSentence = () => {
    if (!newSentence.trim()) return;
    
    const updatedStories = stories.map(story => 
      story.id === currentStory 
        ? { ...story, sentences: [...story.sentences, newSentence] }
        : story
    );
    
    saveStories(updatedStories);
    setNewSentence('');
    setView('home');
  };

  const viewFullStory = (storyId) => {
    const story = stories.find(s => s.id === storyId);
    if (story) {
      setFullStory(story);
      setView('fullStory');
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
                  <h3>Story #{story.id}</h3>
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
          <h2>Story #{fullStory.id}</h2>
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