"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

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
        modules={[Autoplay, Pagination, Navigation]}
        speed={1000}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        navigation={{
          nextEl: '.custom-swiper-button-next',
          prevEl: '.custom-swiper-button-prev',
        }}
        pagination={{
          clickable: true,
          renderBullet: function (index, className) {
            return '<span class="' + className + ' bg-white opacity-50 hover:opacity-100"></span>';
          },
        }}
        loop={true}
        className="h-full w-full relative z-10 group"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="h-full w-full">
            <div className="flex h-full items-center justify-center">
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
                  {slide.button?.label && (
                    <Link
                      href={slide.button.link}
                      className="mt-10 inline-block rounded-none bg-accent px-10 py-4 font-semibold text-white transition-colors hover:bg-accent-light animate-in fade-in slide-in-from-bottom-4 duration-1000"
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

        {/* Custom Navigation Buttons */}
        <div className="custom-swiper-button-prev absolute left-4 md:left-8 top-1/2 z-20 -translate-y-1/2 cursor-pointer rounded-full bg-accent p-3 text-white shadow-lg transition-all hover:bg-accent-light hover:scale-105 active:scale-95 disabled:opacity-50 sm:left-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </div>
        <div className="custom-swiper-button-next absolute right-4 md:right-8 top-1/2 z-20 -translate-y-1/2 cursor-pointer rounded-full bg-accent p-3 text-white shadow-lg transition-all hover:bg-accent-light hover:scale-105 active:scale-95 disabled:opacity-50 sm:right-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

      </Swiper>

      {/* Custom Styles for Swiper Pagination (Navigation styles handled by Tailwind classes above) */}
      <style jsx global>{`
        .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: #fff !important;
          opacity: 0.5;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          width: 30px;
          border-radius: 6px;
          background: var(--color-accent) !important;
          opacity: 1;
        }
          }
        }
      `}</style>
    </section>
  );
}
