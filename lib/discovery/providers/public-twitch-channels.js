'use strict';

// Every handle in this registry must first return at least one public VOD from
// the installed upstream extractor. Keep this list exact; discovery must never
// guess or substitute similarly named accounts.
const VERIFIED_PUBLIC_TWITCH_CHANNELS = Object.freeze([
  Object.freeze({ handle: 'firstcrimson', displayName: 'firstcrimson', verified: true }),
  Object.freeze({ handle: 'piratesoftware', displayName: 'piratesoftware', verified: true }),
  Object.freeze({ handle: 'repeatereater', displayName: 'repeatereater', verified: true }),
  Object.freeze({ handle: 'headlessheadhunter', displayName: 'headlessheadhunter', verified: true }),
  Object.freeze({ handle: 'charlienounouvember', displayName: 'charlienounouvember', verified: true }),
  Object.freeze({ handle: 'acegikmo', displayName: 'acegikmo', verified: true }),
  Object.freeze({ handle: 'amchoon', displayName: 'amchoon', verified: true }),
  Object.freeze({ handle: 'bromorangersgo', displayName: 'bromorangersgo', verified: true }),
  Object.freeze({ handle: 'chivurr', displayName: 'chivurr', verified: true }),
  Object.freeze({ handle: 'dahlia', displayName: 'dahlia', verified: true }),
  Object.freeze({ handle: 'kenthekoi', displayName: 'kenthekoi', verified: true }),
  Object.freeze({ handle: 'totally_kaal', displayName: 'totally_kaal', verified: true }),
  Object.freeze({ handle: 'ariathome', displayName: 'ariathome', verified: true }),
  Object.freeze({ handle: 'curoze_', displayName: 'curoze_', verified: true }),
  Object.freeze({ handle: 'rikardekberg', displayName: 'rikardekberg', verified: true }),
  Object.freeze({ handle: 'tiamatto', displayName: 'tiamatto', verified: true }),
  Object.freeze({ handle: 'crusader4hymn', displayName: 'crusader4hymn', verified: true }),
  Object.freeze({
    handle: 'philipbowenmusic', displayName: 'philipbowenmusic',
    preferredVodId: 'v1418053287', verified: true
  }),
  Object.freeze({ handle: 'coldiart', displayName: 'coldiart', verified: true }),
  Object.freeze({ handle: 'dizmadraws', displayName: 'dizmadraws', verified: true }),
  Object.freeze({ handle: 'heygreyyart', displayName: 'heygreyyart', verified: true }),
  Object.freeze({ handle: 'jmillustrates', displayName: 'jmillustrates', verified: true }),
  Object.freeze({ handle: 'thegreatshono', displayName: 'thegreatshono', verified: true }),
  Object.freeze({ handle: 'melonppuccino', displayName: 'melonppuccino', verified: true })
]);

module.exports = { VERIFIED_PUBLIC_TWITCH_CHANNELS };
