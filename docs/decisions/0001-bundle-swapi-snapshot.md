# 0001 — Bundle a SWAPI snapshot instead of fetching live

Status: accepted (round 1)

In the context of where the Databank gets its Star Wars data,
facing third-party SWAPI hosts that come and go (swapi.dev, swapi.tech and swapi.info all exist; any may go down), and a course rule that the project runs with one command on our own computer with no outside service,
we decided for a snapshot of swapi.info's full collections saved unchanged as `data/*.json`, with a developer-only script to refresh it,
and neglected fetching from a live SWAPI host on each visit, and a live fetch with a local cache fallback,
to achieve a site that always works offline, loads fast, and has tests that run against fixed data,
accepting that the data will not pick up upstream fixes until someone re-runs `scripts/fetch-data.mjs`, and that the repository carries about 200 KB of JSON.
