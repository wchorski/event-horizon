document.querySelectorAll("textarea").forEach((el) => {
    if (!el.classList.contains("resize")) return;
    const resize = () => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    };

    el.addEventListener("input", resize);
    resize();
  });