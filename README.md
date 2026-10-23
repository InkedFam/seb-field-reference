# SEB Field Reference

The SEB Field Reference is a searchable, browser-based companion for members of the Special Enforcement Bureau (SEB) of the Los Santos County Sheriff's Department. It brings commonly used bureau reference material into one place so members can quickly check key terms, equipment and weapons details, movement commands, and personal kit notes.

The site also provides generators for incident reports, training schedules, and attendance records. Its purpose is to make field information easier to find and keep routine paperwork consistent. Current bureau orders, official policy, and training remain the authoritative sources.

## Open Source

This project is completely open source under the MIT License. You may use, modify, and redistribute the source subject to the terms in [LICENSE](LICENSE). Externally hosted images and other third-party content referenced by the site may have separate terms.

## Created for GTA: World

This project was created for the GTA: World roleplay community to support the Special Enforcement Bureau with a searchable field reference and consistent paperwork tools.

## SOD Calendar

The Events Calendar is currently on hold while the event-post workflow is unresolved. The calendar view presents the Markdown explanation in [calendar-hold.md](calendar-hold.md), including the three potential solutions and their blockers.

The existing event-feed work is retained but inactive: the Cloudflare Pages Function in `functions/` reads a private Google Calendar iCal feed and serves sanitized event data at `/sod-events.json`, and its parser tests remain available through `npm test`. The page does not request the feed while the calendar is on hold.

If an approved solution makes the feed usable again, configure a Cloudflare Pages secret named `GOOGLE_ICS_URL` with the synced calendar's **Secret address in iCal format**. Do not make the calendar public or put the secret address in this repository or the page source. The function accepts Google Calendar iCal URLs, limits feed and recurrence processing, and caches successful results for five minutes. Install dependencies from the repository root before Wrangler bundles the Function: use `npm install` as the Cloudflare Pages build command if no other build step is configured, or run it locally before a direct `wrangler pages deploy`. Keep the project root set to this repository, and do not commit `node_modules`.

## Contact

For questions or suggestions, reach the creator on Discord: **inked**.

## AI Use

This website was created with assistance from an LLM. 

