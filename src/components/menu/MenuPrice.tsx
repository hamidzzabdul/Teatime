import { formatMenuPrice, type MenuItem } from "@/data/menu";

export default function MenuPrice({ item }: { item: MenuItem }) {
  if (item.variants) return <dl className="mt-4 space-y-2 text-sm">
    {item.variants.map((variant) => <div key={variant.label} className="flex flex-wrap justify-between gap-x-3 gap-y-1">
      <dt className="text-brand-gray">{variant.label}</dt>
      <dd className="font-bold text-brand-red">{formatMenuPrice(variant.price)}</dd>
    </div>)}
  </dl>;
  return item.price !== undefined ? <p className="mt-4 text-sm font-bold text-brand-red">{formatMenuPrice(item.price)}</p> : null;
}
