s/#060606/var(--ground)/g
s/#0a0a0a/var(--panel)/g
s/#0f0f0f/var(--rule)/g
s/#111\b/var(--rule-strong)/g
s/#151515/var(--panel-border)/g
s/#222\b/var(--text-footer)/g
s/#242424/var(--rule-label)/g
s/#2e2e2e/var(--text-label)/g
s/#333\b/var(--text-faint)/g
s/#3a3a3a/var(--text-nav)/g
s/#444\b/var(--text-cta)/g
s/#4a4a4a/var(--text-cta)/g
s/#555\b/var(--text-strong)/g
s/#686868/var(--text)/g
s/#8a8a8a/var(--focus)/g
s/#888\b/var(--text-hover)/g
s/#e8e4d8/var(--text-display)/g
s/rgba(6,6,6,\([0-9.]*\))/rgb(var(--ground-rgb) \/ \1)/g
s/rgba(232,228,216,\([0-9.]*\))/rgb(var(--bone-rgb) \/ \1)/g
s/rgba(255,255,255,\([0-9.]*\))/rgb(var(--white-rgb) \/ \1)/g
s/font-family: 'Cinzel', serif;/font-family: var(--font-display);/g
s/font-family: 'Space Grotesk', sans-serif;/font-family: var(--font-body);/g
s/font-family: 'Space Grotesk', system-ui, sans-serif;/font-family: var(--font-body);/g
s/font-family: 'Uncial Antiqua', serif;/font-family: var(--font-ghost);/g
s/font-size: clamp(18px, 2.5vw, 24px);/font-size: var(--fs-h2);/g
s/font-size: clamp(28px, 4vw, 48px);/font-size: var(--fs-h1);/g
s/font-size: clamp(32px, 5vw, 56px);/font-size: var(--fs-hero);/g
s/font-size: \(9\|10\|11\|12\|13\|14\)px;/font-size: var(--fs-\1);/g
s/letter-spacing: 0.5px;/letter-spacing: var(--ls-05);/g
s/letter-spacing: 1px;/letter-spacing: var(--ls-1);/g
s/letter-spacing: 1.5px;/letter-spacing: var(--ls-15);/g
s/letter-spacing: \([234]\)px;/letter-spacing: var(--ls-\1);/g
s/line-height: 1.75;/line-height: var(--lh-body);/g
s/line-height: 1.85;/line-height: var(--lh-article);/g
s/\(padding\|margin\|margin-top\|margin-bottom\|gap\): \(6\|8\|10\|14\|16\|20\|22\|24\|28\|32\|40\|44\|48\|56\|60\|64\|72\|80\|120\)px;/\1: var(--s-\2);/g
s/padding: 60px 0;/padding: var(--s-60) 0;/g
s/padding: 60px 0 40px;/padding: var(--s-60) 0 var(--s-40);/g
s/padding: 80px 0 40px;/padding: var(--s-80) 0 var(--s-40);/g
s/padding: 80px 0 48px;/padding: var(--s-80) 0 var(--s-48);/g
s/padding: 120px 0 40px;/padding: var(--s-120) 0 var(--s-40);/g
s/padding: 120px 0 80px;/padding: var(--s-120) 0 var(--s-80);/g
s/padding: 0 56px;/padding: 0 var(--gutter);/g
s/padding: 0 28px;/padding: 0 var(--gutter-mobile);/g
s/padding: 60px 28px;/padding: var(--s-60) var(--gutter-mobile);/g
s/max-width: 720px;/max-width: var(--measure);/g
