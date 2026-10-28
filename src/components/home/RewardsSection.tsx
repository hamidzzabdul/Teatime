import Link from "next/link";
import { ArrowUpRight, Coffee, QrCode, Sparkles } from "lucide-react";
export default function RewardsSection() {
  return (
    <section
      className="site-section rewards-invitation"
      aria-labelledby="club-heading"
    >
      <div className="container-custom">
        <div className="club-banner" data-reveal>
          <div>
            <p className="site-eyebrow">FOR OUR FAMILIAR FACES</p>
            <h2 id="club-heading">
              Your TeaTime.
              <br />
              <em>A little more rewarding.</em>
            </h2>
            <p>
              A membership for your everyday visits. Keep your points, daily
              spins and available treats together in TeaTime Rewards.
            </p>
            <Link href="/rewards" className="site-button site-button-ivory">
              Meet the Rewards club <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="club-card" aria-hidden="true">
            <div>
              TeaTime <Coffee size={25} />
            </div>
            <span>THE REWARDS CLUB</span>
            <strong>
              Every visit.
              <br />A little closer.
            </strong>
            <footer>
              <span>YOUR MEMBER CARD</span>
              <QrCode size={27} />
            </footer>
          </div>
          <div className="club-footnote">
            <Sparkles size={14} /> Collect points · Discover your daily spin ·
            Redeem available rewards
          </div>
        </div>
      </div>
    </section>
  );
}
