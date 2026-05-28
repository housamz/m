/**
 * @typedef {Object} MOptions
 * @property {string|Element} el CSS selector or element for the root M.js controls.
 * @property {Document|Element} [root=document] Document or element used to resolve `el` selectors.
 * @property {Object|Function} [data] Initial reactive state or a function that returns it.
 * @property {Object<string, Function>} [computed] Getter functions exposed on state.
 * @property {Object<string, Function>} [watch] Watchers keyed by state path.
 * @property {Object<string, Function>} [methods] Methods bound to the reactive state object.
 * @property {Function} [mounted] Lifecycle hook called after state setup.
 */

/**
 * Tiny browser-only reactive view layer.
 *
 * M owns one root element, wraps data in recursive proxies, evaluates template
 * expressions against that data, and refreshes supported `m-*` bindings when
 * state changes.
 */
class M {
  /**
   * Creates an M.js application instance.
   *
   * @param {MOptions} options App configuration.
   * @throws {Error} If the configured root element cannot be found.
   */
  constructor(options) {
    this.$root = options.root || document;
    this.$doc =
      this.$root.nodeType === 9 ? this.$root : this.$root.ownerDocument;
    this.$el =
      typeof options.el === "string"
        ? this.$root.querySelector(options.el)
        : options.el;
    if (!this.$el) {
      throw new Error(`M could not find element: ${options.el}`);
    }

    this.$computed = options.computed || {};
    this.$watchers = options.watch || {};
    this.$behaviors = {};
    this._templateId = 0;
    this._modelBindings = new WeakSet();
    this._eventBindings = new WeakMap();
    this._scopes = new WeakMap();

    this._registerBuiltInBehaviors();

    const initialData =
      typeof options.data === "function" ? options.data() : options.data || {};
    this._initComputed(initialData);
    this.$data = this._createReactiveObject(initialData, () =>
      this._updateDOM(),
    );

    if (options.methods) {
      for (const key in options.methods) {
        this.$data[key] = options.methods[key].bind(this.$data);
      }
    }

    if (options.mounted) {
      options.mounted.call(this.$data);
    }

    this._updateDOM();
  }

  /**
   * Renders a HTML template into a target element.
   *
   * `base` is a layout file. `<m-slot name="content"></m-slot>` tags inside it
   * are replaced by fragment files listed in `slots`. Any template can also use
   * `<m-include src="file.html"></m-include>` for reusable partials.
   *
   * @param {Object} options Template rendering options.
   * @param {string|Element} options.el Target element or selector.
   * @param {string} options.base Layout file path.
   * @param {Object<string, string>} [options.slots] Slot names mapped to fragment paths.
   * @param {Object} [options.data] Values available to `{{ key }}` placeholders.
   * @param {Document|Element} [options.root=document] Document or element used to resolve `el`.
   * @returns {Promise<Element>} The element that received the rendered HTML.
   */
  static async renderTemplate(options) {
    const root = options.root || document;
    const target =
      typeof options.el === "string" ? root.querySelector(options.el) : options.el;

    if (!target) {
      throw new Error(`M could not find template target: ${options.el}`);
    }

    const html = await M._loadTemplate(options.base, {
      data: options.data || {},
      slots: options.slots || {},
    });

    target.innerHTML = html;
    if (options.executeScripts !== false) {
      M._executeTemplateScripts(target);
    }
    return target;
  }

  /**
   * Short alias for `M.renderTemplate(...)`.
   *
   * @param {Object} options Template rendering options.
   * @returns {Promise<Element>} The element that received the rendered HTML.
   */
  static async template(options) {
    return M.renderTemplate(options);
  }

  /**
   * Gets the current page name for a hash-routed template site.
   *
   * Hash routes such as `#/about` are preferred. Query-string routes such as
   * `?page=about` are accepted as a fallback and converted to hash routes.
   *
   * @param {Object<string, Object>} pages Page registry keyed by page name.
   * @param {Object} [options] Routing options.
   * @param {string} [options.defaultPage="about"] Page used when no route matches.
   * @param {string} [options.detailPage] Page used for `defaultPage/slug` routes.
   * @param {string} [options.queryParam="page"] Query-string fallback key.
   * @param {Function} [options.matchPage] Custom matcher for dynamic routes.
   * @returns {string} Selected page name.
   */
  static getPageName(pages, options = {}) {
    const defaultPage = options.defaultPage;
    const detailPage = options.detailPage || M.singularize(defaultPage);
    const queryParam = options.queryParam || "page";
    const hashPage = M.getRoutePath();
    const params = new URLSearchParams(window.location.search);
    const queryPage = params.get(queryParam);

    if (pages[hashPage]) return hashPage;

    if (
      defaultPage &&
      pages[detailPage] &&
      hashPage.startsWith(`${defaultPage}/`)
    ) {
      return detailPage;
    }

    if (options.matchPage) {
      const matchedPage = options.matchPage(hashPage, pages);
      if (pages[matchedPage]) return matchedPage;
    }

    if (pages[queryPage]) {
      window.location.hash = `#/${queryPage}`;
      return queryPage;
    }

    if (
      defaultPage &&
      pages[detailPage] &&
      queryPage?.startsWith(`${defaultPage}/`)
    ) {
      window.location.hash = `#/${queryPage}`;
      return detailPage;
    }

    if (options.matchPage) {
      const matchedPage = options.matchPage(queryPage, pages);
      if (pages[matchedPage]) {
        window.location.hash = `#/${queryPage}`;
        return matchedPage;
      }
    }

    return pages[defaultPage] ? defaultPage : Object.keys(pages)[0];
  }

