const RULES = [
  ['AI & ChatGPT', ['chatgpt.com', 'openai.com']],
  ['YouTube & Videos', ['youtube.com', 'youtu.be', 'youtube-nocookie.com']],
  ['Social Media & Messaging', ['whatsapp.com', 'x.com', 'twitter.com', 't.co']],
  ['Movies & Anime', ['netflix.com', 'moviztime.site']],
  ['Learning & Books', ['terenglish.com', 'atirbooks.com']],
  ['Research & University', ['notion.com', 'notion.so', 'overleaf.com']],
  ['Google Tools', ['google.com', 'docs.google.com', 'drive.google.com', 'sheets.google.com', 'slides.google.com', 'meet.google.com', 'calendar.google.com', 'gmail.com', 'translate.google.com']]
];

export const GROUP_TITLES = RULES.map(([title]) => title);

export function classifyUrl(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (hostname.endsWith('.')) hostname = hostname.slice(0, -1);
  if (hostname.startsWith('www.')) hostname = hostname.slice(4);
  for (const [title, domains] of RULES) {
    if (domains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
      return title;
    }
  }
  return null;
}
