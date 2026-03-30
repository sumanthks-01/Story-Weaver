const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
const MAX_SENTENCE_LENGTH = 500;
const MAX_STORIES = 1000;

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

// In-memory storage
let stories = {};
let storyCounter = 1;

const validateSentence = (sentence) => {
  if (!sentence || typeof sentence !== 'string') return 'Sentence is required.';
  const trimmed = sentence.trim();
  if (!trimmed) return 'Sentence cannot be empty.';
  if (trimmed.length > MAX_SENTENCE_LENGTH) return `Sentence must be ${MAX_SENTENCE_LENGTH} characters or fewer.`;
  return null;
};

// Start a new story
app.post('/api/stories/new', (req, res) => {
  const { firstSentence } = req.body;
  const error = validateSentence(firstSentence);
  if (error) return res.status(400).json({ error });

  if (Object.keys(stories).length >= MAX_STORIES) {
    return res.status(429).json({ error: 'Story limit reached.' });
  }

  const storyId = storyCounter++;
  stories[storyId] = {
    id: storyId,
    sentences: [firstSentence.trim()],
    createdAt: new Date()
  };

  res.status(201).json({ storyId, message: 'Story created successfully' });
});

// Get latest sentence of a story
app.get('/api/stories/:id/latest', (req, res) => {
  const storyId = parseInt(req.params.id, 10);
  if (isNaN(storyId)) return res.status(400).json({ error: 'Invalid story ID.' });

  const story = stories[storyId];
  if (!story) return res.status(404).json({ error: 'Story not found' });

  res.json({
    latestSentence: story.sentences[story.sentences.length - 1],
    sentenceCount: story.sentences.length
  });
});

// Add sentence to story
app.post('/api/stories/:id/add', (req, res) => {
  const storyId = parseInt(req.params.id, 10);
  if (isNaN(storyId)) return res.status(400).json({ error: 'Invalid story ID.' });

  const { sentence } = req.body;
  const error = validateSentence(sentence);
  if (error) return res.status(400).json({ error });

  const story = stories[storyId];
  if (!story) return res.status(404).json({ error: 'Story not found' });

  story.sentences.push(sentence.trim());
  res.json({ message: 'Sentence added successfully' });
});

// Get full story
app.get('/api/stories/:id/full', (req, res) => {
  const storyId = parseInt(req.params.id, 10);
  if (isNaN(storyId)) return res.status(400).json({ error: 'Invalid story ID.' });

  const story = stories[storyId];
  if (!story) return res.status(404).json({ error: 'Story not found' });

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
