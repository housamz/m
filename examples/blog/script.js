window.blog = {
  defaultPage: "articles",
  posts: M.createPostManager(window.blogPosts),
  currentSlug() {
    return M.getRouteSlug({ defaultPage: this.defaultPage });
  },
};

const pages = {
  articles: {
    file: "pages/articles.html",
    title: "Latest Articles",
    subtitle: "Notes on building small browser-first tools with m.js.",
  },
  article: {
    file: "pages/article.html",
    title: "Article",
    subtitle: "",
  },
  about: {
    file: "pages/about.html",
    title: "About M Journal",
    subtitle: "A small blog powered by m.js templates and page scripts.",
  },
  contact: {
    file: "pages/contact.html",
    title: "Contact",
    subtitle: "A tiny reactive form that belongs to this page fragment.",
  },
};

function renderBlog() {
  const pageName = M.getPageName(pages, {
    defaultPage: window.blog.defaultPage,
  });
  const page = pages[pageName];

  M.renderTemplate({
    el: "#app",
    base: "base.html",
    slots: {
      content: page.file,
    },
    data: {
      title: page.title,
      subtitle: page.subtitle,
      articlesActive: pageName === "articles" || pageName === "article" ? "active" : "",
      aboutActive: pageName === "about" ? "active" : "",
      contactActive: pageName === "contact" ? "active" : "",
      postCount: window.blog.posts.published().length,
      year: new Date().getFullYear(),
    },
  }).catch((error) => {
    document.querySelector("#app").innerHTML = `
      <main class="page">
        <section class="panel error-panel">
          <h1>Blog Error</h1>
          <pre>${error.stack || error.message}</pre>
        </section>
      </main>
    `;
  });
}

window.addEventListener("hashchange", renderBlog);
renderBlog();
