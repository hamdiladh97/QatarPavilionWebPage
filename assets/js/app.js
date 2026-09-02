/* ==========================================================================
   QATAR PAVILION AT COP31
   Renders the page from data/content.js, then wires the live behaviour:
   sticky nav + scrollspy, countdown, programme tabs, counters, reveals.
   No dependencies. Runs from file:// as well as any static host.
   ========================================================================== */
(function () {
  "use strict";

  var C = window.PAVILION_CONTENT;
  var app = document.getElementById("app");
  if (!C || !app) return;

  var TZ = "Europe/Istanbul";              // COP31 is in Antalya — show venue time
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------- utilities */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmt(iso, opts) {
    var d = new Date(iso);
    return new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: TZ }, opts)).format(d);
  }
  var dayLabel  = function (iso) { return fmt(iso, { month: "short", day: "numeric" }).toUpperCase(); };
  var longDate  = function (iso) { return fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" }); };
  var clockTime = function (iso) { return fmt(iso, { hour: "2-digit", minute: "2-digit", hour12: false }); };

  var ICON = {
    cal:  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    pin:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    time: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.3 2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    tel:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>',
    web:  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></svg>'
  };

  /* The section divider — the brochure cover's bottom sweep, traced from the
     PDF's own vector path and redrawn full width.

     The source curve is monotonic: dead flat from the right edge to x=79%,
     then one continuous rise to 37.8% of page height at the left. It never
     reverses. Sampled at the original control points, normalised to a
     1440x100 viewBox (the vertical squash is what lets a 419pt page device
     work as a ~100px divider).

     Two filled shapes, never a stroke — that is how the brochure builds it:
     the incoming ground in front, the same path in gold behind it, lifted so
     a thin gold edge shows along the whole run and widens where the sweep
     deepens. The gold carries an alpha ramp anchored to the deep end; since
     consecutive dividers alternate sides, consecutive ramps run in opposite
     directions, as the cover's two shadings do.

     `to` is the ground of the section below. Nothing paints the section
     above — the divider is transparent there, so whatever is up there
     (including the hero photograph) runs underneath the curve.

     On the cover the sweep runs out to nothing, because its shallow end is
     the page edge. Mid-page it cannot: a band of zero height carries no gold
     and meets the next ground on a hard line. So the curve is scaled to
     land at y=88, leaving the shallow end 12 units of ground — which is the
     brochure's own minimum band, 52pt of a 419pt page. The boundary is then
     the curve, everywhere, and the closing edge sits exactly on the
     divider's bottom so nothing spills onto the section below.          */
  var SWEEP =
    "M1138.5,88 C1084.4,86.9 1030.7,84.8 977.9,81.6 L920.7,77.6" +
    " C878.9,74.4 839.2,70.3 799.7,65.8 L721.5,56.1 L649.3,47.3" +
    " C643.6,46.6 637.1,46.1 632.6,45.2 C583.7,39.9 517.9,36.1 463.7,34.7" +
    " L352.0,31.9 C313.4,31.0 275.4,30.1 238.2,28.3 L217.7,27.5 L205.9,27.0" +
    " C132.1,23.0 80.8,18.2 39.7,10.0 C35.9,9.2 32.2,8.6 29.5,7.8" +
    /* L1440,88 is load-bearing: without it Z closes on a diagonal back to
       the start point and the band tapers to nothing at the right edge. */
    " C18.8,5.5 8.9,2.8 0,0 L0,100 L1440,100 L1440,88 Z";

  var ribbonSeq = 0;

  function ribbon(to, flip, hero) {
    var id = "rib-gold-" + ribbonSeq++;
    return '<div class="ribbon' + (flip ? " ribbon--flip" : "") +
      (hero ? " ribbon--hero" : "") + '" aria-hidden="true"' +
      ' style="--ribbon-to:' + to + '">' +
      '<svg viewBox="0 0 1440 100" preserveAspectRatio="none" focusable="false">' +
      '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="var(--qp-gold-lit)" stop-opacity="1"/>' +
        '<stop offset="0.55" stop-color="var(--qp-gold)" stop-opacity="0.82"/>' +
        '<stop offset="1" stop-color="var(--qp-gold)" stop-opacity="var(--ribbon-gold-fade)"/>' +
      "</linearGradient>" +
      '<path class="ribbon__gold" fill="url(#' + id + ')" d="' + SWEEP + '"/>' +
      /* the cover stacks three: gold at the back, a tan band over it, the
         ground in front. Only the hero sweep is at cover scale, so only it
         has the room to read as three rather than as a thickened edge.  */
      (hero ? '<path class="ribbon__mid" d="' + SWEEP + '"/>' : "") +
      '<path class="ribbon__fill" d="' + SWEEP + '"/>' +
      "</svg></div>";
  }

  /* ------------------------------------------------------------- render */
  function renderNav() {
    return '<header class="nav" id="nav"><div class="container nav__inner">' +
      '<a class="nav__brand" href="#top" aria-label="Qatar Pavilion at COP31 — back to top">' +
        '<img class="nav__logo" src="assets/img/logos/lockup-white.png" alt="Qatar Pavilion and COP31 Türkiye">' +
      "</a>" +
      '<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
      "</button>" +
      '<nav id="nav-links" class="nav__links" aria-label="Sections">' +
        C.nav.map(function (n) {
          return '<a class="nav__link" href="' + esc(n.href) + '">' + esc(n.label) + "</a>";
        }).join("") +
      "</nav></div></header>";
  }

  function renderHero() {
    var m = C.meta, h = C.hero;
    return '<section class="hero" id="top">' +
      '<div class="hero__media"><img src="assets/img/scenes/hero.jpg" alt="" aria-hidden="true"></div>' +
      '<div class="hero__scrim" aria-hidden="true"></div>' +
      '<div class="container"><div class="hero__inner">' +
        '<p class="eyebrow" data-reveal>' + esc(m.eyebrow) + " &middot; " + esc(m.location) + "</p>" +
        '<h1 class="hero__title" data-reveal style="--reveal-delay:90ms">' +
          "<span>Qatar Pavilion</span><span class=\"is-gold\">at COP31</span>" +
        "</h1>" +
        '<p class="hero__sub" data-reveal style="--reveal-delay:180ms">' + esc(m.subtitle) + "</p>" +
        '<div class="hero__rule" data-reveal style="--reveal-delay:240ms" aria-hidden="true"><span>&#9670;</span></div>' +
        '<p class="hero__tagline" data-reveal style="--reveal-delay:300ms">' + esc(m.tagline) + "</p>" +
        '<ul class="hero__meta" data-reveal style="--reveal-delay:360ms">' +
          "<li>" + ICON.cal + "<span>" + esc(m.dates) + "</span></li>" +
          "<li>" + ICON.pin + "<span>" + esc(m.location) + "</span></li>" +
        "</ul>" +
        '<div class="hero__actions" data-reveal style="--reveal-delay:420ms">' +
          '<a class="btn btn--gold" href="' + esc(h.ctaPrimary.href) + '">' + esc(h.ctaPrimary.label) + "</a>" +
          '<a class="btn btn--ghost" href="' + esc(h.ctaSecondary.href) + '">' + esc(h.ctaSecondary.label) + "</a>" +
        "</div>" +
        '<div class="countdown" data-reveal style="--reveal-delay:500ms" id="countdown"></div>' +
      "</div></div></section>";
  }

  function renderPavilion() {
    var p = C.pavilion;
    return '<section class="section section--ivory" id="pavilion"><div class="container">' +
      '<div class="pavilion__grid">' +
        '<div class="pavilion__map" data-reveal>' +
          '<img src="assets/img/scenes/qatar-map.png" alt="The outline of Qatar filled with a view of the Doha skyline above desert dunes">' +
        "</div>" +
        '<div class="pavilion__body">' +
          '<div class="section__head" data-reveal>' +
            '<p class="eyebrow">' + esc(p.eyebrow) + "</p>" +
            '<h2 class="section__title">' + esc(p.heading) + "</h2>" +
          "</div>" +
          p.body.map(function (t, i) {
            return '<p data-reveal style="--reveal-delay:' + (i * 90) + 'ms">' + esc(t) + "</p>";
          }).join("") +
          '<div class="pillars">' +
            p.pillars.map(function (x, i) {
              return '<div class="pillar" data-reveal style="--reveal-delay:' + (i * 90) + 'ms">' +
                '<span class="pillar__label">' + esc(x.label) + "</span><p>" + esc(x.text) + "</p></div>";
            }).join("") +
          "</div>" +
        "</div>" +
      "</div></div></section>";
  }

  function statusOf(ev, now) {
    var s = new Date(ev.start).getTime(), e = new Date(ev.end).getTime();
    return now >= s && now <= e ? "live" : now > e ? "past" : "upcoming";
  }
  var STATUS_TEXT = { live: "Live now", past: "Concluded", upcoming: "Upcoming" };

  function renderProgramme() {
    var p = C.programme, now = Date.now();

    var tabs = p.events.map(function (ev, i) {
      var st = statusOf(ev, now);
      return '<button class="rail__tab" role="tab" type="button"' +
        ' id="tab-' + i + '" aria-controls="panel-' + i + '"' +
        ' aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' +
        '<span class="rail__no">' + esc(ev.no) + "</span>" +
        '<span class="rail__date">' + dayLabel(ev.start) + "</span>" +
        '<span class="rail__theme">' + esc(ev.theme) + "</span>" +
        '<span class="rail__status" data-state="' + st + '">' + STATUS_TEXT[st] + "</span>" +
        "</button>";
    }).join("");

    var panels = p.events.map(function (ev, i) {
      return '<div class="panel' + (i === 0 ? " is-active" : "") + '" role="tabpanel"' +
        ' id="panel-' + i + '" aria-labelledby="tab-' + i + '" tabindex="0">' +
        '<div class="panel__grid">' +
          '<figure class="panel__media">' +
            '<img src="' + esc(ev.image) + '" alt="' + esc(ev.imageAlt) + '" loading="lazy">' +
          "</figure>" +
          "<div>" +
            '<p class="panel__no">Side-Event ' + esc(ev.no) + "</p>" +
            '<h3 class="panel__title">' + esc(ev.title) + "</h3>" +
            '<span class="chip">Theme: ' + esc(ev.theme) + "</span>" +
            '<ul class="panel__when">' +
              "<li>" + ICON.cal + "<span>" + longDate(ev.start) + "</span></li>" +
              "<li>" + ICON.time + "<span>" + clockTime(ev.start) + " &rarr; " + clockTime(ev.end) +
                ' <span class="visually-hidden">Antalya time</span></span></li>' +
            "</ul>" +
            '<p class="panel__desc">' + esc(ev.description) + "</p>" +

            '<h4 class="panel__sub">Agenda</h4>' +
            '<ul class="agenda">' +
              p.agenda.map(function (a) {
                return "<li><span>" + esc(a.item) + "</span><span>" + esc(a.duration) + "</span></li>";
              }).join("") +
            "</ul>" +
          "</div>" +
        "</div>" +

        /* speakers get the full panel width so all four sit on one row */
        '<h4 class="panel__sub">Speakers</h4>' +
        '<ul class="speakers">' +
          ev.speakers.map(function (s) {
            return '<li class="speaker">' +
              '<img class="speaker__photo" src="' + esc(s.photo) + '" alt="' + esc(s.name) + '" loading="lazy">' +
              '<p class="speaker__name">' + esc(s.name) + "</p>" +
              (s.role ? '<p class="speaker__role">' + esc(s.role) + "</p>" : "") +
              (s.org ? '<p class="speaker__org">' + esc(s.org) + "</p>" : "") +
              "</li>";
          }).join("") +
        "</ul>" +
        "</div>";
    }).join("");

    return '<section class="section section--brand" id="programme"><div class="container">' +
      '<div class="section__head" data-reveal>' +
        '<p class="eyebrow">' + esc(p.eyebrow) + "</p>" +
        '<h2 class="section__title">' + esc(p.heading) + "</h2>" +
        '<p class="section__intro">' + esc(p.intro) + "</p>" +
      "</div>" +
      '<div class="rail" role="tablist" aria-label="Side events by date" data-reveal>' + tabs + "</div>" +
      '<div class="panels">' + panels + "</div>" +
      "</div></section>";
  }

  function renderHighlights() {
    var h = C.highlights;
    return '<section class="section section--sand" id="qatar-mecc"><div class="container">' +
      '<div class="section__head" data-reveal>' +
        '<p class="eyebrow">' + esc(h.eyebrow) + "</p>" +
        '<h2 class="section__title">' + esc(h.heading) + "</h2>" +
        '<p class="section__intro">' + esc(h.intro) + "</p>" +
      "</div>" +
      '<div class="stats">' +
        h.groups.map(function (g, i) {
          return '<article class="stat-card' + (g.wide ? " stat-card--wide" : "") + '"' +
            ' data-reveal style="--reveal-delay:' + (i * 70) + 'ms">' +
            '<h3 class="stat-card__title">' + esc(g.title) + "</h3>" +
            '<div class="stat-card__list">' +
              g.stats.map(function (s) {
                return '<div class="stat">' +
                  '<span class="stat__num" data-count="' + s.value + '"' +
                    (s.suffix ? ' data-suffix="' + esc(s.suffix) + '"' : "") + ">0</span>" +
                  "<span>" +
                    '<span class="stat__label">' + esc(s.label) + "</span>" +
                    '<span class="stat__note">' + esc(s.note) + "</span>" +
                  "</span></div>";
              }).join("") +
            "</div>" +
            (g.tags ? '<div class="tags">' + g.tags.map(function (t) {
              return '<span class="tag">' + esc(t) + "</span>";
            }).join("") + "</div>" : "") +
            "</article>";
        }).join("") +
      "</div></div></section>";
  }

  function renderMecc() {
    var m = C.mecc;
    return '<section class="section section--ivory" id="mecc"><div class="container">' +
      '<div class="mecc__grid">' +
        '<div class="mecc__body">' +
          '<div class="section__head" data-reveal>' +
            '<p class="eyebrow">' + esc(m.eyebrow) + "</p>" +
            '<h2 class="section__title">' + esc(m.heading) + "</h2>" +
          "</div>" +
          m.body.map(function (t, i) {
            return '<p data-reveal style="--reveal-delay:' + (i * 90) + 'ms">' + esc(t) + "</p>";
          }).join("") +
          '<blockquote class="quote" data-reveal><p>&ldquo;' + esc(m.quote) + "&rdquo;</p>" +
            "<cite>" + esc(m.quoteSource) + "</cite></blockquote>" +
          '<a class="btn btn--gold" href="' + esc(m.cta.href) + '" target="_blank" rel="noopener" data-reveal>' +
            esc(m.cta.label) + ' <span class="btn__arrow" aria-hidden="true">&rarr;</span></a>' +
        "</div>" +
        /* the mark is reversed out white, so it needs a maroon ground now
           that this section is ivory — which is how the brochure carries it
           too: a maroon container with one corner rounded hard.          */
        '<div class="mecc__emblem" data-reveal>' +
          '<img src="assets/img/logos/mecc-white.png" alt="Ministry of Environment and Climate Change, State of Qatar">' +
        "</div>" +
      "</div></div></section>";
  }

  function renderReports() {
    var r = C.reports;
    return '<section class="section section--sand" id="reports"><div class="container">' +
      '<div class="section__head" data-reveal>' +
        '<p class="eyebrow">' + esc(r.eyebrow) + "</p>" +
        '<h2 class="section__title">' + esc(r.heading) + "</h2>" +
        '<p class="section__intro">' + esc(r.intro) + "</p>" +
      "</div>" +
      '<div class="reports">' +
        r.items.map(function (it, i) {
          return '<a class="report' + (it.image ? " report--media" : "") + '" href="' + esc(r.cta.href) + '" target="_blank" rel="noopener"' +
            ' data-reveal style="--reveal-delay:' + (i * 70) + 'ms">' +
            (it.image ? '<span class="report__media"><img src="' + esc(it.image) + '" alt="' + esc(it.imageAlt || "") + '" loading="lazy"></span>' : "") +
            '<span class="report__kind">' + esc(it.kind) + "</span>" +
            '<span class="report__title">' + esc(it.title) + "</span>" +
            '<span class="report__note">' + esc(it.note) + "</span>" +
            "</a>";
        }).join("") +
      "</div>" +
      '<div class="reports__cta" data-reveal>' +
        '<a class="btn btn--outline" href="' + esc(r.cta.href) + '" target="_blank" rel="noopener">' +
          esc(r.cta.label) + ' <span class="btn__arrow" aria-hidden="true">&rarr;</span></a>' +
      "</div></div></section>";
  }

  function renderFooter() {
    var f = C.footer, c = f.contact;
    return '<footer class="footer" id="contact"><div class="container">' +
      '<div class="footer__top">' +
        '<div class="footer__logos">' +
          '<img src="assets/img/logos/lockup-white.png" alt="Qatar Pavilion and COP31 Türkiye">' +
          '<img src="assets/img/logos/mecc-white.png" alt="Ministry of Environment and Climate Change, State of Qatar" style="max-width:150px">' +
        "</div>" +
        '<div class="footer__cols">' +
          f.columns.map(function (col) {
            return '<div class="footer__col"><h3>' + esc(col.title) + "</h3><ul>" +
              col.links.map(function (l) {
                return '<li><a href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.label) + "</a></li>";
              }).join("") + "</ul></div>";
          }).join("") +
          '<div class="footer__col"><h3>Contact</h3><ul class="footer__contact">' +
            "<li>" + ICON.pin + '<a href="' + esc(c.mapHref) + '" target="_blank" rel="noopener">' + esc(c.address) + "</a></li>" +
            "<li>" + ICON.tel + '<a href="tel:' + esc(c.phone.replace(/\s/g, "")) + '">' + esc(c.phone) + "</a>" +
              ' &middot; <a href="tel:' + esc(c.hotline) + '">' + esc(c.hotline) + "</a></li>" +
            "<li>" + ICON.mail + '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a></li>" +
            "<li>" + ICON.web + '<a href="https://www.mecc.gov.qa/english/Pages/default.aspx" target="_blank" rel="noopener">' + esc(c.site) + "</a></li>" +
          "</ul></div>" +
        "</div>" +
      "</div>" +
      '<div class="footer__bottom">' +
        "<span>" + esc(f.copyright) + "</span>" +
        '<nav class="social" aria-label="MECC on social media">' +
          f.social.map(function (s) {
            return '<a href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.label) + "</a>";
          }).join("") +
        "</nav>" +
        '<span class="footer__hash">' + esc(C.meta.hashtag) + "</span>" +
      "</div></div></footer>";
  }

  /* --------------------------------------------------------- compose page */
  /* Grounds follow the brochure: it has sixteen pages and not one of them is
     a maroon field — every page is ivory or sand, alternating, with maroon
     reserved for the corner device, image containers and type. Programme
     keeps a maroon ground as the page's single dark chapter; everything
     between it and the footer alternates ivory/sand as the brochure does. */
  var IVORY = "var(--surface-ivory)", SAND = "var(--surface-sand)", BRAND = "var(--surface-brand)",
      DEEP  = "var(--surface-brand-deep)";

  app.innerHTML =
    renderNav() +
    '<main id="main">' +
      renderHero() +
      ribbon(IVORY, false, true) +
      renderPavilion() +
      ribbon(BRAND, true) +
      renderProgramme() +
      ribbon(SAND, false) +
      renderHighlights() +
      ribbon(IVORY, true) +
      renderMecc() +
      ribbon(SAND, false) +
      renderReports() +
      ribbon(DEEP, true) +
    "</main>" +
    renderFooter();

  /* ------------------------------------------------------------ behaviour */

  /* Sticky nav + mobile menu */
  var nav = document.getElementById("nav");
  var links = document.getElementById("nav-links");
  var toggle = nav.querySelector(".nav__toggle");

  window.addEventListener("scroll", function () {
    nav.classList.toggle("is-stuck", window.scrollY > 40);
  }, { passive: true });

  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  links.addEventListener("click", function (e) {
    if (e.target.closest(".nav__link")) {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && links.classList.contains("is-open")) {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });

  /* Scrollspy — mark the nav link for whichever section owns the viewport */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll(".nav__link"));
  var targets = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && targets.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + en.target.id));
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* Countdown to the Pavilion opening */
  var cd = document.getElementById("countdown");
  var opensAt = new Date(C.meta.opensAt).getTime();

  function unit(v, label) {
    return '<div class="countdown__unit"><span class="countdown__num">' +
      String(v).padStart(2, "0") + "</span><span>" + label + "</span></div>";
  }
  function tickCountdown() {
    var diff = opensAt - Date.now();
    if (diff <= 0) {
      cd.innerHTML = '<p class="countdown__live">The Qatar Pavilion is open at COP31.</p>';
      return false;
    }
    var s = Math.floor(diff / 1000);
    cd.innerHTML =
      '<p class="countdown__label">Doors open in</p>' +
      '<div class="countdown__units" role="timer" aria-live="off">' +
        unit(Math.floor(s / 86400), "Days") +
        unit(Math.floor(s / 3600) % 24, "Hours") +
        unit(Math.floor(s / 60) % 60, "Minutes") +
        unit(s % 60, "Seconds") +
      "</div>";
    return true;
  }
  if (tickCountdown()) {
    var timer = setInterval(function () { if (!tickCountdown()) clearInterval(timer); }, 1000);
  }

  /* Programme tabs — click plus full arrow-key support */
  var tabList = app.querySelector('[role="tablist"]');
  if (tabList) {
    var tabEls = Array.prototype.slice.call(tabList.querySelectorAll('[role="tab"]'));

    function select(idx, focus) {
      tabEls.forEach(function (t, i) {
        var on = i === idx;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById("panel-" + i).classList.toggle("is-active", on);
      });
      if (focus) tabEls[idx].focus();
    }

    tabList.addEventListener("click", function (e) {
      var t = e.target.closest('[role="tab"]');
      if (t) select(tabEls.indexOf(t), false);
    });

    tabList.addEventListener("keydown", function (e) {
      var i = tabEls.indexOf(document.activeElement);
      if (i < 0) return;
      var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabEls.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select((next + tabEls.length) % tabEls.length, true);
    });

    /* open on the session that is live, or the next one still to come */
    var now = Date.now();
    var idx = C.programme.events.findIndex(function (ev) { return statusOf(ev, now) !== "past"; });
    if (idx > 0) select(idx, false);
  }

  /* Scroll reveals, ribbon draw-in, and stat counters — one observer */
  function countUp(el) {
    var target = Number(el.dataset.count) || 0;
    var suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1100, t0 = null;
    requestAnimationFrame(function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    });
  }

  var revealables = app.querySelectorAll("[data-reveal], .ribbon");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        en.target.querySelectorAll("[data-count]").forEach(countUp);
        obs.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
    app.querySelectorAll("[data-count]").forEach(countUp);
  }
})();
