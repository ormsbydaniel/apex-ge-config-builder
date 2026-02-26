

## Plan: Auto-discover hashed bundle filenames from S3

### Problem
`viewer-host.html` hardcodes `bundle.js` and `bundle.css`. This forces manual renaming of Vite's hashed output (`index-AbC123.js`) before uploading to S3, and defeats browser cache-busting.

### Approach
At load time in `viewer-host.html`, list the S3 version folder to discover the actual JS/CSS entry files by pattern matching (`index-*.js`, `index-*.css`), falling back to `bundle.js`/`bundle.css` for backward compatibility.

---

### File changes

#### 1. `public/viewer/viewer-host.html`
Replace hardcoded `bundle.js`/`bundle.css` loading with S3 file discovery:

- After computing `basePath` and `version`, fetch:
  ```
  GET {bucketRoot}/?list-type=2&prefix=software/{version}/
  ```
- Parse XML response for `<Key>` entries.
- Match JS entry: filename matching `index-*.js` (in version root, not `assets/` subfolder). Fall back to `bundle.js`.
- Match CSS entry: filename matching `index-*.css`. Fall back to `bundle.css`.
- Then load the discovered files as before.

#### 2. `src/utils/viewerVersions.ts`
- Change `path` in `ViewerVersion` from `${base}${version}/bundle.js` to `${base}${version}/` (folder URL), since file resolution is now delegated to `viewer-host.html`.

#### 3. `src/config/viewerBundleConfig.ts`
- Update comments to reflect new expected bucket structure with hashed filenames. No functional changes.

---

### Technical detail: S3 listing in viewer-host.html

```javascript
var bucketRoot = baseUrl.replace(/\/software\/?$/, '').replace(/\/$/, '');
var listingUrl = bucketRoot + '/?list-type=2&prefix=software/' + version + '/';

var xhr = new XMLHttpRequest();
xhr.open('GET', listingUrl, true);
xhr.onload = function() {
  var keys = xhr.responseXML.querySelectorAll('Key');
  var jsFile = 'bundle.js';   // fallback
  var cssFile = 'bundle.css'; // fallback
  keys.forEach(function(key) {
    var name = key.textContent.split('/').pop();
    // Only match files in version root, not assets/ subfolder
    var parts = key.textContent.replace('software/' + version + '/', '').split('/');
    if (parts.length === 1) {
      if (/^index-.*\.js$/.test(name)) jsFile = name;
      if (/^index-.*\.css$/.test(name)) cssFile = name;
    }
  });
  // Load cssFile and jsFile from basePath
};
```

### Backward compatibility
- Versions with `bundle.js`/`bundle.css` still work via fallback.
- New uploads use Vite's original hashed names directly — no renaming needed.
- Different hashes = different URLs = automatic cache busting.

### No changes to
- `public/viewer/update-viewer-bundle.sh` — obsolete (S3 hosting replaces repo-based bundles).
- Schema, types, or validation files.

