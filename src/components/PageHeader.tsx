"use client";

import Link from "next/link";
import Image from "next/image";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    items: BreadcrumbItem[];
    description?: string;
    bgImage?: string;
}

export default function PageHeader({
    title,
    items,
    description,
    bgImage = "/images/banner/banner.jpg",
}: PageHeaderProps) {
    const allItems: BreadcrumbItem[] = [{ label: "首頁", href: "/" }, ...items];

    // Schema.org structured data for BreadcrumbList
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: allItems.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(item.href ? { item: item.href } : {}),
        })),
    };

    return (
        <section className="relative h-[300px] w-full bg-cover bg-center sm:h-[400px]" aria-labelledby="page-header-title">
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src={bgImage}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                />
                {/* Overlay to match original theme's dark overlay */}
                <div className="absolute inset-0 bg-primary/60" />
            </div>

            <div className="relative z-10 flex h-full items-center justify-center text-center">
                <div className="container mx-auto px-6 lg:px-8">
                    {/* Breadcrumb List */}
                    <nav aria-label="breadcrumb">
                        <script
                            type="application/ld+json"
                            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                        />
                        <ol className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base">
                            {allItems.map((item, index) => {
                                const isLast = index === allItems.length - 1;
                                return (
                                    <li key={index} className="flex items-center text-white/80">
                                        {index > 0 && (
                                            <span className="mx-2 text-white/50">/</span>
                                        )}
                                        {isLast || !item.href ? (
                                            <span className="font-medium text-white" aria-current="page">
                                                {item.label}
                                            </span>
                                        ) : (
                                            <Link href={item.href} className="transition-colors duration-200 hover:text-accent-light">
                                                {item.label}
                                            </Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>

                    {/* Title */}
                    <h1 id="page-header-title" className="mt-4 text-heading-1 text-white">
                        {title}
                    </h1>

                    {/* Description (optional) */}
                    {description && (
                        <p className="mt-4 max-w-2xl mx-auto text-lead">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
