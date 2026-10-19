import Link from "next/link";
import { ArrowRight, Handshake, MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/ui/Reveal";
import { generalEnquiryMessage, waLink } from "@/lib/whatsapp";

export async function CtaBanner() {
  const settings = await getSettings();
  const waHref = waLink(settings.whatsappNumber, generalEnquiryMessage(settings.brandName));

  return (
    <section className="section bg-white" aria-labelledby="cta-heading">
      <div className="container-page">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy-900 px-6 py-16 text-center shadow-[0_50px_100px_-50px_rgba(11,31,58,0.8)] md:px-16 md:py-20">
            {/* subtle animated background */}
            <div aria-hidden className="absolute inset-0 -z-10">
              <div className="absolute -top-24 left-[15%] size-80 rounded-full bg-fresh-600/16 blur-3xl animate-float-slow" />
              <div className="absolute -right-16 -bottom-24 size-96 rounded-full bg-sky-400/12 blur-3xl animate-float-slower" />
              <div
                className="absolute inset-0 opacity-[0.1]"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                  maskImage: "radial-gradient(70% 70% at 50% 50%, black, transparent)",
                  WebkitMaskImage: "radial-gradient(70% 70% at 50% 50%, black, transparent)",
                }}
              />
            </div>

            <Handshake className="mx-auto size-10 text-fresh-500" aria-hidden />
            <h2
              id="cta-heading"
              className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-white md:text-4xl"
            >
              Looking for Wholesale Supply?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/65">
              Share your requirement with {settings.manufacturerName} — we supply retailers,
              wholesalers and distributors directly.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-fresh-600 px-6 text-sm font-bold text-white transition-[background-color,transform] duration-200 hover:bg-fresh-700 active:scale-[0.97]"
              >
                Submit an Order
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/contact?type=dealer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition-[background-color,transform,border-color] duration-200 hover:border-white/45 hover:bg-white/20 active:scale-[0.97]"
              >
                Become a Dealer
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center rounded-full px-6 text-sm font-bold text-white/80 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline"
              >
                Contact Us
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold text-[#062b17] transition-[background-color,transform] duration-200 hover:bg-[#1fbb59] active:scale-[0.97]"
              >
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
