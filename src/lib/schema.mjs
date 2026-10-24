// schema.org descriptions of the label, its releases and its artists.
import { artistsOf, artistUrl, coverUrl, labelOf, labels, releaseUrl, SITE } from './catalog.mjs';

const label = l => ({ '@type': 'Organization', name: l.name, url: SITE, ...(l.logo ? { logo: l.logo } : {}), sameAs: Object.values(l.links) });

export const home = () => [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Section 8 Recordings', url: SITE + '/' },
  { '@context': 'https://schema.org', ...label(labels[0]), foundingDate: '2007', email: 'team@section8recs.com',
    subOrganization: labels.slice(1).map(label) },
];

export const release = r => {
  const group = a => ({ '@type': 'MusicGroup', name: a.name, url: SITE + artistUrl(a) });
  const main = artistsOf(r).filter(a => a.role !== 'FeaturedArtist');
  return {
    '@context': 'https://schema.org', '@type': 'MusicAlbum', '@id': SITE + releaseUrl(r) + '#album',
    name: r.title, url: SITE + releaseUrl(r), image: coverUrl(r, 800), datePublished: r.date, numTracks: r.tracks.length,
    ...(r.genres.length ? { genre: r.genres } : {}), byArtist: main.map(group),
    albumRelease: { '@type': 'MusicRelease', name: r.title, catalogNumber: r.cat, datePublished: r.date,
      musicReleaseFormat: 'https://schema.org/DigitalFormat', recordLabel: { '@type': 'Organization', name: labelOf(r).name } },
    track: { '@type': 'ItemList', numberOfItems: r.tracks.length, itemListElement: r.tracks.map((t, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: { '@type': 'MusicRecording', name: t.title, ...(t.artist ? { byArtist: { '@type': 'MusicGroup', name: t.artist } } : {}) } })) },
    ...(Object.keys(r.links).length ? { sameAs: Object.values(r.links) } : {}),
  };
};

export const artist = a => ({
  '@context': 'https://schema.org', '@type': 'MusicGroup', name: a.name, url: SITE + artistUrl(a),
  album: a.releases.map(r => ({ '@type': 'MusicAlbum', name: r.title, url: SITE + releaseUrl(r), datePublished: r.date })),
});
