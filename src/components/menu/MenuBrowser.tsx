"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Heart,
  ArrowUpRight,
  Coffee,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Copy,
  Phone,
} from "lucide-react";
import {
  allMenuItems,
  menuCategories,
  formatMenuPrice,
  type MenuItem,
} from "@/data/menu";
import { restaurant } from "@/lib/site";
import MenuImage from "./MenuImage";
import MenuPrice from "./MenuPrice";

const savedKey = "teatime:saved-dishes:v1";
const normalise = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
function minimumPrice(item: MenuItem) {
  return (
    item.price ??
    (item.variants?.length
      ? Math.min(...item.variants.map((v) => v.price))
      : Infinity)
  );
}

export default function MenuBrowser() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [batch, setBatch] = useState({ key: "", count: 24 });
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [onlySaved, setOnlySaved] = useState(false);
  const [budget, setBudget] = useState("all");
  const [dish, setDish] = useState<MenuItem | null>(null);
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const browserRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function hydrate() {
      const id = window.location.hash
        .slice(1)
        .replace("fries-Specials", "fries-specials");
      setCategory(menuCategories.some((c) => c.id === id) ? id : "all");
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") || ""); setOnlySaved(params.get("saved") === "1");
      const item = params.get("dish");
      if (item) setDish(allMenuItems.find((d) => d.id === item) || null);
    }
    Promise.resolve().then(() => {
      hydrate();
      try {
        const stored: unknown = JSON.parse(
          localStorage.getItem(savedKey) || "[]",
        );
        if (Array.isArray(stored))
          setSaved(
            new Set(
              stored.filter(
                (id): id is string =>
                  typeof id === "string" &&
                  allMenuItems.some((d) => d.id === id),
              ),
            ),
          );
      } catch {
        /* Saved dishes still work for this visit. */
      }
    });
    window.addEventListener("hashchange", hydrate);
    window.addEventListener("popstate", hydrate);
    return () => {
      window.removeEventListener("hashchange", hydrate);
      window.removeEventListener("popstate", hydrate);
    };
  }, []);

  useEffect(() => {
    if (!dish) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),a[href]",
        ) || [],
      );
    focusable()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") setDish(null);
      if (e.key === "Tab") {
        const nodes = focusable(),
          first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [dish]);

  useEffect(() => {
    const active = stripRef.current?.querySelector<HTMLElement>(
      '[aria-current="true"]',
    );
    if (
      !active ||
      !stripRef.current ||
      matchMedia("(min-width:1024px)").matches
    )
      return;
    const container = stripRef.current;
    container.scrollTo({
      left:
        active.offsetLeft -
        container.offsetLeft -
        (container.clientWidth - active.offsetWidth) / 2,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [category]);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const measure = () =>
      browserRef.current?.style.setProperty(
        "--menu-toolbar-height",
        `${toolbar.getBoundingClientRect().height}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const needle = normalise(deferred.trim());
    return allMenuItems
      .filter(
        (item) =>
          (category === "all" || item.category === category) &&
          (!onlySaved || saved.has(item.id)) &&
          (budget === "all" || minimumPrice(item) <= Number(budget)) &&
          (!needle ||
            normalise(
              `${item.name} ${item.description} ${menuCategories.find((c) => c.id === item.category)?.name}`,
            ).includes(needle)),
      )
      .sort((a, b) =>
        category === "all"
          ? Number(Boolean(b.image)) - Number(Boolean(a.image))
          : 0,
      );
  }, [category, deferred, onlySaved, saved, budget]);
  const current =
    category === "all"
      ? "The whole menu"
      : menuCategories.find((c) => c.id === category)?.name;

  const filterKey = JSON.stringify([category, deferred, onlySaved, budget]);
  const visibleCount = batch.key === filterKey ? batch.count : 24;
  const visibleItems = filtered.slice(0, visibleCount);
  function save(item: MenuItem) {
    const next = new Set(saved);
    const existed = next.has(item.id);
    if (existed) next.delete(item.id);
    else next.add(item.id);
    setSaved(next);
    try {
      localStorage.setItem(savedKey, JSON.stringify([...next]));
      setNotice(
        existed
          ? `${item.name} removed from saved dishes.`
          : `${item.name} saved for your next visit.`,
      );
    } catch {
      setNotice("Saved for this visit. Browser storage is unavailable.");
    }
  }
  function selectCategory(id: string) {
    setCategory(id);
    setNotice("");
    setQuery("");
    setDish(null);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}#${id}`,
    );
    if (resultsRef.current) {
      const top =
        resultsRef.current.getBoundingClientRect().top +
        scrollY -
        (document.querySelector(".site-header")?.getBoundingClientRect()
          .height || 90) -
        (toolbarRef.current?.getBoundingClientRect().height || 80) -
        (matchMedia("(max-width:900px)").matches
          ? document
              .querySelector(".menu-category-sidebar")
              ?.getBoundingClientRect().height || 0
          : 0) -
        20;
      if (scrollY > top)
        window.scrollTo({
          top: Math.max(0, top),
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
    }
  }
  function reset() {
    setQuery("");
    setCategory("all");
    setBudget("all");
    setOnlySaved(false);
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
    searchRef.current?.focus();
  }
  async function copy(item: MenuItem) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/menu/?dish=${encodeURIComponent(item.id)}#${item.category}`,
      );
      setNotice("Dish link copied.");
    } catch {
      setNotice(
        "Copying is unavailable in this browser. Search this dish by name to find it again.",
      );
    }
  }

  return (
    <section
      ref={browserRef}
      className="pro-menu-browser"
      aria-label="Restaurant menu"
    >
      <div ref={toolbarRef} className="menu-toolbar">
        <div className="container-custom menu-toolbar-inner">
          <label className="menu-search">
            <Search size={19} />
            <span className="sr-only">Search dishes and drinks</span>
            <input
              ref={searchRef}
              aria-label="Search dishes and drinks"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNotice("");
                if (category !== "all") setCategory("all");
              }}
              placeholder="Search a dish, drink or ingredient…"
              type="search"
            />
            {query && (
              <button
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X size={16} />
              </button>
            )}
          </label>
          <label className="menu-budget">
            <SlidersHorizontal size={16} />
            <span className="sr-only">Filter by maximum starting price</span>
            <select value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option value="all">Any price</option>
              <option value="500">Up to KSh 500</option>
              <option value="1000">Up to KSh 1,000</option>
              <option value="1500">Up to KSh 1,500</option>
            </select>
          </label>
          <button
            className="menu-saved-toggle"
            aria-pressed={onlySaved}
            onClick={() => {
              setOnlySaved((v) => !v);
              setCategory("all");
            }}
          >
            <Heart size={17} fill={onlySaved ? "currentColor" : "none"} />
            <span>Saved</span>
            <b>{saved.size}</b>
          </button>
        </div>
      </div>
      <div className="container-custom menu-browser-layout">
        <aside className="menu-category-sidebar">
          <div className="menu-category-title">
            <span>THE MENU</span>
            <span>{allMenuItems.length} dishes & drinks</span>
          </div>
          <nav aria-label="Menu categories">
            <div ref={stripRef} className="menu-category-strip">
              <button
                aria-current={category === "all" ? "true" : undefined}
                onClick={() => selectCategory("all")}
              >
                <span>All dishes & drinks</span>
                <b>{allMenuItems.length}</b>
              </button>
              {menuCategories.map((c) => (
                <button
                  key={c.id}
                  aria-current={category === c.id ? "true" : undefined}
                  onClick={() => selectCategory(c.id)}
                >
                  <span>{c.name}</span>
                  <b>
                    {allMenuItems.filter((i) => i.category === c.id).length}
                  </b>
                </button>
              ))}
            </div>
          </nav>
          <p className="menu-sidebar-note">
            A favourite today.
            <br />A familiar order tomorrow.
          </p>
        </aside>
        <div className="menu-results" ref={resultsRef}>
          <div className="menu-results-heading">
            <div>
              <p className="site-eyebrow">
                {onlySaved
                  ? "YOUR NEXT VISIT, SORTED"
                  : deferred
                    ? "FIND YOUR FAVOURITE"
                    : "TAKE YOUR PICK"}
              </p>
              <h2>
                {onlySaved
                  ? "Your saved dishes"
                  : deferred
                    ? `Results for “${deferred}”`
                    : current}
              </h2>
            </div>
            <span role="status" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="menu-results-note">
            Prices in KSh.{" "}
            {onlySaved
              ? "Saved on this device; this is not an order."
              : "Choose a dish for details, or tap the heart to save it."}{" "}
            {budget !== "all" && "Price filters use the lowest listed variant."}
          </p>
          {notice && (
            <p className="menu-notice" role="status">
              <Check size={14} />
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={14} />
              </button>
            </p>
          )}
          {filtered.length ? (
            <div className="pro-food-grid">
              {visibleItems.map((item) => (
                <article className="pro-food-card" key={item.id}>
                  <button
                    className="dish-save"
                    aria-label={`${saved.has(item.id) ? "Unsave" : "Save"} ${item.name}`}
                    aria-pressed={saved.has(item.id)}
                    onClick={() => save(item)}
                  >
                    <Heart
                      size={18}
                      fill={saved.has(item.id) ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    className="dish-open"
                    onClick={() => {
                      setNotice("");
                      setDish(item);
                    }}
                    aria-label={`View ${item.name}`}
                  >
                    <div
                      className={`pro-food-photo ${!item.image ? "without-photo" : ""}`}
                    >
                      {item.image ? (
                        <MenuImage
                          src={item.image}
                          alt={item.imageCredit?.label || item.name}
                          sizes="(min-width:1280px) 300px,(min-width:640px) 40vw,100px"
                        />
                      ) : (
                        <>
                          <Coffee size={35} strokeWidth={1} />
                          <span>TEATIME KITCHEN</span>
                        </>
                      )}
                    </div>
                    <div className="pro-food-copy">
                      <span className="dish-category">
                        {
                          menuCategories.find((c) => c.id === item.category)
                            ?.name
                        }
                      </span>
                      <h3>{item.name}</h3>
                      {item.description && <p>{item.description}</p>}
                      <span className="pro-food-price">
                        {item.variants ? "From " : ""}
                        {Number.isFinite(minimumPrice(item))
                          ? formatMenuPrice(minimumPrice(item))
                          : "Ask our team"}
                      </span>
                      <span className="dish-detail-link">
                        View details <ChevronRight size={13} />
                      </span>
                    </div>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="menu-empty">
              <Search size={30} />
              <h3>
                {onlySaved && saved.size === 0
                  ? "Your next favourites start here."
                  : "No dishes found this time."}
              </h3>
              <p>
                {onlySaved && saved.size === 0
                  ? "Tap the heart on any dish to keep it here for your next visit."
                  : "Try another name, ingredient or price range."}
              </p>
              <button className="site-button site-button-dark" onClick={reset}>
                Explore the full menu <ArrowUpRight size={15} />
              </button>
            </div>
          )}
          {visibleItems.length < filtered.length && (
            <div className="menu-load-more">
              <p>
                Showing {visibleItems.length} of {filtered.length} dishes &
                drinks
              </p>
              <button
                className="site-button site-button-dark"
                onClick={() =>
                  setBatch({ key: filterKey, count: visibleCount + 24 })
                }
              >
                Explore more dishes <ChevronRight size={16} />
              </button>
            </div>
          )}
          <div className="menu-help">
            <Coffee size={23} />
            <div>
              <strong>A question before your first bite?</strong>
              <p>
                Ask the team about ingredients, allergens and today’s
                availability.
              </p>
            </div>
            <a href={`tel:${restaurant.phone}`}>
              Call TeaTime <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </div>
      {dish && (
        <div
          className="dish-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDish(null);
          }}
        >
          <div
            className="dish-modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dish-detail-title"
          >
            <button
              className="dish-modal-close"
              aria-label="Close dish details"
              onClick={() => setDish(null)}
            >
              <X size={21} />
            </button>
            <div
              className={`dish-modal-photo ${!dish.image ? "without-photo" : ""}`}
            >
              {dish.image ? (
                <MenuImage
                  src={dish.image}
                  alt={dish.imageCredit?.label || dish.name}
                  sizes="(min-width:768px) 450px,90vw"
                />
              ) : (
                <Coffee size={64} strokeWidth={1} />
              )}
            </div>
            <div className="dish-modal-copy">
              <p className="site-eyebrow">
                {menuCategories.find((c) => c.id === dish.category)?.name}
              </p>
              <h2 id="dish-detail-title">{dish.name}</h2>
              {dish.description && (
                <p className="dish-modal-description">{dish.description}</p>
              )}
              <MenuPrice item={dish} />
              {dish.imageCredit && (
                <p className="dish-photo-credit">
                  {dish.imageCredit.label} ·{" "}
                  <a
                    href={dish.imageCredit.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {dish.imageCredit.author}
                  </a>{" "}
                  ·{" "}
                  <a
                    href={dish.imageCredit.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {dish.imageCredit.license}
                  </a>
                </p>
              )}
              <div className="dish-modal-actions">
                <button
                  onClick={() => save(dish)}
                  className="site-button site-button-red"
                >
                  <Heart
                    size={17}
                    fill={saved.has(dish.id) ? "currentColor" : "none"}
                  />
                  {saved.has(dish.id) ? "Saved for later" : "Save for my visit"}
                </button>
                <button
                  className="dish-copy"
                  onClick={() => copy(dish)}
                  aria-label="Copy dish link"
                >
                  <Copy size={18} />
                </button>
              </div>
              <a className="dish-enquiry" href={`tel:${restaurant.phone}`}>
                <Phone size={15} /> Ask about this dish{" "}
                <ArrowUpRight size={14} />
              </a>
              <p className="dish-allergen-note">
                Descriptions are not a complete allergen guide. Please speak
                with our team about dietary requirements before ordering. Prices
                and availability may change.
              </p>
              {notice && (
                <p role="status" className="dish-modal-notice">
                  {notice}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

