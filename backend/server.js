const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// In-memory storage
let stories = {};
let storyCounter = 1;

// Start a new story
app.post('/api/stories/new', (req, res) => {
  const { firstSentence } = req.body;
  const storyId = storyCounter++;
  
  stories[storyId] = {
    id: storyId,
    sentences: [firstSentence],
    createdAt: new Date()
  };
  
  res.json({ storyId, message: 'Story created successfully' });
});

// Get latest sentence of a story
app.get('/api/stories/:id/latest', (req, res) => {
  const storyId = parseInt(req.params.id);
  const story = stories[storyId];
  
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  const latestSentence = story.sentences[story.sentences.length - 1];
  res.json({ 
    latestSentence, 
    sentenceCount: story.sentences.length 
  });
});

// Add sentence to story
app.post('/api/stories/:id/add', (req, res) => {
  const storyId = parseInt(req.params.id);
  const { sentence } = req.body;
  const story = stories[storyId];
  
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  story.sentences.push(sentence);
  res.json({ message: 'Sentence added successfully' });
});

// Get full story
app.get('/api/stories/:id/full', (req, res) => {
  const storyId = parseInt(req.params.id);
  const story = stories[storyId];
  
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  res.json({ 
    storyId,
    sentences: story.sentences,
    totalSentences: story.sentences.length
  });
});

// Get all active stories
app.get('/api/stories', (req, res) => {
  const activeStories = Object.values(stories).map(story => ({
    id: story.id,
    sentenceCount: story.sentences.length,
    createdAt: story.createdAt
  }));
  
  res.json(activeStories);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});