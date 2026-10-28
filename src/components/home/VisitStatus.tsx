"use client";
import { useEffect, useState } from "react";
import { restaurant } from "@/lib/site";
export default function VisitStatus() {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const update = () =>
      setHour(
        Number(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Africa/Nairobi",
            hour: "2-digit",
            hourCycle: "h23",
          }).format(new Date()),
        ),
      );
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  const known = restaurant.hours === "6:00 am – midnight";
  const open = known && hour !== null && hour >= 6;
  return (
    <span className="visit-status" data-open={open}>
      <i aria-hidden="true" />
      {hour === null || !known
        ? `Opening hours · ${restaurant.hours}`
        : open
          ? "Open now · until midnight"
          : "See you from 6 am"}
    </span>
  );
}
