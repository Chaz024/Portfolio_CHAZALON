import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const etudes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/etudes' }),
  schema: z.object({
    num: z.number().int().min(1).max(12),
    title: z.string(),
    cycle: z.enum(['3A', 'ENSEEIHT', 'CPGE']),
    periode: z.string(),            // ex. "2025 — 3ᵉ année"
    methods: z.array(z.string()),   // ex. ["Lattice Boltzmann", "BGK"]
    tools: z.array(z.string()),     // ex. ["Python", "NumPy"]
    metric: z.string(),             // résultat clé, une ligne
    summary: z.string(),            // 2 lignes pour l'index
    pdf: z.string().nullable(),     // ex. "/pdf/aeroacoustique-lbm.pdf"
    pdfSize: z.string().nullable(), // ex. "4,6 Mo"
    featured: z.boolean().default(false),
    plates: z.array(z.object({ src: z.string(), caption: z.string(), alt: z.string() })).default([]),
  }),
});
export const collections = { etudes };
