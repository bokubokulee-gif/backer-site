# Backer Market header revision

Update the native `backerdemo.html#trades` page so its standalone page and the scaled pitch preview show the same requested copy.

- Set the Market headline to “Bet on anyone, anything before the world catches on.”
- Remove the descriptive paragraph beginning “Source-backed creator accounts and original content from Discovery.”
- Remove the latest-item ticker's outbound arrow and item-count display. Keep the latest item, original-source link, live label, and rotation behavior.
- Preserve the Market layout, catalog, native controls, and trading behavior.

Source ownership: `js/market.js` renders the header and ticker; `css/market.css` lays out the ticker. Validate JavaScript syntax and the existing Trades core suite. Bump the lazy Market asset URLs in `js/app.js`, then the public entry-point app URL, when publishing.
