"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Droplets, MessageCircle, MousePointer2, Sparkles } from "lucide-react";
import { generalEnquiryMessage, waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export type HeroImage = { src: string; alt: string };

const ROTATE_MS = 4200;

export function Hero({
  brandName,
  whatsappNumber,
  title,
  subtitle,
  images = [],
}: {
  brandName: string;
  whatsappNumber: string;
  title: string;
  subtitle: string;
  /** Product/site photos for the rotating cluster. Empty = branded 3D panels. */
  images?: HeroImage[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const yMain = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60]);
  const yLeft = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -120]);
  const yRight = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -30]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 120]);

  const words = title.split(" ");
  const waHref = waLink(whatsappNumber, generalEnquiryMessage(brandName));

  // Shuffle once per mount so the sequence differs between visits.
  const shuffled = useMemo(() => shuffle(images), [images]);
  const [index, setIndex] = useState(0);
  const count = shuffled.length;

  useEffect(() => {
    if (count < 2 || reduced) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [count, reduced]);

  // The three slots cycle independently so the cluster always looks varied.
  const main = count > 0 ? shuffled[index % count] : undefined;
  const left = count > 0 ? shuffled[(index + 1) % count] : undefined;
  const right = count > 1 ? shuffled[(index + 2) % count] : main;

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-navy-950 pt-28 pb-20 md:pt-36 md:pb-28"
      aria-label="Introduction"
    >
      {/* ---------- animated background ---------- */}
      <motion.div aria-hidden style={{ y: bgY }} className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_-10%,#12294a_0%,#0b1f3a_45%,#060f1d_100%)]" />
        <div className={cn("absolute -top-24 left-[12%] size-96 rounded-full bg-fresh-600/14 blur-3xl", !reduced && "animate-float-slow")} />
        <div className={cn("absolute top-40 right-[8%] size-[28rem] rounded-full bg-sky-500/12 blur-3xl", !reduced && "animate-float-slower")} />
        <div className={cn("absolute bottom-[-10%] left-[38%] size-72 rounded-full bg-indigo-400/10 blur-3xl", !reduced && "animate-float-slow")} />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(80% 60% at 50% 30%, black, transparent)",
            WebkitMaskImage: "radial-gradient(80% 60% at 50% 30%, black, transparent)",
          }}
        />
      </motion.div>

      <div className="container-page grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* ---------- copy ---------- */}
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/80 uppercase backdrop-blur"
          >
            <span className="size-1.5 rounded-full bg-fresh-500" aria-hidden />
            Retail · Wholesale · Bulk supply
          </motion.p>

          <h1 className="mt-6 text-[2.6rem] leading-[1.05] font-extrabold tracking-tight text-white sm:text-6xl lg:text-[4.2rem]">
            {words.map((word, i) => (
              <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  className={cn("inline-block", word.toLowerCase().startsWith("cleaner") && "text-fresh-500")}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.12 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                >
                  {word}
                  {i < words.length - 1 ? "\u00A0" : ""}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-white/70 md:text-lg"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/products"
              className="group inline-flex h-13 items-center gap-2 rounded-full bg-fresh-600 px-7 text-base font-bold text-white shadow-[0_18px_40px_-18px_rgba(22,163,74,0.9)] transition-[background-color,transform] duration-200 hover:bg-fresh-700 active:scale-[0.97]"
            >
              Explore Products
              <ArrowRight className="size-4.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-13 items-center gap-2 rounded-full border border-white/25 bg-white/8 px-7 text-base font-bold text-white backdrop-blur transition-[background-color,transform,border-color] duration-200 hover:border-white/45 hover:bg-white/15 active:scale-[0.97]"
            >
              <MessageCircle className="size-4.5" aria-hidden />
              Enquire on WhatsApp
            </a>
          </motion.div>
        </div>

        {/* ---------- product cluster ---------- */}
        <div
          className="relative mx-auto h-[24rem] w-full max-w-lg sm:h-[28rem] lg:h-[34rem]"
          style={{ perspective: "1400px" }}
        >
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: yMain, transformStyle: "preserve-3d" }}
            className="absolute inset-x-8 top-6 bottom-0 z-20 sm:inset-x-16"
          >
            <HeroSlot
              slot="main"
              image={main}
              brandName={brandName}
              index={index}
              className="h-full w-full rotate-[-2deg] shadow-[0_50px_90px_-40px_rgba(0,0,0,0.75)]"
            />
          </motion.div>

          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: -40, rotate: -12 }}
            animate={{ opacity: 1, x: 0, rotate: -8 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: yLeft }}
            className="absolute top-16 -left-2 z-10 w-36 sm:top-24 sm:-left-4 sm:w-44 lg:w-52"
          >
            <HeroSlot
              slot="spray"
              image={left}
              brandName={brandName}
              index={index}
              className="shadow-[0_40px_70px_-35px_rgba(0,0,0,0.7)]"
            />
          </motion.div>

          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 40, rotate: 12 }}
            animate={{ opacity: 1, x: 0, rotate: 8 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: yRight }}
            className="absolute right-0 bottom-0 z-30 w-36 sm:right-2 sm:w-44 lg:w-52"
          >
            <HeroSlot
              slot="car"
              image={right}
              brandName={brandName}
              index={index}
              className="shadow-[0_40px_70px_-35px_rgba(0,0,0,0.7)]"
            />
          </motion.div>

          {/* rotation progress dots */}
          {count > 1 && (
            <div className="absolute inset-x-0 -bottom-6 z-40 flex justify-center gap-1.5" aria-hidden>
              {shuffled.map((img, i) => (
                <span
                  key={img.src + i}
                  className={cn(
                    "h-1.5 rounded-full bg-white transition-all duration-300",
                    i === index % count ? "w-5 bg-fresh-400" : "w-1.5 bg-white/35"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.8 }}
        className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center lg:flex"
      >
        <motion.div
          animate={reduced ? {} : { y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1.5 text-white/40"
        >
          <MousePointer2 className="size-4" aria-hidden />
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">Scroll</span>
        </motion.div>
      </motion.div>
    </section>
  );
}

/** Fisher–Yates shuffle on a copy, so the caller's array is never mutated. */
function shuffle<T>(input: T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * One slot in the hero cluster. Cross-fades between photos with a 3D
 * rotate/translate so a swap reads as depth rather than a hard cut. Falls back
 * to a branded glass panel when no photo is available.
 */
function HeroSlot({
  slot,
  image,
  brandName,
  index,
  className,
}: {
  slot: "main" | "spray" | "car";
  image?: HeroImage;
  brandName: string;
  index: number;
  className?: string;
}) {
  return (
    <div className={cn("[transform-style:preserve-3d]", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={image?.src ?? `${slot}-panel`}
          initial={{ opacity: 0, rotateY: 42, z: -90 }}
          animate={{ opacity: 1, rotateY: 0, z: 0 }}
          exit={{ opacity: 0, rotateY: -42, z: -90 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="size-full [transform-style:preserve-3d]"
        >
          {image ? (
            <div className="size-full overflow-hidden rounded-3xl border border-white/12 bg-white/95 shadow-inner backdrop-blur-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                loading={index === 0 ? "eager" : "lazy"}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <FallbackPanel slot={slot} brandName={brandName} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Branded 3D glass tile shown until real product photos exist. */
function FallbackPanel({ slot, brandName }: { slot: "main" | "spray" | "car"; brandName: string }) {
  const isMain = slot === "main";
  const Icon = slot === "spray" ? Droplets : Sparkles;

  return (
    <div
      className={cn(
        "relative flex size-full flex-col justify-between overflow-hidden rounded-3xl border border-white/15 p-5 text-white",
        "bg-[linear-gradient(150deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04)_45%,rgba(34,197,94,0.18))]",
        "backdrop-blur-md [transform-style:preserve-3d]",
        isMain ? "items-start" : "items-center justify-center gap-3 text-center"
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-fresh-500/25 blur-2xl"
      />
      <Icon
        className={cn("relative text-fresh-300 drop-shadow-[0_6px_18px_rgba(34,197,94,0.5)]", isMain ? "size-10" : "size-7")}
        aria-hidden
      />
      <span className={cn("relative font-extrabold tracking-tight", isMain ? "text-2xl" : "text-xs leading-tight")}>
        {isMain ? brandName : "Photo coming soon"}
      </span>
      {isMain && (
        <span className="relative mt-1 text-xs font-semibold text-white/60">
          Real product photos are uploaded from the admin dashboard
        </span>
      )}
    </div>
  );
}
