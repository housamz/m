# m

m is a minimal (~ 20kb), zero-build frontend library for adding reactive behavior directly to plain HTML. It gives you a small `new M(...)` API, declarative `m-*` attributes, computed values, watchers, event handlers, simple conditionals, loops, and custom behaviors without requiring a bundler or component compiler. It can also work as a small templating library: render a shared layout, fill slots with page fragments, include reusable partials, replace `{{ placeholders }}`, apply filters, and route between pages in a static website. It also includes `m.css`, an optional CSS library for clean defaults and small reusable UI classes.

The JavaScript library is contained in [`m.js`](./m.js), the CSS library is contained in [`m.css`](./m.css), and [`index.html`](./index.html) is a complete browser demo.

## Features

- Reactive state powered by JavaScript `Proxy`
- Text binding with `m-text`
- Two-way input binding with `m-model`
- Conditional rendering with `<template m-if>`, `<template m-else-if>`, and `<template m-else>`
- List rendering with `m-for`
- Event handlers with `m-click` and `m-submit`
- Event modifiers: `.prevent` and `.stop`
- Attribute binding with `m-bind:attr` or `:attr`
- Computed properties
- Watchers for top-level and nested state paths
- Lifecycle hook with `mounted`
- Custom directive-like behaviors with `app.behavior(...)`
- Static templating with layouts, slots, includes, placeholders, filters, and hash-routed pages
- Optional CSS library with semantic element styling, layout helpers, buttons, cards, badges, alerts, and form defaults

## Quick Start

Include `m.js` in a browser page and create an `M` instance for a root element. Add `m.css` too if you want the built-in styling.

```html
<link rel="stylesheet" href="m.min.css" />

<div id="app">
  <input m-model="name" />
  <p>Hello, <span m-text="name"></span>.</p>
  <button m-click="resetName">Reset</button>
</div>

<script src="m.min.js"></script>
<script>
  const app = new M({
    el: "#app",
    data() {
      return {
        name: "Sara",
      };
    },
    methods: {
      resetName() {
        this.name = "Sara";
      },
    },
  });
</script>
```

Open the HTML file in a browser.

## Use Hosted Files

You can use the minified JS and CSS directly in any browser project by linking the hosted files:

```html
<link rel="stylesheet" href="https://www.hmz.ie/m/min/m.min.css" />
<script src="https://www.hmz.ie/m/min/m.min.js"></script>
```

Place the stylesheet in the document `<head>`. Place the script before the closing `</body>` tag, or before your inline app script, so `window.M` is available when you call `new M(...)`.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://www.hmz.ie/m/min/m.min.css" />
    <title>M.js App</title>
  </head>
  <body>
    <main id="app" class="page stack">
      <article>
        <h1 m-text="title"></h1>
        <p>Count: <strong m-text="count"></strong></p>
        <button type="button" m-click="count += 1">Count Up</button>
      </article>
    </main>

    <script src="https://www.hmz.ie/m/min/m.min.js"></script>
    <script>
      new M({
        el: "#app",
        data() {
          return {
            title: "Hello from M.js",
            count: 0,
          };
        },
      });
    </script>
  </body>
</html>
```

## CSS Library

`m.css` is optional. It is designed for examples, prototypes, documentation pages, and small apps that should look good with mostly semantic HTML.

To use it locally, link the file in your page:

```html
<link rel="stylesheet" href="m.css" />
```

For production or hosted usage, link the minified file:

```html
<link rel="stylesheet" href="https://www.hmz.ie/m/min/m.min.css" />
```

The stylesheet includes base styles for common elements such as headings, links, lists, forms, tables, `article`, `blockquote`, `details`, `code`, and `pre`. It also includes utility and component classes:

- Layout: `.container`, `.page`, `.stack`, `.cluster`, `.grid`, `.split`
- Text helpers: `.lead`, `.lead-text`, `.muted`, `.eyebrow`, `.meta`
- Components: `.button`, `.card`, `.panel`, `.badge`, `.alert`, `.navbar`
- States and variants: `.button.secondary`, `.button.outline`, `.alert.success`, `.alert.warning`, `.alert.danger`

Example:

```html
<main class="page stack">
  <section class="hero">
    <p class="eyebrow">Example</p>
    <h1>Small app, already styled</h1>
    <p class="lead">Semantic HTML carries most of the design.</p>
  </section>

  <div class="grid">
    <article>
      <span class="badge">Card</span>
      <h2>Readable defaults</h2>
      <p>Use articles, forms, tables, and buttons without writing custom CSS first.</p>
      <a class="button" href="#">Continue</a>
    </article>

    <article>
      <h2>Form controls</h2>
      <label>
        Project name
        <input type="text" value="M Journal" />
      </label>
      <div class="cluster">
        <button type="button">Save</button>
        <button type="button" class="button secondary">Cancel</button>
      </div>
    </article>
  </div>
