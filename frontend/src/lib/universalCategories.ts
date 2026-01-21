/**
 * Universal Categories - The "Musician Mindset" Taxonomy
 * 
 * Defines the 10 "Halilit Categories" that organize instruments by function
 * instead of brand. Reduces cognitive load by grouping similar instruments together.
 * 
 * Architecture: Translator between complex backend data and simple frontend buttons
 */

import type { Product } from '../types';

export interface UniversalCategoryDef {
    id: string;
    label: string;
    iconName: string; // Maps to Lucide icon names dynamically
    description: string;
    color: string; // Cognitive color anchor for each category
}

/**
 * The "Universal 10" - Core instrument categories organized by musician perspective
 */
export const UNIVERSAL_CATEGORIES: UniversalCategoryDef[] = [
    {
        id: 'keys',
        label: 'Keys & Pianos',
        iconName: 'Piano',
        description: 'Synths, Stage Pianos, Controllers',
        color: '#f59e0b', // Amber
    },
    {
        id: 'drums',
        label: 'Drums & Percussion',
        iconName: 'Music',
        description: 'V-Drums, Acoustic, Cymbals',
        color: '#ef4444', // Red
    },
    {
        id: 'guitars',
        label: 'Guitars & Amps',
        iconName: 'Zap',
        description: 'Pedals, Amps, Effects',
        color: '#3b82f6', // Blue
    },
    {
        id: 'studio',
        label: 'Studio & Recording',
        iconName: 'Mic2',
        description: 'Monitors, Interfaces, Mics',
        color: '#10b981', // Emerald
    },
    {
        id: 'live',
        label: 'Live Sound',
        iconName: 'Speaker',
        description: 'PA Systems, Mixers, Subwoofers',
        color: '#8b5cf6', // Violet
    },
    {
        id: 'dj',
        label: 'DJ & Production',
        iconName: 'Disc3',
        description: 'Controllers, Turntables',
        color: '#ec4899', // Pink
    },
    {
        id: 'headphones',
        label: 'Headphones',
        iconName: 'Headphones',
        description: 'Studio, DJ, Consumer',
        color: '#6366f1', // Indigo
    },
    {
        id: 'accessories',
        label: 'Accessories',
        iconName: 'Wrench',
        description: 'Stands, Cases, Cables',
        color: '#64748b', // Slate
    },
];

/**
 * The "Brain" - Maps product categories to universal categories
 * Uses fuzzy matching on product metadata to intelligently sort items
 */
export function mapProductToUniversal(product: Product): string {
    // Build search string from all product metadata
    const searchStr =
        (
            (product.category || '') +
            ' ' +
            (product.subcategory || '') +
            ' ' +
            (product.name || '') +
            ' ' +
            ((product.specifications || []).map((s) => s.key).join(' ') || '')
        ).toLowerCase();

    // Multi-level matching: Most specific to least specific
    if (
        searchStr.includes('piano') ||
        searchStr.includes('synth') ||
        searchStr.includes('keyboard') ||
        searchStr.includes('keys')
    ) {
        return 'keys';
    }
    if (
        searchStr.includes('drum') ||
        searchStr.includes('percussion') ||
        searchStr.includes('cymbal') ||
        searchStr.includes('v-drum')
    ) {
        return 'drums';
    }
    if (
        searchStr.includes('guitar') ||
        searchStr.includes('bass') ||
        searchStr.includes('amp') ||
        searchStr.includes('pedal') ||
        searchStr.includes('effect')
    ) {
        return 'guitars';
    }
    if (
        searchStr.includes('monitor') ||
        searchStr.includes('interface') ||
        searchStr.includes('mic') ||
        searchStr.includes('recording')
    ) {
        return 'studio';
    }
    if (
        searchStr.includes('speaker') ||
        searchStr.includes('mixer') ||
        searchStr.includes('pa') ||
        searchStr.includes('subwoofer') ||
        searchStr.includes('live')
    ) {
        return 'live';
    }
    if (searchStr.includes('dj') || searchStr.includes('turntable')) {
        return 'dj';
    }
    if (searchStr.includes('headphone') || searchStr.includes('ear')) {
        return 'headphones';
    }

    // Default fallback
    return 'accessories';
}

/**
 * Get the category definition by ID
 */
export function getCategoryById(id: string): UniversalCategoryDef | undefined {
    return UNIVERSAL_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get the color associated with a category ID
 */
export function getCategoryColor(categoryId: string): string {
    const cat = getCategoryById(categoryId);
    return cat?.color || '#64748b'; // Default to slate
}
