"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import Scanner from "./Scanner";
import AdminDetails from "./AdminDetails";
import {
  Coffee,
  House,
  QrCode,
  ChevronRight,
  MapPin,
  Gift,
  History,
  UserRound,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LogOut,
  Ticket,
  Check,
  LoaderCircle,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { loyalty } from "./client";
import { restaurant } from "@/lib/site";

type Member = {
  id: string;
  name: string;
  phone: string;
  role: string;
  membership: string;
  marketing: boolean;
  suspended: boolean;
};
type Reward = {
  id: string;
  name: string;
  description: string;
  points: number;
  active: boolean;
  validity_days: number;
  stock: number | null;
};
type Voucher = {
  id: string;
  code: string;
  name: string;
  terms: string;
  status: string;
  expires_at: string;
  expired?: boolean;
};
type Entry = {
  id: string;
  amount: number;
  description: string;
  created_at: string;
};
type Prize = { label: string; points: number; weight: number };
type Settings = {
  enabled: boolean;
  wheel_enabled: boolean;
  points_per_kes: number;
};
const initialPrizes: Prize[] = [
  { label: "5 points", points: 5, weight: 40 },
  { label: "10 points", points: 10, weight: 30 },
  { label: "20 points", points: 20, weight: 20 },
  { label: "50 points", points: 50, weight: 9 },
  { label: "Free tea", points: 0, weight: 1 },
];
const samples = [
  {
    name: "Tea on us",
    points: 100,
    description: "Your favourite little pause.",
  },
  {
    name: "A little treat",
    points: 180,
    description: "A pastry to brighten your day.",
  },
  {
    name: "The perfect pairing",
    points: 250,
    description: "Tea, a pastry, and a moment for you.",
  },
];
const date = (value: string) =>
  new Date(value).toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    dateStyle: "medium",
    timeStyle: "short",
  });
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String(error.message)
      : "Something went wrong. Please try again.";
}

