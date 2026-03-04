(function redirectToUnifiedSurveyPage() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const id = parts.length >= 2 && parts[0] === "survey" ? Number(parts[1]) : 0;
  const fallbackLink = document.getElementById("fallbackLink");

  if (Number.isInteger(id) && id > 0) {
    const target = `/survey.html?id=${id}&tab=settings`;
    if (fallbackLink) fallbackLink.href = target;
    window.location.replace(target);
    return;
  }

  if (fallbackLink) fallbackLink.href = "/cabinet";
})();
