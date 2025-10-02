// Vercel serverless function to serve grounding pages with OG meta tags
// This handles Facebook's crawler which doesn't execute JavaScript

export default function handler(req, res) {
  // Extract week from URL path or query parameter
  const urlPath = req.url || '';
  const pathMatch = urlPath.match(/\/grounding\/(\d+)/);
  const week = pathMatch ? pathMatch[1] : req.query.week;
  const weekNumber = parseInt(week, 10);

  // Validate week number
  if (!weekNumber || weekNumber < 1 || weekNumber > 12) {
    return res.status(404).send('Invalid week number');
  }

  // Get the host from the request
  const host = req.headers.host || 'bealigned.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const imageUrl = `${baseUrl}/images/grounding/be_grounding_wk${weekNumber}.png`;
  const pageUrl = `${baseUrl}/grounding/${weekNumber}`;
  const title = `Week ${weekNumber} Grounding from BeAligned™`;
  const description = 'Be grounded. Be clear. BeAligned.™ - Your weekly reflection card for mindful co-parenting.';

  // Return HTML with OG meta tags that redirect to the actual app route
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="BeAligned" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${title}" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@BeAligned" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:alt" content="${title}" />

  <!-- Redirect to actual app page -->
  <meta http-equiv="refresh" content="0;url=/grounding/${weekNumber}" />
  <script>window.location.href = '/grounding/${weekNumber}';</script>
</head>
<body>
  <p>Redirecting to <a href="/grounding/${weekNumber}">Week ${weekNumber} Grounding</a>...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
