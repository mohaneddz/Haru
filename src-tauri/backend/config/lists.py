CONTEXT_INSTRUCTIONS = {
    "first": "You are processing the beginning of the transcript. Start refining directly from the text provided, start with an #H1 title : <Module Name> - Lecture X, don't rewrite the original text, start directly",
    "middle": "You are processing a middle part of a larger transcript. For continuity, the start of the text may contain a small, read-only context from the end of the previous chunk, marked with '--- Context from previous chunk ---'. Do not repeat this context in your output. Your response MUST be a direct continuation of the previous section. DO NOT use a top-level H1 header ('#'). Begin with an H2 ('##') or H3 ('###') header if a new section starts, or with plain text if it's a continuation.",
    "last": "You are processing the final part of the transcript. This is the conclusion. For continuity, the start may contain context from the previous chunk. Do not repeat this context in your output. Ensure your response provides a clean and logical conclusion.",
    "single": "You are processing the entire transcript in one go. Refine it from beginning to end, following all formatting rules."
}

TRUSTED_DOMAINS = {
    'imdb.com': 1.5,
    'wikipedia.org': 1.5,
    'rottentomatoes.com': 1.2,
    'variety.com': 1.1,
    'hollywoodreporter.com': 1.1,
    'bbc.com': 1.2,
    'reuters.com': 1.2,
    'nytimes.com': 1.2,
    'theguardian.com': 1.3,
    'cnn.com': 1.1,
    'techcrunch.com': 1.1,
    'engadget.com': 1.2,
    'stackoverflow.com': 1.4,
    'arxiv.org': 1.3,
    'sciencedaily.com': 1.2,
    'nature.com': 1.3,
    'academia.edu': 1.2,
    'medium.com': 0.9,
    'ted.com': 1.1,
    'khanacademy.org': 1.3,
    'britannica.com': 1.4,
    'nih.gov': 1.4,
    'cdc.gov': 1.4,
    'edx.org': 1.2,
    'coursera.org': 1.2,
    'stackoverflow.com': 1.4,
    'github.com': 1.3,
    'medium.com': 1.2,
    'quora.com': 1.2,
}

UNIVERSITIES_URLS = [
    "harvard.edu",
    "mit.edu",
    "stanford.edu",
    "ox.ac.uk",
    "cam.ac.uk",
    "berkeley.edu",
    "princeton.edu",
    "yale.edu",
    "columbia.edu",
    "caltech.edu",
    "cmu.edu",
    "imperial.ac.uk",
    "nus.edu.sg",
    "utoronto.ca",
    "ethz.ch",
    "unimelb.edu.au",
    "anu.edu.au",
    "epfl.ch",
    "tudelft.nl",
    "umich.edu",
    "ucla.edu",
    "cornell.edu",
    "edinburgh.ac.uk",
    "unsw.edu.au",
]

PDF_SEARCH_DOMAINS = [
    "arxiv.org",
    "researchgate.net",
    "ocw.mit.edu",
    "cs.stanford.edu",
    "springer.com",
    "acm.org",
    "ieee.org",
    "sciencedirect.com"
]

VIDEO_SEARCH_DOMAINS = [
    "youtube.com",
    "khanacademy.org",
    "3blue1brown.com",
    "coursera.org",
    "edx.org",
    "udacity.com",
    "mitocw.mit.edu"
]
