import { useEffect } from "react";
import movedGraphic from "@/assets/config-builder-moved.png.asset.json";
import { NEW_SITE_URL } from "@/utils/siteRedirect";

const RelocationNotice = () => {
  useEffect(() => {
    const previous = document.title;
    document.title = "We've moved — APEx Geospatial Explorer Config Builder";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-6 py-10">
      <div className="max-w-3xl w-full flex flex-col items-center text-center gap-8">
        <img
          src={movedGraphic.url}
          alt="Illustration of two movers loading the Config Builder interface into a 'New home' delivery van"
          className="w-full max-w-xl h-auto rounded-lg shadow-md"
        />

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            We've moved!
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            The APEx Geospatial Explorer Config Builder now lives at its new
            permanent home. Please update your bookmarks.
          </p>
        </div>

        <a
          href={NEW_SITE_URL}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-3 text-base font-medium shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go to the new site
          <span aria-hidden="true">→</span>
        </a>

        <p className="text-sm text-muted-foreground break-all">
          {NEW_SITE_URL}
        </p>
      </div>
    </main>
  );
};

export default RelocationNotice;
