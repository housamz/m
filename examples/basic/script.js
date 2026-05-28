const pages = {
  home: {
    file: "pages/home.html",
    title: "Home m.js Templates",
    subtitle: "A small layout and fragment renderer.",
  },
  about: {
    file: "pages/about.html",
    title: "About m.js Templates",
    subtitle: "A small layout and fragment renderer.",
  },
  counter: {
    file: "pages/counter.html",
    title: "Counter Page",
    subtitle: "This page owns the JavaScript that powers its counter.",
  },
  todos: {
    file: "pages/todos.html",
    title: "Todo Page",
    subtitle: "A separate page fragment with its own state and methods.",
  },
};

M.startTemplateRouter({
  el: "#app",
  base: "base.html",
  defaultPage: "home",
  pages,
  data: {
    scores: [12, 44, 8, 19],
    tags: ["templates", "filters", "layouts"],
    emptyAuthor: "",
    year: new Date().getFullYear(),
  },
  onError(error) {
    document.querySelector("#app").innerHTML = `
      <main class="page">
        <section class="panel error-panel">
          <h1>Template Error</h1>
          <pre>${error.stack || error.message}</pre>
        </section>
      </main>
    `;
  },
});
