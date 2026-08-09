"use client";

import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, A11y } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import Image from "next/image";
import Link from "next/link";
import "swiper/css";
import "swiper/css/pagination";

// Define the interface for a single slide item
// This should match the structure used in page.tsx
interface SliderItem {
  image: string;
  title: string;
  content: string;
  button: {
    label: string;
    link: string;
  };
}

interface HeroSliderProps {
  slides: SliderItem[];
}

function usePrefersReducedMotion() {
  // Start conservatively during hydration; motion is enabled only after the
  // browser preference has been read.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const swiperRef = useRef<SwiperInstance | null>(null);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper?.autoplay) return;

    if (prefersReducedMotion) {
      swiper.autoplay.stop();
    } else {
      swiper.autoplay.start();
    }
  }, [prefersReducedMotion]);

  return (
    <section aria-label="首頁橫幅輪播" aria-roledescription="輪播" role="region" className="relative h-[550px] sm:h-[650px] lg:h-[800px]">
      <Swiper
        modules={[Autoplay, Pagination, A11y]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          if (prefersReducedMotion) swiper.autoplay?.stop();
        }}
        speed={prefersReducedMotion ? 0 : 1000}
        a11y={{
          enabled: true,
          prevSlideMessage: "上一張投影片",
          nextSlideMessage: "下一張投影片",
          firstSlideMessage: "第一張投影片",
          lastSlideMessage: "最後一張投影片",
          paginationBulletMessage: "前往投影片 {{index}}",
        }}
        autoplay={prefersReducedMotion ? false : {
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          el: ".hero-pagination",
          renderBullet: function (index, className) {
            return '<button type="button" class="' + className + '" aria-label="前往投影片 ' + (index + 1) + '"></button>';
          },
        }}
        loop={true}
        className="h-full w-full relative z-10 group"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="relative h-full w-full">
            {/* Per-slide background image */}
            <div className="absolute inset-0 z-0">
              <Image
                src={slide.image}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority={index < 2}
              />
              <div className="absolute inset-0 bg-primary/60 sm:bg-primary/50" />
            </div>
            <div className="relative z-10 flex h-full items-center">
              <div className="container mx-auto px-6 lg:px-8">
                <div className="max-w-3xl text-left pt-10 sm:pt-0">
                  <h1
                    className="text-display text-white animate-in fade-in slide-in-from-bottom-4 duration-1000"
                    style={{ animationDelay: '200ms' }}
                  >
                    {slide.title}
                  </h1>
                  <p
                    className="mt-4 sm:mt-6 text-lead animate-in fade-in slide-in-from-bottom-4 duration-1000"
                    style={{ animationDelay: '400ms' }}
                  >
                    {slide.content}
                  </p>
                  
                  {slide.button?.label && (
                    <Link
                      href={slide.button.link}
                      className="mt-2 sm:mt-4 inline-block rounded-lg bg-accent px-8 py-3 sm:px-10 sm:py-4 text-sm sm:text-base font-semibold text-primary-dark transition-colors duration-200 hover:bg-accent-light animate-in fade-in slide-in-from-bottom-4 duration-1000"
                      style={{ animationDelay: '600ms' }}
                      aria-label={`${slide.button.label}：${slide.title}`}
                    >
                      {slide.button.label}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Pagination bullets - clickable, keyboard accessible */}
      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 sm:bottom-24 lg:bottom-24">
        <div className="container mx-auto flex justify-center px-4 sm:px-6 lg:px-8">
          <div
            className="hero-controls flex flex-nowrap items-center justify-center gap-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-1000"
            style={{ animationDelay: '500ms' }}
            role="group"
            aria-label="輪播控制"
          >
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-primary-dark/85 text-white shadow-lg transition-colors hover:bg-primary-dark hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark sm:size-11"
              aria-label="上一張投影片"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="hero-pagination flex items-center gap-2" />

            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-primary-dark/85 text-white shadow-lg transition-colors hover:bg-primary-dark hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark sm:size-11"
              aria-label="下一張投影片"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Styles for Swiper Pagination - buttons for accessibility */}
      <style jsx global>{`
        /* Swiper's pagination defaults to absolute positioning and width: 100%,
           which would force the arrows onto separate rows in this control bar. */
        .hero-pagination.swiper-pagination,
        .hero-pagination.swiper-pagination-horizontal {
          position: static !important;
          width: auto !important;
          transform: none !important;
        }
        .hero-pagination .swiper-pagination-bullet {
          width: 2.25rem;
          height: 2.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: rgb(13 13 31 / 0.85) !important;
          opacity: 1;
          transition: background-color 0.3s ease, border-color 0.3s ease;
          border: 2px solid rgb(255 255 255 / 0.75);
          border-radius: 9999px !important;
          cursor: pointer;
          margin: 0 !important;
          padding: 0;
        }
        @media (min-width: 640px) {
          .hero-pagination .swiper-pagination-bullet {
            width: 2.75rem;
            height: 2.75rem;
          }
        }
        .hero-pagination .swiper-pagination-bullet::after {
          content: "";
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: #fff;
        }
        .hero-pagination .swiper-pagination-bullet-active {
          background: var(--color-accent) !important;
          border-color: var(--color-accent);
        }
        .hero-pagination .swiper-pagination-bullet-active::after {
          background: var(--color-primary-dark);
        }
        .hero-pagination .swiper-pagination-bullet:focus-visible {
          outline: 3px solid var(--color-accent);
          outline-offset: 3px;
        }
      `}</style>
    </section>
  );
}