</main>
```

## Creating an App

`new M(options)` accepts these options:

```js
const app = new M({
  el: "#app",
  data() {
    return {
      count: 0,
      user: {
        firstName: "Sara",
        lastName: "Smith",
      },
    };
  },
  computed: {
    fullName() {
      return `${this.user.firstName} ${this.user.lastName}`;
    },
  },
  watch: {
    count(newValue, oldValue) {
      console.log("count changed", oldValue, newValue);
    },
    "user.firstName"(newValue, oldValue) {
      console.log("first name changed", oldValue, newValue);
    },
  },
  methods: {
    increment() {
      this.count += 1;
    },
  },
  mounted() {
    console.log("App mounted");
  },
});
```

Inside `computed`, `watch`, `methods`, and `mounted`, `this` points at the reactive data object.

## Template Syntax

### Text

```html
<h1 m-text="fullName"></h1>
```

`m-text` evaluates the expression and writes the result to `textContent`.

### Show and Hide

```html
<p m-show="count > 0">The counter has started.</p>
```

`m-show` toggles the element's `display` style. The element remains in the DOM.

### Two-Way Model Binding

```html
<input m-model="user.firstName" />
```

`m-model` keeps form input values and state paths in sync. Text inputs, checkboxes, and radio buttons are supported.

### Attribute Binding

```html
<button :disabled="count === 0">Save</button>
<img m-bind:src="avatarUrl" />
<div :class="{ active: isActive, hidden: !isVisible }"></div>
```

Use either `:attr` or `m-bind:attr`. Boolean properties such as `disabled` are handled as DOM properties, and object values for `class` toggle each class by truthiness.

### Events

```html
<button m-click="increment">Increment</button>
<button m-click="count += 1">Increment inline</button>

<form m-submit.prevent="save">
  <input m-model="name" />
  <button type="submit">Save</button>
</form>
```

Event attributes can call a method by name or run an inline expression. The current DOM event is available as `$event`.

```html
<button m-click="selectUser($event, user)">Select</button>
```

Supported events are currently `m-click` and `m-submit`.

Supported modifiers:

- `.prevent` calls `event.preventDefault()`
- `.stop` calls `event.stopPropagation()`

### Conditionals

Conditionals use `<template>` elements:

```html
<template m-if="status === 'loading'">
  <p>Loading...</p>
</template>
<template m-else-if="status === 'error'">
  <p>Something went wrong.</p>
</template>
<template m-else>
  <p>Ready.</p>
</template>
```

M.js clones the matching template content into the DOM and removes previously rendered conditional content on each update.

### Loops

```html
<ul>
  <li m-for="todo, index in todos">
    <span m-text="index + 1"></span>.
    <span m-text="todo.title"></span>
  </li>