  /**
   * Gets the current hash route without the `#/` prefix.
   *
   * @returns {string} Current route path.
   */
  static getRoutePath() {
    return window.location.hash.replace(/^#\/?/, "");
  }

  /**
   * Gets the slug portion from a collection/detail route.
   *
   * With `defaultPage: "articles"`, `#/articles/my-post` returns `my-post`.
   * With `defaultPage: "posts"`, `#/posts/my-post` returns `my-post`.
   *
   * @param {Object} options Route options.
   * @param {string} options.defaultPage Collection route prefix.
   * @returns {string} Decoded slug or an empty string.
   */
  static getRouteSlug(options = {}) {
    const route = M.getRoutePath();
    const prefix = `${options.defaultPage}/`;

    if (!options.defaultPage || !route.startsWith(prefix)) return "";

    return decodeURIComponent(route.slice(prefix.length));
  }

  /**
   * Applies a small English singularization for collection/detail routes.
   *
   * @param {string} value Collection route name.
   * @returns {string} Singular page name.
   */
  static singularize(value) {
    if (!value) return "";
    if (value.endsWith("ies")) return `${value.slice(0, -3)}y`;
    if (value.endsWith("s")) return value.slice(0, -1);
    return value;
  }

  /**
   * Renders the current hash-routed page into a base template.
   *
   * Each page can define `file`, `title`, `subtitle`, and an optional `data`
   * object. The render data also receives active-link helpers such as
   * `aboutActive`, `counterActive`, etc.
   *
   * @param {Object} options Page rendering options.
   * @param {Object<string, Object>} options.pages Page registry.
   * @param {string|Element} options.el Target element or selector.
   * @param {string} options.base Layout file path.
   * @param {string} [options.slot="content"] Slot name to fill with the current page.
   * @param {string} [options.defaultPage="about"] Page used when no route matches.
   * @param {Object} [options.data] Shared template data.
   * @param {Function} [options.onError] Error handler.
   * @returns {Promise<Element>} The element that received the rendered HTML.
   */
  static async renderCurrentPage(options) {
    const slot = options.slot || "content";
    const pageName = M.getPageName(options.pages, {
      defaultPage: options.defaultPage,
      detailPage: options.detailPage,
      queryParam: options.queryParam,
      matchPage: options.matchPage,
    });
    const page = options.pages[pageName];
    const activeData = {};

    Object.keys(options.pages).forEach((name) => {
      activeData[`${name}Active`] = name === pageName ? "active" : "";
    });

    try {
      return await M.renderTemplate({
        el: options.el,
        base: options.base,
        root: options.root,
        executeScripts: options.executeScripts,
        slots: {
          ...(options.slots || {}),
          [slot]: page.file,
        },
        data: {
          ...(options.data || {}),
          ...(page.data || {}),
          ...activeData,
          title: page.title,
          subtitle: page.subtitle,
        },
      });
    } catch (error) {
      if (options.onError) {
        options.onError(error);
        return null;
      }

      throw error;
    }
  }

  /**
   * Starts a tiny hash router for template pages.
   *
   * @param {Object} options Same options accepted by `M.renderCurrentPage`.
   * @returns {Function} Function that removes the hashchange listener.
   */
  static startTemplateRouter(options) {
    const render = () => M.renderCurrentPage(options);
    window.addEventListener("hashchange", render);
    render();

    return () => window.removeEventListener("hashchange", render);
  }

  /**
   * Creates a tiny post manager for blog examples and static sites.
   *
   * Posts are normalized with a slug and sorted newest-first by default. The
   * returned manager gives page scripts a small API for lists, detail pages,
   * tags, and featured posts without scattering post logic across templates.
   *
   * @param {Array<Object>} posts Raw post objects.
   * @param {Object} [options] Post manager options.
   * @param {boolean} [options.sort=true] Sort posts by date descending.
   * @returns {Object} Post manager API.
   */
  static createPostManager(posts, options = {}) {
    const shouldSort = options.sort !== false;
    const normalized = posts.map((post) => ({
      ...post,
      slug: post.slug || M.slugify(post.title),
      tags: post.tags || [],
    }));

    if (shouldSort) {
      normalized.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return {
      all() {
        return normalized;
      },
      published() {
        return normalized.filter((post) => post.draft !== true);
      },
      featured() {
        return normalized.filter((post) => post.featured === true);
      },
      find(slug) {
        return normalized.find((post) => post.slug === slug) || null;
      },
      byTag(tag) {
        return normalized.filter((post) => post.tags.includes(tag));
      },
      tags() {
        return Array.from(new Set(normalized.flatMap((post) => post.tags)));
      },
    };
  }

  /**
   * Converts a title into a URL-friendly slug.
   *
   * @param {string} value Source value.
   * @returns {string} Slug.
   */
  static slugify(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Executes scripts that were inserted as rendered template HTML.
   *
   * Browsers do not run `<script>` tags that arrive through `innerHTML`.
   * Replacing each script node with a fresh one makes inline and external page
   * scripts behave as if they were present in the original document.
   *
   * @private
   * @param {Element} root Rendered template root.
   * @returns {void}
   */
  static _executeTemplateScripts(root) {
    const scripts = Array.from(root.querySelectorAll("script"));

    scripts.forEach((script) => {
      const nextScript = root.ownerDocument.createElement("script");

      Array.from(script.attributes).forEach((attr) => {
        nextScript.setAttribute(attr.name, attr.value);
      });

      if (!script.src) {
        nextScript.textContent = script.textContent;
      }

      script.replaceWith(nextScript);
    });
  }

  /**
   * Fetches a template file and resolves its includes, slots, and placeholders.
   *
   * @private
   * @param {string} path Template file path.
   * @param {{ data: Object, slots: Object<string, string> }} options Render context.
   * @param {string|null} [fromPath=null] Parent template path for relative includes.
   * @returns {Promise<string>} Rendered HTML.
   */
  static async _loadTemplate(path, options, fromPath = null) {
    const url = M._resolveTemplatePath(path, fromPath);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`M could not load template: ${path}`);
    }

    const template = await response.text();
    return M._renderTemplateString(template, options, url);
  }

  /**
   * Replaces template tags in a loaded HTML string.
   *
   * @private
   * @param {string} template HTML template source.
   * @param {{ data: Object, slots: Object<string, string> }} options Render context.
   * @param {string} currentPath Current template path.
   * @returns {Promise<string>} Rendered HTML.
   */
  static async _renderTemplateString(template, options, currentPath) {
    let html = await M._replaceAsync(
      template,
      /<m-include\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/m-include>/gi,
      (match, src) => M._loadTemplate(src, options, currentPath),
    );

    html = await M._replaceAsync(
      html,
      /<m-slot\s+[^>]*name=["']([^"']+)["'][^>]*>\s*<\/m-slot>/gi,
      (match, name) => {
        const slotPath = options.slots[name];
        return slotPath ? M._loadTemplate(slotPath, options) : "";
      },
    );

    return M._interpolate(html, options.data);
  }

  /**
   * Performs async string replacement.
   *
   * @private
   * @param {string} value Source string.
   * @param {RegExp} pattern Pattern to replace.
   * @param {Function} replacer Async replacer.
   * @returns {Promise<string>} Replaced string.
   */
  static async _replaceAsync(value, pattern, replacer) {
    const matches = Array.from(value.matchAll(pattern));
    const replacements = await Promise.all(
      matches.map((match) => replacer(...match)),
    );

    return matches.reduce((result, match, index) => {
      return result.replace(match[0], replacements[index]);
    }, value);
  }

  /**
   * Replaces `{{ key }}` and `{{ key | filter }}` placeholders.
   *
   * @private
   * @param {string} html Rendered HTML.
   * @param {Object} data Placeholder values.
   * @returns {string} HTML with placeholders filled.
   */
  static _interpolate(html, data) {
    return html.replace(/{{\s*([^}]+?)\s*}}/g, (match, expression) => {
      return M._evaluateTemplateExpression(expression, data) ?? "";
    });
  }

