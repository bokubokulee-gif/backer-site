# Backer language support

The public site supports English, Simplified Chinese, Japanese, and Korean. English remains the editorial source of truth and the default. Translations use native syntax and precise research and market terminology, with the same claims, qualifications, and product status as the source.

The enlarged language control sits at the upper-right edge of the header, with a minimum 44px touch target. Pages without a brand header use an upper-right control. Opening a URL without a valid `lang` parameter always uses English, regardless of an earlier language choice. Explicit choices travel in the `lang` query parameter; internal navigation stays on the current host. Switching languages reloads the current route so text animations and page controllers initialize against the selected language.

Authored interface copy, headings, descriptions, controls, form messages, accessibility labels, and research diagram labels are localized. Names, handles, URLs, code identifiers, numerical data, original source titles/quotations, and visitor-entered text retain their original content. Public source data and simulation records are never rewritten to translate presentation.

The shared runtime uses reviewed message catalogs and explicit rich-text templates. It updates only text nodes and presentation attributes, preserving listeners and underlying application state. It observes new UI output so filters, search results, tabs, and validation messages use the selected language. The separate Attention Simulation application localizes at the React render boundary and receives the parent language explicitly.

Verification covers desktop and narrow mobile layouts, all four language choices, English restoration, cross-page persistence, same-host links, dynamic states, keyboard access, and existing headline/card effects. Releases are published and verified on both GitHub Pages and Vercel.