</ul>
```

The loop expression format is:

```txt
item in list
item, index in list
```

Inside a loop, the item name, index name, and `$index` are available to bindings and event handlers.

## How It Works

M.js does a full DOM refresh pass whenever reactive state changes:

1. `data` is wrapped in a recursive `Proxy`.
2. `computed` properties are defined as getters on the raw data object.
3. `methods` are bound onto the reactive data object.
4. State changes trigger matching watchers.
5. State changes call `_updateDOM()`.
6. `_updateDOM()` captures focused input state, renders conditionals and loops, binds models and events, applies behaviors, then restores focus.

M.js uses `Proxy` because plain JavaScript objects do not automatically announce when a property changes. A proxy lets the library intercept operations like assigning or deleting values, so code such as `this.count += 1` can trigger watchers and refresh the DOM.

The proxy wrapping is recursive so nested state is reactive too. If your data contains `user.firstName`, changing `this.user.firstName = "Grace"` still triggers an update. Without recursive wrapping, M.js would only notice top-level replacements like `this.user = newUser`, not edits inside the existing nested object.

Expressions are evaluated with `new Function(...)` inside a `with (this)` block, where `this` is the reactive data object. Loop variables and `$event` are passed in as local scope values.

Because expressions are executable JavaScript, M.js is intended for trusted templates, not user-authored HTML.

## Adding Features

There are a few main ways to extend the library.

## Static Templating

M.js can also render simple HTML layouts before starting a reactive app. This lets you use `m` as a tiny website templating library for static sites, documentation, portfolios, small blogs, or multi-page demos without introducing a build step.

```js
await M.renderTemplate({
  el: "#app",
  base: "base.html",
  slots: {
    content: "pages/about.html",
  },
  data: {
    title: "About",
  },
});
```

Supported template features:

- `<m-slot name="content"></m-slot>` is replaced by a file from `slots.content`
- `<m-include src="partials/header.html"></m-include>` loads a reusable partial
- `{{ title }}` is replaced by values from `data`
- `{{ scores | max }}`, `{{ tags | first }}`, and other filters transform values
- `M.startTemplateRouter(...)` renders hash routes such as `#/about`

Built-in filters: `abs`, `capitalize`, `default`, `first`, `format`, `join`, `last`, `length`, `lower`, `max`, `min`, `random`, `replace`, `reverse`, `round`, `slice`, `sort`, `title`, `trim`, `truncate`, `unique`, `upper`, `wordcount`, and `yesno`.

### Building a Full Website

A typical `m` website has one browser entry file, one base layout, shared partials, and one HTML fragment per page:

```txt
site/
├── index.html
├── base.html
├── script.js
├── partials/
│   ├── header.html
│   └── footer.html
└── pages/
    ├── home.html
    ├── about.html
    ├── articles.html
    └── contact.html
```

`index.html` only needs a mount element and the library:

```html
<div id="app">Loading...</div>

<script src="https://www.hmz.ie/m/min/m.min.js"></script>
<script src="script.js"></script>
```

Use `base.html` for the shared shell. Slots are filled by pages, includes are reusable fragments, and placeholders come from render data:

```html
<div class="site-shell">
  <m-include src="partials/header.html"></m-include>

  <main class="page">
    <m-slot name="content"></m-slot>
  </main>

  <m-include src="partials/footer.html"></m-include>
</div>
```

Create each page as a normal HTML fragment. Page fragments can use placeholders and can also start their own reactive `new M(...)` instance after they render:

```html
<section id="contact-page">
  <h1>{{ title }}</h1>
  <p>{{ subtitle }}</p>

  <form m-submit.prevent="send">
    <input m-model="email" type="email" placeholder="Email" />
    <button type="submit">Send</button>
  </form>
</section>

<script>
  new M({
    el: "#contact-page",
    data() {
      return { email: "" };
    },
    methods: {
      send() {
        alert(`Thanks, ${this.email}`);
      },
    },
  });
</script>
```

Then wire the pages together with the template router:

```js
const pages = {
  home: {
    file: "pages/home.html",
    title: "Home",
    subtitle: "Welcome to the site.",
  },
  about: {
    file: "pages/about.html",
    title: "About",
    subtitle: "A static page rendered into the shared layout.",
  },
  articles: {
    file: "pages/articles.html",
    title: "Articles",
    subtitle: "A list page.",
  },
  contact: {
    file: "pages/contact.html",
    title: "Contact",
    subtitle: "A page with its own reactive form.",
  },
};

M.startTemplateRouter({
  el: "#app",
  base: "base.html",
  defaultPage: "home",
  pages,
  data: {
    year: new Date().getFullYear(),
    siteName: "My Site",
  },
});
```

