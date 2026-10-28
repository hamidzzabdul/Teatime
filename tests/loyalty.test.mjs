import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

test("TeaTime database: permissions, accounting, spins, vouchers and reversals", async (t) => {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to authenticated; grant execute on function auth.uid() to authenticated;`,
  );
  const migration = await readFile(
    new URL("./001_loyalty.sql", import.meta.url),
    "utf8",
  ).catch(() =>
    readFile(new URL("../supabase/001_loyalty.sql", import.meta.url), "utf8"),
  );
  await db.exec(migration);
  const customer = randomUUID(),
    other = randomUUID(),
    staff = randomUUID(),
    admin = randomUUID();
  for (const [id, name] of [
    [customer, "Customer"],
    [other, "Other"],
    [staff, "Staff"],
    [admin, "Admin"],
  ])
    await db.query("insert into auth.users values($1,$2)", [
      id,
      { name, terms: true },
    ]);
  await db.query("update loyalty_members set role='staff' where id=$1", [
    staff,
  ]);
  await db.query("update loyalty_members set role='admin' where id=$1", [
    admin,
  ]);
  const membership = (
    await db.query("select membership from loyalty_members where id=$1", [
      customer,
    ])
  ).rows[0].membership;
  async function as(id) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec("set role authenticated");
  }
  async function action(action, payload = {}) {
    const data = (
      await db.query("select loyalty_action($1,$2) as data", [action, payload])
    ).rows[0].data;
    if (data?.error) throw new Error(data.error);
    return data;
  }
  async function balance(id = customer) {
    return Number(
      (await db.query("select loyalty_balance($1) as balance", [id])).rows[0]
        .balance,
    );
  }
  await t.test("signup requires terms", async () => {
    await db.exec("reset role");
    await assert.rejects(
      db.query("insert into auth.users values($1,$2)", [
        randomUUID(),
        { name: "No terms" },
      ]),
      /terms/,
    );
  });
  await t.test(
    "RLS isolates members and rejects direct ledger writes",
    async () => {
      await as(customer);
      assert.equal(
        (await db.query("select * from loyalty_members")).rows.length,
        1,
      );
      await assert.rejects(
        db.query(
          "insert into loyalty_ledger(member,amount,description) values($1,100,'Cheat')",
          [customer],
        ),
        /permission denied/,
      );
      await assert.rejects(
        action("settings", { enabled: true }),
        /Staff access/,
      );
      await assert.rejects(action("spin"), /not open/);
    },
  );
  await as(admin);
  await action("settings", {
    enabled: true,
    wheel_enabled: true,
    points_per_kes: 100,
  });
  let reward = (
    await db.query("select * from loyalty_rewards order by points limit 1")
  ).rows[0];
  await action("reward", { ...reward, active: true, stock: 2 });
  await t.test("wheel rejects invalid probability totals", async () => {
    await assert.rejects(
      action("wheel", {
        prizes: Array.from({ length: 5 }, (_, i) => ({
          label: "Prize " + i,
          points: 5,
          weight: 10,
        })),
      }),
      /100%/,
    );
  });
  await t.test(
    "purchase rounds down and duplicate receipts cannot issue points twice",
    async () => {
      await as(staff);
      const p = await action("purchase", {
        membership,
        receipt: "TT-001",
        amount_minor: 24999,
      });
      assert.equal(p.message, "2 points added");
      assert.equal(await balance(), 2);
      await assert.rejects(
        action("purchase", {
          membership,
          receipt: "TT-001",
          amount_minor: 24999,
        }),
        /duplicate key/,
      );
      assert.equal(await balance(), 2);
    },
  );
  await t.test(
    "customer cannot perform staff operations or see other balances",
    async () => {
      await as(customer);
      await assert.rejects(
        action("purchase", {
          membership,
          receipt: "Cheat",
          amount_minor: 99999,
        }),
        /Staff access/,
      );
      assert.equal(await balance(other), 0);
    },
  );
  await t.test(
    "one spin per Nairobi date, retries return the recorded result",
    async () => {
      await as(customer);
      const first = await action("spin");
      const retried = await action("spin");
      assert.deepEqual(first, retried);
      assert.equal(
        (await db.query("select * from loyalty_spins")).rows.length,
        1,
      );
      assert.equal(await balance(), 2 + first.points);
      const rows = await db.query(
        "select local_day=(now() at time zone 'Africa/Nairobi')::date as valid from loyalty_spins",
      );
      assert.equal(rows.rows[0].valid, true);
    },
  );
  let voucher;
  await t.test(
    "insufficient points do not create vouchers or change balance",
    async () => {
      await as(other);
      await assert.rejects(
        action("redeem", { reward: reward.id, request_id: randomUUID() }),
        /Not enough points/,
      );
      assert.equal(await balance(other), 0);
    },
  );
  await as(admin);
  await action("adjust", {
    member: customer,
    amount: 500,
    reason: "Test balance",
  });
  await t.test(
    "reward claim is idempotent and deductions happen once",
    async () => {
      await as(customer);
      const before = await balance();
      const request_id = randomUUID();
      voucher = await action("redeem", { reward: reward.id, request_id });
      const again = await action("redeem", { reward: reward.id, request_id });
      assert.equal(voucher.id, again.id);
      assert.equal(await balance(), before - 100);
      assert.equal(voucher.terms, reward.description);
    },
  );
  await t.test(
    "voucher is single use and staff must be authorised",
    async () => {
      await as(customer);
      await assert.rejects(
        action("voucher_use", { code: voucher.code }),
        /Staff access/,
      );
      await as(staff);
      await action("voucher_use", { code: voucher.code });
      await assert.rejects(
        action("voucher_use", { code: voucher.code }),
        /already used/,
      );
    },
  );
  await t.test("expired voucher is refused", async () => {
    await db.exec("reset role");
    await db.query(
      "update loyalty_vouchers set status='active',expires_at=now()-interval '1 day' where id=$1",
      [voucher.id],
    );
    await as(staff);
    await assert.rejects(
      action("voucher_use", { code: voucher.code }),
      /expired/,
    );
  });
  await t.test(
    "negative adjustments are blocked and roles cannot be self-promoted",
    async () => {
      await as(admin);
      await assert.rejects(
        action("adjust", {
          member: other,
          amount: -1,
          reason: "Test negative",
        }),
        /Insufficient/,
      );
      await as(customer);
      await assert.rejects(
        action("role", { member: customer, role: "admin" }),
        /Staff access/,
      );
    },
  );
  await t.test("purchase reversals are audited and cannot repeat", async () => {
    await as(staff);
    const p = await action("purchase", {
      membership,
      receipt: "TT-002",
      amount_minor: 10000,
    });
    await as(admin);
    const before = await balance();
    await action("reverse", {
      purchase: p.purchase_id,
      reason: "Returned purchase",
    });
    assert.equal(await balance(), before - 1);
    await assert.rejects(
      action("reverse", { purchase: p.purchase_id, reason: "Again" }),
      /already reversed/,
    );
    assert.ok(
      (await db.query("select * from loyalty_audit where action='reverse'"))
        .rows.length,
    );
  });
  await t.test("stock cannot be oversold", async () => {
    await as(customer);
    await action("redeem", { reward: reward.id, request_id: randomUUID() });
    await assert.rejects(
      action("redeem", { reward: reward.id, request_id: randomUUID() }),
      /unavailable/,
    );
  });
  await t.test(
    "metrics require admin and reconcile outstanding balance",
    async () => {
      await as(customer);
      await assert.rejects(
        db.query("select loyalty_metrics()"),
        /Admin access/,
      );
      await as(admin);
      const metrics = (await db.query("select loyalty_metrics() as data"))
        .rows[0].data;
      const sum = Number(
        (await db.query("select sum(amount) as total from loyalty_ledger"))
          .rows[0].total,
      );
      assert.equal(metrics.outstanding_points, sum);
      assert.equal(metrics.members, 4);
    },
  );
  await t.test(
    "queued simultaneous spin retries produce exactly one result",
    async () => {
      await as(customer);
      const before = await balance();
      const results = await Promise.all(
        Array.from({ length: 5 }, () => action("spin")),
      );
      assert.ok(results.every((value) => value.label === results[0].label));
      assert.equal(await balance(), before);
      assert.equal(
        (await db.query("select * from loyalty_spins")).rows.length,
        1,
      );
    },
  );
  await t.test("new Nairobi day permits another spin", async () => {
    await db.exec("reset role");
    await db.query(
      "update loyalty_spins set local_day=local_day-1 where member=$1",
      [customer],
    );
    await as(customer);
    await action("spin");
    assert.equal(
      (await db.query("select * from loyalty_spins")).rows.length,
      2,
    );
  });
  await t.test(
    "suspended accounts cannot mutate and failed checks are rate limited",
    async () => {
      await as(admin);
      await action("suspend", { member: other, suspended: true });
      await as(other);
      await assert.rejects(action("spin"), /Account unavailable/);
      await as(staff);
      for (let i = 0; i < 30; i++) {
        try {
          await action("voucher_check", { code: randomUUID() });
        } catch {}
      }
      await assert.rejects(
        action("voucher_check", { code: randomUUID() }),
        /Too many attempts/,
      );
    },
  );
  await db.close();
});
