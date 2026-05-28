window.blogPosts = [
  {
    title: "Building a Blog with m.js Templates",
    date: "2026-05-27",
    excerpt:
      "Use base layouts, page fragments, and a small post manager to build a blog without a build step.",
    tags: ["m.js", "templating", "static-site"],
    featured: true,
    body: `
      <p>The blog starts with <code>base.html</code>, fills its content slot with a page fragment, and then runs that page's script.</p>
      <p>The article list and detail page both read from <code>posts.js</code>, so post management stays in one place.</p>
    `,
  },
  {
    title: "Page Scripts per Fragment",
    date: "2026-05-20",
    excerpt:
      "Each HTML fragment can include its own script and start a scoped m.js app.",
    tags: ["routing", "fragments"],
    body: `
      <p>Scripts inside rendered fragments are executed by <code>M.renderTemplate()</code>.</p>
      <p>That lets each page own its behavior while the layout stays shared.</p>
    `,
  },
  {
    title: "Managing Posts in One File",
    date: "2026-05-12",
    excerpt:
      "A post is just an object with title, date, excerpt, tags, and body HTML.",
    tags: ["content", "posts"],
    body: `
      <p>To add a new post, add another object to <code>window.blogPosts</code>.</p>
      <p>If you omit <code>slug</code>, m.js creates one from the title with <code>M.slugify()</code>.</p>
    `,
  },
];
