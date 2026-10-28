import Link from "next/link";
import { restaurant, pageMetadata } from "@/lib/site";
import "../rewards.css";
export const metadata = pageMetadata(
  "Rewards terms & privacy",
  "TeaTime Rewards programme rules and privacy information.",
  "/rewards/terms",
);
export default function Terms() {
  return (
    <main id="main-content" className="tt-terms">
      <Link href="/rewards/">← TeaTime Rewards</Link>
      <h1>A little clarity, with your tea.</h1>
      <p>
        Proposed programme terms · Version MVP-1 · 27 October 2026. The
        programme and example offers are subject to restaurant review and
        activation. No offer is redeemable before activation.
      </p>
      <h2>Membership and points</h2>
      <p>
        Membership is free. The participating location is {restaurant.address}.
        Staff record eligible purchases against your membership code. The
        default earning rate is one point per KSh 100, rounded down separately
        for each receipt; the current rate appears in your account. Points have
        no cash value, cannot be transferred, and have no automatic expiry in
        this MVP. Corrections and purchase reversals are recorded in your
        activity. Restaurant staff can suspend accounts for misuse.
      </p>
      <h2>Daily spin</h2>
      <p>
        One free spin per account per calendar day in Africa/Nairobi, resetting
        at midnight EAT. No purchase or payment is needed. Current prize
        probabilities appear before spinning. Your result is saved even if you
        close the page. Bonus points are credited immediately. A wheel-won
        standard tea voucher is valid for seven days. There are no paid spins.
      </p>
      <h2>Claiming rewards</h2>
      <p>
        Review the points price and reward terms before confirming. Claiming
        deducts points and issues a single-use voucher. Catalogue rewards are
        valid for the period stated when claimed (30 days by default). Show the
        QR or full voucher code to staff when collecting your reward. Codes
        should be kept private. Expired, used, and cancelled vouchers cannot be
        redeemed. Menu availability and item restrictions are stated on each
        voucher. Contact the restaurant for a mistaken claim; automatic
        cancellation and refund are not provided.
      </p>
      <h2>Your information</h2>
      <p>
        We collect your email for authentication, first name, optional phone
        number, terms acceptance, and optional marketing preference. We store
        membership, purchase references and amounts, points activity, daily
        spins, vouchers, and staff audit records to operate and protect the
        programme. Supabase processes authentication and database records. The
        browser stores the authentication session so you can remain signed in.
        The MVP does not process payments, request your location, or send
        marketing messages automatically.
      </p>
      <p>
        Marketing consent is optional and can be changed in Profile. Authorised
        staff can look up membership information and validate vouchers;
        administrators manage programme data. Contact {restaurant.email} to
        request access, correction, or deletion of your information. Retention
        periods and any required transaction retention must be reviewed by the
        restaurant before public launch. This draft notice requires owner review
        before activation.
      </p>
      <h2>Need a hand?</h2>
      <p>
        <a href={"mailto:" + restaurant.email}>{restaurant.email}</a> ·{" "}
        <a href={"tel:" + restaurant.phone}>{restaurant.phoneLabel}</a>
      </p>
    </main>
  );
}
