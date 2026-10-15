// =====================================================
//  THEME (runs on every page)
// =====================================================
const root = document.documentElement;
const themeBtn = document.getElementById("themeBtn");
const THEME_KEY = "theme";

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "dark" || saved === "light" ? saved : null;
  } catch (error) {
    return null;   // localStorage unavailable
  }
}

function getPreferredTheme() {
  // Saved choice first, otherwise follow the operating system
  return getSavedTheme() ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
}

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  if (themeBtn) {
    const next = theme === "dark" ? "light" : "dark";
    themeBtn.setAttribute("aria-label", `Switch to ${next} mode`);
    themeBtn.setAttribute("title", `Switch to ${next} mode`);
  }
}

function toggleTheme() {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch (error) { /* ignore */ }
}

applyTheme(getPreferredTheme());
if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

// If the user never chose a theme, follow OS changes live
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (!getSavedTheme()) applyTheme(getPreferredTheme());
});

// =====================================================
//  QUOTE APP (only runs on app.html)
// =====================================================
if (document.getElementById("quoteCard")) initQuoteApp();

function initQuoteApp() {
  // ----- Config -----
  const API_URL = "https://dummyjson.com/quotes/random";   // returns { id, quote, author }
  const FAV_KEY = "favoriteQuotes";

  // Curated quotes used for the category filters (the API has no categories)
  const LOCAL_QUOTES = [
    // Motivation
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Motivation" },
    { quote: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "Motivation" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "Motivation" },
    { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe", category: "Motivation" },
    { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Motivation" },
    { quote: "Fall seven times, stand up eight.", author: "Japanese Proverb", category: "Motivation" },
    { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", category: "Motivation" },
    { quote: "The future depends on what you do today.", author: "Mahatma Gandhi", category: "Motivation" },
    // Life
    { quote: "Not all those who wander are lost.", author: "J.R.R. Tolkien", category: "Life" },
    { quote: "Life shrinks or expands in proportion to one's courage.", author: "Anais Nin", category: "Life" },
    { quote: "Turn your wounds into wisdom.", author: "Oprah Winfrey", category: "Life" },
    { quote: "Whoever is happy will make others happy too.", author: "Anne Frank", category: "Life" },
    { quote: "Happiness is when what you think, what you say, and what you do are in harmony.", author: "Mahatma Gandhi", category: "Life" },
    { quote: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost", category: "Life" },
    { quote: "The purpose of our lives is to be happy.", author: "Dalai Lama", category: "Life" },
    // Wisdom
    { quote: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu", category: "Wisdom" },
    { quote: "Well done is better than well said.", author: "Benjamin Franklin", category: "Wisdom" },
    { quote: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", category: "Wisdom" },
    { quote: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", category: "Wisdom" },
    { quote: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington", category: "Wisdom" },
    { quote: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt", category: "Wisdom" },
    { quote: "Learning never exhausts the mind.", author: "Leonardo da Vinci", category: "Wisdom" },
    // Success
    { quote: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison", category: "Success" },
    { quote: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison", category: "Success" },
    { quote: "Opportunity is missed by most people because it is dressed in overalls and looks like work.", author: "Thomas Edison", category: "Success" },
    { quote: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau", category: "Success" },
    { quote: "Quality is not an act, it is a habit.", author: "Will Durant", category: "Success" },
    { quote: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela", category: "Success" },
    { quote: "Stay hungry, stay foolish.", author: "Steve Jobs", category: "Success" },
    // Philosophy
    { quote: "The unexamined life is not worth living.", author: "Socrates", category: "Philosophy" },
    { quote: "I think, therefore I am.", author: "Rene Descartes", category: "Philosophy" },
    { quote: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "Philosophy" },
    { quote: "Man is condemned to be free.", author: "Jean-Paul Sartre", category: "Philosophy" },
    { quote: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", category: "Philosophy" },
    { quote: "It is not that we have a short time to live, but that we waste much of it.", author: "Seneca", category: "Philosophy" },
    { quote: "We suffer more often in imagination than in reality.", author: "Seneca", category: "Philosophy" },
    { quote: "Imagination is more important than knowledge.", author: "Albert Einstein", category: "Philosophy" }
  ];

  // ----- DOM elements -----
  const quoteCard   = document.getElementById("quoteCard");
  const quoteText   = document.getElementById("quoteText");
  const quoteAuthor = document.getElementById("quoteAuthor");
  const quoteTag    = document.getElementById("quoteTag");
  const statusEl    = document.getElementById("status");
  const newQuoteBtn = document.getElementById("newQuoteBtn");
  const copyBtn     = document.getElementById("copyBtn");
  const shareBtn    = document.getElementById("shareBtn");
  const favoriteBtn = document.getElementById("favoriteBtn");
  const favoriteLbl = document.getElementById("favoriteLabel");
  const favList     = document.getElementById("favoritesList");
  const favCount    = document.getElementById("favCount");
  const emptyFav    = document.getElementById("emptyFavorites");
  const toastEl     = document.getElementById("toast");
  const chips       = document.querySelectorAll(".chip");

  // ----- State -----
  let currentQuote = null;        // { quote, author, category }
  let currentCategory = "All";
  let favorites = loadFavorites();
  let toastTimer = null;

  // ----- Events -----
  newQuoteBtn.addEventListener("click", getQuote);
  copyBtn.addEventListener("click", copyQuote);
  shareBtn.addEventListener("click", shareQuote);
  favoriteBtn.addEventListener("click", toggleFavorite);

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      currentCategory = chip.dataset.category;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      getQuote();
    });
  });

  // ----- Start -----
  renderFavorites();
  getQuote();

  // =====================================================
  //  Getting a quote
  // =====================================================
  async function getQuote() {
    setLoading(true);
    clearStatus();

    try {
      const quote = currentCategory === "All"
        ? await fetchApiQuote()                 // live data from the API
        : pickLocalQuote(currentCategory);      // curated category quotes
      displayQuote(quote);
    } catch (error) {
      console.error(error);
      showError("Could not fetch data. Please try again.");
      if (!currentQuote) {
        quoteText.textContent = "Press \u201CNew Quote\u201D to try again.";
        quoteAuthor.textContent = "";
        quoteTag.classList.add("hidden");
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchApiQuote() {
    let data = null;

    // Try a few times so we don't show the same quote twice in a row
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(API_URL);

      // fetch() only rejects on network failure, so check HTTP errors ourselves
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      data = await response.json();
      if (!data.quote || !data.author) throw new Error("Unexpected data format");

      if (!currentQuote || data.quote !== currentQuote.quote) break;
    }
    return { quote: data.quote, author: data.author, category: null };
  }

  function pickLocalQuote(category) {
    const pool = LOCAL_QUOTES.filter((q) => q.category === category);
    const options = pool.filter((q) => !currentQuote || q.quote !== currentQuote.quote);
    const list = options.length ? options : pool;
    return list[Math.floor(Math.random() * list.length)];
  }

  // =====================================================
  //  Updating the page
  // =====================================================
  function displayQuote(quote) {
    currentQuote = quote;

    quoteText.textContent = quote.quote;
    quoteAuthor.textContent = quote.author;
    quoteTag.textContent = quote.category || "Live from API";
    quoteTag.classList.remove("hidden");

    // restart the fade-in animation
    quoteCard.classList.remove("fade-in");
    void quoteCard.offsetWidth;
    quoteCard.classList.add("fade-in");

    setActionsEnabled(true);
    updateFavoriteButton();
  }

  function setLoading(isLoading) {
    newQuoteBtn.disabled = isLoading;
    quoteCard.setAttribute("aria-busy", String(isLoading));
    if (isLoading) statusEl.textContent = "Loading\u2026";
  }

  function setActionsEnabled(enabled) {
    copyBtn.disabled = !enabled;
    shareBtn.disabled = !enabled;
    favoriteBtn.disabled = !enabled;
  }

  function showError(message) {
    statusEl.textContent = message;
    statusEl.classList.add("error");
  }

  function clearStatus() {
    statusEl.textContent = "";
    statusEl.classList.remove("error");
  }

  // =====================================================
  //  Copy / Share
  // =====================================================
  function formatQuote(q) {
    return `"${q.quote}" \u2014 ${q.author}`;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for browsers/contexts without the Clipboard API
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      area.remove();
      return ok;
    }
  }

  async function copyQuote() {
    if (!currentQuote) return;
    const ok = await copyText(formatQuote(currentQuote));
    showToast(ok ? "Quote copied to clipboard" : "Could not copy the quote");
  }

  async function shareQuote() {
    if (!currentQuote) return;
    const text = formatQuote(currentQuote);

    if (navigator.share) {
      try {
        await navigator.share({ title: "Random Quote", text });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;   // user closed the share sheet
      }
    }

    // Fallback: copy instead
    const ok = await copyText(text);
    showToast(ok ? "Sharing isn't supported here, so the quote was copied" : "Could not share the quote");
  }

  // =====================================================
  //  Favorites
  // =====================================================
  function loadFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(FAV_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveFavorites() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch (error) { /* ignore */ }
  }

  function findFavoriteIndex(quote) {
    return favorites.findIndex((f) => f.quote === quote.quote && f.author === quote.author);
  }

  function toggleFavorite() {
    if (!currentQuote) return;
    const index = findFavoriteIndex(currentQuote);

    if (index === -1) {
      favorites.unshift({ quote: currentQuote.quote, author: currentQuote.author, category: currentQuote.category });
      showToast("Saved to favorites");
    } else {
      favorites.splice(index, 1);
      showToast("Removed from favorites");
    }

    saveFavorites();
    renderFavorites();
    updateFavoriteButton();
  }

  function removeFavorite(index) {
    favorites.splice(index, 1);
    saveFavorites();
    renderFavorites();
    updateFavoriteButton();
    showToast("Removed from favorites");
  }

  function updateFavoriteButton() {
    const saved = currentQuote && findFavoriteIndex(currentQuote) !== -1;
    favoriteBtn.setAttribute("aria-pressed", String(Boolean(saved)));
    favoriteLbl.textContent = saved ? "Favorited" : "Favorite";
  }

  function renderFavorites() {
    favList.innerHTML = "";
    favCount.textContent = favorites.length;
    emptyFav.classList.toggle("hidden", favorites.length > 0);

    favorites.forEach((item, index) => {
      const li = document.createElement("li");

      const info = document.createElement("div");
      const text = document.createElement("p");
      text.className = "fav-quote";
      text.textContent = `"${item.quote}"`;
      const author = document.createElement("p");
      author.className = "fav-author";
      author.textContent = item.author;
      info.append(text, author);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-btn";
      removeBtn.setAttribute("aria-label", `Remove quote by ${item.author} from favorites`);
      removeBtn.innerHTML =
        '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
      removeBtn.addEventListener("click", () => removeFavorite(index));

      li.append(info, removeBtn);
      favList.appendChild(li);
    });
  }

  // =====================================================
  //  Toast notification
  // =====================================================
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }
}
