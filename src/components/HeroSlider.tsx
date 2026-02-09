"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
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
  // Assuming all slides use the same background image, or we just use the first one as the base
  const backgroundImage = slides[0]?.image || "/images/banner/banner.jpg";

  return (
    <section aria-label="首頁橫幅" className="relative h-[600px] sm:h-[700px] lg:h-[800px]">
      {/* Static Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-primary/50" />
      </div>

      {/* Slider Content */}
      <Swiper
        modules={[Autoplay, Pagination]}
        speed={1000}
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
          <SwiperSlide key={index} className="h-full w-full">
            <div className="flex h-full items-center">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl text-left">
                  <h1
                    className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-1000"
                    style={{ animationDelay: '200ms' }}
                  >
                    {slide.title}
                  </h1>
                  <p
                    className="mt-6 text-lg leading-relaxed text-white/90 sm:text-xl animate-in fade-in slide-in-from-bottom-4 duration-1000"
                    style={{ animationDelay: '400ms' }}
                  >
                    {slide.content}
                  </p>
                  
                  {/* Empty space for pagination to be positioned below subtitle via absolute positioning or margin */}
                  <div className="h-12 sm:h-16"></div>

                  {slide.button?.label && (
                    <Link
                      href={slide.button.link}
                      className="mt-4 inline-block rounded-none bg-accent px-10 py-4 font-semibold text-primary-dark transition-colors hover:bg-accent-light animate-in fade-in slide-in-from-bottom-4 duration-1000"
                      style={{ animationDelay: '600ms' }}
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
      <div className="absolute bottom-1/4 sm:bottom-1/3 lg:bottom-[30%] left-0 right-0 z-20 pointer-events-none">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
