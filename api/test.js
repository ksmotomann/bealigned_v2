// Simple test to verify Vercel serverless functions are working
export default function handler(req, res) {
  res.status(200).json({
    message: 'Vercel serverless functions are working!',
    timestamp: new Date().toISOString(),
    url: req.url,
    query: req.query
  });
}
