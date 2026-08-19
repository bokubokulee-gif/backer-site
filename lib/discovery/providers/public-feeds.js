'use strict';

// Reviewed, server-owned public feeds. Request bodies can select these providers,
// but cannot add or override URLs.
const REVIEWED_PUBLIC_FEEDS = Object.freeze([
  Object.freeze({
    id: 'medium-artificial-intelligence',
    provider: 'medium',
    title: 'Medium · Artificial Intelligence',
    url: 'https://medium.com/feed/tag/artificial-intelligence',
    profileUrl: 'https://medium.com/tag/artificial-intelligence',
    verified: true
  }),
  Object.freeze({
    id: 'github-blog',
    provider: 'rss',
    title: 'GitHub Blog',
    url: 'https://github.blog/feed/',
    profileUrl: 'https://github.blog/',
    verified: true
  }),
  Object.freeze({
    id: 'medium-creator-economy',
    provider: 'medium',
    title: 'Medium · Creator Economy',
    url: 'https://medium.com/feed/tag/creator-economy',
    profileUrl: 'https://medium.com/tag/creator-economy',
    verified: true
  }),
  Object.freeze({ id: 'lennys-newsletter', provider: 'substack', title: "Lenny's Newsletter", url: 'https://www.lennysnewsletter.com/feed', profileUrl: 'https://www.lennysnewsletter.com/', verified: true }),
  Object.freeze({ id: 'platformer', provider: 'substack', title: 'Platformer', url: 'https://www.platformer.news/feed', profileUrl: 'https://www.platformer.news/', verified: true }),
  Object.freeze({ id: 'big-technology', provider: 'substack', title: 'Big Technology', url: 'https://www.bigtechnology.com/feed', profileUrl: 'https://www.bigtechnology.com/', verified: true }),
  Object.freeze({ id: 'one-useful-thing', provider: 'substack', title: 'One Useful Thing', url: 'https://www.oneusefulthing.org/feed', profileUrl: 'https://www.oneusefulthing.org/', verified: true }),
  Object.freeze({ id: 'import-ai', provider: 'substack', title: 'Import AI', url: 'https://importai.substack.com/feed', profileUrl: 'https://importai.substack.com/', verified: true }),
  Object.freeze({ id: 'not-boring', provider: 'substack', title: 'Not Boring', url: 'https://www.notboring.co/feed', profileUrl: 'https://www.notboring.co/', verified: true }),
  Object.freeze({ id: 'slow-boring', provider: 'substack', title: 'Slow Boring', url: 'https://www.slowboring.com/feed', profileUrl: 'https://www.slowboring.com/', verified: true })
]);

module.exports = { REVIEWED_PUBLIC_FEEDS };
