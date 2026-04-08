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
    activeExperiments: []
  };

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

  function matchesPattern(pattern, pathname) {
    if (pattern === pathname) return true;
    if (pattern.slice(-1) === "*") return pathname.indexOf(pattern.slice(0, -1)) === 0;
    return pathname.indexOf(pattern) !== -1;
  }

  function applyChanges(changes) {
    changes.forEach(function (change) {
      var elements = document.querySelectorAll(change.selector);
      elements.forEach(function (element) {
        if (change.type === "text" || change.type === "cta") {
          element.textContent = change.value;
        }
        if (change.type === "visibility") {
          element.style.display = change.value === "hide" ? "none" : "";
        }
        if (change.type === "style") {
          element.style.cssText += change.value;
        }
      });
    });
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

    var overlay = document.createElement("div");
    overlay.setAttribute("data-optify-builder-ui", "true");
    overlay.style.cssText = "position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #135c43;background:rgba(19,92,67,.12);border-radius:10px;display:none;";
    document.body.appendChild(overlay);

    var badge = document.createElement("div");
    badge.setAttribute("data-optify-builder-ui", "true");
    badge.style.cssText = "position:fixed;top:16px;left:16px;z-index:2147483647;background:#11291f;color:#fff;padding:10px 14px;border-radius:999px;font:600 12px/1.2 sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.18);";
    badge.textContent = "Optify placement picker: hover and click an element";
    document.body.appendChild(badge);

    function resolveTarget(eventTarget) {
      if (!eventTarget || !eventTarget.closest) return null;
      var target = eventTarget.closest("section,aside,div,button,a,ul,ol,li,article,header,footer,main");
      if (target && target.getAttribute && target.getAttribute("data-optify-builder-ui") === "true") return null;
      return target;
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

      var payload = {
        type: "optify-builder-selection",
        selector: buildPreciseSelector(target),
        fallbackSelector: buildElementSelector(target),
        label: normalizeText(target.textContent || target.getAttribute("aria-label") || target.tagName, 120),
        pathname: window.location.pathname,
        url: window.location.href
      };

      if (window.opener && typeof window.opener.postMessage === "function") {
        window.opener.postMessage(payload, builderOrigin || "*");
      }

      badge.textContent = "Selection sent back to Optify";
      window.setTimeout(function () {
        try {
          window.close();
        } catch (error) {}
        badge.textContent = "Selection sent back to Optify. You can close this tab.";
      }, 140);
    }, true);
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

  fetch(origin + "/api/sdk/config/" + projectId, {
    headers: { "ngrok-skip-browser-warning": "true" }
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
        var assigned = assignments[experiment.id];
        if (!assigned) {
          assigned = pickVariant(experiment.variants, getAnonymousId() + ":" + experiment.id).key;
          assignments[experiment.id] = assigned;
          saveAssignments(assignments);
        }

        var variant = experiment.variants.find(function (item) {
          return item.key === assigned;
        });
        if (!variant) return;

        applyChanges(variant.changes || []);
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
