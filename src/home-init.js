const hero = document.querySelector(".hero");
const sections = [...document.querySelectorAll(".home-section")];

if (hero && sections.length) {
  const updateBlur = () => {
    const navBottom = document.querySelector("#navbar")?.getBoundingClientRect().bottom || 116;
    sections.forEach((section) => {
      section.classList.toggle("is-passing-nav", section.getBoundingClientRect().bottom < navBottom);
    });
  };
  window.addEventListener("scroll", updateBlur, { passive: true });
  window.addEventListener("resize", updateBlur);
  updateBlur();
}