export default function RewardsApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!loyalty);
  const [member, setMember] = useState<Member | null>(null);
  const [settings, setSettings] = useState<Settings>({
    enabled: false,
    wheel_enabled: false,
    points_per_kes: 100,
  });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [balance, setBalance] = useState(0);
  const [prizes, setPrizes] = useState(initialPrizes);
  const [spun, setSpun] = useState(false);
  const [tab, setTab] = useState("home");
  const [auth, setAuth] = useState("login");
  const [showAuth, setShowAuth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [confirm, setConfirm] = useState<Reward | null>(null);
  const [requestId, setRequestId] = useState("");
  const [staffVoucher, setStaffVoucher] = useState<Voucher | null>(null);
  const [lookup, setLookup] = useState<{
    name: string;
    balance: number;
  } | null>(null);
  const [customers, setCustomers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [staffCode, setStaffCode] = useState("");

  const scanMember = useCallback((code: string) => setStaffCode(code), []);
  const load = useCallback(async () => {
    if (!loyalty) return;
    const {
      data: { session: active },
    } = await loyalty.auth.getSession();
    if (!active) return;
    const responses = await Promise.all([
      loyalty
        .from("loyalty_members")
        .select("*")
        .eq("id", active.user.id)
        .single(),
      loyalty.from("loyalty_settings").select("*").single(),
      loyalty.from("loyalty_rewards").select("*").order("points"),
      loyalty
        .from("loyalty_vouchers")
        .select("*")
        .eq("member", active.user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      loyalty
        .from("loyalty_ledger")
        .select("*")
        .eq("member", active.user.id)
        .order("created_at", { ascending: false })
        .range(page * 20, page * 20 + 19),
      loyalty.rpc("loyalty_balance", { who: active.user.id }),
      loyalty
        .from("loyalty_wheels")
        .select("prizes")
        .eq("active", true)
        .single(),
      loyalty
        .from("loyalty_spins")
        .select("result")
        .eq("member", active.user.id)
        .eq("local_day", today())
        .maybeSingle(),
    ]);
    for (const response of responses) if (response.error) throw response.error;
    setMember(responses[0].data);
    setSettings(responses[1].data);
    setRewards(responses[2].data || []);
    setVouchers(responses[3].data || []);
    setEntries(responses[4].data || []);
    setBalance(Number(responses[5].data));
    setPrizes(responses[6].data?.prizes || initialPrizes);
    setSpun(Boolean(responses[7].data));
    if (responses[7].data) setResult(responses[7].data.result.label);
  }, [page]);

  useEffect(() => {
    if (!loyalty) return;
    loyalty.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const {
      data: { subscription },
    } = loyalty.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") {
        setAuth("password");
        setShowAuth(true);
      }
      if (!next) {
        setMember(null);
        setTab("home");
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!showAuth && !confirm) return;
    const previous = document.activeElement as HTMLElement | null;
    const container = document.querySelector<HTMLElement>(".tt-modal");
    const focusable = () =>
      Array.from(
        container?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,textarea,select,a[href]",
        ) || [],
      );
    focusable()[0]?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function key(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        setShowAuth(false);
        setConfirm(null);
      }
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items[items.length - 1];
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
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [showAuth, confirm, busy]);
  useEffect(() => {
    if (session)
      Promise.resolve()
        .then(load)
        .catch((e) => setError(message(e)));
  }, [session, load]);
  useEffect(() => {
    const refresh = () => {
      if (session) load().catch((e) => setError(message(e)));
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [session, load]);

  async function run(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function action(name: string, payload: Record<string, unknown> = {}) {
    if (!navigator.onLine) throw new Error("Connect to the internet before using points, spins or vouchers.");
    if (!loyalty)
      throw new Error("Connect Supabase to activate the loyalty programme.");
    const { data, error } = await loyalty.rpc("loyalty_action", {
      action: name,
      payload,
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }
  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    await run(async () => {
      if (!loyalty)
        throw new Error(
          "Online registration is coming soon. The loyalty database has not been connected yet.",
        );
      const email = String(f.get("email") || "");
      const password = String(f.get("password") || "");
      if (auth === "password") {
        const { error } = await loyalty.auth.updateUser({ password });
        if (error) throw error;
        setShowAuth(false);
        setNotice("Password updated.");
        return;
      }
      if (auth === "reset") {
        const { error } = await loyalty.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + "/rewards/",
        });
        if (error) throw error;
        setNotice("If this email has an account, a reset link is on its way.");
        return;
      }
      if (auth === "signup") {
        const { data, error } = await loyalty.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: location.origin + "/rewards/",
            data: {
              name: f.get("name"),
              phone: f.get("phone"),
              terms: true,
              marketing: f.get("marketing") === "on",
            },
          },
        });
        if (error) throw error;
        setNotice(
          data.session
            ? "Welcome to TeaTime Rewards!"
            : "Check your email to confirm your account, then sign in.",
        );
        if (data.session) setShowAuth(false);
      } else {
        const { error } = await loyalty.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setShowAuth(false);
      }
    });
  }
  async function spin() {
    await run(async () => {
      const outcome = await action("spin");
      const index = prizes.findIndex((p) => p.label === outcome.label);
      setRotation(
        (current) =>
          Math.ceil(current / 360) * 360 +
          1800 +
          (360 - (Math.max(index, 0) * 72 + 36)),
      );
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : 3300,
        ),
      );
      setResult(outcome.label);
      await load();
      setNotice("You won " + outcome.label + "! Your reward is saved.");
    });
  }
  async function adminLoad() {
    if (!loyalty) return;
    const { data, error } = await loyalty
      .from("loyalty_members")
      .select("*")
      .ilike("name", "%" + search.replace(/[%_]/g, "") + "%")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    setCustomers(data || []);
    const { data: counts, error: countError } =
      await loyalty.rpc("loyalty_metrics");
    if (countError) throw countError;
    setStats(counts);
  }

  const nav = [
    { id: "home", label: "Home", Icon: House },
    { id: "spin", label: "Daily spin", Icon: Sparkles },
    { id: "rewards", label: "Rewards", Icon: Gift },
    { id: "activity", label: "Activity", Icon: History },
    { id: "profile", label: "Profile", Icon: UserRound },
    ...(member && member.role !== "customer"
      ? [{ id: "staff", label: "Staff", Icon: ShieldCheck }]
      : []),
    ...(member?.role === "admin"
      ? [{ id: "admin", label: "Admin", Icon: ShieldCheck }]
      : []),
  ];
  function navigate(destination: string) {
    if (!session && destination !== "home") {
      setAuth("login");
      setShowAuth(true);
      return;
    }
    setTab(destination);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "instant" });
    if (destination === "admin") run(adminLoad);
  }
  const activeVouchers = vouchers.filter(
    (v) => v.status === "active" && new Date(v.expires_at) > new Date(),
  ).length;
  const nextReward = rewards.find((r) => r.points > balance);
  const screenLabel = nav.find((item) => item.id === tab)?.label || "Home";
  return (
    <main
      id="main-content"
      className="tt-rewards"
      data-screen={tab}
      data-authenticated={Boolean(session)}
    >
      <header className="tt-appbar">
        <div className="tt-appbar-inner">
          <Link
            href="/"
            className="tt-app-brand"
            aria-label="Back to TeaTime website"
          >
            <Image
              src="/images/teatime-logo2.png"
              alt="TeaTime"
              width={60}
              height={60}
            />
            <span>
              TeaTime<strong>REWARDS CLUB</strong>
            </span>
          </Link>
          <div className="tt-appbar-right">
            <Link href="/menu" className="tt-menu-link">
              Browse menu <ArrowRight size={14} />
            </Link>
            <button
              className="tt-avatar"
              aria-label={
                session ? "Open your profile" : "Sign in to your account"
              }
              onClick={() => navigate("profile")}
            >
              {member?.name?.slice(0, 1).toUpperCase() || (
                <UserRound size={20} />
              )}
            </button>
          </div>
        </div>
      </header>
      <div className="tt-screen-heading">
        <span>YOUR TEATIME</span>
        <h1>{screenLabel === "Home" ? "Rewards club" : screenLabel}</h1>
        {session && tab !== "home" && (
          <span className="tt-screen-balance">
            <Sparkles size={14} />
            {balance} pts
          </span>
        )}
      </div>
      <nav className="tt-tabs" aria-label="Rewards sections">
        {nav
          .filter((item) => session || !["staff", "admin"].includes(item.id))
          .map(({ id, label, Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "selected" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
      </nav>
      <div className="tt-container">
        {session && tab === "home" && (
          <section className="tt-dashboard">
            <div className="tt-dashboard-welcome">
              <div>
                <p className="tt-kicker">YOUR EVERYDAY, UPGRADED</p>
                <h1>
                  Hey, {member?.name || "friend"}{" "}
                  <span aria-hidden="true">✦</span>
                </h1>
                <p>A little TeaTime. A little more to look forward to.</p>
              </div>
              <span className="tt-location-pill">
                <MapPin size={13} /> Lavington
              </span>
            </div>
            <div className="tt-dashboard-grid">
              <div className="tt-membership">
                <div className="tt-card-top">
                  <span>
                    TeaTime<span className="tt-card-sub">THE REWARDS CLUB</span>
                  </span>
                  <Coffee size={32} strokeWidth={1} />
                </div>
                <div className="tt-card-points">
                  <small>
                    {session
                      ? "YOUR AVAILABLE POINTS"
                      : "A LITTLE THANK YOU, EVERY VISIT"}
                  </small>
                  <strong>
                    {session ? balance.toLocaleString() : "Sip. Savour."}
                  </strong>
                  <span>
                    {session
                      ? "points to spend on something lovely"
                      : "Come back for more."}
                  </span>
                </div>
                <div className="tt-card-bottom">
                  <span>{member?.name || "YOUR NEXT FAVOURITE TRADITION"}</span>
                  <button
                    className="tt-member-code"
                    onClick={() => navigate("profile")}
                  >
                    <QrCode size={16} /> Member code
                  </button>
                </div>
              </div>

              <div className="tt-next-reward">
                <div className="tt-next-icon">
                  <Gift size={23} />
                </div>
                <p className="tt-kicker">SOMETHING TO LOOK FORWARD TO</p>
                <h2>{nextReward ? nextReward.name : "Your next treat"}</h2>
                <p>
                  {nextReward
                    ? `${Math.max(nextReward.points - balance, 0)} points away from a little happiness.`
                    : "Your points are ready for something delicious."}
                </p>
                <progress
                  aria-label="Progress towards your next reward"
                  value={balance}
                  max={Math.max(nextReward?.points || balance, 1)}
                />
                <div className="tt-progress-label">
                  <span>{balance} points</span>
                  <span>{nextReward?.points || balance} points</span>
                </div>
                <button className="tt-text" onClick={() => navigate("rewards")}>
                  Explore rewards <ArrowRight size={15} />
                </button>
              </div>
            </div>
            <div className="tt-shortcuts">
              <button onClick={() => navigate("profile")}>
                <span>
                  <QrCode size={21} />
                </span>
                <strong>Member code</strong>
                <small>Scan. Earn. Enjoy.</small>
                <ChevronRight size={16} />
              </button>
              <button onClick={() => navigate("rewards")}>
                <span>
                  <Ticket size={21} />
                </span>
                <strong>
                  My vouchers <b>{activeVouchers}</b>
                </strong>
                <small>Your treats, in one place</small>
                <ChevronRight size={16} />
              </button>
              <Link href="/menu">
                <span>
                  <Coffee size={21} />
                </span>
                <strong>Our menu</strong>
                <small>Find your favourite</small>
                <ChevronRight size={16} />
              </Link>
            </div>
          </section>
        )}
        {!session && (
          <>
            {" "}
            <section className="tt-hero">
              <div>
                <p className="tt-kicker">
                  GOOD FOOD. GREAT COMPANY. LITTLE EXTRAS.
                </p>
                <h1>
                  Your TeaTime.
                  <br />
                  <em>A little more rewarding.</em>
                </h1>
                <p className="tt-intro">
                  Make yourself at home. Collect points with every visit,
                  discover delicious treats, and add a little surprise to your
                  day.
                </p>
                {!session ? (
                  <div className="tt-actions">
                    <button
                      className="tt-primary"
                      onClick={() => {
                        setAuth("signup");
                        setShowAuth(true);
                      }}
                    >
                      Join the club <ArrowRight size={17} />
                    </button>
                    <button
                      className="tt-text"
                      onClick={() => {
                        setAuth("login");
                        setShowAuth(true);
                      }}
                    >
                      Already a member? Sign in ↗
                    </button>
                  </div>
                ) : (
                  <p className="tt-greeting">
                    Welcome back, {member?.name || "friend"}.{" "}
                    <button
                      className="tt-text"
                      onClick={() =>
                        run(async () => {
                          await loyalty?.auth.signOut();
                        })
                      }
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </p>
                )}
                <div className="tt-benefits">
                  <span>
                    <Check size={14} /> Free to join
                  </span>
                  <span>
                    <Check size={14} /> A daily surprise
                  </span>
                  <span>
                    <Check size={14} /> Made for our regulars
                  </span>
                </div>
              </div>
              <div className="tt-membership">
                <div className="tt-card-top">
                  <span>
                    TeaTime<span className="tt-card-sub">THE REWARDS CLUB</span>
                  </span>
                  <Coffee size={32} strokeWidth={1} />
                </div>
                <div className="tt-card-points">
                  <small>
                    {session
                      ? "YOUR AVAILABLE POINTS"
                      : "A LITTLE THANK YOU, EVERY VISIT"}
                  </small>
                  <strong>
                    {session ? balance.toLocaleString() : "Sip. Savour."}
                  </strong>
                  <span>
                    {session
                      ? "points to spend on something lovely"
                      : "Come back for more."}
                  </span>
                </div>
                <div className="tt-card-bottom">
                  <span>{member?.name || "YOUR NEXT FAVOURITE TRADITION"}</span>
                  <span>✦ MEMBER</span>
                </div>
              </div>
            </section>
          </>
        )}
        {!loyalty && (
          <div className="tt-banner">
            <ShieldCheck size={19} />
            <span>
              <strong>A new chapter is brewing.</strong> Explore the rewards
              experience below. Accounts, spins and redemptions open once the
              restaurant connects and activates the programme.
            </span>
          </div>
        )}
        {session && !settings.enabled && (
          <div className="tt-banner">
            The programme is being prepared. Rewards shown are proposed offers
            and are not yet redeemable.
          </div>
        )}
        {error && (
          <div role="alert" className="tt-alert">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="tt-success">
            {notice}
          </div>
        )}
        {!ready && (
          <p className="tt-loading">
            <LoaderCircle className="tt-loader" /> Loading your membership…
          </p>
        )}
        {(tab === "home" || !session) && (
          <>
            <div className="tt-section-title">
              <div>
                <p className="tt-kicker">DAILY PERKS</p>
                <h2>A little surprise, every day.</h2>
              </div>
              <Link href="/menu">Explore our menu ↗</Link>
            </div>
            <div className="tt-feature-grid">
              <section className="tt-spin-preview">
                <span className="tt-tag">YOUR DAILY SPIN</span>
                <h3>
                  {spun
                    ? "Same time tomorrow?"
                    : "Your next little win awaits."}
                </h3>
                <p>
                  Spin the wheel for bonus points or a tea on us. A small
                  surprise, just for stopping by.
                </p>
                <button
                  className="tt-primary"
                  onClick={() => {
                    if (session) setTab("spin");
                    else {
                      setAuth("signup");
                      setShowAuth(true);
                    }
                  }}
                >
                  {spun ? "See today’s reward" : "Let’s spin"}{" "}
                  <ArrowRight size={16} />
                </button>
                <div className="tt-mini-wheel" aria-hidden="true">
                  <Coffee size={35} />
                </div>
              </section>
              {!session && (
                <section className="tt-how">
                  <p className="tt-kicker">YOUR TABLE IS WAITING</p>
                  <h3>
                    A simple way to
                    <br />
                    say thank you.
                  </h3>
                  {[
                    [
                      "01",
                      "Join our little club",
                      "Create your free account. Make it official.",
                    ],
                    [
                      "02",
                      "Make every visit count",
                      `Earn 1 point for every KSh ${settings.points_per_kes} spent, rounded down per receipt.`,
                    ],
                    [
                      "03",
                      "Enjoy something on us",
                      "Exchange your points for a little TeaTime treat.",
                    ],
                  ].map(([n, title, description]) => (
                    <div className="tt-step" key={n}>
                      <span>{n}</span>
                      <div>
                        <strong>{title}</strong>
                        <p>{description}</p>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
            <div className="tt-section-title">
              <div>
                <p className="tt-kicker">A TASTE OF WHAT’S WAITING</p>
                <h2>Made for your next visit.</h2>
              </div>
              {session && (
                <button className="tt-text" onClick={() => setTab("rewards")}>
                  View all rewards ↗
                </button>
              )}
            </div>
            <div className="tt-reward-grid">
              {(session ? rewards.slice(0, 3) : samples).map((r, i) => (
                <article className="tt-reward" key={r.name}>
                  <div className={"tt-reward-art art-" + i}>
                    <Image
                      src={
                        [
                          "/images/menu/teatime-karak.jpeg",
                          "/images/menu/banana-chocolate-croissant.jpeg",
                          "/images/menu/teatime-karak.jpeg",
                        ][i]
                      }
                      alt={
                        [
                          "TeaTime karak",
                          "Banana chocolate croissant",
                          "TeaTime tea",
                        ][i]
                      }
                      width={420}
                      height={240}
                      className="tt-food-photo"
                    />
                  </div>
                  <div className="tt-reward-body">
                    <span className="tt-points">{r.points} POINTS</span>
                    <h3>{r.name}</h3>
                    <p>{r.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {session && tab === "spin" && (
          <section className="tt-panel tt-spin-section">
            <div>
              <p className="tt-kicker">A SMALL SURPRISE, JUST FOR YOU</p>
              <h2>Make today a winning day.</h2>
              <p>
                One free spin each Nairobi calendar day. Resets at midnight
                (EAT).
              </p>
              <ul className="tt-odds">
                {prizes.map((p) => (
                  <li key={p.label}>
                    <span>{p.label}</span>
                    <strong>{p.weight}%</strong>
                  </li>
                ))}
              </ul>
              <button
                className="tt-primary"
                disabled={
                  busy || spun || !settings.enabled || !settings.wheel_enabled
                }
                onClick={spin}
              >
                {busy
                  ? "Finding your surprise…"
                  : spun
                    ? "Come back tomorrow"
                    : "Spin the wheel"}
              </button>
              {result && (
                <p className="tt-result" role="status">
                  Your latest surprise: <strong>{result}</strong>
                </p>
              )}
              <p className="tt-fine">
                No payment required. Points have no cash value. Free tea
                vouchers expire after 7 days.
              </p>
            </div>
            <div className="tt-wheel-wrap">
              <div className="tt-pointer" />
              <div
                className="tt-wheel"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {prizes.map((p, i) => (
                  <span
                    key={i}
                    style={{
                      transform: `rotate(${i * 72 + 36}deg) translateY(-110px)`,
                    }}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
              <div className="tt-wheel-hub">
                <Coffee size={27} />
              </div>
            </div>
          </section>
        )}
        {session && tab === "rewards" && (
          <>
            <div className="tt-section-title">
              <div>
                <p className="tt-kicker">YOURS TO LOOK FORWARD TO</p>
                <h2>Choose your next treat.</h2>
              </div>
              <span>{balance} points available</span>
            </div>
            <div className="tt-reward-grid">
              {rewards.map((r, i) => (
                <article key={r.id} className="tt-reward">
                  <div className={"tt-reward-art art-" + (i % 3)}>
                    <Gift size={52} strokeWidth={1} />
                  </div>
                  <div className="tt-reward-body">
                    <span className="tt-points">{r.points} POINTS</span>
                    <h3>{r.name}</h3>
                    <p>{r.description}</p>
                    <p className="tt-fine">
                      Valid for {r.validity_days} days after claiming.{" "}
                      {r.stock !== null && `${r.stock} available.`}
                    </p>
                    <button
                      className="tt-primary"
                      disabled={
                        busy ||
                        !settings.enabled ||
                        !r.active ||
                        balance < r.points ||
                        r.stock === 0
                      }
                      onClick={() => {
                        setConfirm(r);
                        setRequestId(crypto.randomUUID());
                      }}
                    >
                      Claim reward
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {!rewards.length && (
              <p className="tt-panel">
                Our rewards menu is being prepared. Check back soon.
              </p>
            )}
            <h2 className="tt-subheading">Your vouchers</h2>
            <div className="tt-voucher-grid">
              {vouchers.map((v) => (
                <article className="tt-panel" key={v.id}>
                  <Ticket />
                  <h3>{v.name}</h3>
                  <span className="tt-tag">
                    {v.status === "active" &&
                    new Date(v.expires_at) < new Date()
                      ? "expired"
                      : v.status}
                  </span>
                  <p>{v.terms}</p>
                  <p className="tt-fine">Expires {date(v.expires_at)}</p>
                  {v.status === "active" &&
                    new Date(v.expires_at) > new Date() && (
                      <>
                        <p className="tt-fine">
                          Show this code to a staff member:
                        </p>
                        <div className="tt-qr">
                          <QRCodeSVG
                            value={v.code}
                            size={130}
                            title="Reward voucher code"
                          />
                        </div>
                        <code className="tt-code">{v.code}</code>
                        <button
                          className="tt-text"
                          onClick={() =>
                            run(async () => {
                              await navigator.clipboard.writeText(v.code);
                              setNotice("Voucher code copied.");
                            })
                          }
                        >
                          Copy code
                        </button>
                      </>
                    )}
                </article>
              ))}
            </div>
            {!vouchers.length && (
              <p>No vouchers yet. Your next treat is waiting.</p>
            )}
          </>
        )}
        {session && tab === "activity" && (
          <section className="tt-panel">
            <p className="tt-kicker">EVERY LITTLE MOMENT COUNTS</p>
            <h2>Your points story.</h2>
            {entries.map((e) => (
              <div className="tt-entry" key={e.id}>
                <div>
                  <strong>{e.description}</strong>
                  <small>{date(e.created_at)}</small>
                </div>
                <span className={e.amount >= 0 ? "tt-positive" : ""}>
                  {e.amount > 0 ? "+" : ""}
                  {e.amount}
                </span>
              </div>
            ))}
            {!entries.length && (
              <p>
                No activity on this page yet. Earn points with your next visit.
              </p>
            )}
            <div className="tt-actions">
              <button
                className="tt-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>Page {page + 1}</span>
              <button
                className="tt-secondary"
                disabled={entries.length < 20}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </section>
        )}
        {session && tab === "profile" && member && (
          <>
            <section className="tt-profile-summary">
              <span className="tt-profile-initial">
                {member.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h2>{member.name}</h2>
                <p>TeaTime Rewards member</p>
              </div>
              <button
                className="tt-text"
                onClick={() =>
                  run(async () => {
                    await loyalty?.auth.signOut();
                  })
                }
              >
                <LogOut size={16} /> Sign out
              </button>
            </section>
            {member.role !== "customer" && (
              <div className="tt-workspace-links">
                <button onClick={() => navigate("staff")}>
                  <ShieldCheck size={19} />
                  <span>
                    <strong>Staff workspace</strong>
                    <small>Purchases & voucher validation</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
                {member.role === "admin" && (
                  <button onClick={() => navigate("admin")}>
                    <ShieldCheck size={19} />
                    <span>
                      <strong>Manage rewards</strong>
                      <small>Programme settings & members</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                )}
              </div>
            )}
            <div className="tt-profile-grid">
              <section className="tt-panel">
                <h2>A little about you.</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run(async () => {
                      await action("profile", {
                        name: f.get("name"),
                        phone: f.get("phone"),
                        marketing: f.get("marketing") === "on",
                      });
                      await load();
                      setNotice("Your profile is up to date.");
                    });
                  }}
                >
                  <label>
                    First name
                    <input
                      name="name"
                      required
                      maxLength={80}
                      defaultValue={member.name}
                    />
                  </label>
                  <label>
                    Phone (optional)
                    <input
                      name="phone"
                      type="tel"
                      maxLength={30}
                      defaultValue={member.phone || ""}
                    />
                  </label>
                  <label className="tt-check">
                    <input
                      name="marketing"
                      type="checkbox"
                      defaultChecked={member.marketing}
                    />{" "}
                    Keep me updated about TeaTime offers.
                  </label>
                  <button className="tt-primary" disabled={busy}>
                    Save profile
                  </button>
                </form>
              </section>
              <section className="tt-panel">
                <Coffee />
                <h3>Your TeaTime membership</h3>
                <p>
                  Give this membership code to staff when paying to collect
                  points.
                </p>
                <div className="tt-qr">
                  <QRCodeSVG
                    value={member.membership}
                    size={150}
                    title="TeaTime membership code"
                  />
                </div>
                <code className="tt-code">{member.membership}</code>
                <button
                  className="tt-text"
                  onClick={() =>
                    run(async () => {
                      await navigator.clipboard.writeText(member.membership);
                      setNotice("Membership code copied.");
                    })
                  }
                >
                  Copy membership code
                </button>
                <h3>Good to know</h3>
                <p>
                  Participating location: {restaurant.address}. Daily spins
                  reset at midnight EAT. Points cannot be exchanged for cash.
                </p>
                <a className="tt-text" href={"tel:" + restaurant.phone}>
                  Questions? {restaurant.phoneLabel}
                </a>
              </section>
            </div>
          </>
        )}
        {session && tab === "staff" && member?.role !== "customer" && (
          <>
            <div className="tt-section-title">
              <div>
                <p className="tt-kicker">AT THE COUNTER</p>
                <h2>A warm welcome, every time.</h2>
              </div>
            </div>
            <div className="tt-profile-grid">
              <section className="tt-panel">
                <h3>Record a purchase</h3>
                <p>
                  Enter the customer’s membership code and a unique receipt
                  reference. Staff-verified purchases only.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run(async () => {
                      const response = await action("purchase", {
                        membership: f.get("membership"),
                        receipt: f.get("receipt"),
                        amount_minor: Math.round(Number(f.get("amount")) * 100),
                      });
                      setNotice(response.message);
                    });
                  }}
                >
                  <Scanner onCode={scanMember} />
                  <label>
                    Membership code
                    <input
                      name="membership"
                      required
                      value={staffCode}
                      onChange={(e) => setStaffCode(e.target.value)}
                      placeholder="Customer membership UUID"
                    />
                  </label>
                  <button
                    type="button"
                    className="tt-secondary"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        setLookup(
                          await action("lookup", { membership: staffCode }),
                        );
                      })
                    }
                  >
                    Look up customer
                  </button>
                  {lookup && (
                    <p>
                      {lookup.name} · {lookup.balance} points
                    </p>
                  )}
                  <label>
                    Receipt reference
                    <input name="receipt" maxLength={100} required />
                  </label>
                  <label>
                    Purchase total (KSh)
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      max="1000000"
                      step="0.01"
                      required
                    />
                  </label>
                  <button className="tt-primary" disabled={busy}>
                    Record purchase
                  </button>
                </form>
              </section>
              <section className="tt-panel">
                <h3>Validate a voucher</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    setStaffVoucher(null);
                    run(async () =>
                      setStaffVoucher(
                        await action("voucher_check", { code: f.get("code") }),
                      ),
                    );
                  }}
                >
                  <label>
                    Voucher code
                    <input
                      name="code"
                      required
                      placeholder="Paste the full voucher code"
                    />
                  </label>
                  <button className="tt-secondary" disabled={busy}>
                    Check voucher
                  </button>
                </form>
                {staffVoucher && (
                  <div className="tt-voucher-check">
                    <h3>{staffVoucher.name}</h3>
                    <p>{staffVoucher.terms}</p>
                    <p>
                      {staffVoucher.status} ·{" "}
                      {staffVoucher.expired
                        ? "EXPIRED"
                        : "Expires " + date(staffVoucher.expires_at)}
                    </p>
                    <button
                      className="tt-primary"
                      disabled={
                        busy ||
                        staffVoucher.status !== "active" ||
                        staffVoucher.expired
                      }
                      onClick={() =>
                        run(async () => {
                          const response = await action("voucher_use", {
                            code: staffVoucher.code,
                          });
                          setNotice(response.message);
                          setStaffVoucher(null);
                        })
                      }
                    >
                      Confirm reward served & use voucher
                    </button>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
        {session && tab === "admin" && member?.role === "admin" && (
          <>
            <div className="tt-section-title">
              <div>
                <p className="tt-kicker">THE CLUB, AT A GLANCE</p>
                <h2>Rewards administration.</h2>
              </div>
              <button className="tt-secondary" onClick={() => run(adminLoad)}>
                Refresh
              </button>
            </div>
            <div className="tt-stats">
              {Object.entries(stats).map(([key, value]) => (
                <div className="tt-panel" key={key}>
                  <small>{key.replaceAll("_", " ")}</small>
                  <strong>{Number(value).toLocaleString()}</strong>
                </div>
              ))}
            </div>
            <div className="tt-profile-grid">
              <section className="tt-panel">
                <h3>Programme settings</h3>
                <form
                  key={JSON.stringify(settings)}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run(async () => {
                      await action("settings", {
                        enabled: f.get("enabled") === "on",
                        wheel_enabled: f.get("wheel_enabled") === "on",
                        points_per_kes: Number(f.get("rate")),
                      });
                      await load();
                      setNotice("Programme settings saved.");
                    });
                  }}
                >
                  <label className="tt-check">
                    <input
                      type="checkbox"
                      name="enabled"
                      defaultChecked={settings.enabled}
                    />{" "}
                    Activate reviewed loyalty programme
                  </label>
                  <label className="tt-check">
                    <input
                      type="checkbox"
                      name="wheel_enabled"
                      defaultChecked={settings.wheel_enabled}
                    />{" "}
                    Enable daily wheel
                  </label>
                  <label>
                    KSh spend needed for 1 point
                    <input
                      name="rate"
                      type="number"
                      min="1"
                      max="100000"
                      defaultValue={settings.points_per_kes}
                      required
                    />
                  </label>
                  <button className="tt-primary" disabled={busy}>
                    Save settings
                  </button>
                </form>
                <p className="tt-fine">
                  Single branch: {restaurant.address}. Timezone: Africa/Nairobi.
                  Currency: KES.
                </p>
              </section>
              <section className="tt-panel">
                <h3>Wheel probabilities</h3>
                <form
                  key={JSON.stringify(prizes)}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    run(async () => {
                      await action("wheel", {
                        prizes: prizes.map((p, i) => ({
                          ...p,
                          weight: Number(f.get("weight" + i)),
                        })),
                      });
                      await load();
                      setNotice("New wheel version saved.");
                    });
                  }}
                >
                  {prizes.map((p, i) => (
                    <label key={i}>
                      {p.label} (%)
                      <input
                        name={"weight" + i}
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={p.weight}
                        required
                      />
                    </label>
                  ))}
                  <p className="tt-fine">
                    Must total exactly 100%. New versions apply to future spins.
                  </p>
                  <button className="tt-primary" disabled={busy}>
                    Save wheel version
                  </button>
                </form>
              </section>
            </div>
            <h2 className="tt-subheading">Rewards catalogue</h2>
            <div className="tt-reward-grid">
              {[
                ...rewards,
                {
                  id: "",
                  name: "",
                  description: "",
                  points: 100,
                  active: false,
                  validity_days: 30,
                  stock: null,
                },
              ].map((r, i) => (
                <section className="tt-panel" key={r.id || "new"}>
                  <h3>{r.id ? "Edit reward" : "New reward"}</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      run(async () => {
                        await action("reward", {
                          id: r.id || null,
                          name: f.get("name"),
                          description: f.get("description"),
                          points: Number(f.get("points")),
                          validity_days: Number(f.get("days")),
                          stock:
                            f.get("stock") === ""
                              ? null
                              : Number(f.get("stock")),
                          active: f.get("active") === "on",
                        });
                        await load();
                        setNotice("Reward saved.");
                      });
                    }}
                  >
                    <label>
                      Name
                      <input
                        name="name"
                        required
                        defaultValue={r.name}
                        maxLength={100}
                      />
                    </label>
                    <label>
                      Terms
                      <textarea
                        name="description"
                        required
                        defaultValue={r.description}
                      />
                    </label>
                    <label>
                      Points
                      <input
                        name="points"
                        type="number"
                        min="1"
                        required
                        defaultValue={r.points}
                      />
                    </label>
                    <label>
                      Validity (days)
                      <input
                        name="days"
                        type="number"
                        min="1"
                        max="365"
                        required
                        defaultValue={r.validity_days}
                      />
                    </label>
                    <label>
                      Stock (blank = unlimited)
                      <input
                        name="stock"
                        type="number"
                        min="0"
                        defaultValue={r.stock ?? ""}
                      />
                    </label>
                    <label className="tt-check">
                      <input
                        name="active"
                        type="checkbox"
                        defaultChecked={r.active}
                      />{" "}
                      Reviewed and active
                    </label>
                    <button className="tt-primary" disabled={busy}>
                      Save reward {i + 1}
                    </button>
                  </form>
                </section>
              ))}
            </div>
            <section className="tt-panel tt-admin-members">
              <h3>Members and staff access</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(adminLoad);
                }}
                className="tt-inline-form"
              >
                <input
                  aria-label="Search members by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search first name"
                />
                <button className="tt-secondary" disabled={busy}>
                  Search
                </button>
              </form>
              <p className="tt-fine">
                Showing up to 50 matches. Staff register through the normal
                verified signup, then an admin assigns their role here.
              </p>
              {customers.map((c) => (
                <div className="tt-entry" key={c.id}>
                  <div>
                    <strong>{c.name}</strong>
                    <small>{c.id}</small>
                    <small>
                      {c.role} · {c.suspended ? "suspended" : "active"}
                    </small>
                  </div>
                  <div className="tt-actions">
                    <select
                      aria-label={"Role for " + c.name}
                      value={c.role}
                      disabled={busy || c.id === member.id}
                      onChange={(e) => {
                        const role = e.target.value;
                        run(async () => {
                          await action("role", { member: c.id, role });
                          await adminLoad();
                          setNotice("Access updated.");
                        });
                      }}
                    >
                      {["customer", "staff", "admin"].map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                    <button
                      className="tt-secondary"
                      disabled={busy || c.id === member.id}
                      onClick={() =>
                        run(async () => {
                          await action("suspend", {
                            member: c.id,
                            suspended: !c.suspended,
                          });
                          await adminLoad();
                        })
                      }
                    >
                      {c.suspended ? "Reactivate" : "Suspend"}
                    </button>
                  </div>
                </div>
              ))}
              <h3>Adjust points</h3>
              <form
                className="tt-inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  run(async () => {
                    await action("adjust", {
                      member: f.get("member"),
                      amount: Number(f.get("amount")),
                      reason: f.get("reason"),
                    });
                    setNotice("Points adjustment recorded.");
                  });
                }}
              >
                <input
                  name="member"
                  placeholder="Member ID"
                  aria-label="Member ID"
                  required
                />
                <input
                  name="amount"
                  type="number"
                  placeholder="Points (+ or −)"
                  aria-label="Points adjustment"
                  required
                />
                <input
                  name="reason"
                  placeholder="Reason"
                  aria-label="Adjustment reason"
                  minLength={3}
                  required
                />
                <button className="tt-secondary" disabled={busy}>
                  Record adjustment
                </button>
              </form>
              <h3>Reverse purchase</h3>
              <form
                className="tt-inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  run(async () => {
                    await action("reverse", {
                      purchase: f.get("purchase"),
                      reason: f.get("reason"),
                    });
                    setNotice("Purchase reversed.");
                    await adminLoad();
                  });
                }}
              >
                <input
                  name="purchase"
                  placeholder="Purchase ID"
                  aria-label="Purchase ID"
                  required
                />
                <input
                  name="reason"
                  placeholder="Reason"
                  aria-label="Reversal reason"
                  minLength={3}
                  required
                />
                <button className="tt-secondary" disabled={busy}>
                  Reverse purchase
                </button>
              </form>
            </section>
            <AdminDetails />
          </>
        )}
        <footer className="tt-app-footer">
          <span>Made for your TeaTime.</span>
          <Link href="/rewards/terms/">Terms & privacy</Link>
          <Link href="/contact">Need a hand?</Link>
        </footer>
      </div>
      <nav className="tt-bottom-nav" aria-label="Mobile rewards navigation">
        {["home", "rewards", "spin", "activity", "profile"].map((id) => {
          const item = nav.find((n) => n.id === id)!;
          const Icon = item.Icon;
          const selected =
            tab === id ||
            (id === "profile" && ["staff", "admin"].includes(tab));
          return (
            <button
              key={id}
              data-destination={id}
              aria-current={selected ? "page" : undefined}
              className={selected ? "selected" : ""}
              onClick={() => navigate(id)}
            >
              <span className="tt-nav-icon">
                <Icon size={22} strokeWidth={selected ? 2.3 : 1.7} />
              </span>
              <span>{id === "spin" ? "Spin" : item.label}</span>
            </button>
          );
        })}
      </nav>
      {showAuth && (
        <div className="tt-modal-backdrop">
          <section
            className="tt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              className="tt-close"
              aria-label="Close"
              onClick={() => setShowAuth(false)}
            >
              ×
            </button>
            <Coffee size={30} />
            <p className="tt-kicker">WELCOME TO THE CLUB</p>
            <h2 id="auth-title">
              {auth === "signup"
                ? "Your next chapter starts here."
                : auth === "reset"
                  ? "Let’s get you back in."
                  : auth === "password"
                    ? "Choose a new password."
                    : "Good to have you back."}
            </h2>
            <form onSubmit={submitAuth}>
              {auth === "signup" && (
                <>
                  <label>
                    First name
                    <input
                      name="name"
                      autoComplete="given-name"
                      maxLength={80}
                      required
                    />
                  </label>
                  <label>
                    Phone (optional)
                    <input
                      name="phone"
                      type="tel"
                      maxLength={30}
                      autoComplete="tel"
                    />
                  </label>
                </>
              )}
              {auth !== "password" && (
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
              )}
              {auth !== "reset" && (
                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    autoComplete={
                      auth === "login" ? "current-password" : "new-password"
                    }
                    required
                  />
                </label>
              )}
              {auth === "signup" && (
                <>
                  <label className="tt-check">
                    <input type="checkbox" required /> I accept the{" "}
                    <a href="/rewards/terms/" target="_blank" rel="noreferrer">
                      programme terms and privacy notice
                    </a>
                    .
                  </label>
                  <label className="tt-check">
                    <input name="marketing" type="checkbox" /> Send me
                    occasional TeaTime offers (optional).
                  </label>
                </>
              )}
              <button className="tt-primary" disabled={busy || !loyalty}>
                {busy
                  ? "One moment…"
                  : auth === "signup"
                    ? "Create my membership"
                    : auth === "reset"
                      ? "Send reset link"
                      : auth === "password"
                        ? "Update password"
                        : "Sign in"}
              </button>
            </form>
            {error && (
              <p role="alert" className="tt-alert">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="tt-success">
                {notice}
              </p>
            )}
            {!loyalty && (
              <p className="tt-fine">
                Registration is coming soon. Supabase configuration is required.
              </p>
            )}
            <div className="tt-auth-links">
              <button
                onClick={() => setAuth(auth === "signup" ? "login" : "signup")}
              >
                {auth === "signup"
                  ? "Already a member? Sign in"
                  : "New here? Join the club"}
              </button>
              <button onClick={() => setAuth("reset")}>Forgot password?</button>
            </div>
          </section>
        </div>
      )}
      {confirm && (
        <div className="tt-modal-backdrop">
          <section
            className="tt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="claim-title"
          >
            <h2 id="claim-title">A little treat for you.</h2>
            <h3>{confirm.name}</h3>
            <p>{confirm.description}</p>
            <p>
              This uses <strong>{confirm.points} points</strong>. Your voucher
              will expire in {confirm.validity_days} days.
            </p>
            <div className="tt-actions">
              <button
                className="tt-secondary"
                disabled={busy}
                onClick={() => setConfirm(null)}
              >
                Keep saving
              </button>
              <button
                className="tt-primary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await action("redeem", {
                      reward: confirm.id,
                      request_id: requestId,
                    });
                    setConfirm(null);
                    await load();
                    setNotice(
                      "Your voucher is ready. Show its code to staff when visiting.",
                    );
                  })
                }
              >
                {busy ? "Claiming…" : "Confirm & claim"}
              </button>
            </div>
            {error && (
              <p className="tt-alert" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

