const searchInput = document.querySelector("#guide-search");
const searchStatus = document.querySelector("#search-status");
const chapters = [...document.querySelectorAll(".chapter[data-searchable]")];
const chapterLinks = [...document.querySelectorAll(".contents a")];

searchInput.addEventListener("input", () => {
	const query = searchInput.value.trim().toLocaleLowerCase();
	let visibleCount = 0;

	chapters.forEach((chapter) => {
		const matches = !query || chapter.textContent.toLocaleLowerCase().includes(query);
		chapter.hidden = !matches;
		if (matches) visibleCount++;
	});

	chapterLinks.forEach((link) => {
		const target = document.querySelector(link.getAttribute("href"));
		link.hidden = !target || target.hidden;
	});

	searchStatus.textContent = query
		? `${visibleCount} ${visibleCount === 1 ? "chapter" : "chapters"} found`
		: `${chapters.length} chapters`;
});

const chapterObserver = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (!entry.isIntersecting) return;
		chapterLinks.forEach((link) => {
			link.classList.toggle("is-active", link.hash === `#${entry.target.id}`);
		});
	});
}, {rootMargin: "-10% 0px -75% 0px"});

chapters.forEach((chapter) => chapterObserver.observe(chapter));