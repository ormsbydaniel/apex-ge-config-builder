/* Tutorials sidebar grouping.
 *
 * Attaches decorative "Core" / "Topics" headings to the tutorial nav items.
 * Items are identified by their folder slug (i.e. their identity), not by
 * their position in the nav, so reordering tutorials in mkdocs.yml keeps the
 * labels attached to the right exercises. The label is drawn on whichever
 * member of a group appears first in the sidebar.
 *
 * To move a tutorial between groups, or add a new one, just edit the two
 * arrays below.
 */
(function () {
  var GROUPS = [
    {
      label: "Core",
      slugs: [
        "01-familiarisation",
        "02-getting-started",
        "03-working-with-services",
      ],
    },
    {
      label: "Topics",
      slugs: [
        "04-categorical-data",
        "05-time-series",
        "06-constraints",
      ],
    },
  ];

  function slugOf(link) {
    // Use the resolved absolute path so relative hrefs work from any page.
    var parts = link.pathname.split("/").filter(Boolean);
    var i = parts.indexOf("workshops");
    if (i === -1 || i + 1 >= parts.length) return null;
    var slug = parts[i + 1];
    if (slug.indexOf(".") !== -1) return null; // workshops/index.html
    // Only the tutorial's own overview page identifies the section root;
    // deeper exercise pages must not pick up a group label.
    if (parts.length !== i + 3 || parts[i + 2].indexOf("index.") !== 0) return null;
    return slug;
  }

  function apply() {
    document
      .querySelectorAll("[data-nav-group-label]")
      .forEach(function (el) {
        el.removeAttribute("data-nav-group-label");
        el.classList.remove("nav-group-first");
      });

    document.querySelectorAll(".md-nav__list").forEach(function (list) {
      var seen = {};
      Array.prototype.forEach.call(list.children, function (item) {
        var link = item.querySelector(":scope > a, :scope > label, :scope > .md-nav__link");
        var anchor =
          item.querySelector(":scope > a.md-nav__link") ||
          item.querySelector(":scope > .md-nav__link a") ||
          item.querySelector(":scope > .md-nav__link[href]") ||
          item.querySelector(":scope .md-nav__link[href]");
        if (!anchor || !anchor.pathname) return;
        var slug = slugOf(anchor);
        if (!slug) return;
        GROUPS.forEach(function (group) {
          if (group.slugs.indexOf(slug) === -1) return;
          if (seen[group.label]) return;
          seen[group.label] = true;
          item.setAttribute("data-nav-group-label", group.label);
          if (item === list.firstElementChild) {
            item.classList.add("nav-group-first");
          }
        });
        void link;
      });
    });
  }

  /* Tutorial name "eyebrow" above the step H1.
   * Add a line here when adding a new tutorial. */
  var TUTORIAL_TITLES = {
    "01-familiarisation": "1. Familiarisation",
    "02-getting-started": "2. My first config",
    "03-working-with-services": "3. Working with Services",
    "04-categorical-data": "4. Categorical Data",
    "05-time-series": "5. Time Series",
    "06-constraints": "6. Constraints",
  };

  function currentStepTutorial() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    var i = parts.indexOf("workshops");
    if (i === -1 || i + 2 >= parts.length) return null;
    var slug = parts[i + 1];
    var page = parts[i + 2];
    if (!TUTORIAL_TITLES[slug]) return null;
    if (page.indexOf("index.") === 0) return null; // tutorial home page
    return TUTORIAL_TITLES[slug];
  }

  function applyEyebrow() {
    var title = currentStepTutorial();
    var article = document.querySelector(".md-content__inner");
    if (!article) return;
    var existing = article.querySelector(".tutorial-eyebrow");
    if (existing) existing.remove();
    if (!title) return;
    var h1 = article.querySelector("h1");
    if (!h1) return;
    var p = document.createElement("p");
    p.className = "tutorial-eyebrow";
    p.textContent = title;
    h1.parentNode.insertBefore(p, h1);
  }

  /* Footer prev/next links pointing at a tutorial home page read "Overview"
   * (their nav label). Show the tutorial name instead. */
  function applyFooterTitles() {
    document.querySelectorAll(".md-footer__link").forEach(function (link) {
      if (!link.pathname) return;
      var parts = link.pathname.split("/").filter(Boolean);
      var i = parts.indexOf("workshops");
      if (i === -1 || i + 2 >= parts.length) return;
      var slug = parts[i + 1];
      var page = parts[i + 2];
      if (!TUTORIAL_TITLES[slug] || page.indexOf("index.") !== 0) return;
      var label =
        link.querySelector(".md-ellipsis") ||
        link.querySelector(".md-footer__title > .md-footer__direction + *") ||
        link.querySelector(".md-footer__title");
      if (label) label.textContent = TUTORIAL_TITLES[slug];
    });
  }

  /* Open external links in a new tab by default. */
  function applyExternalLinks() {
    document.querySelectorAll(".md-content a[href]").forEach(function (link) {
      if (link.host && link.host !== window.location.host) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function run() {
    apply();
    applyEyebrow();
    applyFooterTitles();
    applyExternalLinks();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(run);
  } else if (document.readyState !== "loading") {
    run();
  } else {
    document.addEventListener("DOMContentLoaded", run);
  }
})();
