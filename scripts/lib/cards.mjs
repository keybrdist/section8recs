// Social card file names carry the cover's LabelGrid timestamp, so a new cover gets a new URL (link previews cache by URL).
export const cardName = r => `${r.cat}-${r.cover_ts || '0'}.jpg`;
