import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://stockle.fun',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
