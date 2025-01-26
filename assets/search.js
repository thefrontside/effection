document.addEventListener("DOMContentLoaded", function () {
  const searchElement = document.getElementById("search");
  if (searchElement) {
    searchElement.addEventListener("blur", function () {
      searchElement.removeAttribute("value");
      searchElement.setAttribute("placeholder", "⌘K");
    });

    document.addEventListener("keydown", function (event) {
      if (event.metaKey && event.key === "k") {
        event.preventDefault();
        searchElement.focus();
        searchElement.removeAttribute("placeholder");
      }
      if (event.key === "Escape") {
        searchElement.blur();
      }
    });
  }
});
