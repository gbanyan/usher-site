"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, A11y } from "swiper/modules";
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

export default function HeroSlider({ slides }: HeroSliderProps) {
  return (
    <section aria-label="首頁橫幅輪播" aria-roledescription="輪播" role="region" className="relative h-[550px] sm:h-[650px] lg:h-[800px]">
      <Swiper
        modules={[Autoplay, Pagination, A11y]}
        speed={1000}
        a11y={{
          enabled: true,
          prevSlideMessage: "上一張投影片",
          nextSlideMessage: "下一張投影片",
          firstSlideMessage: "第一張投影片",
          lastSlideMessage: "最後一張投影片",
          paginationBulletMessage: "前往投影片 {{index}}",
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          el: ".hero-pagination",
          renderBullet: function (index, className) {
            return '<span class="' + className + '"></span>';
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
                  
                  {/* Empty space for pagination to be positioned below subtitle via absolute positioning or margin */}
                  <div className="h-10 sm:h-16"></div>

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

      {/* Custom Pagination Aligned with Content */}
      <div className="absolute bottom-[20%] sm:bottom-1/3 lg:bottom-[30%] left-0 right-0 z-20 pointer-events-none">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* 
                Approximate position under the subtitle. 
                Since the content is flex items-center, it's roughly in the middle.
                Subtitle is below title. 
                We adjust the bottom position to align it visually.
            */}
            <div 
              className="hero-pagination flex gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-1000"
              style={{ animationDelay: '500ms' }}
            ></div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Swiper Pagination */}
      <style jsx global>{`
        .hero-pagination .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #fff !important;
          opacity: 0.5;
          transition: all 0.3s ease;
          border-radius: 0 !important;
          cursor: pointer;
          margin: 0 !important;
        }
        .hero-pagination .swiper-pagination-bullet-active {
          background: var(--color-accent) !important;
          opacity: 1;
        }
      `}</style>
    </section>
  );
}
