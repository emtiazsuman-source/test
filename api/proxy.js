module.exports = async (req, res) => {
  try {
    const urlParam = req.query && req.query.url;
    if (!urlParam || typeof urlParam !== 'string') {
      res.statusCode = 400;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end('Missing url query param');
      return;
    }

    let upstreamUrl;
    try {
      upstreamUrl = new URL(urlParam);
    } catch {
      res.statusCode = 400;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end('Invalid url');
      return;
    }

    const allowedHosts = new Set(['103.158.133.62', '103.134.28.242']);
    if (!allowedHosts.has(upstreamUrl.hostname)) {
      res.statusCode = 403;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end('Host not allowed');
      return;
    }

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      headers: {
        'user-agent': req.headers['user-agent'] || 'Mozilla/5.0',
        accept: req.headers.accept || '*/*',
        range: req.headers.range || undefined,
      },
      redirect: 'follow',
    });

    res.statusCode = upstreamRes.status;

    const contentType = upstreamRes.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    const cacheControl = upstreamRes.headers.get('cache-control');
    if (cacheControl) res.setHeader('cache-control', cacheControl);
    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) res.setHeader('content-range', contentRange);
    const acceptRanges = upstreamRes.headers.get('accept-ranges');
    if (acceptRanges) res.setHeader('accept-ranges', acceptRanges);

    const isM3u8 = upstreamUrl.pathname.toLowerCase().endsWith('.m3u8') || (contentType && contentType.toLowerCase().includes('mpegurl'));

    if (isM3u8) {
      const text = await upstreamRes.text();
      const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

      const rewriteUri = (uri) => {
        const trimmed = uri.trim();
        if (!trimmed) return uri;
        if (trimmed.startsWith('#')) return uri;
        if (trimmed.startsWith('data:')) return uri;
        const resolved = new URL(trimmed, upstreamUrl).toString();
        return `${origin}/api/proxy?url=${encodeURIComponent(resolved)}`;
      };

      const rewritten = text
        .split(/\r?\n/)
        .map((line) => {
          if (line.startsWith('#EXT-X-KEY')) {
            return line.replace(/URI="([^"]+)"/g, (_m, p1) => {
              const resolved = new URL(p1, upstreamUrl).toString();
              return `URI=\"${origin}/api/proxy?url=${encodeURIComponent(resolved)}\"`;
            });
          }
          return rewriteUri(line);
        })
        .join('\n');

      res.end(rewritten);
      return;
    }

    const buf = Buffer.from(await upstreamRes.arrayBuffer());
    res.end(buf);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(String(e && e.message ? e.message : e));
  }
};
