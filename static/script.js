const defaultPlaygroundCode = `<div id="demo">
  <h2 m-text="title"></h2>
  <p>Count: <strong m-text="count"></strong></p>
  <button m-click="count += 1">Count Up</button>
  <button m-click="count = 0">Reset</button>

  <ul>
    <li m-for="item in items">
      <span m-text="item"></span>
    </li>
  </ul>
</div>

<script>
  new M({
    el: "#demo",
    data() {
      return {
        title: "Hello from the playground",
        count: 0,
        items: ["m-text", "m-click", "m-for"],
      };
    },
  });
<\/script>`;

const app = new M({
  el: "#app",
  data() {
    return {
      activeTab: "intro",
      searchQuery: "",
      count: 0,
      demoInput: "",
      user: {
        firstName: "John",
        lastName: "Smith",
      },
      trackedVariable: "Initial text content",
      watchLog: "No mutations tracked yet.",
      newTodo: "",
      todos: [
        { id: 1, title: "Read the m-for loop output", done: true },
        { id: 2, title: "Add a new todo item", done: false },
        { id: 3, title: "Toggle and remove list rows", done: false },
      ],
      apiSearchTerm: "housamz",
      apiStatus: "idle",
      apiPayloadData: {},
      playgroundCode: defaultPlaygroundCode,
      playgroundFrameHtml: "",
      filterExamples: [
        {
          name: "abs",
          syntax: "{{ change | abs }}",
          input: "change = -12",
          result: "12",
          description: "Returns the absolute number.",
        },
        {
          name: "capitalize",
          syntax: "{{ name | capitalize }}",
          input: 'name = "mira"',
          result: "Mira",
          description: "Uppercases the first character.",
        },
        {
          name: "default",
          syntax: "{{ author | default:'Anonymous' }}",
          input: 'author = ""',
          result: "Anonymous",
          description: "Shows a fallback for empty values.",
        },
        {
          name: "first",
          syntax: "{{ tags | first }}",
          input: 'tags = ["ui", "state", "templates"]',
          result: "ui",
          description: "Returns the first array or string item.",
        },
        {
          name: "format",
          syntax: "{{ greeting | format:name }}",
          input: 'greeting = "Hello, {0}"; name = "Mira"',
          result: "Hello, Mira",
          description: "Replaces numbered placeholders with arguments.",
        },
        {
          name: "join",
          syntax: "{{ tags | join:', ' }}",
          input: 'tags = ["ui", "state", "templates"]',
          result: "ui, state, templates",
          description: "Joins array items with a separator.",
        },
        {
          name: "last",
          syntax: "{{ tags | last }}",
          input: 'tags = ["ui", "state", "templates"]',
          result: "templates",
          description: "Returns the last array or string item.",
        },
        {
          name: "length",
          syntax: "{{ tags | length }}",
          input: 'tags = ["ui", "state", "templates"]',
          result: "3",
          description: "Returns an array or string length.",
        },
        {
          name: "lower",
          syntax: "{{ title | lower }}",
          input: 'title = "M.JS FILTERS"',
          result: "m.js filters",
          description: "Lowercases text.",
        },
        {
          name: "max",
          syntax: "{{ scores | max }}",
          input: "scores = [7, 42, 13]",
          result: "42",
          description: "Returns the largest number in an array.",
        },
        {
          name: "min",
          syntax: "{{ scores | min }}",
          input: "scores = [7, 42, 13]",
          result: "7",
          description: "Returns the smallest number in an array.",
        },
        {
          name: "random",
          syntax: "{{ tags | random }}",
          input: 'tags = ["ui", "state", "templates"]',
          result: "ui or state or templates",
          description: "Returns a random array or string item.",
        },
        {
          name: "replace",
          syntax: "{{ title | replace:'m.js','M.js' }}",
          input: 'title = "m.js filters"',
          result: "M.js filters",
          description: "Replaces all matching text.",
        },
        {
          name: "reverse",
          syntax: "{{ tags | reverse | join:', ' }}",
          input: 'tags = ["ui", "state", "templates"]',
          result: "templates, state, ui",
          description: "Reverses arrays or strings.",
        },
        {
          name: "round",
          syntax: "{{ rating | round:1 }}",
          input: "rating = 4.67",
          result: "4.7",
          description: "Rounds a number, optionally to decimal places.",
        },
        {
          name: "slice",
          syntax: "{{ tags | slice:0,2 | join:', ' }}",
          input: 'tags = ["ui", "state", "templates"]',
          result: "ui, state",
          description: "Returns part of an array or string.",
        },
        {
          name: "sort",
          syntax: "{{ tags | sort | join:', ' }}",
          input: 'tags = ["templates", "ui", "state"]',
          result: "state, templates, ui",
          description: "Sorts array items without mutating the original array.",
        },
        {
          name: "title",
          syntax: "{{ headline | title }}",
          input: 'headline = "small template filters"',
          result: "Small Template Filters",
          description: "Capitalizes each word.",
        },
        {
          name: "trim",
          syntax: "{{ label | trim }}",
          input: 'label = "  Ready  "',
          result: "Ready",
          description: "Removes leading and trailing whitespace.",
        },
        {
          name: "truncate",
          syntax: "{{ excerpt | truncate:18 }}",
          input: 'excerpt = "A compact templating layer"',
          result: "A compact templati...",
          description: "Shortens long text.",
        },
        {
          name: "upper",
          syntax: "{{ title | upper }}",
          input: 'title = "m.js filters"',
          result: "M.JS FILTERS",
          description: "Uppercases text.",
        },
        {
          name: "unique",
          syntax: "{{ repeatedTags | unique | join:', ' }}",
          input: 'repeatedTags = ["ui", "ui", "state"]',
          result: "ui, state",
          description: "Removes duplicate array items.",
        },
        {
          name: "wordcount",
          syntax: "{{ excerpt | wordcount }}",
          input: 'excerpt = "A compact templating layer"',
          result: "4",
          description: "Counts words in a string.",
        },
        {
          name: "yesno",
          syntax: "{{ published | yesno:'Published','Draft' }}",
          input: "published = true",
          result: "Published",
          description: "Returns one of two labels based on truthiness.",
        },
      ],

      navigationSections: [
        {
          title: "Start Here",
          items: [
            { id: "css", label: "m.css Library" },
            { id: "counter", label: "Counter Example" },
            { id: "api", label: "Async Data Streams" },
          ],
        },
        {
          title: "Reactive Core",
          items: [
            { id: "bind", label: "Attribute Binding" },
            { id: "computed", label: "Computed Fields" },
            { id: "watch", label: "State Watchers" },
            { id: "lists", label: "List Rendering" },
          ],
        },
        {
          title: "Templating",
          items: [{ id: "filters", label: "Template Filters" }],
        },
        {
          title: "Tools",
          items: [
            { id: "playground", label: "Code Playground" },
          ],
        },
      ],
      exampleLinks: [
        {
          href: "./examples/basic",
          label: "Basic",
        },
        {
          href: "./examples/blog",
          label: "Blog",
        },
      ],
    };
  },
  computed: {
    fullName() {
      return `${this.user.firstName} ${this.user.lastName}`.trim();
    },
    isButtonDisabled() {
      return this.demoInput.trim().length === 0;
    },
    isTodoInputEmpty() {
      return this.newTodo.trim().length === 0;
    },
    completedTodos() {
      return this.todos.filter((todo) => todo.done).length;
    },
    todoSummary() {
      const open = this.todos.length - this.completedTodos;
      return `${open} open / ${this.todos.length} total`;
    },
    filteredNavigation() {
      const query = this.searchQuery.toLowerCase().trim();
      return this.navigationSections
        .map((section) => {
          const items = query
            ? section.items.filter((item) => {
                return (
                  item.label.toLowerCase().includes(query) ||
                  section.title.toLowerCase().includes(query)
                );
              })
            : section.items;

          return {
            title: section.title,
            items: items.map((item) => {
              return {
                id: item.id,
                label: item.label,
                activeClass: { active: this.activeTab === item.id },
              };
            }),
          };
        })
        .filter((section) => section.items.length > 0);
    },
    hasNavigationResults() {
      return this.navigationRows.some((item) => item.type === "item");
    },
    navigationRows() {
      return this.filteredNavigation.flatMap((section) => {
        return [
          {
            type: "heading",
            label: section.title,
            id: `heading-${section.title}`,
          },
          ...section.items.map((item) => ({
            type: "item",
            ...item,
          })),
        ];
      });
    },
  },
  watch: {
    trackedVariable(newValue, oldValue) {
      const stamp = new Date().toLocaleTimeString();
      this.watchLog = `[${stamp}] Altered from "${oldValue}" to "${newValue}"`;
    },
  },
  methods: {
    switchTab(tabId) {
      this.activeTab = tabId;
    },
    incrementCount() {
      this.count += 1;
    },
    decrementCount() {
      this.count -= 1;
    },
    resetCount() {
      this.count = 0;
    },
    addTodo() {
      const title = this.newTodo.trim();
      if (!title) return;

      this.todos.push({
        id: Date.now(),
        title,
        done: false,
      });
      this.newTodo = "";
    },
    toggleTodo(todoId) {
      const todo = this.todos.find((item) => item.id === todoId);
      if (todo) todo.done = !todo.done;
    },
    removeTodo(todoId) {
      const index = this.todos.findIndex((item) => item.id === todoId);
      if (index !== -1) this.todos.splice(index, 1);
    },
    clearCompleted() {
      this.todos = this.todos.filter((todo) => !todo.done);
    },
    getPlaygroundParts(code) {
      const scripts = [];
      const html = code.replace(
        /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
        (match, scriptContent) => {
          scripts.push(scriptContent);
          return "";
        },
      );

      return { html, scripts };
    },
    buildPlaygroundDocument(code) {
      const parts = this.getPlaygroundParts(code);
      const scripts = JSON.stringify(parts.scripts).replace(
        /<\/script/gi,
        "<\\/script",
      );

      return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        color: #0f172a;
        font-family: system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 20px;
      }

      button {
        background: #0087e7;
        border: 0;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-weight: 600;
        margin: 0 6px 8px 0;
        padding: 8px 12px;
      }

      ul {
        padding-left: 20px;
      }
    </style>
  </head>
  <body>
    <script>
      window.M = class M extends parent.M {
        constructor(options) {
          super({ ...options, root: document });
        }
      };
    <\/script>
    ${parts.html}
    <script>
      window.addEventListener("DOMContentLoaded", () => {
        const scripts = ${scripts};
        for (const source of scripts) {
          try {
            new Function(source)();
          } catch (error) {
            const pre = document.createElement("pre");
            pre.style.background = "#fee2e2";
            pre.style.border = "1px solid #fecaca";
            pre.style.borderRadius = "6px";
            pre.style.color = "#991b1b";
            pre.style.padding = "12px";
            pre.textContent = error.stack || error.message;
            document.body.prepend(pre);
            throw error;
          }
        }
      });
    <\/script>
  </body>
</html>`;
    },
    runPlayground() {
      this.playgroundFrameHtml = this.buildPlaygroundDocument(
        this.playgroundCode,
      );
    },
    resetPlayground() {
      this.playgroundCode = defaultPlaygroundCode;
      this.runPlayground();
    },
    async runFetchPipeline() {
      if (!this.apiSearchTerm.trim()) return;
      this.apiStatus = "loading";

      try {
        const res = await fetch(
          `https://api.github.com/users/${this.apiSearchTerm.trim()}`,
        );
        if (!res.ok) throw new Error();
        this.apiPayloadData = await res.json();
        this.apiStatus = "success";
      } catch (e) {
        this.apiStatus = "error";
      }
    },
  },
  mounted() {
    this.runPlayground();
    console.log(
      "%c✔ Documentation Hub SPA Mounted on M.js Core!",
      "color:#6366f1; font-weight:bold;",
    );
  },
});
