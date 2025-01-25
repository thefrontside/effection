document.addEventListener("DOMContentLoaded", function () {
  const searchElement = document.getElementById("search");
  if (searchElement) {
    searchElement.addEventListener("blur", function () {
      searchElement.value = "";
    });

        document.addEventListener('keydown', function(event) {
            if (event.metaKey && event.key === 'k') {
                event.preventDefault();
                searchElement.focus();
            }
            if (event.key === 'Escape') {
                searchElement.blur();
            }
        });
    }
});
