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

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(apply);
  } else if (document.readyState !== "loading") {
    apply();
  } else {
    document.addEventListener("DOMContentLoaded", apply);
  }
})();
