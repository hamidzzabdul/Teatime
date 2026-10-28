import Link from "next/link";

const questions = [
  {
    question: "Does TeaTime offer delivery?",
    answer: (
      <>
        Yes, we do deliveries and are listed on Glovo, Bolt Food and Uber Eats.
        Search for TeaTime in your preferred app and enter your address to check
        delivery availability. Explore our{" "}
        <Link
          href="/our-place#delivery"
          className="font-semibold text-brand-red underline"
        >
          delivery options
        </Link>
        .
      </>
    ),
  },
  {
    question: "What is on the TeaTime menu?",
    answer: (
      <>
        Explore soups, breakfast bowls, burgers, club sandwiches, pasta, pizza,
        local dishes, desserts and drinks. Our{" "}
        <Link href="/menu" className="font-semibold text-brand-red underline">
          full menu
        </Link>{" "}
        lists the dishes in each category.
      </>
    ),
  },
  {
    question: "Are there meat-free choices?",
    answer: (
      <>
        The menu includes a Falafel Wrap, Vegan Pasta, Vegan Taco with Guacamole
        and salads. Please speak with the restaurant about ingredients and
        preparation before ordering.
      </>
    ),
  },
  {
    question: "How can I check ingredients or allergens?",
    answer: (
      <>
        Some dish descriptions list ingredients, but they are not a complete
        allergen guide.{" "}
        <Link
          href="/contact"
          className="font-semibold text-brand-red underline"
        >
          Contact the team
        </Link>{" "}
        before ordering if you have an allergy or dietary requirement.
      </>
    ),
  },
  {
    question: "Where is TeaTime and when is it open?",
    answer: (
      <>
        Find us at Legend Valley Business Park, Lavington, Nairobi. We open from
        6:00 am to midnight. Visit our{" "}
        <Link
          href="/contact"
          className="font-semibold text-brand-red underline"
        >
          contact page
        </Link>{" "}
        and get in touch before your visit to confirm hours, dish availability
        and current prices.
      </>
    ),
  },
];

export default function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="section-padding bg-white"
    >
      <div className="container-custom grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">A few things to know</p>
          <h2 id="faq-heading" className="section-title">
            Before your first bite.
          </h2>
          <p className="mt-5 max-w-sm leading-7 text-brand-gray">
            A little help choosing your meal and planning your visit.
          </p>
        </div>
        <div className="divide-y divide-black/10 border-y border-black/10">
          {questions.map((item) => (
            <details key={item.question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-bold">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="text-2xl font-normal text-brand-red group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 pr-6 text-sm leading-7 text-brand-gray">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

