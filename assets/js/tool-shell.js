(() => {
  const root = document.documentElement;
  try {
    if (localStorage.getItem("bambook-theme") === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;
  } catch (error) {}
})();
