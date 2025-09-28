import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import conversationRoutes from './routes/conversations';
import conversationChatRoutes from './routes/conversationsChat';
import adminRoutes from './routes/admin';
import sessionRoutes from './routes/sessions';
import issuesRoutes from './routes/issues';
import aiAssistantRoutes from './routes/aiAssistant';
import githubSyncRoutes from './routes/githubSync';
import usersRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import assistantSettingsRoutes from './routes/assistantSettings';
import documentsRoutes from './routes/documentsSimple';

dotenv.config();

const app = express();
// Configure server port - can be overridden via PORT environment variable
// Default: 3001, commonly used: 3003 to avoid conflicts with other services
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Use chat completions if USE_CHAT_COMPLETION env var is set, otherwise use assistant API
const USE_CHAT_COMPLETION = process.env.USE_CHAT_COMPLETION === 'true';
if (USE_CHAT_COMPLETION) {
  console.log('Using OpenAI Chat Completion API for conversations');
  app.use('/api/conversations', conversationChatRoutes);
} else {
  console.log('Using OpenAI Assistant API for conversations');
  app.use('/api/conversations', conversationRoutes);
}
app.use('/api/admin', adminRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/github-sync', githubSyncRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assistant-settings', assistantSettingsRoutes);
app.use('/api/documents', documentsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export for Vercel
export default app;

// Only listen when not in Vercel
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}