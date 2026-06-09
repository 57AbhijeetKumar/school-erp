function stripHtml(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/<[^>]*>/g, '');
}

module.exports = { stripHtml };
