(function () {
  var script = document.currentScript;
  var projectId = script && script.dataset ? script.dataset.project : null;
  if (!projectId) return;
  var runtimeUrl = new URL(window.location.href);
  var builderMode = runtimeUrl.searchParams.get("optify_builder") === "1";
  var builderOrigin = runtimeUrl.searchParams.get("optify_builder_origin") || "";

  var assignmentKey = "optify_assignments:" + projectId;
  var anonymousKey = "optify_anon:" + projectId;
  var sessionKey = "optify_session:" + projectId;
  var pageCountKey = "optify_page_count:" + projectId;
  var queueKey = "optify_event_queue:" + projectId;
  var recordingChunkIndexKey = "optify_recording_chunk_index:" + projectId;
  var origin = script.src && script.src.indexOf("http") === 0 ? new URL(script.src).origin : window.location.origin;
  var shopifyContext = window.__OPTIFY_SHOPIFY_CONTEXT || null;
  var pageStart = Date.now();
  var sessionStart = pageStart;
  var scrollMilestones = {};
  var recommendationObserver = null;
  var variantReapplyObservers = {};
  var activeExperiments = [];
  var assignments = {};
  var clickHistory = [];
  var startedForms = {};
  var submittedForms = {};
  var trackedVideoMilestones = {};
  var lastReplaySnapshotAt = 0;
  var lastHtmlSnapshotAt = 0;
  var exitSent = false;
  var flushTimer = null;
  var recordingFlushTimer = null;
  var debugState = {
    queueSize: 0,
    recordingQueueSize: 0,
    lastFlushAt: null,
    lastRecordingFlushAt: null,
    lastError: null,
    assignments: {},
    activeExperiments: [],
    experimentDetails: {}
  };
  var forcedExperimentId = runtimeUrl.searchParams.get("optify_experiment") || "";
  var forcedVariantKey = runtimeUrl.searchParams.get("optify_variant") || "";

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function getAnonymousId() {
    var existing = localStorage.getItem(anonymousKey);
    if (existing) return existing;
    var created = "anon_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(anonymousKey, created);
    return created;
  }

  function getSession() {
    var now = Date.now();
    var existing = safeJsonParse(sessionStorage.getItem(sessionKey) || "null", null);
    if (existing && typeof existing.id === "string" && now - existing.lastSeen < 30 * 60 * 1000) {
      existing.lastSeen = now;
      sessionStorage.setItem(sessionKey, JSON.stringify(existing));
      sessionStart = existing.startedAt || now;
      return { id: existing.id, isNew: false };
    }

    var created = {
      id: "sess_" + Math.random().toString(36).slice(2) + now.toString(36),
      startedAt: now,
      lastSeen: now
    };
    sessionStorage.setItem(sessionKey, JSON.stringify(created));
    sessionStart = now;
    return { id: created.id, isNew: true };
  }

  var session = getSession();

  function incrementPageCount() {
    var current = Number(sessionStorage.getItem(pageCountKey) || "0") + 1;
    sessionStorage.setItem(pageCountKey, String(current));
    return current;
  }

  var pagesInSession = incrementPageCount();

  function getAssignments() {
    return safeJsonParse(localStorage.getItem(assignmentKey) || "{}", {});
  }

  function saveAssignments(nextAssignments) {
    localStorage.setItem(assignmentKey, JSON.stringify(nextAssignments));
  }

  function getQueuedEvents() {
    return safeJsonParse(localStorage.getItem(queueKey) || "[]", []);
  }

  function saveQueuedEvents(events) {
    localStorage.setItem(queueKey, JSON.stringify(events.slice(-200)));
    debugState.queueSize = events.length;
  }

  function getRecordingQueueKey() {
    return "optify_recording_queue:" + projectId + ":" + session.id;
  }

  function getRecordingChunkIndexKey() {
    return recordingChunkIndexKey + ":" + session.id;
  }

  function getQueuedRecordingFrames() {
    return safeJsonParse(localStorage.getItem(getRecordingQueueKey()) || "[]", []);
  }

  function saveQueuedRecordingFrames(frames) {
    localStorage.setItem(getRecordingQueueKey(), JSON.stringify(frames.slice(-40)));
    debugState.recordingQueueSize = frames.length;
  }

  function getRecordingChunkIndex() {
    return Number(localStorage.getItem(getRecordingChunkIndexKey()) || "0") || 0;
  }

  function incrementRecordingChunkIndex() {
    var next = getRecordingChunkIndex() + 1;
    localStorage.setItem(getRecordingChunkIndexKey(), String(next));
    return next;
  }

  function simpleHash(value) {
    var hash = 2166136261;
    for (var index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return Math.abs(hash >>> 0);
  }

  function pickVariant(variants, seed) {
    var total = variants.reduce(function (sum, variant) {
      return sum + variant.allocation;
    }, 0);
    var roll = (simpleHash(seed) % total);
    for (var index = 0; index < variants.length; index += 1) {
      roll -= variants[index].allocation;
      if (roll <= 0) return variants[index];
    }
    return variants[0];
  }

  function isUserInExperiment(experimentId, trafficSplit, seed) {
    var normalizedSplit = Math.max(0, Math.min(100, Number(trafficSplit || 100)));
    if (normalizedSplit >= 100) return true;
    if (normalizedSplit <= 0) return false;
    var bucket = simpleHash(seed + ":" + experimentId + ":traffic") % 100;
    return bucket < normalizedSplit;
  }

  function matchesPattern(pattern, pathname) {
    if (pattern === pathname) return true;
    if (pattern.slice(-1) === "*") return pathname.indexOf(pattern.slice(0, -1)) === 0;
    return pathname.indexOf(pattern) !== -1;
  }

  function getFallbackSelectors(selector) {
    var normalized = String(selector || "").toLowerCase();
    var fallbacks = [];
    var looksLikeAtc =
      normalized.indexOf("add-to-cart") !== -1 ||
      normalized.indexOf("/cart/add") !== -1 ||
      normalized.indexOf("productsubmitbutton") !== -1 ||
      normalized.indexOf("[name='add']") !== -1 ||
      normalized.indexOf('[name="add"]') !== -1 ||
      normalized.indexOf("[data-add-to-cart]") !== -1;

    if (looksLikeAtc || inferShopifyPageType() === "product") {
      fallbacks = [
        "form[action*='/cart/add'] [type='submit']",
        "product-form [type='submit']",
        "button[name='add']",
        "button[id*='ProductSubmitButton']",
        ".product-form__submit",
        "[data-add-to-cart]",
        "[data-product-form] [type='submit']"
      ];
    }

    return [selector].concat(fallbacks).filter(function (value, index, list) {
      return value && list.indexOf(value) === index;
    });
  }

  function resolveChangeTargets(change) {
    var selectors = getFallbackSelectors(change.selector);
    var firstMatch = null;

    function isVisibleElement(element) {
      if (!element) return false;
      var rect = element.getBoundingClientRect ? element.getBoundingClientRect() : null;
      var style = window.getComputedStyle ? window.getComputedStyle(element) : null;
      if (!rect) return false;
      if (rect.width <= 0 || rect.height <= 0) return false;
      if (style && (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")) return false;
      if (element.disabled) return false;
      return true;
    }

    function scoreElement(element) {
      var score = 0;
      var tag = element && element.tagName ? element.tagName.toLowerCase() : "";
      var text = (element && element.textContent ? element.textContent : "").toLowerCase();
      var type = element && element.getAttribute ? (element.getAttribute("type") || "").toLowerCase() : "";
      var name = element && element.getAttribute ? (element.getAttribute("name") || "").toLowerCase() : "";
      var id = element && element.id ? element.id.toLowerCase() : "";
      var className = element && typeof element.className === "string" ? element.className.toLowerCase() : "";

      if (isVisibleElement(element)) score += 100;
      if (tag === "button") score += 60;
      if (type === "submit") score += 40;
      if (name === "add") score += 40;
      if (id.indexOf("productsubmitbutton") !== -1) score += 40;
      if (className.indexOf("product-form__submit") !== -1) score += 35;
      if (text.indexOf("add to cart") !== -1 || text.indexOf("ajouter au panier") !== -1) score += 30;
      return score;
    }

    for (var index = 0; index < selectors.length; index += 1) {
      try {
        var elements = Array.prototype.slice.call(document.querySelectorAll(selectors[index]));
        if (elements && elements.length) {
          if (!firstMatch) {
            firstMatch = {
              selector: selectors[index],
              elements: elements
            };
          }
          var bestElements = elements
            .map(function (element) {
              return { element: element, score: scoreElement(element) };
            })
            .sort(function (left, right) {
              return right.score - left.score;
            })
            .filter(function (entry) {
              return entry.score > 0;
            })
            .map(function (entry) {
              return entry.element;
            });
          if (bestElements.length) {
            return {
              selector: selectors[index],
              elements: bestElements
            };
          }
        }
      } catch (error) {}
    }

    return firstMatch || {
      selector: change.selector,
      elements: []
    };
  }

  function applyChanges(changes, experimentId, variantKey) {
    var appliedCount = 0;
    var matchedSelectors = [];

    function applyDeclarationString(element, cssText) {
      String(cssText || "")
        .split(";")
        .map(function (chunk) { return chunk.trim(); })
        .filter(Boolean)
        .forEach(function (chunk) {
          var parts = chunk.split(":");
          if (parts.length < 2) return;
          var property = parts.shift().trim();
          var rawValue = parts.join(":").trim();
          var important = /!important$/i.test(rawValue);
          var value = rawValue.replace(/\s*!important$/i, "").trim();
          if (!property || !value) return;
          element.style.setProperty(property, value, important ? "important" : "");
        });
    }

    changes.forEach(function (change) {
      var resolution = resolveChangeTargets(change);
      Array.prototype.forEach.call(resolution.elements, function (element) {
        if (change.type === "text" || change.type === "cta") {
          element.textContent = change.value;
        }
        if (change.type === "visibility") {
          element.style.display = change.value === "hide" ? "none" : "";
        }
        if (change.type === "style") {
          applyDeclarationString(element, change.value);
          Array.prototype.forEach.call(element.querySelectorAll("*"), function (child) {
            if (String(change.value || "").toLowerCase().indexOf("color") !== -1) {
              child.style.setProperty("color", element.style.color || "#ffffff", "important");
            }
            if (String(change.value || "").toLowerCase().indexOf("fill") !== -1) {
              child.style.setProperty("fill", "currentColor", "important");
            }
            if (String(change.value || "").toLowerCase().indexOf("stroke") !== -1) {
              child.style.setProperty("stroke", "currentColor", "important");
            }
          });
        }
        appliedCount += 1;
      });
      matchedSelectors.push({
        requested: change.selector,
        matched: resolution.selector,
        count: resolution.elements.length
      });
    });
    if (experimentId) {
      debugState.experimentDetails[experimentId] = debugState.experimentDetails[experimentId] || {};
      debugState.experimentDetails[experimentId].variantKey = variantKey || null;
      debugState.experimentDetails[experimentId].matchedSelectors = matchedSelectors;
      debugState.experimentDetails[experimentId].appliedCount = appliedCount;
    }
    return appliedCount;
  }

  function scheduleVariantReapply(experiment, variant) {
    if (!experiment || !variant || !variant.changes || !variant.changes.length) return;
    if (variantReapplyObservers[experiment.id]) return;

    [120, 600, 1600, 3200].forEach(function (delay) {
      window.setTimeout(function () {
        applyChanges(variant.changes || [], experiment.id, variant.key);
      }, delay);
    });

    if (!("MutationObserver" in window)) return;
    var throttled = false;
    var observer = new MutationObserver(function () {
      if (throttled) return;
      throttled = true;
      window.setTimeout(function () {
        throttled = false;
        applyChanges(variant.changes || [], experiment.id, variant.key);
      }, 180);
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true
    });
    variantReapplyObservers[experiment.id] = observer;
    window.setTimeout(function () {
      if (variantReapplyObservers[experiment.id]) {
        variantReapplyObservers[experiment.id].disconnect();
        delete variantReapplyObservers[experiment.id];
      }
    }, 5000);
  }

  function applyCustomCode(code) {
    if (!code) return;
    try {
      var fn = new Function("document", "window", code);
      fn(document, window);
    } catch (error) {}
  }

  function detectDevice() {
    var ua = navigator.userAgent || "";
    if (/tablet|ipad/i.test(ua)) return "tablet";
    if (/mobi|android/i.test(ua)) return "mobile";
    return "desktop";
  }

  function detectDeviceFamily() {
    var ua = navigator.userAgent || "";
    if (/iphone/i.test(ua)) return "iphone";
    if (/ipad/i.test(ua)) return "ipad";
    if (/android/i.test(ua)) return "android";
    if (/windows/i.test(ua)) return "windows";
    if (/mac os/i.test(ua)) return "mac";
    return "generic";
  }

  function detectBrowser() {
    var ua = navigator.userAgent || "";
    if (/edg/i.test(ua)) return "edge";
    if (/chrome|crios/i.test(ua)) return "chrome";
    if (/firefox|fxios/i.test(ua)) return "firefox";
    if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return "safari";
    return "unknown";
  }

  function detectOs() {
    var ua = navigator.userAgent || "";
    if (/windows/i.test(ua)) return "windows";
    if (/mac os/i.test(ua)) return "macos";
    if (/android/i.test(ua)) return "android";
    if (/iphone|ipad|ios/i.test(ua)) return "ios";
    if (/linux/i.test(ua)) return "linux";
    return "unknown";
  }

  function inferShopifyPageType() {
    var explicit = (script.dataset && script.dataset.shopifyPageType) || (shopifyContext && shopifyContext.pageType) || "";
    if (explicit) return explicit;
    var pathname = window.location.pathname || "/";
    if (pathname === "/") return "index";
    if (pathname.indexOf("/products/") === 0) return "product";
    if (pathname.indexOf("/collections/") === 0) return "collection";
    if (pathname === "/cart") return "cart";
    if (pathname.indexOf("/search") === 0) return "search";
    if (pathname.indexOf("/checkouts") !== -1 || pathname.indexOf("/checkout") === 0) return "checkout";
    if (pathname.indexOf("/blogs/") === 0) return "blog";
    if (pathname.indexOf("/pages/") === 0) return "page";
    return "";
  }

  function getVisitorType() {
    var key = "optify_visitor_seen:" + projectId;
    var existing = localStorage.getItem(key);
    if (existing) return "returning";
    localStorage.setItem(key, "1");
    return "new";
  }

  function baseContext() {
    var url = new URL(window.location.href);
    var pageType = inferShopifyPageType();
    return {
      sessionId: session.id,
      pageType: pageType || undefined,
      templateName: (script.dataset && script.dataset.shopifyTemplate) || (shopifyContext && shopifyContext.templateName) || undefined,
      shopDomain: (script.dataset && script.dataset.shopifyShop) || (shopifyContext && shopifyContext.shopDomain) || undefined,
      storefrontDomain: shopifyContext && shopifyContext.storefrontDomain || undefined,
      themeId: (script.dataset && script.dataset.shopifyTheme) || (shopifyContext && shopifyContext.themeId) || undefined,
      themeName: (script.dataset && script.dataset.shopifyThemeName) || (shopifyContext && shopifyContext.themeName) || undefined,
      referrer: document.referrer || "",
      source: url.searchParams.get("utm_source") || "",
      medium: url.searchParams.get("utm_medium") || "",
      campaign: url.searchParams.get("utm_campaign") || "",
      term: url.searchParams.get("utm_term") || "",
      content: url.searchParams.get("utm_content") || "",
      pageUrl: window.location.href,
      queryString: url.search || "",
      device: detectDevice(),
      deviceFamily: detectDeviceFamily(),
      browser: detectBrowser(),
      os: detectOs(),
      language: navigator.language || "",
      visitorType: getVisitorType(),
      country: (shopifyContext && shopifyContext.country) || undefined,
      region: (shopifyContext && shopifyContext.region) || undefined,
      city: (shopifyContext && shopifyContext.city) || undefined,
      viewportWidth: window.innerWidth || 0,
      viewportHeight: window.innerHeight || 0,
      pageTitle: document.title || "",
      pagesInSession: pagesInSession
    };
  }

  function findExperimentContext(metadata) {
    var experimentId = metadata && metadata.experimentId ? metadata.experimentId : activeExperiments[0] && activeExperiments[0].id;
    var variantKey = metadata && metadata.variantKey ? metadata.variantKey : experimentId ? assignments[experimentId] : null;

    return {
      experimentId: experimentId || "__sdk__",
      variantKey: variantKey || "sitewide"
    };
  }

  function flushQueue(useBeacon) {
    var queued = getQueuedEvents();
    if (!queued.length) return;
    var body = JSON.stringify({ events: queued.slice(0, 20) });

    if (useBeacon && navigator.sendBeacon) {
      var ok = navigator.sendBeacon(origin + "/api/sdk/events", new Blob([body], { type: "application/json" }));
      if (ok) {
        saveQueuedEvents(queued.slice(20));
        debugState.lastFlushAt = new Date().toISOString();
      }
      return;
    }

    fetch(origin + "/api/sdk/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: body,
      keepalive: useBeacon
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to flush event batch");
      }
      saveQueuedEvents(queued.slice(20));
      debugState.lastFlushAt = new Date().toISOString();
      if (getQueuedEvents().length > 0) {
        flushQueue(false);
      }
    }).catch(function (error) {
      debugState.lastError = error && error.message ? error.message : "Event flush failed";
    });
  }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = window.setTimeout(function () {
      flushTimer = null;
      flushQueue(false);
    }, 500);
  }

  function enqueuePayload(payload, useBeacon) {
    var queued = getQueuedEvents();
    queued.push(payload);
    saveQueuedEvents(queued);
    if (useBeacon) {
      flushQueue(true);
      return;
    }
    scheduleFlush();
  }

  function flushRecordingQueue(useBeacon) {
    var queued = getQueuedRecordingFrames();
    if (!queued.length) return;

    var chunkSize = 5;
    var frames = queued.slice(0, chunkSize);
    var body = JSON.stringify({
      projectId: projectId,
      anonymousId: getAnonymousId(),
      sessionId: session.id,
      startedAt: new Date(sessionStart).toISOString(),
      endedAt: frames[frames.length - 1].timestamp || new Date().toISOString(),
      chunkIndex: getRecordingChunkIndex(),
      frames: frames
    });

    if (useBeacon && navigator.sendBeacon) {
      var ok = navigator.sendBeacon(origin + "/api/sdk/recordings", new Blob([body], { type: "application/json" }));
      if (ok) {
        saveQueuedRecordingFrames(queued.slice(chunkSize));
        incrementRecordingChunkIndex();
        debugState.lastRecordingFlushAt = new Date().toISOString();
      }
      return;
    }

    fetch(origin + "/api/sdk/recordings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: body,
      keepalive: useBeacon
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to flush recording batch");
      }
      saveQueuedRecordingFrames(queued.slice(chunkSize));
      incrementRecordingChunkIndex();
      debugState.lastRecordingFlushAt = new Date().toISOString();
      if (getQueuedRecordingFrames().length > 0) {
        flushRecordingQueue(false);
      }
    }).catch(function (error) {
      debugState.lastError = error && error.message ? error.message : "Recording flush failed";
    });
  }

  function scheduleRecordingFlush() {
    if (recordingFlushTimer) return;
    recordingFlushTimer = window.setTimeout(function () {
      recordingFlushTimer = null;
      flushRecordingQueue(false);
    }, 900);
  }

  function enqueueRecordingFrame(frame, useBeacon) {
    var queued = getQueuedRecordingFrames();
    queued.push(frame);
    saveQueuedRecordingFrames(queued);
    if (useBeacon || queued.length >= 5) {
      flushRecordingQueue(!!useBeacon);
      return;
    }
    scheduleRecordingFlush();
  }

  function getDocumentHeight() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight || 0, 1);
  }

  function normalizeText(value, maxLength) {
    if (!value) return "";
    return String(value).replace(/\s+/g, " ").trim().slice(0, maxLength || 120);
  }

  function shouldCaptureReplay(eventType) {
    return [
      "page_view",
      "click",
      "rage_click",
      "dead_click",
      "add_to_cart",
      "checkout_start",
      "purchase",
      "conversion",
      "scroll_depth",
      "js_error"
    ].indexOf(eventType) !== -1;
  }

  function serializeReplayNode(element, depth, targetElement) {
    if (!element || depth > 3) return null;
    var tag = element.tagName ? element.tagName.toLowerCase() : "div";
    var role = element.getAttribute ? element.getAttribute("role") || undefined : undefined;
    var text = normalizeText(element.innerText || element.textContent || "", depth === 0 ? 90 : 60);
    var children = [];
    var childElements = Array.prototype.slice.call(element.children || []).filter(function (child) {
      return !!child && !!child.tagName;
    }).slice(0, depth === 0 ? 6 : 4);

    childElements.forEach(function (child) {
      var serialized = serializeReplayNode(child, depth + 1, targetElement);
      if (serialized) {
        children.push(serialized);
      }
    });

    return {
      id: buildElementSelector(element) || tag + ":" + depth + ":" + children.length,
      tag: tag,
      text: text || undefined,
      role: role,
      target: !!targetElement && (element === targetElement || (element.contains && element.contains(targetElement))),
      muted: depth > 1,
      children: children.length ? children : undefined
    };
  }

  function captureReplaySnapshot(targetElement) {
    try {
      var now = Date.now();
      if (now - lastReplaySnapshotAt < 700) return "";
      lastReplaySnapshotAt = now;
      var root = document.querySelector("main,[role='main'],body") || document.body;
      var snapshot = [serializeReplayNode(root, 0, targetElement)].filter(Boolean);
      return JSON.stringify(snapshot);
    } catch (error) {
      return "";
    }
  }

  function captureReplayHtmlSnapshot() {
    try {
      var now = Date.now();
      if (now - lastHtmlSnapshotAt < 1200) return "";
      lastHtmlSnapshotAt = now;
      var root = document.documentElement.cloneNode(true);
      Array.prototype.slice.call(root.querySelectorAll("script,noscript")).forEach(function (node) {
        if (node && node.parentNode) node.parentNode.removeChild(node);
      });

      Array.prototype.slice.call(root.querySelectorAll("input,textarea,select,[contenteditable='true']")).forEach(function (field) {
        if (!field || !field.tagName) return;
        var tag = field.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea") {
          field.setAttribute("value", "");
          field.value = "";
          if (tag === "textarea") field.textContent = "";
        }
        if (tag === "select") {
          Array.prototype.slice.call(field.querySelectorAll("option")).forEach(function (option) {
            option.removeAttribute("selected");
          });
        }
      });

      var head = root.querySelector("head");
      if (head) {
        var base = document.createElement("base");
        base.setAttribute("href", window.location.href);
        head.insertBefore(base, head.firstChild || null);

        var style = document.createElement("style");
        style.textContent = "html,body{margin:0 !important;padding:0 !important;pointer-events:none !important;} *{animation:none !important;transition:none !important;caret-color:transparent !important;}";
        head.appendChild(style);
      }

      return "<!DOCTYPE html>\n" + root.outerHTML.slice(0, 180000);
    } catch (error) {
      return "";
    }
  }

  function maybeRecordFrame(eventType, metadata, options, replayHtmlSnapshot) {
    if (!shouldCaptureReplay(eventType) || !replayHtmlSnapshot) return;

    enqueueRecordingFrame({
      id: "frame_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      pathname: window.location.pathname,
      eventType: eventType,
      title: document.title || "",
      selector: metadata && metadata.elementSelector ? metadata.elementSelector : undefined,
      scrollOffsetY: metadata && typeof metadata.scrollOffsetY === "number" ? metadata.scrollOffsetY : (window.scrollY || window.pageYOffset || 0),
      documentHeight: metadata && typeof metadata.documentHeight === "number" ? metadata.documentHeight : getDocumentHeight(),
      clickX: metadata && typeof metadata.clickX === "number" ? metadata.clickX : undefined,
      clickY: metadata && typeof metadata.clickY === "number" ? metadata.clickY : undefined,
      viewportWidth: window.innerWidth || 0,
      viewportHeight: window.innerHeight || 0,
      htmlSnapshot: replayHtmlSnapshot,
      baseHref: window.location.href
    }, options && options.beacon);
  }

  function sendHealthReport() {
    var payload = {
      projectId: projectId,
      pathname: window.location.pathname,
      origin: window.location.origin,
      sdkVersion: "0.3.0",
      anonymousId: getAnonymousId(),
      sessionId: session.id,
      userAgent: navigator.userAgent || "",
      capabilities: {
        beacon: !!navigator.sendBeacon,
        fetch: typeof window.fetch === "function",
        intersectionObserver: "IntersectionObserver" in window,
        localStorage: (function () {
          try {
            return !!window.localStorage;
          } catch (error) {
            return false;
          }
        })(),
        sessionStorage: (function () {
          try {
            return !!window.sessionStorage;
          } catch (error) {
            return false;
          }
        })()
      }
    };

    fetch(origin + "/api/sdk/health", {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {});
  }

  function track(eventType, metadata, options) {
    var experimentContext = findExperimentContext(metadata || {});
    var context = baseContext();
    var replaySnapshot = shouldCaptureReplay(eventType) ? captureReplaySnapshot(metadata && metadata.__targetElement ? metadata.__targetElement : null) : "";
    var replayHtmlSnapshot = shouldCaptureReplay(eventType) ? captureReplayHtmlSnapshot() : "";
    var payload = {
      clientEventId: projectId + ":" + eventType + ":" + Date.now() + ":" + Math.random().toString(36).slice(2, 8),
      anonymousId: getAnonymousId(),
      sessionId: session.id,
      experimentId: experimentContext.experimentId,
      variantKey: experimentContext.variantKey,
      eventType: eventType,
      pathname: window.location.pathname,
      projectId: projectId,
      context: {}
    };

    Object.keys(context).forEach(function (key) {
      payload.context[key] = context[key];
    });

    if (replaySnapshot) {
      payload.context.replaySnapshot = replaySnapshot;
    }
    if (replayHtmlSnapshot) {
      payload.context.replayHtmlSnapshot = replayHtmlSnapshot;
      payload.context.replayBaseHref = window.location.href;
    }
    payload.context.scrollOffsetY = window.scrollY || window.pageYOffset || 0;
    payload.context.documentHeight = getDocumentHeight();

    Object.keys(metadata || {}).forEach(function (key) {
      if (key !== "experimentId" && key !== "variantKey" && key.indexOf("__") !== 0 && metadata[key] !== undefined) {
        payload.context[key] = metadata[key];
      }
    });

    enqueuePayload(payload, options && options.beacon);
    maybeRecordFrame(eventType, metadata, options, replayHtmlSnapshot);
  }

  function registerScrollTracking() {
    function emitScrollDepth() {
      var scrollTop = window.scrollY || window.pageYOffset || 0;
      var viewport = window.innerHeight || 0;
      var documentHeight = getDocumentHeight();
      var depth = Math.min(100, Math.round(((scrollTop + viewport) / documentHeight) * 100));
      [25, 50, 75, 100].forEach(function (threshold) {
        if (depth >= threshold && !scrollMilestones[threshold]) {
          scrollMilestones[threshold] = true;
          track("scroll_depth", { scrollDepth: threshold, scrollOffsetY: scrollTop, documentHeight: documentHeight });
        }
      });
    }

    window.addEventListener("scroll", emitScrollDepth, { passive: true });
    emitScrollDepth();
  }

  function registerPageExitTracking() {
    function emitExit() {
      if (exitSent) return;
      exitSent = true;
      var duration = Date.now() - pageStart;
      track("page_exit", { durationMs: duration, pagesInSession: pagesInSession }, { beacon: true });
      track("time_on_page", { durationMs: duration, pagesInSession: pagesInSession }, { beacon: true });

      Object.keys(startedForms).forEach(function (formId) {
        if (!submittedForms[formId]) {
          track("form_abandon", { formId: formId }, { beacon: true });
        }
      });
    }

    window.addEventListener("pagehide", emitExit);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        emitExit();
      }
    });
  }

  function buildElementSelector(target) {
    if (!target || !target.tagName) return "";
    var selector = target.tagName.toLowerCase();
    if (target.id) selector += "#" + target.id;
    if (target.classList && target.classList.length) selector += "." + Array.prototype.slice.call(target.classList).join(".");
    return selector.slice(0, 240);
  }

  function buildPreciseSelector(target) {
    if (!target || !target.tagName) return "";
    var parts = [];
    var current = target;
    while (current && current.tagName && current.tagName.toLowerCase() !== "html") {
      var part = current.tagName.toLowerCase();
      if (current.id) {
        part += "#" + current.id;
        parts.unshift(part);
        break;
      }
      var siblings = current.parentElement ? Array.prototype.slice.call(current.parentElement.children).filter(function (child) {
        return child.tagName === current.tagName;
      }) : [];
      if (siblings.length > 1) {
        part += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(" > ").slice(0, 500);
  }

  function registerBuilderMode() {
    if (!builderMode) return;
    var builderScope = runtimeUrl.searchParams.get("optify_builder_scope") || "recommendation";
    var initialSelector = runtimeUrl.searchParams.get("optify_builder_selector") || "";
    var initialText = runtimeUrl.searchParams.get("optify_builder_text") || "";
    var initialStyle = runtimeUrl.searchParams.get("optify_builder_style") || "";
    var selectedTarget = null;
    var selectedSelector = "";
    var selectedFallbackSelector = "";
    var originalSnapshot = null;

    function parseHexColor(value) {
      var normalized = String(value || "").trim();
      if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return "";
      if (normalized.length === 4) {
        return "#" + normalized.slice(1).split("").map(function (char) { return char + char; }).join("");
      }
      return normalized.toLowerCase();
    }

    function rgbToHex(value) {
      var match = String(value || "").match(/\d+/g);
      if (!match || match.length < 3) return "";
      return "#" + match.slice(0, 3).map(function (item) {
        return Number(item).toString(16).padStart(2, "0");
      }).join("");
    }

    function inspectStyle(target) {
      var computed = window.getComputedStyle(target);
      return {
        backgroundColor: computed.backgroundColor && computed.backgroundColor.indexOf("rgb") === 0 ? rgbToHex(computed.backgroundColor) : "",
        color: computed.color && computed.color.indexOf("rgb") === 0 ? rgbToHex(computed.color) : "",
        borderColor: computed.borderColor && computed.borderColor.indexOf("rgb") === 0 ? rgbToHex(computed.borderColor) : "",
        borderRadius: computed.borderRadius && computed.borderRadius !== "0px" ? computed.borderRadius : "",
        borderWidth: computed.borderWidth && computed.borderWidth !== "0px" ? computed.borderWidth : ""
      };
    }

    function parseStyleDraft(styleValue) {
      var draft = inspectStyle(document.body);
      draft.backgroundColor = "";
      draft.color = "";
      draft.borderColor = "";
      draft.borderRadius = "";
      draft.borderWidth = "";
      String(styleValue || "")
        .split(";")
        .map(function (chunk) { return chunk.trim(); })
        .filter(Boolean)
        .forEach(function (chunk) {
          var parts = chunk.split(":");
          if (parts.length < 2) return;
          var key = parts.shift().trim().toLowerCase();
          var value = parts.join(":").replace(/\s*!important$/i, "").trim();
          if (key === "background" || key === "background-color") draft.backgroundColor = parseHexColor(value) || value;
          if (key === "color") draft.color = parseHexColor(value) || value;
          if (key === "border-color") draft.borderColor = parseHexColor(value) || value;
          if (key === "border-radius") draft.borderRadius = value;
          if (key === "border-width") draft.borderWidth = value;
        });
      return draft;
    }

    var styleDraft = parseStyleDraft(initialStyle);

    function serializeStyleDraft(draft) {
      return [
        draft.backgroundColor ? "background:" + draft.backgroundColor + " !important" : "",
        draft.color ? "color:" + draft.color + " !important" : "",
        draft.borderColor ? "border-color:" + draft.borderColor + " !important" : "",
        draft.borderWidth ? "border-width:" + draft.borderWidth + " !important" : "",
        draft.borderWidth ? "border-style:solid !important" : "",
        draft.borderRadius ? "border-radius:" + draft.borderRadius + " !important" : ""
      ].filter(Boolean).join(";");
    }

    function snapshotTarget(target) {
      return {
        text: target.textContent || "",
        style: target.getAttribute("style") || ""
      };
    }

    function restoreTarget() {
      if (!selectedTarget || !originalSnapshot) return;
      selectedTarget.textContent = originalSnapshot.text;
      if (originalSnapshot.style) {
        selectedTarget.setAttribute("style", originalSnapshot.style);
      } else {
        selectedTarget.removeAttribute("style");
      }
    }

    function applyDraftToTarget() {
      if (!selectedTarget) return;
      if (builderScope === "experience" && textInput.value) {
        selectedTarget.textContent = textInput.value;
      } else if (builderScope === "experience" && originalSnapshot) {
        selectedTarget.textContent = originalSnapshot.text;
      }
      if (builderScope !== "experience") return;
      if (styleDraft.backgroundColor) selectedTarget.style.setProperty("background", styleDraft.backgroundColor, "important");
      if (styleDraft.color) selectedTarget.style.setProperty("color", styleDraft.color, "important");
      if (styleDraft.borderColor) selectedTarget.style.setProperty("border-color", styleDraft.borderColor, "important");
      if (styleDraft.borderWidth) {
        selectedTarget.style.setProperty("border-width", styleDraft.borderWidth, "important");
        selectedTarget.style.setProperty("border-style", "solid", "important");
      }
      if (styleDraft.borderRadius) selectedTarget.style.setProperty("border-radius", styleDraft.borderRadius, "important");
      Array.prototype.forEach.call(selectedTarget.querySelectorAll("*"), function (child) {
        if (styleDraft.color) child.style.setProperty("color", styleDraft.color, "important");
      });
    }

    var overlay = document.createElement("div");
    overlay.setAttribute("data-optify-builder-ui", "true");
    overlay.style.cssText = "position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #ff6f61;background:rgba(255,111,97,.12);border-radius:12px;display:none;box-shadow:0 0 0 9999px rgba(17,16,16,.06);";
    document.body.appendChild(overlay);

    var panel = document.createElement("aside");
    panel.setAttribute("data-optify-builder-ui", "true");
    panel.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;width:360px;max-width:calc(100vw - 32px);background:#fffaf5;color:#241b13;border:1px solid rgba(169,101,50,.18);border-radius:24px;box-shadow:0 28px 80px rgba(28,18,10,.24);font:500 14px/1.5 Inter,system-ui,sans-serif;";
    panel.innerHTML =
      "<div data-optify-builder-ui='true' style='padding:20px 20px 14px;border-bottom:1px solid rgba(169,101,50,.12)'>" +
        "<div style='font:700 12px/1.2 Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a96532'>Optify live editor</div>" +
        "<div style='margin-top:10px;font:700 20px/1.2 Inter,system-ui,sans-serif;color:#241b13'>" + (builderScope === "experience" ? "Edite la vraie boutique" : "Choisis un placement Shopify") + "</div>" +
        "<div style='margin-top:8px;color:#6f6458'>" + (builderScope === "experience" ? "Clique un element de la page, modifie-le dans ce panneau, puis valide pour renvoyer le resultat dans Optify." : "Clique un element de la page pour recuperer son selecteur et le point d'insertion.") + "</div>" +
      "</div>" +
      "<div data-optify-builder-ui='true' style='padding:18px 20px'>" +
        "<div style='font:600 12px/1.2 Inter,system-ui,sans-serif;color:#a96532;text-transform:uppercase;letter-spacing:.12em'>Element cible</div>" +
        "<div id='optify-builder-label' style='margin-top:10px;font:600 14px/1.5 Inter,system-ui,sans-serif;color:#241b13'>Aucun element selectionne</div>" +
        "<div id='optify-builder-selector' style='margin-top:8px;padding:10px 12px;border-radius:16px;background:#fff;border:1px solid rgba(169,101,50,.12);color:#6f6458;font:500 12px/1.5 ui-monospace, SFMono-Regular, monospace;word-break:break-all'>Le selecteur apparaitra ici.</div>" +
        "<div id='optify-builder-editor' style='display:" + (builderScope === "experience" ? "block" : "none") + ";margin-top:16px'>" +
          "<label style='display:block;font:600 12px/1.2 Inter,system-ui,sans-serif;color:#a96532;text-transform:uppercase;letter-spacing:.12em'>Texte variante B</label>" +
          "<textarea id='optify-builder-text' style='margin-top:8px;width:100%;min-height:88px;padding:12px 14px;border-radius:16px;border:1px solid rgba(169,101,50,.18);background:#fff;color:#241b13;resize:vertical'></textarea>" +
          "<div style='margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px'>" +
            "<label style='display:block'><span style='display:block;font:600 12px/1.2 Inter,system-ui,sans-serif;color:#a96532;text-transform:uppercase;letter-spacing:.12em'>Fond</span><input id='optify-builder-bg' type='color' style='margin-top:8px;width:100%;height:44px;border-radius:14px;border:1px solid rgba(169,101,50,.18);background:#fff;padding:4px'></label>" +
            "<label style='display:block'><span style='display:block;font:600 12px/1.2 Inter,system-ui,sans-serif;color:#a96532;text-transform:uppercase;letter-spacing:.12em'>Texte</span><input id='optify-builder-color' type='color' style='margin-top:8px;width:100%;height:44px;border-radius:14px;border:1px solid rgba(169,101,50,.18);background:#fff;padding:4px'></label>" +
            "<label style='display:block'><span style='display:block;font:600 12px/1.2 Inter,system-ui,sans-serif;color:#a96532;text-transform:uppercase;letter-spacing:.12em'>Bordure</span><input id='optify-builder-border' type='color' style='margin-top:8px;width:100%;height:44px;border-radius:14px;border:1px solid rgba(169,101,50,.18);background:#fff;padding:4px'></label>" +
            "<label style='display:block'><span style='display:block;font:600 12px/1.2 Inter,system-ui,sans-serif;color:#a96532;text-transform:uppercase;letter-spacing:.12em'>Rayon</span><input id='optify-builder-radius' type='text' placeholder='16px' style='margin-top:8px;width:100%;height:44px;border-radius:14px;border:1px solid rgba(169,101,50,.18);background:#fff;padding:0 12px;color:#241b13'></label>" +
          "</div>" +
        "</div>" +
        "<div style='margin-top:18px;display:flex;flex-wrap:wrap;gap:10px'>" +
          "<button id='optify-builder-send' type='button' style='border:0;background:linear-gradient(135deg,#ff5f6d 0%,#ff7f50 55%,#ffb36b 100%);color:#fff;padding:12px 16px;border-radius:999px;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer'>Valider dans Optify</button>" +
          "<button id='optify-builder-reset' type='button' style='border:1px solid rgba(169,101,50,.18);background:#fff;color:#6f6458;padding:12px 16px;border-radius:999px;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer'>Reinitialiser</button>" +
          "<button id='optify-builder-close' type='button' style='border:1px solid rgba(169,101,50,.18);background:#fff;color:#6f6458;padding:12px 16px;border-radius:999px;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer'>Fermer</button>" +
        "</div>" +
      "</div>";
    document.body.appendChild(panel);

    var labelNode = panel.querySelector("#optify-builder-label");
    var selectorNode = panel.querySelector("#optify-builder-selector");
    var textInput = panel.querySelector("#optify-builder-text");
    var backgroundInput = panel.querySelector("#optify-builder-bg");
    var colorInput = panel.querySelector("#optify-builder-color");
    var borderInput = panel.querySelector("#optify-builder-border");
    var radiusInput = panel.querySelector("#optify-builder-radius");
    var sendButton = panel.querySelector("#optify-builder-send");
    var resetButton = panel.querySelector("#optify-builder-reset");
    var closeButton = panel.querySelector("#optify-builder-close");

    if (textInput) textInput.value = initialText;
    if (backgroundInput) backgroundInput.value = parseHexColor(styleDraft.backgroundColor) || "#2563eb";
    if (colorInput) colorInput.value = parseHexColor(styleDraft.color) || "#ffffff";
    if (borderInput) borderInput.value = parseHexColor(styleDraft.borderColor) || "#2563eb";
    if (radiusInput) radiusInput.value = styleDraft.borderRadius || "";

    function resolveTarget(eventTarget) {
      if (!eventTarget || !eventTarget.closest) return null;
      var target = eventTarget.closest("button,a,input[type='submit'],[role='button'],section,aside,div,li,article,header,footer,main");
      if (!target || !target.getAttribute) return null;
      if (target.getAttribute("data-optify-builder-ui") === "true") return null;
      return target;
    }

    function syncPanelFromTarget(target) {
      labelNode.textContent = normalizeText(target.textContent || target.getAttribute("aria-label") || target.tagName, 120);
      selectorNode.textContent = selectedSelector || "Le selecteur apparaitra ici.";
      if (builderScope !== "experience") return;
      originalSnapshot = snapshotTarget(target);
      if (textInput && !initialText) textInput.value = normalizeText(originalSnapshot.text, 200);
      var computedDraft = inspectStyle(target);
      if (!initialStyle) {
        styleDraft = computedDraft;
        if (backgroundInput) backgroundInput.value = parseHexColor(styleDraft.backgroundColor) || "#2563eb";
        if (colorInput) colorInput.value = parseHexColor(styleDraft.color) || "#ffffff";
        if (borderInput) borderInput.value = parseHexColor(styleDraft.borderColor) || "#2563eb";
        if (radiusInput) radiusInput.value = styleDraft.borderRadius || "";
      }
      applyDraftToTarget();
    }

    function sendSelection() {
      if (!selectedTarget) return;
      var payload = {
        type: "optify-builder-selection",
        scope: builderScope,
        selector: selectedSelector,
        fallbackSelector: selectedFallbackSelector,
        label: labelNode.textContent || "",
        pathname: window.location.pathname,
        url: window.location.href,
        variantText: builderScope === "experience" ? textInput.value : "",
        variantStyle: builderScope === "experience" ? serializeStyleDraft(styleDraft) : ""
      };
      if (window.opener && typeof window.opener.postMessage === "function") {
        window.opener.postMessage(payload, builderOrigin || "*");
      }
    }

    document.addEventListener("mousemove", function (event) {
      var target = resolveTarget(event.target);
      if (!target) {
        overlay.style.display = "none";
        return;
      }
      var rect = target.getBoundingClientRect();
      overlay.style.display = "block";
      overlay.style.top = rect.top + "px";
      overlay.style.left = rect.left + "px";
      overlay.style.width = rect.width + "px";
      overlay.style.height = rect.height + "px";
    }, true);

    document.addEventListener("click", function (event) {
      var target = resolveTarget(event.target);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (selectedTarget && selectedTarget !== target && builderScope === "experience") {
        restoreTarget();
      }
      selectedTarget = target;
      selectedSelector = buildPreciseSelector(target);
      selectedFallbackSelector = buildElementSelector(target);
      syncPanelFromTarget(target);
      if (builderScope !== "experience") {
        sendSelection();
        window.setTimeout(function () {
          try {
            window.close();
          } catch (error) {}
        }, 120);
      }
    }, true);

    function handleDraftChange() {
      styleDraft = {
        backgroundColor: backgroundInput ? backgroundInput.value : styleDraft.backgroundColor,
        color: colorInput ? colorInput.value : styleDraft.color,
        borderColor: borderInput ? borderInput.value : styleDraft.borderColor,
        borderRadius: radiusInput ? radiusInput.value : styleDraft.borderRadius,
        borderWidth: styleDraft.borderWidth || "1px"
      };
      applyDraftToTarget();
    }

    if (textInput) {
      textInput.addEventListener("input", function () {
        applyDraftToTarget();
      });
    }
    if (backgroundInput) backgroundInput.addEventListener("input", handleDraftChange);
    if (colorInput) colorInput.addEventListener("input", handleDraftChange);
    if (borderInput) borderInput.addEventListener("input", handleDraftChange);
    if (radiusInput) radiusInput.addEventListener("input", handleDraftChange);

    if (sendButton) {
      sendButton.addEventListener("click", function () {
        sendSelection();
      });
    }

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        if (selectedTarget && builderScope === "experience") {
          restoreTarget();
          if (originalSnapshot && textInput) textInput.value = normalizeText(originalSnapshot.text, 200);
          styleDraft = inspectStyle(selectedTarget);
          if (backgroundInput) backgroundInput.value = parseHexColor(styleDraft.backgroundColor) || "#2563eb";
          if (colorInput) colorInput.value = parseHexColor(styleDraft.color) || "#ffffff";
          if (borderInput) borderInput.value = parseHexColor(styleDraft.borderColor) || "#2563eb";
          if (radiusInput) radiusInput.value = styleDraft.borderRadius || "";
        }
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", function () {
        if (builderScope === "experience") restoreTarget();
        try {
          window.close();
        } catch (error) {}
      });
    }

    if (initialSelector) {
      try {
        var presetTarget = document.querySelector(initialSelector);
        if (presetTarget) {
          selectedTarget = presetTarget;
          selectedSelector = buildPreciseSelector(presetTarget);
          selectedFallbackSelector = buildElementSelector(presetTarget);
          syncPanelFromTarget(presetTarget);
        }
      } catch (error) {}
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildStorefrontProductUrl(handle) {
    if (!handle) return "#";
    return "/products/" + String(handle).replace(/^\//, "");
  }

  function shouldRenderRecommendation(experiment, variant) {
    if (!experiment || experiment.type !== "recommendation" || !experiment.recommendationConfig) return false;
    if (!variant || variant.key === "A") return false;
    var targetUrl = experiment.recommendationConfig.targetUrl || "";
    if (!targetUrl) return true;

    try {
      var parsedTargetUrl = new URL(targetUrl, window.location.href);
      return parsedTargetUrl.pathname === window.location.pathname && (parsedTargetUrl.search || "") === window.location.search;
    } catch (error) {
      return true;
    }
  }

  function injectRecommendationMarkup(anchor, container, mode) {
    if (!anchor || !container) return false;
    if (mode === "replace") {
      anchor.parentNode && anchor.parentNode.replaceChild(container, anchor);
      return true;
    }
    if (mode === "before") {
      anchor.parentNode && anchor.parentNode.insertBefore(container, anchor);
      return true;
    }
    if (mode === "after") {
      anchor.parentNode && anchor.parentNode.insertBefore(container, anchor.nextSibling);
      return true;
    }
    anchor.appendChild(container);
    return true;
  }

  function renderRecommendationModule(experiment, payload) {
    if (!payload || !payload.items || !payload.items.length) return;
    var config = experiment.recommendationConfig || {};
    var anchorSelector = config.placementSelector || "";
    var anchor = anchorSelector ? document.querySelector(anchorSelector) : null;
    if (!anchor) return;

    var existing = document.querySelector("[data-optify-recommendation-root='" + experiment.id + "']");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    var layout = config.layout || "grid";
    var spacing = Number(config.spacingPx || 16);
    var padding = Number(config.paddingPx || 16);
    var imageRatio = config.imageRatio || "square";
    var titleLines = Number(config.cardTitleLines || 2);
    var showPrice = config.showPrice !== false;
    var showCompareAtPrice = config.showCompareAtPrice === true;
    var showCta = config.showCta !== false;
    var ctaLabel = config.ctaLabel || "Shop now";
    var storefrontBase = (shopifyContext && shopifyContext.storefrontDomain ? "https://" + shopifyContext.storefrontDomain.replace(/^https?:\/\//, "") : window.location.origin).replace(/\/$/, "");
    var listStyles = layout === "stack"
      ? "display:grid;grid-template-columns:1fr;gap:" + spacing + "px;"
      : layout === "carousel"
        ? "display:grid;grid-auto-flow:column;grid-auto-columns:minmax(220px,1fr);gap:" + spacing + "px;overflow-x:auto;padding-bottom:4px;"
        : "display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:" + spacing + "px;";
    var aspectRatio = imageRatio === "portrait" ? "3 / 4" : imageRatio === "landscape" ? "4 / 3" : "1 / 1";

    var cards = payload.items.slice(0, Number(config.maxProducts || 3)).map(function (item) {
      var productUrl = storefrontBase + buildStorefrontProductUrl(item.handle);
      return "" +
        "<a href=\"" + escapeHtml(productUrl) + "\" " +
        "data-optify-recommendation-id=\"" + escapeHtml(experiment.id) + "\" " +
        "data-optify-placement=\"" + escapeHtml(config.placement || payload.placement || "") + "\" " +
        "data-optify-strategy=\"" + escapeHtml(config.strategy || payload.strategy || "") + "\" " +
        "data-product-id=\"" + escapeHtml(item.id || "") + "\" " +
        "data-product-name=\"" + escapeHtml(item.title || "") + "\" " +
        "style=\"display:flex;flex-direction:column;gap:12px;border:1px solid rgba(17,41,31,.12);border-radius:22px;padding:14px;background:#fff;text-decoration:none;color:#11291f;box-shadow:0 10px 26px rgba(17,41,31,.06);min-width:0;\">" +
          "<div style=\"aspect-ratio:" + aspectRatio + ";border-radius:16px;background:#f5f3ec;overflow:hidden;\">" +
            (item.image ? "<img src=\"" + escapeHtml(item.image) + "\" alt=\"" + escapeHtml(item.title || "") + "\" style=\"width:100%;height:100%;object-fit:cover;display:block;\" />" : "") +
          "</div>" +
          "<div style=\"display:flex;flex-direction:column;gap:6px;min-width:0;\">" +
            "<div style=\"font:600 14px/1.35 system-ui,sans-serif;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:" + titleLines + ";overflow:hidden;\">" + escapeHtml(item.title || "Recommended product") + "</div>" +
            (showPrice && item.price ? "<div style=\"font:500 13px/1.3 system-ui,sans-serif;color:rgba(17,41,31,.72);\">" + escapeHtml(item.price) + "</div>" : "") +
            (showCompareAtPrice && item.compareAtPrice ? "<div style=\"font:500 12px/1.3 system-ui,sans-serif;color:rgba(17,41,31,.42);text-decoration:line-through;\">" + escapeHtml(item.compareAtPrice) + "</div>" : "") +
          "</div>" +
          (showCta ? "<span style=\"margin-top:auto;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#11291f;color:#fff;padding:10px 14px;font:600 12px/1 system-ui,sans-serif;\">" + escapeHtml(ctaLabel) + "</span>" : "") +
        "</a>";
    }).join("");

    var container = document.createElement("section");
    container.setAttribute("data-optify-recommendation-root", experiment.id);
    container.style.cssText = "margin:16px 0;border-radius:24px;background:linear-gradient(180deg,#fffefb 0%,#f7f4ea 100%);padding:" + padding + "px;border:1px solid rgba(17,41,31,.08);box-shadow:0 18px 48px rgba(17,41,31,.08);";
    container.innerHTML = "" +
      "<div style=\"display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;\">" +
        "<div>" +
          "<div style=\"font:700 18px/1.2 system-ui,sans-serif;color:#11291f;\">" + escapeHtml(payload.title || config.title || "Recommended for this page") + "</div>" +
          "<div style=\"margin-top:6px;font:500 12px/1.4 system-ui,sans-serif;color:rgba(17,41,31,.56);\">Powered by " + escapeHtml(config.strategy || payload.strategy || "optify") + "</div>" +
        "</div>" +
      "</div>" +
      "<div style=\"" + listStyles + "\">" + cards + "</div>";

    if (!injectRecommendationMarkup(anchor, container, config.injectionMode || "append")) return;
    registerRecommendationTracking();
  }

  function renderRecommendationExperience(experiment, variant) {
    if (!shouldRenderRecommendation(experiment, variant)) return;
    fetch(origin + "/api/sdk/recommendations?projectId=" + encodeURIComponent(projectId) + "&experimentId=" + encodeURIComponent(experiment.id), {
      headers: { "ngrok-skip-browser-warning": "true" }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Recommendation payload unavailable");
      }
      return response.json();
    }).then(function (payload) {
      renderRecommendationModule(experiment, payload);
    }).catch(function (error) {
      debugState.lastError = error && error.message ? error.message : "Recommendation render failed";
    });
  }

  function registerClickTracking() {
    document.addEventListener("click", function (event) {
      var target = event.target && event.target.closest ? event.target.closest("a,button,[data-optify-track],[role='button'],input[type='submit']") : null;
      if (!target) return;

      var selector = buildElementSelector(target);
      var text = (target.textContent || "").trim().slice(0, 160);
      var href = target.href || target.getAttribute && target.getAttribute("href") || "";
      var baseMeta = {
        elementSelector: selector,
        elementText: text,
        href: href,
        clickX: typeof event.clientX === "number" ? event.clientX : 0,
        clickY: typeof event.clientY === "number" ? event.clientY : 0,
        scrollOffsetY: window.scrollY || window.pageYOffset || 0,
        documentHeight: getDocumentHeight(),
        __targetElement: target,
        isTrusted: !!event.isTrusted
      };

      track("click", baseMeta);

      var trackValue = target.getAttribute && target.getAttribute("data-optify-track");
      if (trackValue) {
        trackValue.split(/\s+/).forEach(function (token) {
          if (token) {
            track(token, baseMeta);
          }
        });
      }

      if (href && /^https?:/i.test(href) && href.indexOf(window.location.origin) !== 0) {
        track("outbound_click", baseMeta);
      }

      clickHistory.push({
        selector: selector,
        ts: Date.now()
      });
      clickHistory = clickHistory.filter(function (entry) {
        return Date.now() - entry.ts < 1500;
      });

      var sameTargetRapidClicks = clickHistory.filter(function (entry) {
        return entry.selector === selector;
      }).length;
      if (sameTargetRapidClicks >= 3) {
        track("rage_click", baseMeta);
      }

      var initialUrl = window.location.href;
      var initialScroll = window.scrollY;
      setTimeout(function () {
        var changed = window.location.href !== initialUrl || Math.abs((window.scrollY || 0) - initialScroll) > 32 || target.matches("input,textarea,select");
        if (!changed) {
          track("dead_click", baseMeta);
        }
      }, 900);
    }, true);
  }

  function registerFormTracking() {
    document.addEventListener("focusin", function (event) {
      var field = event.target;
      if (!field || !field.form) return;
      var formId = field.form.id || field.form.getAttribute("name") || "form:" + buildElementSelector(field.form);
      if (!startedForms[formId]) {
        startedForms[formId] = true;
        track("form_start", { formId: formId });
      }

      track("field_focus", {
        formId: formId,
        fieldName: field.name || field.id || "",
        fieldType: field.type || field.tagName.toLowerCase()
      });
    }, true);

    document.addEventListener("focusout", function (event) {
      var field = event.target;
      if (!field || !field.form) return;
      track("field_blur", {
        formId: field.form.id || field.form.getAttribute("name") || "form:" + buildElementSelector(field.form),
        fieldName: field.name || field.id || "",
        fieldType: field.type || field.tagName.toLowerCase()
      });
    }, true);

    document.addEventListener("invalid", function (event) {
      var field = event.target;
      if (!field || !field.form) return;
      track("form_error", {
        formId: field.form.id || field.form.getAttribute("name") || "form:" + buildElementSelector(field.form),
        fieldName: field.name || field.id || "",
        fieldType: field.type || field.tagName.toLowerCase(),
        errorMessage: field.validationMessage || ""
      });
    }, true);

    document.addEventListener("submit", function (event) {
      var form = event.target;
      if (!form) return;
      var formId = form.id || form.getAttribute("name") || "form:" + buildElementSelector(form);
      submittedForms[formId] = true;
      track("form_submit", { formId: formId });
    }, true);
  }

  function registerVideoTracking() {
    document.querySelectorAll("video").forEach(function (video, index) {
      var videoId = video.id || video.currentSrc || "video_" + index;
      trackedVideoMilestones[videoId] = {};

      video.addEventListener("play", function () {
        track("video_start", { videoId: videoId, videoTitle: video.getAttribute("title") || document.title });
      });

      video.addEventListener("timeupdate", function () {
        if (!video.duration) return;
        var progress = Math.round((video.currentTime / video.duration) * 100);
        [25, 50, 75].forEach(function (milestone) {
          if (progress >= milestone && !trackedVideoMilestones[videoId][milestone]) {
            trackedVideoMilestones[videoId][milestone] = true;
            track("video_progress", { videoId: videoId, videoProgress: milestone });
          }
        });
      });

      video.addEventListener("ended", function () {
        track("video_complete", { videoId: videoId, videoProgress: 100 });
      });
    });
  }

  function registerRecommendationTracking() {
    var recommendationNodes = document.querySelectorAll("[data-optify-recommendation-id]");
    if (!recommendationNodes.length || !("IntersectionObserver" in window)) return;

    recommendationObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var target = entry.target;
        if (target.getAttribute("data-optify-impression-tracked") === "true") return;
        target.setAttribute("data-optify-impression-tracked", "true");
        track("recommendation_impression", {
          recommendationId: target.getAttribute("data-optify-recommendation-id") || "",
          recommendationPlacement: target.getAttribute("data-optify-placement") || "",
          recommendationStrategy: target.getAttribute("data-optify-strategy") || "",
          productId: target.getAttribute("data-product-id") || "",
          productName: target.getAttribute("data-product-name") || ""
        });
      });
    }, { threshold: 0.4 });

    recommendationNodes.forEach(function (node) {
      recommendationObserver.observe(node);
      node.addEventListener("click", function () {
        track("recommendation_click", {
          recommendationId: node.getAttribute("data-optify-recommendation-id") || "",
          recommendationPlacement: node.getAttribute("data-optify-placement") || "",
          recommendationStrategy: node.getAttribute("data-optify-strategy") || "",
          productId: node.getAttribute("data-product-id") || "",
          productName: node.getAttribute("data-product-name") || ""
        });
      });
    });
  }

  function registerCommerceTracking() {
    var productRoot = document.querySelector("[data-product-id]");
    var shopifyProduct = shopifyContext && shopifyContext.product;
    if (!productRoot && shopifyProduct && inferShopifyPageType() === "product") {
      track("product_view", {
        productId: shopifyProduct.id || "",
        productName: shopifyProduct.title || document.title
      });
    }

    if (productRoot) {
      track("product_view", {
        productId: productRoot.getAttribute("data-product-id") || "",
        productName: productRoot.getAttribute("data-product-name") || document.title
      });
    }

    document.addEventListener("click", function (event) {
      var target = event.target && event.target.closest ? event.target.closest("[data-product-id],[data-add-to-cart],[data-remove-from-cart],[data-checkout-start],[data-purchase]") : null;
      if (!target) return;

      var commerceMeta = {
        productId: target.getAttribute("data-product-id") || "",
        productName: target.getAttribute("data-product-name") || "",
        sku: target.getAttribute("data-sku") || "",
        currency: target.getAttribute("data-currency") || "",
        value: Number(target.getAttribute("data-value") || "0") || 0,
        revenue: Number(target.getAttribute("data-revenue") || target.getAttribute("data-value") || "0") || 0,
        quantity: Number(target.getAttribute("data-quantity") || "1") || 1
      };

      if (target.hasAttribute("data-add-to-cart")) track("add_to_cart", commerceMeta);
      if (target.hasAttribute("data-remove-from-cart")) track("remove_from_cart", commerceMeta);
      if (target.hasAttribute("data-checkout-start")) track("checkout_start", commerceMeta);
      if (target.hasAttribute("data-purchase")) track("purchase", commerceMeta);
    }, true);
  }

  function registerErrorTracking() {
    window.addEventListener("error", function (event) {
      track("js_error", {
        errorMessage: event.message || "",
        errorSource: event.filename || "",
        custom: { lineno: event.lineno || 0, colno: event.colno || 0 }
      });
    });

    window.addEventListener("unhandledrejection", function (event) {
      track("js_error", {
        errorMessage: event.reason && event.reason.message ? event.reason.message : String(event.reason || "Unhandled promise rejection")
      });
    });
  }

  function emitPerformanceMetrics() {
    if (!("performance" in window) || !performance.timing) return;

    setTimeout(function () {
      var timing = performance.timing;
      track("performance", {
        performanceTiming: {
          dnsMs: timing.domainLookupEnd - timing.domainLookupStart,
          connectMs: timing.connectEnd - timing.connectStart,
          ttfbMs: timing.responseStart - timing.requestStart,
          domReadyMs: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadMs: timing.loadEventEnd - timing.navigationStart
        }
      });
    }, 0);
  }

  function priorityWeight(priority) {
    if (priority === "high") return 3;
    if (priority === "medium") return 2;
    return 1;
  }

  function readTargetingValue(attribute, context, pathname) {
    if (attribute === "country") return context.country || "";
    if (attribute === "region") return context.region || "";
    if (attribute === "city") return context.city || "";
    if (attribute === "device") return context.device || "";
    if (attribute === "device_family") return context.deviceFamily || "";
    if (attribute === "browser") return context.browser || "";
    if (attribute === "os") return context.os || "";
    if (attribute === "language") return context.language || "";
    if (attribute === "source") return context.source || "";
    if (attribute === "medium") return context.medium || "";
    if (attribute === "campaign") return context.campaign || "";
    if (attribute === "term") return context.term || "";
    if (attribute === "content") return context.content || "";
    if (attribute === "referrer") return context.referrer || "";
    if (attribute === "page_path") return pathname || window.location.pathname || "";
    if (attribute === "page_url") return context.pageUrl || window.location.href || "";
    if (attribute === "page_type") return context.pageType || "";
    if (attribute === "query_string") return context.queryString || "";
    if (attribute === "visitor_type") return context.visitorType || "";
    if (attribute === "pages_in_session") return context.pagesInSession || 0;
    if (attribute === "day_of_week") return new Date().getDay();
    if (attribute === "hour_of_day") return new Date().getHours();
    if (attribute === "viewport_width") return context.viewportWidth || 0;
    if (attribute === "viewport_height") return context.viewportHeight || 0;
    return "";
  }

  function matchTargetingCondition(condition, context, pathname) {
    var actual = readTargetingValue(condition.attribute, context, pathname);
    var actualText = String(actual || "").toLowerCase();
    var expected = String(condition.value || "").toLowerCase();
    var secondValue = String(condition.secondValue || "").toLowerCase();
    var actualNumber = Number(actual);
    var expectedNumber = Number(condition.value);
    var secondNumber = Number(condition.secondValue);

    if (condition.operator === "exists") return actual !== undefined && actual !== null && String(actual) !== "";
    if (condition.operator === "not_exists") return actual === undefined || actual === null || String(actual) === "";
    if (condition.operator === "is") return actualText === expected;
    if (condition.operator === "is_not") return actualText !== expected;
    if (condition.operator === "contains") return actualText.indexOf(expected) !== -1;
    if (condition.operator === "not_contains") return actualText.indexOf(expected) === -1;
    if (condition.operator === "starts_with") return actualText.indexOf(expected) === 0;
    if (condition.operator === "ends_with") return expected ? actualText.slice(-expected.length) === expected : false;
    if (condition.operator === "matches_regex") {
      try {
        return new RegExp(condition.value || "", "i").test(String(actual || ""));
      } catch (error) {
        return false;
      }
    }
    if (condition.operator === "gt") return actualNumber > expectedNumber;
    if (condition.operator === "gte") return actualNumber >= expectedNumber;
    if (condition.operator === "lt") return actualNumber < expectedNumber;
    if (condition.operator === "lte") return actualNumber <= expectedNumber;
    if (condition.operator === "between") return actualNumber >= expectedNumber && actualNumber <= secondNumber;
    return false;
  }

  function matchTargetingNode(node, context, pathname) {
    if (!node) return true;
    if (node.kind === "condition") {
      return matchTargetingCondition(node, context, pathname);
    }

    var matches = (node.children || []).map(function (child) {
      return matchTargetingNode(child, context, pathname);
    });
    if (!matches.length) return true;
    return node.combinator === "or"
      ? matches.some(function (result) { return result; })
      : matches.every(function (result) { return result; });
  }

  function resolveRunnableExperiments(experiments, pathname) {
    var context = baseContext();
    var filtered = experiments.filter(function (experiment) {
      return matchesPattern(experiment.pagePattern, pathname) && matchTargetingNode(experiment.targeting, context, pathname);
    }).sort(function (left, right) {
      return priorityWeight(right.priority) - priorityWeight(left.priority);
    });
    var exclusionSeen = {};
    return filtered.filter(function (experiment) {
      if (!experiment.exclusionGroup) return true;
      if (exclusionSeen[experiment.exclusionGroup]) return false;
      exclusionSeen[experiment.exclusionGroup] = true;
      return true;
    });
  }

  fetch(origin + "/api/sdk/config/" + projectId + "?ts=" + Date.now(), {
    headers: { "ngrok-skip-browser-warning": "true" },
    cache: "no-store"
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (config) {
      assignments = getAssignments();
      var pathname = window.location.pathname;
      activeExperiments = resolveRunnableExperiments(config.experiments || [], pathname);
      debugState.activeExperiments = activeExperiments.map(function (experiment) {
        return experiment.id;
      });

      activeExperiments.forEach(function (experiment) {
        var isForcedExperiment = forcedExperimentId && forcedExperimentId === experiment.id;
        if (!isForcedExperiment && !isUserInExperiment(experiment.id, experiment.trafficSplit, getAnonymousId())) {
          debugState.experimentDetails[experiment.id] = {
            variantKey: null,
            inTraffic: false,
            forced: false,
            matchedSelectors: [],
            appliedCount: 0
          };
          return;
        }

        var assigned = assignments[experiment.id];
        if (isForcedExperiment && forcedVariantKey) {
          assigned = forcedVariantKey;
          assignments[experiment.id] = assigned;
          saveAssignments(assignments);
        } else if (!assigned) {
          assigned = pickVariant(experiment.variants, getAnonymousId() + ":" + experiment.id).key;
          assignments[experiment.id] = assigned;
          saveAssignments(assignments);
        }

        var variant = experiment.variants.find(function (item) {
          return item.key === assigned;
        });
        if (!variant) return;

        debugState.experimentDetails[experiment.id] = {
          variantKey: variant.key,
          inTraffic: true,
          forced: !!isForcedExperiment,
          matchedSelectors: [],
          appliedCount: 0
        };

        applyChanges(variant.changes || [], experiment.id, variant.key);
        scheduleVariantReapply(experiment, variant);
        if (variant.key !== "A") {
          applyCustomCode(experiment.customCode);
        }
        renderRecommendationExperience(experiment, variant);
        track("session_start", { experimentId: experiment.id, variantKey: variant.key });
        track("page_view", { experimentId: experiment.id, variantKey: variant.key });
        track("experiment_impression", { experimentId: experiment.id, variantKey: variant.key });
      });

      if (!activeExperiments.length) {
        track("session_start", { experimentId: "__sdk__", variantKey: "sitewide" });
        track("page_view", { experimentId: "__sdk__", variantKey: "sitewide" });
        if (inferShopifyPageType() === "search") {
          track("search_submitted", {
            experimentId: "__sdk__",
            variantKey: "sitewide",
            searchQuery: new URL(window.location.href).searchParams.get("q") || ""
          });
        }
      }

      registerScrollTracking();
      registerPageExitTracking();
      registerClickTracking();
      registerFormTracking();
      registerVideoTracking();
      registerRecommendationTracking();
      registerCommerceTracking();
      registerErrorTracking();
      registerBuilderMode();
      emitPerformanceMetrics();
      sendHealthReport();
      window.addEventListener("online", function () {
        flushQueue(false);
        flushRecordingQueue(false);
      });
      flushQueue(false);
      flushRecordingQueue(false);

      window.optify = {
        track: function (eventType, metadata) {
          track(eventType, metadata || {});
        },
        debug: debugState
      };
      debugState.assignments = assignments;
    })
    .catch(function () {});
})();