  /**
   * Evaluates one template placeholder expression.
   *
   * Supports a simple Jinja-inspired filter chain:
   * `{{ scores | max }}`, `{{ title | upper }}`, `{{ items | join:", " }}`.
   *
   * @private
   * @param {string} expression Placeholder expression.
   * @param {Object} data Template data.
   * @returns {*} Evaluated value.
   */
  static _evaluateTemplateExpression(expression, data) {
    const [path, ...filters] = expression.split("|").map((part) => part.trim());
    const value = M._getPath(data, path);

    return filters.reduce((current, filterExpression) => {
      const [name, ...rawArgs] = filterExpression
        .split(":")
        .map((part) => part.trim());
      const args = rawArgs.join(":");
      return M._applyTemplateFilter(name, current, args, data);
    }, value);
  }

  /**
   * Reads a dot-separated value from an object.
   *
   * @private
   * @param {Object} data Source object.
   * @param {string} path Dot-separated path.
   * @returns {*} Resolved value.
   */
  static _getPath(data, path) {
    return path.split(".").reduce((current, key) => current?.[key], data);
  }

  /**
   * Applies a built-in template filter.
   *
   * @private
   * @param {string} name Filter name.
   * @param {*} value Current value.
   * @param {string} rawArgs Raw filter argument string.
   * @param {Object} data Template data.
   * @returns {*} Filtered value.
   */
  static _applyTemplateFilter(name, value, rawArgs, data) {
    const filters = M.templateFilters;
    if (!filters[name]) return value;

    return filters[name](value, M._parseFilterArgs(rawArgs, data));
  }