This creates hash routes such as `#/home`, `#/about`, `#/articles`, and `#/contact`. Each route renders the same base layout, swaps the `content` slot to the matching file, injects `title`, `subtitle`, shared data such as `siteName`, and active-link helpers such as `homeActive` and `aboutActive`.

For blogs or content collections, keep posts in a small JavaScript file and use `M.createPostManager(...)` for slugs, sorting, tag lists, featured posts, and detail lookups. The blog example shows a list route like `#/articles` and detail routes like `#/articles/building-a-blog-with-m-js-templates`.

See [`examples/basic/`](./examples/basic/) for a complete multi-page site and [`examples/blog/`](./examples/blog/) for a small blog. Run them from a local web server because the renderer uses `fetch()` to load HTML files:

```bash
python3 -m http.server 8080
```

Then open:

```txt
http://localhost:8080/examples/basic/
http://localhost:8080/examples/blog/
```

### Add a Custom Behavior

Use `app.behavior(name, definition)` to add a directive-like attribute. A behavior receives:

- `el`: the DOM element
- `binding.expression`: the attribute value
- `binding.arg`: the argument for bindings such as `m-bind:title`
- `ctx`: the current `M` instance
- `scope`: loop or conditional scope values

Example:

```js
const app = new M({
  el: "#app",
  data() {
    return {
      isImportant: true,
    };
  },
});

app.behavior("m-highlight", {
  update(el, binding, ctx, scope) {
    const enabled = ctx._evaluate(binding.expression, scope);
    el.style.background = enabled ? "yellow" : "";
  },
});
```

```html
<p m-highlight="isImportant">Highlighted when important.</p>
```

Behaviors are applied during every DOM update, so they should be idempotent.

### Add a Built-In Directive

To add a core behavior, register it in `_registerBuiltInBehaviors()`:

```js
this.behavior("m-html", {
  update: (el, binding, ctx, scope) => {
    el.innerHTML = ctx._evaluate(binding.expression, scope, "");
  },
});
```

Then it can be used in templates:

```html
<article m-html="trustedHtml"></article>
```

Only use an HTML-writing directive with trusted content.

### Add a New Event Directive

Event directives are parsed by `_parseEventDirective(name)`. To support another event, such as `m-input`, extend that method and return the DOM event name plus modifiers.

Conceptually:

```js
_parseEventDirective(name) {
  if (!name.startsWith("m-click") && !name.startsWith("m-submit") && !name.startsWith("m-input")) {
    return null;
  }

  const [directive, ...modifiers] = name.split(".");
  return {
    event: directive === "m-submit" ? "submit" : directive.slice(2),
    modifiers,
  };
}
```

After that, templates can use:

```html
<input m-input="handleInput($event)" />
```

### Add New State Behavior

Reactive state handling lives in `_createReactiveObject()`. This is the place to add features such as batching, async scheduling, deeper watcher semantics, or array-specific handling.

When changing state behavior, check:

- Does the watcher receive the right `newValue` and `oldValue`?
- Does nested state still trigger updates?
- Do computed getters still read from the current reactive object?
- Does focus remain stable while typing into inputs?

## Project Structure

```txt
.
├── index.html   # Demo and usage examples
├── m.css        # CSS library source
├── m.js         # M.js source
├── m.min.css    # Minified CSS library
├── m.min.js     # Minified M.js build
├── examples     # Example apps
└── README.md    # Project documentation
```

## Notes and Limitations

- M.js is browser-only and exposes itself as `window.M`.
- Templates are trusted JavaScript execution contexts.
- DOM updates are simple and broad rather than virtual-DOM diffed.
- Custom behavior names should not conflict with existing `m-*` attributes.
- There is currently no package manifest, test runner, or module export.

## Minifying the Library

Use the following terminal command

```shell
# Minifying JS
npx terser m.js \
--compress passes=3 \
--mangle toplevel,reserved=['M'] \
--mangle-props regex=/^_/ \
--output min/m.min.js

# Minifying CSS
npx clean-css-cli -o min/m.min.css m.css
```
