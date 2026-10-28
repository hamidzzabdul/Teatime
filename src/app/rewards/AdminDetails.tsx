"use client";
import { useState } from "react";
import { loyalty } from "./client";
type RecordRow = {
  id: string;
  created_at: string;
  description?: string;
  amount?: number;
  receipt?: string;
  points?: number;
  reversed?: boolean;
};
export default function AdminDetails() {
  const [id, setId] = useState("");
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [purchases, setPurchases] = useState<RecordRow[]>([]);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  async function load(nextPage: number) {
    if (!loyalty) return;
    setBusy(true);
    setError("");
    try {
      const results = await Promise.all([
        loyalty
          .from("loyalty_ledger")
          .select("*")
          .eq("member", id)
          .order("created_at", { ascending: false })
          .range(nextPage * 20, nextPage * 20 + 19),
        loyalty
          .from("loyalty_purchases")
          .select("*")
          .eq("member", id)
          .order("created_at", { ascending: false })
          .range(nextPage * 20, nextPage * 20 + 19),
        loyalty.rpc("loyalty_balance", { who: id }),
      ]);
      for (const r of results) if (r.error) throw r.error;
      setRows(results[0].data || []);
      setPurchases(results[1].data || []);
      setBalance(Number(results[2].data));
      setPage(nextPage);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : String((e as { message?: string }).message || e),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="tt-panel tt-admin-members">
      <h3>Customer transaction history</h3>
      <form
        className="tt-inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          load(0);
        }}
      >
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          aria-label="Customer ID for history"
          placeholder="Paste member ID from the customer list"
          required
        />
        <button className="tt-secondary" disabled={busy}>
          View history
        </button>
      </form>
      {error && (
        <p className="tt-alert" role="alert">
          {error}
        </p>
      )}
      {rows.length > 0 && <p>Available balance: {balance} points</p>}
      {rows.map((row) => (
        <div className="tt-entry" key={row.id}>
          <div>
            <strong>{row.description}</strong>
            <small>
              {new Date(row.created_at).toLocaleString("en-KE", {
                timeZone: "Africa/Nairobi",
              })}
            </small>
          </div>
          <span>{row.amount}</span>
        </div>
      ))}
      {purchases.length > 0 && (
        <h3 className="tt-subheading">Recorded purchases</h3>
      )}
      {purchases.map((p) => (
        <div className="tt-entry" key={p.id}>
          <div>
            <strong>
              {p.receipt} · {p.points} points {p.reversed ? "(reversed)" : ""}
            </strong>
            <small>Purchase ID: {p.id}</small>
          </div>
        </div>
      ))}
      {(rows.length > 0 || page > 0) && (
        <div className="tt-actions">
          <button
            className="tt-secondary"
            disabled={busy || page === 0}
            onClick={() => load(page - 1)}
          >
            Previous
          </button>
          <span>Page {page + 1}</span>
          <button
            className="tt-secondary"
            disabled={busy || (rows.length < 20 && purchases.length < 20)}
            onClick={() => load(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
