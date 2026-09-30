"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";

type FilterSection = {
  title: string;
  items: string[];
};

type MovieFiltersProps = {
  selectedLanguage: string | null;
  selectedGenre: string | null;
  selectedFormat: string | null;
  onLanguageChange: (value: string | null) => void;
  onGenreChange: (value: string | null) => void;
  onFormatChange: (value: string | null) => void;
};

const filterSections: FilterSection[] = [
  {
    title: "Languages",
    items: [
      "Hindi",
      "English",
      "English 7D",
      "Bengali",
      "Punjabi",
      "Tamil",
      "Japanese",
      "Telugu",
    ],
  },
  {
    title: "Genres",
    items: [
      "Action",
      "Comedy",
      "Drama",
      "Horror",
      "Thriller",
      "Adventure",
      "Animation",
      "Fantasy",
    ],
  },
  {
    title: "Format",
    items: ["2D", "3D", "4DX", "IMAX", "IMAX 3D", "7D"],
  },
];

export function MovieFilters({
  selectedLanguage,
  selectedGenre,
  selectedFormat,
  onLanguageChange,
  onGenreChange,
  onFormatChange,
}: MovieFiltersProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const getSelectedValue = (title: string) => {
    if (title === "Languages") return selectedLanguage;
    if (title === "Genres") return selectedGenre;
    return selectedFormat;
  };

  const handleChange = (title: string, value: string) => {
    const selected = getSelectedValue(title);
    const nextValue = selected === value ? null : value;

    if (title === "Languages") {
      onLanguageChange(nextValue);
    } else if (title === "Genres") {
      onGenreChange(nextValue);
    } else {
      onFormatChange(nextValue);
    }
  };

  const handleClear = (title: string) => {
    if (title === "Languages") {
      onLanguageChange(null);
    } else if (title === "Genres") {
      onGenreChange(null);
    } else {
      onFormatChange(null);
    }
  };

  return (
    <aside className="w-full lg:w-[30%] lg:shrink-0 sticky top-0 z-40">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-5 text-xl font-bold tracking-tight text-foreground">
          Filters
        </h2>

        <div className="space-y-3">
          {filterSections.map((section) => {
            const isOpen = openSection === section.title;
            const selectedValue = getSelectedValue(section.title);

            return (
              <div
                key={section.title}
                className="relative rounded-xl border border-border bg-background"
              >
                {/* Header */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSection(isOpen ? null : section.title)
                    }
                    className="
                      flex
                      min-h-12
                      flex-1
                      items-center
                      justify-between
                      gap-3
                      px-4
                      text-left
                      text-sm
                      font-semibold
                      text-foreground
                    "
                  >
                    <span>{section.title}</span>

                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {selectedValue && (
                    <button
                      type="button"
                      onClick={() => handleClear(section.title)}
                      className="
                        mr-4
                        shrink-0
                        text-xs
                        font-medium
                        text-muted-foreground
                        transition-colors
                        hover:text-primary
                      "
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Dropdown content */}
                {isOpen && (
                  <div className="border-t border-border p-3">
                    <div className="flex flex-wrap gap-2">
                      {section.items.map((item) => {
                        const isSelected = selectedValue === item;

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleChange(section.title, item)}
                            className={`
                              inline-flex
                              w-fit
                              items-center
                              rounded-lg
                              border
                              px-3
                              py-2
                              text-sm
                              transition-colors
                              ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-foreground hover:bg-muted"
                              }
                            `}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Browse by Cinemas */}
          <Button
            type="button"
            variant="outline"
            className="
              min-h-12
              w-full
              rounded-xl
              border-border
              text-foreground
              hover:bg-muted
              hover:text-foreground
            "
          >
            Browse by Cinemas
          </Button>
        </div>
      </div>
    </aside>
  );
}
