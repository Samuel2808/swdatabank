# 0002 — Bundle public-domain/CC0 Commons photos, one per section

Status: accepted (round 2)

In the context of R11 and R12, which ask for blurred landscape backgrounds and fan-page images that are freely licensed photos of real Star Wars filming locations, while R2 still forbids requests to any outside host,
facing a choice between photo licences (public domain/CC0, CC BY, CC BY-SA), between hot-linking and bundling, and between one photo per section and a random photo per visit,
we decided for six photos from Wikimedia Commons that are public domain or CC0 only, one per section (Death Valley and Matmata for Tatooine, Skellig Michael, Redwood National Park, Tikal and Hardangerjøkulen), downloaded at about 1280 px by a developer-only script and committed under `img/photos/`, with author and licence in `js/photos.js` and sources in `CREDITS.md`,
and neglected CC BY / CC BY-SA photos (more choice and better pictures, but every page would have to carry correct attribution and share-alike terms), hot-linking Commons images (breaks R2 and the offline promise from decision 0001), and a random photo per visit (more variety, but the page would look different on each load and tests could not tie a photo to a section),
to achieve images that carry no licence conditions, work offline, and give each section a recognisable look that the tests can check,
accepting a smaller pool of photos (some are older scans or of modest quality, and Matmata's original is only 1080 px wide), about 1.7 MB of images in the repository, and that the place-to-section pairing is a matter of taste.
