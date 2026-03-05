import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

const docsSiteUrl = process.env.DOCS_SITE_URL;

export default defineConfig({
  base: "/",
  ...(docsSiteUrl ? { site: docsSiteUrl } : {}),
  integrations: [
    starlight({
      title: "Lattice UI",
      prerender: true,
      sidebar: [
        {
          label: "Introduction",
          link: "/",
        },
        {
          label: "Getting Started",
          autogenerate: {
            directory: "getting-started",
          },
        },
        {
          label: "CLI",
          autogenerate: {
            directory: "cli",
          },
        },
        {
          label: "Components",
          autogenerate: {
            directory: "components",
          },
        },
        {
          label: "Reference",
          autogenerate: {
            directory: "reference",
          },
        },
      ],
    }),
  ],
});