  /**
   * Parses filter arguments.
   *
   * @private
   * @param {string} rawArgs Raw argument string.
   * @param {Object} data Template data.
   * @returns {Array<*>} Parsed arguments.
   */
  static _parseFilterArgs(rawArgs, data) {
    if (!rawArgs) return [];

    return M._splitFilterArgs(rawArgs).map((arg) => {
      const trimmed = arg.trim();
      const quoted = trimmed.match(/^["'](.*)["']$/);
      if (quoted) return quoted[1];
      if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
      if (trimmed === "true") return true;
      if (trimmed === "false") return false;

      return M._getPath(data, trimmed) ?? trimmed;
    });
  }

  /**
   * Splits filter arguments while preserving commas inside quoted strings.
   *
   * @private
   * @param {string} rawArgs Raw argument string.
   * @returns {string[]} Argument tokens.
   */
  static _splitFilterArgs(rawArgs) {
    const args = [];
    let current = "";
    let quote = null;

    for (const char of rawArgs) {
      if ((char === "'" || char === '"') && !quote) {
        quote = char;
      } else if (char === quote) {
        quote = null;
      }

      if (char === "," && !quote) {
        args.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    if (current) args.push(current);
    return args;
  }

  /**
   * Resolves a template path relative to either a parent template or page URL.
   *
   * @private
   * @param {string} path Template path.
   * @param {string|null} fromPath Parent template path.
   * @returns {string} Resolved URL or original path.
   */
  static _resolveTemplatePath(path, fromPath = null) {
    try {
      return new URL(path, fromPath || window.location.href).href;
    } catch (e) {
      return path;
    }
  }

  /**
   * Registers a custom behavior/directive.
   *
   * A behavior is an object with an `update(el, binding, ctx, scope)` method.
   * It is called during every DOM update for matching attributes.
   *
   * @param {string} name Attribute name, such as "m-text" or "m-highlight".
   * @param {{ update: Function }} definition Behavior implementation.
   */
  behavior(name, definition) {
    this.$behaviors[name] = definition;
  }

  /**
   * Registers the built-in behavior set used by templates.
   *
   * @private
   * @returns {void}
   */
  _registerBuiltInBehaviors() {
    this.behavior("m-text", {
      update: (el, binding, ctx, scope) => {
        const value = ctx._evaluate(binding.expression, scope);
        el.textContent = value ?? "";
      },
    });

    this.behavior("m-show", {
      update: (el, binding, ctx, scope) => {
        const value = ctx._evaluate(binding.expression, scope);
        el.style.display = value ? "" : "none";
      },
    });

    this.behavior("m-html", {
      update: (el, binding, ctx, scope) => {
        const value = ctx._evaluate(binding.expression, scope);
        el.innerHTML = value ?? "";
      },
    });

    this.behavior("m-bind", {
      update: (el, binding, ctx, scope) => {
        if (!binding.arg) return;
        const value = ctx._evaluate(binding.expression, scope);
        ctx._setBoundAttribute(el, binding.arg, value);
      },
    });
  }

  /**
   * Defines computed properties as getters on the raw data object.
   *
   * Computed getters run with `this` pointing at reactive state once available,
   * which lets them read other data and computed values naturally.
   *
   * @private
   * @param {Object} rawData Initial data object before it is proxied.
   * @returns {void}
   */
  _initComputed(rawData) {
    for (const key in this.$computed) {
      Object.defineProperty(rawData, key, {
        get: () => this.$computed[key].call(this.$data || rawData),
        enumerable: true,
        configurable: true,
      });
    }
  }

  /**
   * Recursively wraps state objects in a Proxy.
   *
   * The proxy catches property writes and deletes, runs matching watchers, and
   * invokes the update callback so the DOM can be refreshed. Nested objects are
   * wrapped too, so assignments such as `this.user.name = "Ada"` are reactive.
   *
   * @private
   * @param {*} target Value to wrap.
   * @param {Function} callback Called after a reactive mutation.
   * @param {string} [path=""] Dot path for nested watcher lookup.
   * @returns {*} A proxied object or the original primitive/null value.
   */
  _createReactiveObject(target, callback, path = "") {
    if (typeof target !== "object" || target === null) return target;

    for (const key in target) {
      const descriptor = Object.getOwnPropertyDescriptor(target, key);
      if (descriptor && descriptor.get && !descriptor.set) continue;

      target[key] = this._createReactiveObject(
        target[key],
        callback,
        this._joinPath(path, key),
      );
    }

    return new Proxy(target, {
      set: (obj, prop, value) => {
        const key = String(prop);
        const fullPath = this._joinPath(path, key);
        const oldValue = obj[prop];

        obj[prop] = this._createReactiveObject(value, callback, fullPath);

        if (oldValue !== value) {
          this._runWatcher(key, obj[prop], oldValue);
          if (fullPath !== key) this._runWatcher(fullPath, obj[prop], oldValue);
          callback();
        }

        return true;
      },
      deleteProperty: (obj, prop) => {
        const key = String(prop);
        const fullPath = this._joinPath(path, key);
        const oldValue = obj[prop];

        delete obj[prop];
        this._runWatcher(key, undefined, oldValue);
        if (fullPath !== key) this._runWatcher(fullPath, undefined, oldValue);
        callback();
        return true;
      },
    });
  }

  /**
   * Joins a parent state path and property name.
   *
   * @private
   * @param {string} base Parent path.
   * @param {string} key Property name.
   * @returns {string} Dot-separated path.
   */
  _joinPath(base, key) {
    return base ? `${base}.${key}` : key;
  }

  /**
   * Runs a watcher if one was registered for the changed path.
   *
   * @private
   * @param {string} path State path that changed.
   * @param {*} newValue New value.
   * @param {*} oldValue Previous value.
   * @returns {void}
   */
  _runWatcher(path, newValue, oldValue) {
    if (this.$watchers[path]) {
      this.$watchers[path].call(this.$data, newValue, oldValue);
    }
  }

  /**
   * Evaluates a template expression against reactive state and local scope.
   *
   * @private
   * @param {string} expression JavaScript expression from an `m-*` attribute.
   * @param {Object} [scope={}] Local values from loops/events.
   * @param {*} [fallback=undefined] Value returned if evaluation fails.
   * @returns {*} Evaluated result or fallback.
   */
  _evaluate(expression, scope = {}, fallback = undefined) {
    try {
      const scopeKeys = Object.keys(scope).filter((key) => key !== "$event");
      const scopeValues = scopeKeys.map((key) => scope[key]);
      const fn = new Function(
        ...scopeKeys,
        "$event",
        `with (this) { return (${expression}); }`,
      );
      return fn.call(this.$data, ...scopeValues, scope.$event);
    } catch (e) {
      return fallback;
    }
  }

  /**
   * Executes an event handler expression.
   *
   * Method references such as `save` are called as functions. Inline
   * expressions such as `count += 1` are evaluated directly, with `$event`
   * available in scope.
   *
   * @private
   * @param {string} expression Event directive value.
   * @param {Object} [scope={}] Local values from loops.
   * @param {Event|null} [event=null] DOM event object.
   * @returns {*} Handler return value.
   */
  _runExpression(expression, scope = {}, event = null) {
    const eventScope = { ...scope, $event: event };
    const trimmed = expression.trim();

    if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(trimmed)) {
      const value = this._evaluate(trimmed, eventScope);
      if (typeof value === "function") {
        return value.call(this.$data, event);
      }
    }

    try {
      const scopeKeys = Object.keys(eventScope).filter(
        (key) => key !== "$event",
      );
      const scopeValues = scopeKeys.map((key) => eventScope[key]);
      const fn = new Function(
        ...scopeKeys,
        "$event",
        `with (this) { return (${expression}); }`,
      );
      return fn.call(this.$data, ...scopeValues, event);
    } catch (expressionError) {
      const scopeKeys = Object.keys(eventScope).filter(
        (key) => key !== "$event",
      );
      const scopeValues = scopeKeys.map((key) => eventScope[key]);
      const fn = new Function(
        ...scopeKeys,
        "$event",
        `with (this) { ${expression}; }`,
      );
      return fn.call(this.$data, ...scopeValues, event);
    }
  }

  /**
   * Assigns a nested state path for `m-model` updates.
   *
   * @private
   * @param {Object} obj Root object to mutate.
   * @param {string} path Dot-separated path.
   * @param {*} value New value.
   * @returns {void}
   */
  _setDeepValue(obj, path, value) {
    const parts = path.split(".");
    const last = parts.pop();
    const target = parts.reduce((current, part) => current?.[part], obj);
    if (target && last) target[last] = value;
  }

  /**
   * Runs one full DOM update cycle.
   *
   * The update keeps focused inputs stable while conditionals, loops, models,
   * events, and behaviors are rebound.
   *
   * @private
   * @returns {void}
   */
  _updateDOM() {
    const focusState = this._captureFocusState();

    this._clearRenderedConditionals();
    this._renderConditionals();
    this._prepareForTemplates();
    this._renderLoops();
    this._bindLiveModels();
    this._bindLiveEvents();
    this._applyBehaviors();

    this._restoreFocusState(focusState);
  }

  /**
   * Converts `m-for` elements into hidden reusable templates.
   *
   * @private
   * @returns {void}
   */
  _prepareForTemplates() {
    this.$el
      .querySelectorAll("[m-for]:not([m-template])")
      .forEach((element) => {
        const expression = element.getAttribute("m-for") || "";
        const match = expression.match(
          /^\s*([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?\s+in\s+(.+?)\s*$/,
        );
        if (!match) return;

        const clone = element.cloneNode(true);
        clone.removeAttribute("m-for");

        element.__mFor = {
          id: `m-for-${++this._templateId}`,
          itemName: match[1],
          indexName: match[2] || "$index",
          listExpression: match[3],
          clone,
        };

        element.setAttribute("m-template", "true");
        element.style.display = "none";
      });
  }

  /**
   * Renders all prepared `m-for` templates from their current list values.
   *
   * @private
   * @returns {void}
   */
  _renderLoops() {
    this.$el.querySelectorAll("[m-template]").forEach((placeholder) => {
      const config = placeholder.__mFor;
      if (!config) return;

      placeholder.parentNode
        .querySelectorAll(`[data-m-for="${config.id}"]`)
        .forEach((node) => node.remove());

      const list = this._evaluate(config.listExpression, {}, []) || [];
      Array.from(list).forEach((item, index) => {
        const instance = config.clone.cloneNode(true);
        const scope = {
          [config.itemName]: item,
          [config.indexName]: index,
          $index: index,
        };

        instance.setAttribute("data-m-for", config.id);
        this._assignScope(instance, scope);
        this._applyBehaviors(instance);
        placeholder.parentNode.insertBefore(instance, placeholder);
      });
    });
  }

  /**
   * Removes nodes previously created from conditional templates.
   *
   * @private
   * @returns {void}
   */
  _clearRenderedConditionals() {
    this.$el
      .querySelectorAll("[data-m-if-rendered]")
      .forEach((node) => node.remove());
  }

  /**
   * Renders `<template m-if>`, `<template m-else-if>`, and `<template m-else>`.
   *
   * @private
   * @returns {void}
   */
  _renderConditionals() {
    const processed = new WeakSet();
    let renderedNestedTemplates = true;

    while (renderedNestedTemplates) {
      renderedNestedTemplates = false;
      const templates = Array.from(
        this.$el.querySelectorAll(
          "template[m-if], template[m-else-if], template[m-else]",
        ),
      ).filter((template) => !processed.has(template));

      let chainMatched = false;

      templates.forEach((template) => {
        processed.add(template);

        if (template.hasAttribute("m-if")) {
          chainMatched = false;
        }

        let shouldRender = false;
        const scope = this._scopeFor(template);

        if (template.hasAttribute("m-if")) {
          shouldRender = !!this._evaluate(template.getAttribute("m-if"), scope);
          chainMatched = shouldRender;
        } else if (template.hasAttribute("m-else-if")) {
          shouldRender =
            !chainMatched &&
            !!this._evaluate(template.getAttribute("m-else-if"), scope);
          chainMatched = chainMatched || shouldRender;
        } else if (template.hasAttribute("m-else")) {
          shouldRender = !chainMatched;
          chainMatched = true;
        }

        if (!shouldRender) return;

        const fragment = template.content.cloneNode(true);
        Array.from(fragment.childNodes).forEach((node) => {
          if (node.nodeType === 3 && node.textContent.trim() === "") {
            node.remove();
          }
        });

        const topNodes = Array.from(fragment.children);
        topNodes.forEach((node) => {
          node.setAttribute("data-m-if-rendered", "true");
          if (Object.keys(scope).length > 0) this._assignScope(node, scope);
        });

        template.parentNode.insertBefore(fragment, template.nextSibling);
        if (topNodes.some((node) => node.querySelector("template"))) {
          renderedNestedTemplates = true;
        }
      });
    }
  }

  /**
   * Binds `m-model` inputs and syncs their DOM value from state.
   *
   * @private
   * @param {Element} [root=this.$el] Root element to scan.
   * @returns {void}
   */
  _bindLiveModels(root = this.$el) {
    this._eachElement(root, (element) => {
      if (this._isInsideTemplate(element)) return;

      if (!element.hasAttribute("m-model")) {
        return;
      }

      if (!this._modelBindings.has(element)) {
        this._modelBindings.add(element);
        element.addEventListener("input", (event) => {
          this._setDeepValue(
            this.$data,
            element.getAttribute("m-model"),
            event.target.value,
          );
        });
      }

      this._syncModelElement(element);
    });
  }

  /**
   * Updates a form control from its current `m-model` expression.
   *
   * Focused elements are skipped so typing does not lose cursor position.
   *
   * @private
   * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} element Form control.
   * @returns {void}
   */
  _syncModelElement(element) {
    if (element === this.$doc.activeElement) return;

    const value = this._evaluate(element.getAttribute("m-model"), {});

    if (element.type === "checkbox") {
      element.checked = !!value;
      return;
    }

    if (element.type === "radio") {
      element.checked = value === element.value;
      return;
    }

    const nextValue = value ?? "";
    if (element.value !== nextValue) element.value = nextValue;
  }

  /**
   * Captures enough information to restore focus after a DOM refresh.
   *
   * @private
   * @returns {Object|null} Focus snapshot, or null if focus is outside the app.
   */
  _captureFocusState() {
    const element = this.$doc.activeElement;
    if (!element || !this.$el.contains(element)) return null;

    const state = {
      model: element.getAttribute("m-model"),
      name: element.getAttribute("name"),
      id: element.id,
      tagName: element.tagName,
      type: element.getAttribute("type"),
      selectionStart: null,
      selectionEnd: null,
      selectionDirection: null,
    };

    if ("selectionStart" in element) {
      try {
        state.selectionStart = element.selectionStart;
        state.selectionEnd = element.selectionEnd;
        state.selectionDirection = element.selectionDirection;
      } catch (e) {
        // Some input types expose selection fields but throw when read.
      }
    }

    return state;
  }

  /**
   * Restores focus and text selection after a DOM refresh.
   *
   * @private
   * @param {Object|null} state Snapshot returned by `_captureFocusState`.
   * @returns {void}
   */
  _restoreFocusState(state) {
    if (!state) return;

    const element = this._findFocusableMatch(state);
    if (!element || element === this.$doc.activeElement) return;

    element.focus({ preventScroll: true });

    if (
      state.selectionStart !== null &&
      typeof element.setSelectionRange === "function"
    ) {
      try {
        element.setSelectionRange(
          state.selectionStart,
          state.selectionEnd,
          state.selectionDirection || "none",
        );
      } catch (e) {
        // Non-text inputs cannot restore a selection range.
      }
    }
  }

  /**
   * Finds the best matching focusable element for a saved focus snapshot.
   *
   * @private
   * @param {Object} state Focus snapshot.
   * @returns {Element|null} Matching element, if one still exists.
   */
  _findFocusableMatch(state) {
    const selectors = [];
    const escape =
      this.$doc.defaultView?.CSS?.escape ||
      ((value) => String(value).replace(/"/g, '\\"'));

    if (state.model) {
      selectors.push(`[m-model="${escape(state.model)}"]`);
    }

    if (state.id) {
      selectors.push(`#${escape(state.id)}`);
    }

    if (state.name) {
      selectors.push(`[name="${escape(state.name)}"]`);
    }

    for (const selector of selectors) {
      const matches = Array.from(this.$el.querySelectorAll(selector)).filter(
        (element) =>
          !this._isInsideTemplate(element) &&
          element.tagName === state.tagName &&
          (!state.type || element.getAttribute("type") === state.type),
      );

      if (matches.length > 0) return matches[0];
    }

    return null;
  }

  /**
   * Binds supported event directives such as `m-click` and `m-submit`.
   *
   * Each element/event pair is only bound once, even across multiple DOM
   * refreshes.
   *
   * @private
   * @param {Element} [root=this.$el] Root element to scan.
   * @returns {void}
   */
  _bindLiveEvents(root = this.$el) {
    this._eachElement(root, (element) => {
      if (this._isInsideTemplate(element)) return;

      for (const attr of Array.from(element.attributes)) {
        const parsed = this._parseEventDirective(attr.name);
        if (!parsed) continue;

        const key = `${parsed.event}:${attr.name}`;
        const elementBindings = this._eventBindings.get(element) || new Set();
        if (elementBindings.has(key)) continue;

        elementBindings.add(key);
        this._eventBindings.set(element, elementBindings);

        element.addEventListener(parsed.event, (event) => {
          if (parsed.modifiers.includes("prevent")) event.preventDefault();
          if (parsed.modifiers.includes("stop")) event.stopPropagation();
          this._runExpression(attr.value, this._scopeFor(element), event);
        });
      }
    });
  }

  /**
   * Parses an event directive name into a DOM event and modifier list.
   *
   * @private
   * @param {string} name Attribute name.
   * @returns {{ event: string, modifiers: string[] }|null} Parsed event info.
   */
  _parseEventDirective(name) {
    if (!name.startsWith("m-click") && !name.startsWith("m-submit")) {
      return null;
    }

    const [directive, ...modifiers] = name.split(".");
    return {
      event: directive === "m-submit" ? "submit" : "click",
      modifiers,
    };
  }

  /**
   * Applies all registered behaviors to matching attributes.
   *
   * This also normalizes shorthand bindings such as `:disabled` into the
   * built-in `m-bind` behavior.
   *
   * @private
   * @param {Element} [root=this.$el] Root element to scan.
   * @returns {void}
   */
  _applyBehaviors(root = this.$el) {
    this._eachElement(root, (element) => {
      if (this._isInsideTemplate(element)) return;

      const scope = this._scopeFor(element);

      for (const attr of Array.from(element.attributes)) {
        let name = attr.name;
        let arg = null;

        if (name.startsWith(":")) {
          arg = name.slice(1);
          name = "m-bind";
        } else if (name.startsWith("m-bind:")) {
          arg = name.split(":")[1];
          name = "m-bind";
        }

        if (this.$behaviors[name]) {
          this.$behaviors[name].update(
            element,
            { expression: attr.value, arg },
            this,
            scope,
          );
        }
      }
    });
  }

  /**
   * Writes a bound value to an element attribute/property.
   *
   * Handles class object maps, boolean DOM properties, regular properties, and
   * attribute removal for falsey binding values.
   *
   * @private
   * @param {Element} element Target element.
   * @param {string} name Attribute or property name.
   * @param {*} value Bound value.
   * @returns {void}
   */
  _setBoundAttribute(element, name, value) {
    if (name === "class" && typeof value === "object" && value !== null) {
      for (const className in value) {
        element.classList.toggle(className, !!value[className]);
      }
      return;
    }

    if (name in element && typeof element[name] === "boolean") {
      element[name] = !!value;
      if (value) {
        element.setAttribute(name, "");
      } else {
        element.removeAttribute(name);
      }
      return;
    }

    if (name in element && name !== "list" && name !== "type") {
      element[name] = value ?? "";
    }

    if (value === false || value === null || value === undefined) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value === true ? "" : String(value));
    }
  }

  /**
   * Iterates a root element and all descendants.
   *
   * @private
   * @param {Element} root Root element.
   * @param {Function} callback Called for each element.
   * @returns {void}
   */
  _eachElement(root, callback) {
    if (root.nodeType === 1) callback(root);
    root.querySelectorAll("*").forEach(callback);
  }

  /**
   * Checks whether an element is inside an inactive `m-for` template.
   *
   * @private
   * @param {Element} element Element to test.
   * @returns {boolean} True when the element belongs to a hidden template.
   */
  _isInsideTemplate(element) {
    return (
      element.hasAttribute("m-template") || !!element.closest("[m-template]")
    );
  }

  /**
   * Assigns loop/conditional scope values to a rendered subtree.
   *
   * @private
   * @param {Element} root Rendered subtree root.
   * @param {Object} scope Local scope values.
   * @returns {void}
   */
  _assignScope(root, scope) {
    this._eachElement(root, (element) => {
      this._scopes.set(element, scope);
    });
  }

  /**
   * Finds the nearest local scope for an element.
   *
   * @private
   * @param {Element} element Element requesting scope.
   * @returns {Object} Scope object or an empty object.
   */
  _scopeFor(element) {
    let current = element;
    while (current && current !== this.$el.parentNode) {
      const scope = this._scopes.get(current);
      if (scope) return scope;
      current = current.parentElement;
    }
    return {};
  }
}

M.templateFilters = {
  abs(value) {
    return Math.abs(Number(value));
  },
  capitalize(value) {
    const text = String(value ?? "");
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
  },
  default(value, args) {
    return value === null || value === undefined || value === "" ? args[0] : value;
  },
  first(value) {
    return Array.isArray(value) || typeof value === "string" ? value[0] : "";
  },
  format(value, args) {
    return args.reduce((text, arg, index) => {
      return String(text).replace(new RegExp(`\\{${index}\\}`, "g"), arg);
    }, value);
  },
  join(value, args) {
    return Array.isArray(value) ? value.join(args[0] ?? ", ") : value;
  },
  last(value) {
    return Array.isArray(value) || typeof value === "string"
      ? value[value.length - 1]
      : "";
  },
  length(value) {
    return value?.length ?? 0;
  },
  lower(value) {
    return String(value ?? "").toLowerCase();
  },
  max(value) {
    return Array.isArray(value) ? Math.max(...value) : value;
  },
  min(value) {
    return Array.isArray(value) ? Math.min(...value) : value;
  },
  random(value) {
    if (!Array.isArray(value) && typeof value !== "string") return value;
    return value[Math.floor(Math.random() * value.length)];
  },
  replace(value, args) {
    const [from = "", to = ""] = args;
    return String(value ?? "").split(from).join(to);
  },
  reverse(value) {
    if (Array.isArray(value)) return [...value].reverse();
    if (typeof value === "string") return value.split("").reverse().join("");
    return value;
  },
  round(value, args) {
    const precision = Number(args[0]) || 0;
    const factor = 10 ** precision;
    return Math.round(Number(value) * factor) / factor;
  },
  slice(value, args) {
    const start = Number(args[0]) || 0;
    const end = args[1] === undefined ? undefined : Number(args[1]);
    return Array.isArray(value) || typeof value === "string"
      ? value.slice(start, end)
      : value;
  },
  sort(value) {
    if (!Array.isArray(value)) return value;
    return [...value].sort((a, b) => {
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    });
  },
  title(value) {
    return String(value ?? "")
      .split(" ")
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(" ");
  },
  trim(value) {
    return String(value ?? "").trim();
  },
  truncate(value, args) {
    const text = String(value ?? "");
    const limit = Number(args[0]) || 30;
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
  },
  unique(value) {
    if (!Array.isArray(value)) return value;
    return Array.from(new Set(value));
  },
  upper(value) {
    return String(value ?? "").toUpperCase();
  },
  wordcount(value) {
    const text = String(value ?? "").trim();
    return text ? text.split(/\s+/).length : 0;
  },
  yesno(value, args) {
    const [yes = "yes", no = "no"] = args;
    return value ? yes : no;
  },
};

window.M = M;
