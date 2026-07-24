(function () {
  "use strict";

  var API_BASE = "/api/admin";
  var DEFAULT_RECENT_LIMIT = 100;
  var MAX_RECENT_LIMIT = 200;
  var SVG_NS = "http://www.w3.org/2000/svg";

  var state = {
    authenticated: false,
    csrfToken: "",
    adminIdentity: "",
    sessionExpiresAt: "",
    rawIpRevealEnabled: false,
    range: "7d",
    from: "",
    to: "",
    timeDisplay: "local",
    recentLimit: DEFAULT_RECENT_LIMIT,
    summary: null,
    recent: [],
    hasMore: false,
    requestController: null,
    pendingRevealId: "",
    pendingMaskedIp: "",
    toastTimer: null
  };

  var elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();
    setDefaultCustomDates();
    checkSession();
  }

  function cacheElements() {
    [
      "authView",
      "loginForm",
      "adminPassword",
      "passwordToggle",
      "loginButton",
      "loginStatus",
      "dashboard",
      "analyticsMain",
      "freshness",
      "freshnessText",
      "refreshButton",
      "exportButton",
      "logoutButton",
      "adminIdentity",
      "sessionExpiry",
      "rangePresets",
      "customRangeForm",
      "dateFrom",
      "dateTo",
      "rangeCaption",
      "errorState",
      "errorMessage",
      "retryButton",
      "emptyState",
      "metricsGrid",
      "metricHumanViews",
      "metricVisitors",
      "metricIps",
      "metricSessions",
      "metricViewsPerSession",
      "trafficChart",
      "chartDescription",
      "chartLoading",
      "trafficDonut",
      "humanShare",
      "breakdownHuman",
      "breakdownBots",
      "breakdownTotal",
      "pagesMeta",
      "pagesTable",
      "referrerList",
      "campaignList",
      "countryList",
      "deviceList",
      "rawModeNote",
      "recentTable",
      "recentMeta",
      "loadMoreButton",
      "revealDialog",
      "revealForm",
      "revealClose",
      "revealCancel",
      "revealCopy",
      "revealContext",
      "revealMaskedIp",
      "reauthPassword",
      "revealedResult",
      "revealedIp",
      "revealStatus",
      "revealConfirm",
      "toast"
    ].forEach(function (id) {
      elements[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.passwordToggle.addEventListener("click", togglePasswordVisibility);
    elements.logoutButton.addEventListener("click", handleLogout);
    elements.refreshButton.addEventListener("click", loadDashboard);
    elements.retryButton.addEventListener("click", loadDashboard);
    elements.exportButton.addEventListener("click", exportCsv);
    elements.rangePresets.addEventListener("click", handleRangePreset);
    elements.customRangeForm.addEventListener("submit", handleCustomRange);
    elements.loadMoreButton.addEventListener("click", loadMoreRecent);
    elements.recentTable.addEventListener("click", handleRecentTableClick);
    elements.revealForm.addEventListener("submit", handleReveal);
    elements.revealClose.addEventListener("click", closeRevealDialog);
    elements.revealCancel.addEventListener("click", closeRevealDialog);
    elements.revealDialog.addEventListener("close", clearRevealDialog);
    elements.revealDialog.addEventListener("cancel", function () {
      window.setTimeout(clearRevealDialog, 0);
    });

    document.querySelectorAll("[data-timezone]").forEach(function (button) {
      button.addEventListener("click", function () {
        setTimeDisplay(button.getAttribute("data-timezone"));
      });
    });

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && state.authenticated && sessionNeedsRefresh()) {
        checkSession();
      }
    });
  }

  async function checkSession() {
    setLoginPending(true);
    setLoginStatus("Checking secure session…", false);

    try {
      var session = await request("/session", { method: "GET" });
      applySession(session);
      showDashboard();
      await loadDashboard();
    } catch (error) {
      if (error.status === 401) {
        showUnauthorized("");
      } else {
        showUnauthorized("The secure session service is unavailable. Try again shortly.");
      }
    } finally {
      setLoginPending(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!elements.loginForm.reportValidity()) return;

    var password = elements.adminPassword.value;
    setLoginPending(true);
    setLoginStatus("Opening a secure session…", false);

    try {
      var loginPromise = request("/login", {
        method: "POST",
        body: { password: password },
        csrf: false
      });
      elements.adminPassword.value = "";
      password = "";

      var session = await loginPromise;
      applySession(session);
      showDashboard();
      await loadDashboard();
    } catch (error) {
      if (error.status === 401) {
        setLoginStatus("The password was not accepted.", true);
      } else if (error.status === 429) {
        setLoginStatus("Too many attempts. Wait a moment and try again.", true);
      } else {
        setLoginStatus("Sign-in is temporarily unavailable.", true);
      }
      elements.adminPassword.focus();
    } finally {
      password = "";
      elements.adminPassword.value = "";
      setLoginPending(false);
    }
  }

  async function handleLogout() {
    elements.logoutButton.disabled = true;

    try {
      await request("/logout", {
        method: "POST",
        body: {},
        csrf: true
      });
      showUnauthorized("You have been signed out.");
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        showUnauthorized("Your secure session has ended.");
      } else {
        showToast("Could not sign out. Your current session is still active.");
      }
    } finally {
      elements.logoutButton.disabled = false;
    }
  }

  function applySession(session) {
    state.authenticated = Boolean(session && session.authenticated);
    state.csrfToken = stringValue(session && session.csrfToken);
    state.adminIdentity = stringValue(session && session.adminIdentity) || "Administrator";
    state.sessionExpiresAt = stringValue(session && session.sessionExpiresAt);
    state.rawIpRevealEnabled = Boolean(session && session.rawIpRevealEnabled);

    elements.adminIdentity.textContent = state.adminIdentity;
    elements.sessionExpiry.textContent = state.sessionExpiresAt
      ? "Session ends " + formatDateTime(state.sessionExpiresAt, { short: true })
      : "Secure session";
    elements.rawModeNote.hidden = !state.rawIpRevealEnabled;
  }

  function showDashboard() {
    if (!state.authenticated) {
      showUnauthorized("");
      return;
    }

    elements.authView.hidden = true;
    elements.dashboard.hidden = false;
    setLoginStatus("", false);
    document.title = "First-party analytics — Backer";
  }

  function showUnauthorized(message) {
    if (state.requestController) {
      state.requestController.abort();
      state.requestController = null;
    }

    state.authenticated = false;
    state.csrfToken = "";
    state.adminIdentity = "";
    state.sessionExpiresAt = "";
    state.rawIpRevealEnabled = false;
    state.summary = null;
    state.recent = [];
    state.hasMore = false;

    closeRevealDialog();
    clearSensitiveUi();
    elements.dashboard.hidden = true;
    elements.authView.hidden = false;
    setLoginStatus(message || "", Boolean(message && message.indexOf("signed out") === -1));
    document.title = "Administrator access — Backer";

    window.setTimeout(function () {
      elements.adminPassword.focus();
    }, 0);
  }

  function clearSensitiveUi() {
    [
      elements.pagesTable,
      elements.referrerList,
      elements.campaignList,
      elements.countryList,
      elements.deviceList,
      elements.recentTable,
      elements.trafficChart
    ].forEach(function (node) {
      if (node) node.replaceChildren();
    });

    [
      elements.metricHumanViews,
      elements.metricVisitors,
      elements.metricIps,
      elements.metricSessions,
      elements.metricViewsPerSession,
      elements.breakdownHuman,
      elements.breakdownBots,
      elements.breakdownTotal,
      elements.humanShare
    ].forEach(function (node) {
      if (node) node.textContent = "—";
    });
  }

  async function loadDashboard() {
    if (!state.authenticated) return;

    if (state.requestController) state.requestController.abort();
    state.requestController = new AbortController();
    var signal = state.requestController.signal;

    setLoading(true);
    hideError();
    elements.emptyState.hidden = true;

    try {
      var query = buildRangeQuery();
      var responses = await Promise.all([
        request("/summary?" + query, { method: "GET", signal: signal }),
        request("/recent?" + query + "&limit=" + state.recentLimit, { method: "GET", signal: signal })
      ]);

      state.summary = responses[0] || {};
      state.recent = safeArray(responses[1] && responses[1].views);
      state.hasMore = Boolean(responses[1] && responses[1].hasMore);
      renderDashboard();
      elements.freshnessText.textContent = "Updated " + formatTime(new Date());
    } catch (error) {
      if (error.name === "AbortError") return;
      if (error.status === 401 || error.status === 403) {
        showUnauthorized("Your secure session expired. Sign in again.");
        return;
      }
      showError(error.status === 429 ? "The dashboard is refreshing too quickly. Wait a moment." : "Check the connection and server configuration, then retry.");
    } finally {
      if (state.requestController && state.requestController.signal === signal) {
        state.requestController = null;
        setLoading(false);
      }
    }
  }

  function renderDashboard() {
    var summary = state.summary || {};
    var totals = summary.totals || {};
    var humanViews = toNumber(totals.humanViews);
    var botViews = toNumber(totals.botViews);
    var uniqueVisitors = toNumber(totals.uniqueVisitors);
    var uniqueIps = toNumber(totals.uniqueIps);
    var sessions = toNumber(totals.sessions);
    var viewsPerSession = finiteNumber(totals.viewsPerSession, sessions > 0 ? humanViews / sessions : 0);

    elements.metricHumanViews.textContent = formatNumber(humanViews);
    elements.metricVisitors.textContent = formatNumber(uniqueVisitors);
    elements.metricIps.textContent = formatNumber(uniqueIps);
    elements.metricSessions.textContent = formatNumber(sessions);
    elements.metricViewsPerSession.textContent = formatDecimal(viewsPerSession);

    renderTrafficBreakdown(humanViews, botViews);
    renderChart(safeArray(summary.series));
    renderPages(safeArray(summary.pages));
    renderRankList(elements.referrerList, safeArray(summary.referrers), {
      label: function (item) { return item.referrerHostname || "Direct / unknown"; },
      detail: function () { return ""; },
      value: function (item) { return item.views; }
    });
    renderRankList(elements.campaignList, safeArray(summary.campaigns), {
      label: function (item) {
        return [item.source, item.medium].filter(Boolean).join(" / ") || "Unattributed";
      },
      detail: function (item) {
        return [item.campaign, item.id].filter(Boolean).join(" · ");
      },
      value: function (item) { return item.views; }
    });
    renderRankList(elements.countryList, safeArray(summary.countries), {
      label: function (item) { return item.country || "Unknown"; },
      detail: function (item) { return item.region || ""; },
      value: function (item) { return item.views; }
    });
    renderRankList(elements.deviceList, safeArray(summary.devices), {
      label: function (item) { return titleCase(item.deviceClass || "unknown"); },
      detail: function () { return ""; },
      value: function (item) { return item.views; }
    });
    renderRecent(state.recent);

    var totalScreened = humanViews + botViews;
    elements.emptyState.hidden = totalScreened > 0 || state.recent.length > 0;

    if (summary.range && summary.range.from && summary.range.to) {
      elements.rangeCaption.textContent =
        "UTC rollups · " + formatDate(summary.range.from) + " – " + formatDate(summary.range.to);
    } else {
      elements.rangeCaption.textContent = "UTC rollups · " + rangeLabel(state.range);
    }
  }

  function renderTrafficBreakdown(humanViews, botViews) {
    var total = humanViews + botViews;
    var humanPercent = total > 0 ? Math.round((humanViews / total) * 100) : 0;

    elements.humanShare.textContent = total > 0 ? humanPercent + "%" : "—";
    elements.breakdownHuman.textContent = formatNumber(humanViews);
    elements.breakdownBots.textContent = formatNumber(botViews);
    elements.breakdownTotal.textContent = formatNumber(total);
    elements.trafficDonut.style.background =
      "conic-gradient(var(--positive) 0%, var(--positive) " +
      humanPercent +
      "%, var(--bot) " +
      humanPercent +
      "%, var(--bot) 100%)";
    elements.trafficDonut.setAttribute(
      "aria-label",
      total > 0
        ? humanPercent + "% human traffic; " + formatNumber(botViews) + " filtered bot views"
        : "No screened traffic in this range"
    );
  }

  function renderChart(series) {
    elements.trafficChart.replaceChildren();
    var title = createSvg("title", { id: "chartTitle" });
    title.textContent = "Human and bot views over time";
    var description = createSvg("desc", { id: "chartDescription" });
    elements.trafficChart.append(title, description);
    elements.chartDescription = description;

    if (!series.length) {
      appendSvgText(elements.trafficChart, 500, 150, "No time-series data in this range", "chart-axis-label", "middle");
      elements.chartDescription.textContent = "No analytics data is available for this date range.";
      return;
    }

    var width = 1000;
    var height = 300;
    var left = 54;
    var right = 22;
    var top = 18;
    var bottom = 42;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var maxValue = Math.max.apply(
      null,
      series.map(function (point) {
        return Math.max(toNumber(point.humanViews), toNumber(point.botViews));
      }).concat([1])
    );
    var roundedMax = niceMax(maxValue);

    for (var gridIndex = 0; gridIndex <= 4; gridIndex += 1) {
      var ratio = gridIndex / 4;
      var y = top + plotHeight * ratio;
      var line = createSvg("line", {
        x1: left,
        y1: y,
        x2: width - right,
        y2: y,
        "class": "chart-grid"
      });
      elements.trafficChart.appendChild(line);
      appendSvgText(
        elements.trafficChart,
        left - 10,
        y + 3,
        formatCompact(Math.round(roundedMax * (1 - ratio))),
        "chart-axis-label",
        "end"
      );
    }

    var humanPoints = [];
    var botPoints = [];
    series.forEach(function (point, index) {
      var x = series.length === 1 ? left + plotWidth / 2 : left + (plotWidth * index) / (series.length - 1);
      humanPoints.push({
        x: x,
        y: top + plotHeight - (toNumber(point.humanViews) / roundedMax) * plotHeight
      });
      botPoints.push({
        x: x,
        y: top + plotHeight - (toNumber(point.botViews) / roundedMax) * plotHeight
      });
    });

    var humanPath = pointsToPath(humanPoints);
    var botPath = pointsToPath(botPoints);
    var areaPath =
      humanPath +
      " L " +
      humanPoints[humanPoints.length - 1].x +
      " " +
      (top + plotHeight) +
      " L " +
      humanPoints[0].x +
      " " +
      (top + plotHeight) +
      " Z";

    elements.trafficChart.appendChild(createSvg("path", { d: areaPath, "class": "chart-human-area" }));
    elements.trafficChart.appendChild(createSvg("path", { d: botPath, "class": "chart-bot-line" }));
    elements.trafficChart.appendChild(createSvg("path", { d: humanPath, "class": "chart-human-line" }));

    humanPoints.forEach(function (point, index) {
      if (series.length <= 14 || index === 0 || index === series.length - 1 || index % Math.ceil(series.length / 10) === 0) {
        elements.trafficChart.appendChild(
          createSvg("circle", {
            cx: point.x,
            cy: point.y,
            r: 2.8,
            "class": "chart-point"
          })
        );
      }
    });

    var labelIndexes = chartLabelIndexes(series.length);
    labelIndexes.forEach(function (index) {
      var x = series.length === 1 ? left + plotWidth / 2 : left + (plotWidth * index) / (series.length - 1);
      appendSvgText(
        elements.trafficChart,
        x,
        height - 12,
        formatSeriesDate(series[index].date),
        "chart-axis-label",
        index === 0 ? "start" : index === series.length - 1 ? "end" : "middle"
      );
    });

    var humanTotal = series.reduce(function (sum, point) { return sum + toNumber(point.humanViews); }, 0);
    var botTotal = series.reduce(function (sum, point) { return sum + toNumber(point.botViews); }, 0);
    elements.chartDescription.textContent =
      formatNumber(humanTotal) +
      " human views and " +
      formatNumber(botTotal) +
      " filtered bot views from " +
      formatDate(series[0].date) +
      " through " +
      formatDate(series[series.length - 1].date) +
      ".";
  }

  function renderPages(pages) {
    elements.pagesTable.replaceChildren();
    elements.pagesMeta.textContent = pages.length ? pages.length + " canonical " + pluralize(pages.length, "route", "routes") : "Canonical routes only";

    if (!pages.length) {
      elements.pagesTable.appendChild(emptyTableRow(6, "No page totals in this range."));
      return;
    }

    pages.forEach(function (page) {
      var row = document.createElement("tr");
      var pageCell = document.createElement("td");
      pageCell.className = "page-cell";
      var pageName = document.createElement("strong");
      pageName.textContent = titleCase(page.pageKey || "Unknown page");
      var path = document.createElement("small");
      path.textContent = page.path || "/";
      pageCell.append(pageName, path);
      row.appendChild(pageCell);
      row.appendChild(numberCell(page.humanViews));
      row.appendChild(numberCell(page.uniqueVisitors));
      row.appendChild(numberCell(page.uniqueIps));
      row.appendChild(numberCell(page.sessions));

      var latest = document.createElement("td");
      latest.textContent = page.latestViewAt ? formatDateTime(page.latestViewAt) : "—";
      row.appendChild(latest);
      elements.pagesTable.appendChild(row);
    });
  }

  function renderRankList(container, items, options) {
    container.replaceChildren();
    var sorted = items.slice().sort(function (a, b) {
      return toNumber(options.value(b)) - toNumber(options.value(a));
    }).slice(0, 8);

    if (!sorted.length) {
      var empty = document.createElement("div");
      empty.className = "rank-empty";
      empty.textContent = "No data in this range";
      container.appendChild(empty);
      return;
    }

    var maxValue = Math.max.apply(null, sorted.map(function (item) { return toNumber(options.value(item)); }).concat([1]));
    sorted.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "rank-row";

      var labelWrap = document.createElement("div");
      var label = document.createElement("div");
      label.className = "rank-label";
      label.textContent = options.label(item);
      labelWrap.appendChild(label);

      var detailText = options.detail(item);
      if (detailText) {
        var detail = document.createElement("span");
        detail.className = "rank-detail";
        detail.textContent = detailText;
        labelWrap.appendChild(detail);
      }

      var value = document.createElement("span");
      value.className = "rank-value";
      value.textContent = formatNumber(options.value(item));

      var track = document.createElement("div");
      track.className = "rank-track";
      var fill = document.createElement("i");
      fill.style.setProperty("--rank-width", Math.max(3, (toNumber(options.value(item)) / maxValue) * 100) + "%");
      track.appendChild(fill);
      row.append(labelWrap, value, track);
      container.appendChild(row);
    });
  }

  function renderRecent(views) {
    elements.recentTable.replaceChildren();
    elements.rawModeNote.hidden = !state.rawIpRevealEnabled;

    if (!views.length) {
      elements.recentTable.appendChild(emptyTableRow(8, "No recent consented views in this range."));
      elements.recentMeta.textContent = "No recent records";
      elements.loadMoreButton.hidden = true;
      return;
    }

    views.forEach(function (view) {
      var row = document.createElement("tr");
      row.appendChild(textCell(view.viewedAt ? formatDateTime(view.viewedAt) : "—", "mono-value"));

      var pageCell = document.createElement("td");
      pageCell.className = "source-cell";
      var pageName = document.createElement("strong");
      pageName.textContent = titleCase(view.pageKey || "Unknown page");
      var pagePath = document.createElement("small");
      pagePath.textContent = view.path || "/";
      pageCell.append(pageName, pagePath);
      row.appendChild(pageCell);

      row.appendChild(textCell(view.maskedIp || "Unavailable", "mono-value"));
      row.appendChild(textCell([view.country, view.region].filter(Boolean).join(" · ") || "Unknown"));
      row.appendChild(textCell(view.referrerHostname || "Direct / unknown"));
      row.appendChild(textCell(titleCase(view.deviceClass || "unknown")));

      var classCell = document.createElement("td");
      var classification = document.createElement("span");
      classification.className = "class-pill" + (view.bot ? " is-bot" : "");
      classification.textContent = view.bot ? "Filtered bot" : "Human";
      classCell.appendChild(classification);
      row.appendChild(classCell);

      var actionCell = document.createElement("td");
      if (state.rawIpRevealEnabled && view.revealEligible !== false && view.id && view.maskedIp) {
        var revealButton = document.createElement("button");
        revealButton.type = "button";
        revealButton.className = "reveal-button";
        revealButton.textContent = "Reveal";
        revealButton.setAttribute("data-reveal-id", view.id);
        revealButton.setAttribute("data-masked-ip", view.maskedIp);
        revealButton.setAttribute("aria-label", "Reveal exact IP for view at " + formatDateTime(view.viewedAt));
        actionCell.appendChild(revealButton);
      } else {
        actionCell.textContent = "—";
      }
      row.appendChild(actionCell);
      elements.recentTable.appendChild(row);
    });

    elements.recentMeta.textContent =
      formatNumber(views.length) +
      " recent " +
      pluralize(views.length, "record", "records") +
      (state.hasMore ? " · more available" : "");
    elements.loadMoreButton.hidden = !state.hasMore || state.recentLimit >= MAX_RECENT_LIMIT;
  }

  function handleRangePreset(event) {
    var button = event.target.closest("[data-range]");
    if (!button) return;
    var range = button.getAttribute("data-range");
    if (!["today", "7d", "30d", "90d", "custom"].includes(range)) return;

    state.range = range;
    state.recentLimit = DEFAULT_RECENT_LIMIT;
    document.querySelectorAll("[data-range]").forEach(function (item) {
      var active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    elements.customRangeForm.hidden = range !== "custom";

    if (range !== "custom") loadDashboard();
    else elements.dateFrom.focus();
  }

  function handleCustomRange(event) {
    event.preventDefault();
    if (!elements.customRangeForm.reportValidity()) return;

    var from = elements.dateFrom.value;
    var to = elements.dateTo.value;
    if (!from || !to || from > to) {
      showError("Choose a valid custom date range.");
      return;
    }

    var maxSpan = 89 * 24 * 60 * 60 * 1000;
    if (new Date(to + "T00:00:00Z").getTime() - new Date(from + "T00:00:00Z").getTime() > maxSpan) {
      showError("Custom ranges are limited to 90 calendar days.");
      return;
    }

    state.from = from;
    state.to = to;
    state.recentLimit = DEFAULT_RECENT_LIMIT;
    loadDashboard();
  }

  function setDefaultCustomDates() {
    var today = new Date();
    var sevenDaysAgo = new Date(today.getTime());
    sevenDaysAgo.setDate(today.getDate() - 6);
    state.from = dateInputValue(sevenDaysAgo);
    state.to = dateInputValue(today);
    elements.dateFrom.value = state.from;
    elements.dateTo.value = state.to;
    elements.dateFrom.max = state.to;
    elements.dateTo.max = state.to;
  }

  function buildRangeQuery() {
    var params = new URLSearchParams();
    params.set("range", state.range);
    if (state.range === "custom") {
      params.set("from", state.from);
      params.set("to", state.to);
    }
    return params.toString();
  }

  function loadMoreRecent() {
    if (state.recentLimit >= MAX_RECENT_LIMIT) return;
    state.recentLimit = MAX_RECENT_LIMIT;
    loadDashboard();
  }

  function handleRecentTableClick(event) {
    var button = event.target.closest("[data-reveal-id]");
    if (!button) return;
    openRevealDialog(button.getAttribute("data-reveal-id"), button.getAttribute("data-masked-ip"));
  }

  function openRevealDialog(viewId, maskedIp) {
    if (!state.rawIpRevealEnabled || !viewId) return;
    clearRevealDialog();
    state.pendingRevealId = viewId;
    state.pendingMaskedIp = maskedIp || "Unavailable";
    elements.revealMaskedIp.textContent = state.pendingMaskedIp;
    elements.revealContext.hidden = false;
    elements.revealDialog.showModal();
    window.setTimeout(function () {
      elements.reauthPassword.focus();
    }, 0);
  }

  async function handleReveal(event) {
    event.preventDefault();
    if (!state.pendingRevealId || !state.rawIpRevealEnabled) return;
    if (!elements.revealForm.reportValidity()) return;

    var password = elements.reauthPassword.value;
    var viewId = state.pendingRevealId;
    setRevealPending(true);
    setRevealStatus("Re-authenticating…", false);

    try {
      var reauthPromise = request("/reauth", {
        method: "POST",
        body: { password: password },
        csrf: true
      });
      elements.reauthPassword.value = "";
      password = "";
      await reauthPromise;

      setRevealStatus("Opening the protected record…", false);
      var result = await request("/reveal", {
        method: "POST",
        body: { viewId: viewId },
        csrf: true
      });

      if (!result || !result.ip) throw createClientError("The server returned no exact IP.");
      elements.revealedIp.textContent = result.ip;
      elements.revealedResult.hidden = false;
      elements.revealContext.hidden = true;
      elements.reauthPassword.parentElement.hidden = true;
      elements.revealConfirm.hidden = true;
      elements.revealCancel.textContent = "Close and clear";
      setRevealStatus("Reveal recorded in the administrator audit log.", false);
    } catch (error) {
      if (error.status === 401) {
        closeRevealDialog();
        showUnauthorized("Your secure session expired. Sign in again.");
        return;
      }
      if (error.status === 403) {
        setRevealStatus("Re-authentication failed, expired, or exact-IP mode is disabled.", true);
      } else if (error.status === 404 || error.status === 410) {
        setRevealStatus("This record is no longer eligible for an exact-IP reveal.", true);
      } else if (error.status === 429) {
        setRevealStatus("Too many reveal attempts. Wait before trying again.", true);
      } else {
        setRevealStatus("The protected value could not be revealed.", true);
      }
    } finally {
      password = "";
      elements.reauthPassword.value = "";
      setRevealPending(false);
    }
  }

  function closeRevealDialog() {
    if (elements.revealDialog.open) elements.revealDialog.close();
    clearRevealDialog();
  }

  function clearRevealDialog() {
    state.pendingRevealId = "";
    state.pendingMaskedIp = "";
    elements.reauthPassword.value = "";
    elements.revealedIp.textContent = "";
    elements.revealedResult.hidden = true;
    elements.revealContext.hidden = false;
    elements.reauthPassword.parentElement.hidden = false;
    elements.revealConfirm.hidden = false;
    elements.revealCancel.textContent = "Cancel";
    elements.revealMaskedIp.textContent = "—";
    setRevealStatus("", false);
  }

  async function exportCsv() {
    if (!state.authenticated) return;
    elements.exportButton.disabled = true;
    elements.exportButton.textContent = "Preparing…";

    try {
      var response = await fetch(API_BASE + "/export?" + buildRangeQuery(), {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "text/csv" },
        cache: "no-store"
      });

      if (response.status === 401 || response.status === 403) {
        showUnauthorized("Your secure session expired. Sign in again.");
        return;
      }
      if (!response.ok) throw createHttpError(response.status, "Export failed");

      var blob = await response.blob();
      var downloadUrl = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "backer-analytics-" + state.range + "-" + dateInputValue(new Date()) + ".csv";
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 0);
      showToast("CSV export downloaded. Exact IPs are never included.");
    } catch (error) {
      showToast("CSV export is temporarily unavailable.");
    } finally {
      elements.exportButton.disabled = false;
      elements.exportButton.textContent = "Export CSV";
    }
  }

  function setTimeDisplay(display) {
    if (display !== "local" && display !== "utc") return;
    state.timeDisplay = display;
    document.querySelectorAll("[data-timezone]").forEach(function (button) {
      var active = button.getAttribute("data-timezone") === display;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (state.sessionExpiresAt) {
      elements.sessionExpiry.textContent = "Session ends " + formatDateTime(state.sessionExpiresAt, { short: true });
    }
    if (state.summary) renderDashboard();
  }

  function setLoading(loading) {
    elements.metricsGrid.setAttribute("aria-busy", String(loading));
    elements.chartLoading.hidden = !loading;
    elements.freshness.classList.toggle("is-loading", loading);
    elements.refreshButton.disabled = loading;
    elements.rangePresets.querySelectorAll("button").forEach(function (button) {
      button.disabled = loading;
    });
  }

  function setLoginPending(pending) {
    elements.loginButton.disabled = pending;
    elements.adminPassword.disabled = pending;
    elements.passwordToggle.disabled = pending;
    elements.loginButton.querySelector("span:first-child").textContent = pending ? "Checking…" : "Open analytics";
  }

  function setRevealPending(pending) {
    elements.revealConfirm.disabled = pending;
    elements.revealCancel.disabled = pending;
    elements.revealClose.disabled = pending;
    elements.revealConfirm.textContent = pending ? "Verifying…" : "Re-authenticate & reveal";
  }

  function togglePasswordVisibility() {
    var showing = elements.adminPassword.type === "text";
    elements.adminPassword.type = showing ? "password" : "text";
    elements.passwordToggle.textContent = showing ? "Show" : "Hide";
    elements.passwordToggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    elements.adminPassword.focus();
  }

  function setLoginStatus(message, isError) {
    elements.loginStatus.textContent = message;
    elements.loginStatus.style.color = isError ? "var(--negative)" : "var(--muted)";
  }

  function setRevealStatus(message, isError) {
    elements.revealStatus.textContent = message;
    elements.revealStatus.style.color = isError ? "var(--negative)" : "var(--muted)";
  }

  function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorState.hidden = false;
  }

  function hideError() {
    elements.errorState.hidden = true;
    elements.errorMessage.textContent = "";
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    state.toastTimer = window.setTimeout(function () {
      elements.toast.hidden = true;
      elements.toast.textContent = "";
    }, 4200);
  }

  async function request(path, options) {
    var requestOptions = options || {};
    var headers = new Headers(requestOptions.headers || {});
    headers.set("Accept", "application/json");

    var fetchOptions = {
      method: requestOptions.method || "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: headers,
      signal: requestOptions.signal
    };

    if (requestOptions.body !== undefined) {
      headers.set("Content-Type", "application/json");
      fetchOptions.body = JSON.stringify(requestOptions.body);
    }

    if (requestOptions.csrf) {
      if (!state.csrfToken) throw createClientError("Missing CSRF token");
      headers.set("X-CSRF-Token", state.csrfToken);
    }

    var response = await fetch(API_BASE + path, fetchOptions);
    var contentType = response.headers.get("content-type") || "";
    var payload = null;

    if (contentType.indexOf("application/json") !== -1) {
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }
    }

    if (!response.ok) {
      var message = payload && typeof payload.error === "string" ? payload.error : "Request failed";
      throw createHttpError(response.status, message);
    }

    return payload || {};
  }

  function createHttpError(status, message) {
    var error = new Error(message || "Request failed");
    error.status = status;
    return error;
  }

  function createClientError(message) {
    var error = new Error(message);
    error.status = 0;
    return error;
  }

  function numberCell(value) {
    var cell = document.createElement("td");
    cell.className = "number";
    cell.textContent = formatNumber(value);
    return cell;
  }

  function textCell(value, className) {
    var cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = value === null || value === undefined || value === "" ? "—" : String(value);
    return cell;
  }

  function emptyTableRow(columns, message) {
    var row = document.createElement("tr");
    row.className = "empty-row";
    var cell = document.createElement("td");
    cell.colSpan = columns;
    cell.textContent = message;
    row.appendChild(cell);
    return row;
  }

  function createSvg(tagName, attributes) {
    var element = document.createElementNS(SVG_NS, tagName);
    Object.keys(attributes || {}).forEach(function (name) {
      element.setAttribute(name, String(attributes[name]));
    });
    return element;
  }

  function appendSvgText(svg, x, y, value, className, anchor) {
    var text = createSvg("text", {
      x: x,
      y: y,
      "class": className || "",
      "text-anchor": anchor || "start"
    });
    text.textContent = value;
    svg.appendChild(text);
  }

  function pointsToPath(points) {
    return points
      .map(function (point, index) {
        return (index === 0 ? "M " : " L ") + point.x.toFixed(2) + " " + point.y.toFixed(2);
      })
      .join("");
  }

  function chartLabelIndexes(length) {
    if (length <= 1) return [0];
    var count = Math.min(5, length);
    var indexes = [];
    for (var index = 0; index < count; index += 1) {
      indexes.push(Math.round((index * (length - 1)) / (count - 1)));
    }
    return indexes.filter(function (value, index, array) {
      return array.indexOf(value) === index;
    });
  }

  function niceMax(value) {
    if (value <= 5) return 5;
    var power = Math.pow(10, Math.floor(Math.log10(value)));
    var normalized = value / power;
    var rounded = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return rounded * power;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(toNumber(value));
  }

  function formatCompact(value) {
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(toNumber(value));
  }

  function formatDecimal(value) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(finiteNumber(value, 0));
  }

  function formatDateTime(value, options) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    var short = options && options.short;
    var formatterOptions = short
      ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
      : { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" };
    if (state.timeDisplay === "utc") formatterOptions.timeZone = "UTC";
    return new Intl.DateTimeFormat(undefined, formatterOptions).format(date) + (state.timeDisplay === "utc" ? " UTC" : "");
  }

  function formatDate(value) {
    var date = new Date(String(value).slice(0, 10) + "T00:00:00Z");
    if (Number.isNaN(date.getTime())) return String(value || "—");
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }).format(date);
  }

  function formatSeriesDate(value) {
    var date = new Date(String(value).slice(0, 10) + "T00:00:00Z");
    if (Number.isNaN(date.getTime())) return String(value || "");
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }).format(date);
  }

  function formatTime(date) {
    var options = { hour: "2-digit", minute: "2-digit" };
    if (state.timeDisplay === "utc") options.timeZone = "UTC";
    return new Intl.DateTimeFormat(undefined, options).format(date) + (state.timeDisplay === "utc" ? " UTC" : "");
  }

  function dateInputValue(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, function (character) { return character.toUpperCase(); });
  }

  function rangeLabel(range) {
    return {
      today: "today",
      "7d": "last 7 days",
      "30d": "last 30 days",
      "90d": "last 90 days",
      custom: state.from + " – " + state.to
    }[range] || range;
  }

  function pluralize(count, singular, plural) {
    return Number(count) === 1 ? singular : plural;
  }

  function toNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  }

  function finiteNumber(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function stringValue(value) {
    return typeof value === "string" ? value : "";
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function sessionNeedsRefresh() {
    if (!state.sessionExpiresAt) return false;
    var expiresAt = new Date(state.sessionExpiresAt).getTime();
    return Number.isFinite(expiresAt) && expiresAt - Date.now() < 5 * 60 * 1000;
  }
})();
