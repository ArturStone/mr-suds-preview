/* Mr. Suds — booking wizard (draft). Self-contained. Mount: <div data-ms-wizard></div>
   Prices verbatim from mr-suds.ca/service/*. Add-ons per owner (2026-09): pet hair $50, seat shampoo from $100.
   Polishing & Ceramic Coating = quote by request (owner will contact). No real calendar/instant-book: this
   collects a request and hands off via email + phone. */
(function () {
  "use strict";

  var VEHICLES = [
    { id: "sedan",    name: "Sedan / Hatchback",                     ex: "Corolla, Civic, Golf",              std: 270, prem: 420 },
    { id: "crossover",name: "Crossover / Small SUV",                  ex: "RAV4, CR-V, CX-5, Escape",          std: 290, prem: 470 },
    { id: "suv",      name: "Full-size SUV / Minivan / ½-ton truck", ex: "Explorer, Tahoe, Sienna, F-150", std: 320, prem: 520 },
    { id: "midtruck", name: "Midsize truck",                          ex: "Tacoma, Ranger, Ridgeline, Frontier",std: 350, prem: 620 },
    { id: "bigtruck", name: "Large / heavy-duty truck",               ex: "F-250/350, RAM 2500/3500",          std: 370, prem: 720 }
  ];
  var SERVICES = [
    { id: "standard",  name: "Standard Detailing",            key: "std",  from: 270, quote: false,
      blurb: "Full exterior wash + steam-cleaned interior, brake-dust removal, protective coating." },
    { id: "premium",   name: "Premium Detailing",             key: "prem", from: 420, quote: false,
      blurb: "Everything in Standard plus clay-bar, undercarriage wash, pet-hair removal, seat & carpet shampoo." },
    { id: "polishing", name: "Polishing & Ceramic Coating",   key: null,   from: null, quote: true,
      blurb: "Paint correction and ceramic coating. Priced after we see the vehicle — we’ll contact you." }
  ];
  var ADDONS = [
    { id: "taralgae",  name: "Tar, algae & mold removal",                 price: 50, label: "+$50" },
    { id: "pethair",   name: "Pet hair removal",                          price: 40, label: "+$40", includedIn: ["premium"] },
    { id: "brakedust", name: "Brake-dust removal",                            price: 70, label: "$70–$100 by vehicle", est: true },
    { id: "seatwash",  name: "Seat wash (after inspection)",                  price: 0,  label: "Priced after inspection", est: true }
  ];
  function activeAddons() {
    return ADDONS.filter(function (a) { return !a.includedIn || a.includedIn.indexOf(S.service) === -1; });
  }

  var S = { service: null, vehicle: null, addons: {}, date: "", time: "", name: "", phone: "", email: "", address: "", notes: "" };
  var step = 0; // 0..4, index into STEPS
  var STEPS = ["Service", "Vehicle", "Add-ons", "Date & time", "Your details"];
  var sendState = "idle"; // idle | sending | sent | error

  function money(n) { return "$" + n.toLocaleString("en-CA"); }
  function svc() { return SERVICES.filter(function (x) { return x.id === S.service; })[0]; }
  function veh() { return VEHICLES.filter(function (x) { return x.id === S.vehicle; })[0]; }
  function isQuote() { var s = svc(); return s && s.quote; }

  function basePrice() {
    var s = svc(), v = veh();
    if (!s || s.quote || !v || !s.key) return null;
    return v[s.key];
  }
  function addonsTotal() {
    var t = 0, any = false;
    activeAddons().forEach(function (a) { if (S.addons[a.id]) { t += a.price; any = true; } });
    return any ? t : 0;
  }
  function total() {
    var b = basePrice();
    if (b == null) return null;
    return b + addonsTotal();
  }
  function anyEstimate() {
    return activeAddons().some(function (a) { return S.addons[a.id] && a.est; });
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]; }); }

  /* ---------- rendering ---------- */
  var root;

  function render() {
    if (sendState === "sending") return renderSending();
    if (sendState === "sent") return renderSent();
    if (sendState === "error") return renderError();
    var canNext = validStep();
    root.innerHTML =
      '<div class="msw2__bar" aria-hidden="true">' +
        STEPS.map(function (name, i) {
          var cls = i < step ? "done" : (i === step ? "cur" : "");
          return '<span class="msw2__dot ' + cls + '"><i>' + (i < step ? "✓" : (i + 1)) + '</i>' + esc(name) + "</span>";
        }).join("") +
      "</div>" +
      '<div class="msw2__body">' + stepBody() + "</div>" +
      priceBar() +
      '<div class="msw2__nav">' +
        (step > 0 ? '<button type="button" class="msw2__back" data-back>← Back</button>' : "<span></span>") +
        '<button type="button" class="msw2__next" data-next' + (canNext ? "" : " disabled") + ">" +
          (step === STEPS.length - 1 ? "Send request" : "Continue") +
        "</button>" +
      "</div>";
    wire();
  }

  function stepBody() {
    if (step === 0) {
      return '<h3 class="msw2__h">What service?</h3><div class="msw2__cards">' +
        SERVICES.map(function (s) {
          return '<button type="button" class="msw2__card' + (S.service === s.id ? " sel" : "") + '" data-service="' + s.id + '">' +
            "<b>" + esc(s.name) + "</b><span>" + esc(s.blurb) + "</span>" +
            "<em>" + (s.quote ? "By quote" : "From " + money(s.from)) + "</em></button>";
        }).join("") + "</div>";
    }
    if (step === 1) {
      if (isQuote()) return skipNote("We don’t need vehicle pricing for polishing / ceramic — skip ahead.");
      var key = svc().key;
      return '<h3 class="msw2__h">Your vehicle</h3><div class="msw2__list">' +
        VEHICLES.map(function (v) {
          return '<button type="button" class="msw2__row' + (S.vehicle === v.id ? " sel" : "") + '" data-vehicle="' + v.id + '">' +
            "<span class=\"msw2__row-t\"><b>" + esc(v.name) + "</b><i>" + esc(v.ex) + "</i></span>" +
            "<span class=\"msw2__row-p\">" + money(v[key]) + "</span></button>";
        }).join("") +
        "</div><p class=\"msw2__hint\">Not sure which fits? Pick the closest — we’ll confirm.</p>";
    }
    if (step === 2) {
      if (isQuote()) return skipNote("Add-ons are quoted with the job — skip ahead.");
      return '<h3 class="msw2__h">Add-ons <small>(optional)</small></h3><div class="msw2__addons">' +
        activeAddons().map(function (a) {
          return '<label class="msw2__addon' + (S.addons[a.id] ? " sel" : "") + '">' +
            '<input type="checkbox" data-addon="' + a.id + '"' + (S.addons[a.id] ? " checked" : "") + ">" +
            "<span><b>" + esc(a.name) + "</b><i>" + esc(a.label) + (a.est ? " · confirmed on site" : "") + "</i></span></label>";
        }).join("") +
        "</div><p class=\"msw2__hint\">Need polishing, ceramic, engine bay or something else? Add it in the notes on the next step.</p>";
    }
    if (step === 3) {
      return '<h3 class="msw2__h">Preferred date &amp; time</h3>' +
        '<p class="msw2__hint">Just a preference — we’ll text or email to confirm the exact slot.</p>' +
        '<div class="msw2__days">' + dayChips() + "</div>" +
        '<div class="msw2__times">' +
          ["Any time", "Morning (8–12)", "Afternoon (12–4)", "Evening (4–7)"].map(function (t) {
            return '<button type="button" class="msw2__chip' + (S.time === t || (!S.time && t === "Any time") ? " sel" : "") + '" data-time="' + esc(t) + '">' + esc(t) + "</button>";
          }).join("") +
        "</div>";
    }
    if (step === 4) {
      return '<h3 class="msw2__h">Your details</h3>' +
        '<p class="msw2__hint">Phone or email is enough — whichever you prefer.</p>' +
        field("name", "Name", "text", true) +
        '<div class="msw2__grid">' + field("phone", "Phone", "tel", false) + field("email", "Email", "email", false) + "</div>" +
        field("address", "Service address (street, town)", "text", true) +
        '<label class="msw2__lbl">Notes <small>(vehicle model, extra services, anything we should know)</small>' +
          '<textarea data-f="notes" rows="3">' + esc(S.notes) + "</textarea></label>";
    }
    return "";
  }

  function dayChips() {
    var out = "", d = new Date();
    var W = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (var i = 0; i < 14; i++) {
      var dt = new Date(d.getTime() + i * 864e5);
      var label = i === 0 ? "Today" : (i === 1 ? "Tomorrow" : W[dt.getDay()]);
      var val = label + " " + dt.getDate() + " " + M[dt.getMonth()];
      out += '<button type="button" class="msw2__chip' + (S.date === val ? " sel" : "") + '" data-date="' + esc(val) + '">' +
        "<b>" + esc(label) + "</b><i>" + dt.getDate() + " " + M[dt.getMonth()] + "</i></button>";
    }
    return out;
  }

  function field(f, label, type, req) {
    return '<label class="msw2__lbl">' + esc(label) + (req ? ' <em>*</em>' : "") +
      '<input type="' + type + '" data-f="' + f + '" value="' + esc(S[f]) + '"' + (f === "company" ? " tabindex=\"-1\"" : "") + "></label>";
  }
  function skipNote(t) {
    return '<div class="msw2__skip"><p>' + esc(t) + "</p></div>";
  }

  function priceBar() {
    if (isQuote()) {
      return '<div class="msw2__price"><span>Polishing &amp; Ceramic Coating</span><b>By quote</b></div>';
    }
    var b = basePrice();
    if (b == null) {
      return '<div class="msw2__price msw2__price--ph"><span>Pick a service &amp; vehicle to see your price</span><b>—</b></div>';
    }
    var t = total();
    return '<div class="msw2__price">' +
      "<span>" + esc(svc().name) + (veh() ? " · " + esc(veh().name) : "") + (anyEstimate() ? "  · add-ons est." : "") + "</span>" +
      "<b>" + money(t) + (anyEstimate() ? "+" : "") + "</b>" +
      "</div>";
  }

  function validStep() {
    if (step === 0) return !!S.service;
    if (step === 1) return isQuote() || !!S.vehicle;
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) {
      var okPhone = /[0-9]{7,}/.test(S.phone.replace(/\D/g, ""));
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.email);
      return S.name.trim() && (okPhone || okEmail) && S.address.trim();
    }
    return true;
  }

  function summaryText() {
    var L = [];
    L.push("MR. SUDS — booking request");
    L.push("Service: " + (svc() ? svc().name : "-"));
    if (!isQuote()) {
      L.push("Vehicle: " + (veh() ? veh().name : "-"));
      var ad = activeAddons().filter(function (a) { return S.addons[a.id]; }).map(function (a) { return a.name + " (" + a.label + ")"; });
      if (ad.length) L.push("Add-ons: " + ad.join(", "));
      var t = total();
      if (t != null) L.push("Estimated total: " + money(t) + (anyEstimate() ? " + (add-ons confirmed on site)" : "") + " — travel fee TBD");
    } else {
      L.push("Note: polishing/ceramic — quote by request");
    }
    L.push("Preferred: " + (S.date || "any date") + (S.time && S.time !== "Any time" ? " · " + S.time : ""));
    L.push("Name: " + S.name);
    if (S.phone.trim()) L.push("Phone: " + S.phone);
    if (S.email.trim()) L.push("Email: " + S.email);
    L.push("Address: " + S.address);
    if (S.notes.trim()) L.push("Notes: " + S.notes.trim());
    return L.join("\n");
  }

  function resetAll() {
    S = { service: null, vehicle: null, addons: {}, date: "", time: "", name: "", phone: "", email: "", address: "", notes: "" };
    step = 0; sendState = "idle";
  }

  function wireRestart() {
    var b = root.querySelector("[data-restart]");
    if (b) b.addEventListener("click", function () { resetAll(); render(); });
  }

  function submitRequest() {
    sendState = "sending"; render();
    var ad = activeAddons().filter(function (a) { return S.addons[a.id]; }).map(function (a) { return a.name + " (" + a.label + ")"; }).join(", ");
    var payload = {
      _subject: "Booking request — " + (S.name || "website"),
      _template: "table",
      _captcha: "false",
      Service: svc() ? svc().name : "-",
      Vehicle: (!isQuote() && veh()) ? veh().name : "-",
      "Add-ons": ad || "-",
      "Estimated total": total() != null ? money(total()) + (anyEstimate() ? "+ (add-ons confirmed on site)" : "") + " — travel fee TBD" : "By quote",
      Preferred: (S.date || "any date") + (S.time && S.time !== "Any time" ? " · " + S.time : ""),
      Name: S.name, Phone: S.phone || "-", Email: S.email || "-", Address: S.address,
      Notes: S.notes || "-"
    };
    var ctrl = ("AbortController" in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 10000);
    fetch("https://formsubmit.co/ajax/Mrsuds22@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error("bad status"); return r.json(); })
      .then(function () { sendState = "sent"; render(); })
      .catch(function () { clearTimeout(timer); sendState = "error"; render(); });
  }

  function renderSending() {
    root.innerHTML = '<div class="msw2__done"><h3>Sending your request…</h3><p class="msw2__hint">One moment.</p></div>';
  }

  function renderSent() {
    root.innerHTML =
      '<div class="msw2__done">' +
        "<h3>Request sent</h3>" +
        '<p class="msw2__hint">We got it — we&rsquo;ll email you to confirm the time.</p>' +
        '<button type="button" class="msw2__link" data-restart>Start over</button>' +
      "</div>";
    wireRestart();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderError() {
    var body = summaryText();
    var mailto = "mailto:Mrsuds22@gmail.com?subject=" + encodeURIComponent("Booking request — " + (S.name || "website")) +
      "&body=" + encodeURIComponent(body);
    root.innerHTML =
      '<div class="msw2__done">' +
        "<h3>Couldn’t send automatically</h3>" +
        '<p class="msw2__hint">Sorry about that — please send it by email or give us a call instead.</p>' +
        '<div class="msw2__doneact">' +
          '<a class="msw2__next" href="' + mailto + '">Send by email</a>' +
          '<a class="msw2__back" href="tel:+12505109818">Call 250 510 9818</a>' +
        "</div>" +
        '<button type="button" class="msw2__link" data-restart>Start over</button>' +
      "</div>";
    wireRestart();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function wire() {
    root.querySelectorAll("[data-service]").forEach(function (b) {
      b.addEventListener("click", function () { S.service = b.getAttribute("data-service"); S.addons = {}; if (isQuote()) S.vehicle = null; render(); });
    });
    root.querySelectorAll("[data-vehicle]").forEach(function (b) {
      b.addEventListener("click", function () { S.vehicle = b.getAttribute("data-vehicle"); render(); });
    });
    root.querySelectorAll("[data-date]").forEach(function (b) {
      b.addEventListener("click", function () { S.date = b.getAttribute("data-date"); render(); });
    });
    root.querySelectorAll("[data-time]").forEach(function (b) {
      b.addEventListener("click", function () { S.time = b.getAttribute("data-time"); render(); });
    });
    root.querySelectorAll("[data-addon]").forEach(function (c) {
      c.addEventListener("change", function () { S.addons[c.getAttribute("data-addon")] = c.checked; render(); });
    });
    root.querySelectorAll("[data-f]").forEach(function (el) {
      var ev = (el.tagName === "SELECT" || el.type === "date") ? "change" : "input";
      el.addEventListener(ev, function () { S[el.getAttribute("data-f")] = el.value; if (el.tagName === "SELECT" || el.type === "date") render(); else toggleNext(); });
    });
    var back = root.querySelector("[data-back]"), next = root.querySelector("[data-next]");
    if (back) back.addEventListener("click", function () { step = Math.max(0, step - (isQuote() && (step === 2 || step === 3) ? 1 : 1)); if (isQuote() && step === 2) step = 1; if (isQuote() && step === 1) step = 0; render(); });
    if (next) next.addEventListener("click", function () {
      if (!validStep()) return;
      if (step === STEPS.length - 1) { submitRequest(); return; }
      step += 1;
      if (isQuote() && (step === 1 || step === 2)) step = 3;
      render();
    });
  }
  function toggleNext() {
    var n = root.querySelector("[data-next]");
    if (n) n.disabled = !validStep();
  }

  document.querySelectorAll("[data-ms-wizard]").forEach(function (el) {
    root = el;
    el.classList.add("msw2");
    render();
  });
})();
