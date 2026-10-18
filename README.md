# SEB Field Reference

The SEB Field Reference is a searchable, browser-based companion for members of the Special Enforcement Bureau (SEB) of the Los Santos County Sheriff's Department. It brings commonly used bureau reference material into one place so members can quickly check key terms, equipment and weapons details, movement commands, and personal kit notes.

The site also provides generators for incident reports, training schedules, and attendance records. Its purpose is to make field information easier to find and keep routine paperwork consistent. Current bureau orders, official policy, and training remain the authoritative sources.

## Open Source

This project is completely open source under the MIT License. You may use, modify, and redistribute the source subject to the terms in [LICENSE](LICENSE). Externally hosted images and other third-party content referenced by the site may have separate terms.

## Created for GTA: World

This project was created for the GTA: World roleplay community to support the Special Enforcement Bureau with a searchable field reference and consistent paperwork tools.

## SOD Calendar Feed

The SOD Calendar can load events from a Google Calendar synced by Sesh. The Cloudflare Pages Function in `functions/` reads the calendar's private iCal feed and serves sanitized event data at `/sod-events.json`.

To enable it, open the synced calendar's settings in Google Calendar and copy its **Secret address in iCal format**. In Cloudflare or wherever, open the Pages project settings, add a secret named `GOOGLE_ICS_URL`, paste the address as its value, and redeploy. Add it to production and preview environments as needed. Do not make the calendar public or put the secret address in this repository or the page source.

The function accepts Google Calendar iCal URLs, limits feed and recurrence processing, and caches successful results for five minutes. Ensure dependencies are installed from the repository root before Wrangler bundles the Function: for a Cloudflare Pages Git build, use `npm install` as the build command if no other build step is configured; for a direct Wrangler upload, run `npm install` locally before `wrangler pages deploy`. Keep the project root set to this repository, and do not commit `node_modules`. Parser tests can be run with `npm test` after installation.

## Contact

For questions or suggestions, reach the creator on Discord: **inked**.

## AI Use

This website was created with assistance from an LLM. 


