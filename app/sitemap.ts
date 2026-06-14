import type { MetadataRoute } from 'next';

const BASE_URL = 'https://netto.ouren.no';

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    const routes: Array<{
        path: string;
        priority: number;
        changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    }> = [
        { path: '', priority: 1.0, changeFrequency: 'monthly' },
        { path: '/about', priority: 0.7, changeFrequency: 'yearly' },
        { path: '/data', priority: 0.9, changeFrequency: 'monthly' },
        { path: '/summary', priority: 0.9, changeFrequency: 'monthly' },
        { path: '/summary/details', priority: 0.6, changeFrequency: 'monthly' },
        { path: '/monthly-economy', priority: 0.8, changeFrequency: 'monthly' },
        { path: '/houses', priority: 0.9, changeFrequency: 'monthly' },
        { path: '/sammenligning', priority: 0.7, changeFrequency: 'monthly' },
        { path: '/bid-planning', priority: 0.8, changeFrequency: 'monthly' },
        { path: '/repayment-plans', priority: 0.8, changeFrequency: 'monthly' },
        { path: '/equity-development', priority: 0.7, changeFrequency: 'monthly' },
        { path: '/interest-sensitivity', priority: 0.7, changeFrequency: 'monthly' },
        { path: '/tax-details', priority: 0.7, changeFrequency: 'monthly' },
    ];

    return routes.map(({ path, priority, changeFrequency }) => ({
        url: `${BASE_URL}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }));
}
