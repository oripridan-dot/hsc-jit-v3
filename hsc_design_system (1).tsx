import React, { useState } from 'react';
import { Search, Copy, Check, ChevronRight, FileText, Video, Image, Headphones, Download, ExternalLink, AlertCircle, CheckCircle, Info, HelpCircle, Book, Wrench, MessageSquare, BarChart3, Settings, Home, Zap, Layers, Play, Pause, SkipBack, SkipForward, Volume2, Mic, Radio, Music, Users, Clock, Tag, Filter, Grid, List, Eye, Share2, Bookmark, Star, TrendingUp, Award, Target, Lightbulb, Compass, Box, Package, Boxes, FileSearch, FileCog, FileVideo, FileImage, FileAudio, Cpu, Database, Server, Globe, Link, Mail, Phone, MapPin, Calendar, Bell, AlertTriangle, XCircle, Plus, Minus, X, ChevronDown, ChevronUp, ChevronLeft, ArrowRight, ArrowLeft, RotateCw, Maximize2, Minimize2, MoreVertical, MoreHorizontal, Edit, Trash2, Upload, FolderOpen, Folder, Save, Palette, Sparkles, Droplet } from 'lucide-react';

const BrandableDesignSystem = () => {
  const [copiedIcon, setCopiedIcon] = useState(null);
  const [activeCategory, setActiveCategory] = useState('navigation');
  const [selectedBrand, setSelectedBrand] = useState('halilit');

  // Brand presets - easily extendable for any manufacturer
  const brandPresets = {
    halilit: {
      name: "Halilit",
      primary: "#FF6B35",
      secondary: "#F7931E",
      accent: "#FDB913",
      background: "#FFF8F0",
      surface: "#FFFFFF",
      text: "#2D2D2D",
      textLight: "#6B7280",
      gradient: "from-orange-400 via-amber-400 to-yellow-400",
      description: "Vibrant, playful, educational"
    },
    roland: {
      name: "Roland",
      primary: "#E60012",
      secondary: "#000000",
      accent: "#FFFFFF",
      background: "#F5F5F5",
      surface: "#FFFFFF",
      text: "#000000",
      textLight: "#666666",
      gradient: "from-red-600 via-gray-900 to-black",
      description: "Bold, professional, powerful"
    },
    yamaha: {
      name: "Yamaha",
      primary: "#662D91",
      secondary: "#0033A0",
      accent: "#00A3E0",
      background: "#F8F9FA",
      surface: "#FFFFFF",
      text: "#1A1A1A",
      textLight: "#6C757D",
      gradient: "from-purple-700 via-blue-800 to-cyan-500",
      description: "Elegant, trustworthy, innovative"
    },
    korg: {
      name: "Korg",
      primary: "#000000",
      secondary: "#FF0000",
      accent: "#00A651",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      text: "#000000",
      textLight: "#757575",
      gradient: "from-black via-red-600 to-green-500",
      description: "Modern, technical, precise"
    },
    custom: {
      name: "Custom Brand",
      primary: "#3B82F6",
      secondary: "#8B5CF6",
      accent: "#10B981",
      background: "#F9FAFB",
      surface: "#FFFFFF",
      text: "#111827",
      textLight: "#6B7280",
      gradient: "from-blue-500 via-purple-500 to-green-500",
      description: "Your brand colors"
    }
  };

  const brand = brandPresets[selectedBrand];

  const copyToClipboard = (iconName) => {
    navigator.clipboard.writeText(`<${iconName} className="text-brand-primary" />`);
    setCopiedIcon(iconName);
    setTimeout(() => setCopiedIcon(null), 2000);
  };

  const iconCategories = {
    navigation: {
      title: "Navigation & Core",
      icons: [
        { Icon: Home, name: 'Home', usage: 'Dashboard/Home' },
        { Icon: Book, name: 'Book', usage: 'Knowledge Base' },
        { Icon: MessageSquare, name: 'MessageSquare', usage: 'Support Chat' },
        { Icon: BarChart3, name: 'BarChart3', usage: 'Analytics' },
        { Icon: Settings, name: 'Settings', usage: 'Settings' },
        { Icon: Zap, name: 'Zap', usage: 'Quick Actions' },
        { Icon: Users, name: 'Users', usage: 'Users' },
        { Icon: Search, name: 'Search', usage: 'Search' }
      ]
    },
    workbench: {
      title: "Workbench Tabs",
      icons: [
        { Icon: FileText, name: 'FileText', usage: 'Documents' },
        { Icon: Video, name: 'Video', usage: 'Videos' },
        { Icon: Image, name: 'Image', usage: 'Images' },
        { Icon: Headphones, name: 'Headphones', usage: 'Audio' },
        { Icon: Wrench, name: 'Wrench', usage: 'Tools' },
        { Icon: Layers, name: 'Layers', usage: 'Resources' },
        { Icon: Lightbulb, name: 'Lightbulb', usage: 'Tips' },
        { Icon: Target, name: 'Target', usage: 'Focus' }
      ]
    },
    mediabar: {
      title: "Media Controls",
      icons: [
        { Icon: Play, name: 'Play', usage: 'Play' },
        { Icon: Pause, name: 'Pause', usage: 'Pause' },
        { Icon: SkipBack, name: 'SkipBack', usage: 'Previous' },
        { Icon: SkipForward, name: 'SkipForward', usage: 'Next' },
        { Icon: Volume2, name: 'Volume2', usage: 'Volume' },
        { Icon: Mic, name: 'Mic', usage: 'Voice' },
        { Icon: Radio, name: 'Radio', usage: 'Live' },
        { Icon: Music, name: 'Music', usage: 'Audio' }
      ]
    },
    content: {
      title: "Content Types",
      icons: [
        { Icon: FileSearch, name: 'FileSearch', usage: 'Search' },
        { Icon: FileCog, name: 'FileCog', usage: 'Specs' },
        { Icon: FileVideo, name: 'FileVideo', usage: 'Video' },
        { Icon: FileImage, name: 'FileImage', usage: 'Image' },
        { Icon: FileAudio, name: 'FileAudio', usage: 'Audio' },
        { Icon: Download, name: 'Download', usage: 'Download' },
        { Icon: ExternalLink, name: 'ExternalLink', usage: 'External' },
        { Icon: Bookmark, name: 'Bookmark', usage: 'Saved' }
      ]
    },
    status: {
      title: "Status & Alerts",
      icons: [
        { Icon: CheckCircle, name: 'CheckCircle', usage: 'Success' },
        { Icon: AlertCircle, name: 'AlertCircle', usage: 'Warning' },
        { Icon: XCircle, name: 'XCircle', usage: 'Error' },
        { Icon: Info, name: 'Info', usage: 'Info' },
        { Icon: HelpCircle, name: 'HelpCircle', usage: 'Help' },
        { Icon: AlertTriangle, name: 'AlertTriangle', usage: 'Alert' },
        { Icon: Clock, name: 'Clock', usage: 'Pending' },
        { Icon: Bell, name: 'Bell', usage: 'Notify' }
      ]
    },
    actions: {
      title: "User Actions",
      icons: [
        { Icon: Edit, name: 'Edit', usage: 'Edit' },
        { Icon: Trash2, name: 'Trash2', usage: 'Delete' },
        { Icon: Share2, name: 'Share2', usage: 'Share' },
        { Icon: Upload, name: 'Upload', usage: 'Upload' },
        { Icon: Copy, name: 'Copy', usage: 'Copy' },
        { Icon: Save, name: 'Save', usage: 'Save' },
        { Icon: Plus, name: 'Plus', usage: 'Add' },
        { Icon: Filter, name: 'Filter', usage: 'Filter' }
      ]
    }
  };

  const themeStrategies = [
    {
      title: "Dynamic Color System",
      icon: Palette,
      techniques: [
        "CSS Custom Properties for brand colors",
        "Automatic color shade generation",
        "HSL manipulation for hover/active states",
        "Dark mode support per brand",
        "Semantic naming (--brand-primary, --brand-accent)"
      ]
    },
    {
      title: "Visual Identity Elements",
      icon: Sparkles,
      techniques: [
        "Brand logo integration in header",
        "Custom loading animations with brand colors",
        "Branded empty states and illustrations",
        "Manufacturer-specific typography",
        "Product-line themed icon variations"
      ]
    },
    {
      title: "Contextual Theming",
      icon: Droplet,
      techniques: [
        "Product category color coding",
        "Brand gradient overlays",
        "Manufacturer pattern libraries",
        "Contextual backgrounds (subtle brand textures)",
        "Micro-animations aligned with brand personality"
      ]
    }
  ];

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: brand.background }}>
      {/* Dynamic Header */}
      <header className="border-b sticky top-0 z-50 shadow-lg backdrop-blur-sm transition-all duration-500" 
              style={{ 
                background: `linear-gradient(to right, ${brand.primary}, ${brand.secondary})`,
                borderColor: brand.primary 
              }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: brand.accent }}>
                HSC JIT v3 • Brandable Design System
              </h1>
              <p className="text-sm mt-1 opacity-90" style={{ color: brand.surface }}>
                {brand.description} • {brand.name} Theme Active
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-transform hover:scale-105"
                   style={{ backgroundColor: brand.accent, color: brand.text }}>
                180+ Adaptive Icons
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Brand Selector */}
      <div className="sticky top-[73px] z-40 border-b transition-colors duration-500" 
           style={{ backgroundColor: brand.surface, borderColor: brand.primary + '30' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold" style={{ color: brand.text }}>Select Brand:</span>
            {Object.entries(brandPresets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setSelectedBrand(key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                  selectedBrand === key ? 'shadow-lg scale-105' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  background: selectedBrand === key 
                    ? `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                    : preset.surface,
                  color: selectedBrand === key ? preset.accent : preset.text,
                  border: `2px solid ${selectedBrand === key ? preset.primary : preset.primary + '40'}`
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="sticky top-[145px] z-30 border-b transition-colors duration-500" 
           style={{ backgroundColor: brand.surface, borderColor: brand.primary + '20' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {Object.keys(iconCategories).map((key) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-300"
                style={{
                  backgroundColor: activeCategory === key ? brand.primary : brand.background,
                  color: activeCategory === key ? brand.surface : brand.text,
                  border: `1px solid ${activeCategory === key ? brand.primary : brand.primary + '30'}`
                }}
              >
                {iconCategories[key].title}
              </button>
            ))}
            <button
              onClick={() => setActiveCategory('theming')}
              className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-300"
              style={{
                backgroundColor: activeCategory === 'theming' ? brand.primary : brand.background,
                color: activeCategory === 'theming' ? brand.surface : brand.text,
                border: `1px solid ${activeCategory === 'theming' ? brand.primary : brand.primary + '30'}`
              }}
            >
              Theming Guide
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Icon Categories */}
        {activeCategory !== 'theming' && (
          <div className="space-y-6">
            <div className="rounded-xl shadow-lg border transition-all duration-500" 
                 style={{ backgroundColor: brand.surface, borderColor: brand.primary + '30' }}>
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2" style={{ color: brand.text }}>
                    {iconCategories[activeCategory].title}
                  </h2>
                  <p style={{ color: brand.textLight }}>
                    Click any icon to copy with brand-aware class name
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {iconCategories[activeCategory].icons.map(({ Icon, name, usage }) => (
                    <div
                      key={name}
                      onClick={() => copyToClipboard(name)}
                      className="group relative rounded-lg p-4 cursor-pointer transition-all duration-300 border-2"
                      style={{
                        backgroundColor: brand.background,
                        borderColor: brand.primary + '20'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = brand.primary;
                        e.currentTarget.style.backgroundColor = brand.primary + '10';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 8px 16px ${brand.primary}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = brand.primary + '20';
                        e.currentTarget.style.backgroundColor = brand.background;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-110"
                             style={{ backgroundColor: brand.surface, color: brand.primary }}>
                          <Icon size={28} />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm" style={{ color: brand.text }}>{name}</p>
                          <p className="text-xs mt-1" style={{ color: brand.textLight }}>{usage}</p>
                        </div>
                      </div>
                      {copiedIcon === name && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs flex items-center gap-1 shadow-lg"
                             style={{ backgroundColor: brand.accent, color: brand.text }}>
                          <Check size={12} /> Copied
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Theming Guide */}
        {activeCategory === 'theming' && (
          <div className="space-y-6">
            {/* Brand Color Preview */}
            <div className="rounded-xl shadow-lg overflow-hidden transition-all duration-500"
                 style={{ backgroundColor: brand.surface }}>
              <div className={`p-8 bg-gradient-to-r ${brand.gradient}`}>
                <h2 className="text-3xl font-bold mb-2" style={{ color: brand.surface }}>
                  {brand.name} Brand Theme
                </h2>
                <p className="text-lg opacity-90" style={{ color: brand.surface }}>
                  {brand.description}
                </p>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brand.primary }}>
                    <p className="text-sm font-medium mb-2" style={{ color: brand.surface }}>Primary</p>
                    <p className="text-xs font-mono" style={{ color: brand.surface }}>{brand.primary}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: brand.secondary }}>
                    <p className="text-sm font-medium mb-2" style={{ color: brand.surface }}>Secondary</p>
                    <p className="text-xs font-mono" style={{ color: brand.surface }}>{brand.secondary}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border-2" 
                       style={{ backgroundColor: brand.accent, borderColor: brand.primary }}>
                    <p className="text-sm font-medium mb-2" style={{ color: brand.text }}>Accent</p>
                    <p className="text-xs font-mono" style={{ color: brand.text }}>{brand.accent}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Implementation Strategies */}
            {themeStrategies.map((strategy, idx) => (
              <div key={idx} className="rounded-xl shadow-lg border transition-all duration-500"
                   style={{ backgroundColor: brand.surface, borderColor: brand.primary + '30' }}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: brand.primary + '20', color: brand.primary }}>
                      <strategy.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold" style={{ color: brand.text }}>
                      {strategy.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {strategy.techniques.map((technique, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight size={20} className="mt-0.5 flex-shrink-0" style={{ color: brand.primary }} />
                        <span style={{ color: brand.textLight }}>{technique}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* Code Example */}
            <div className="rounded-xl shadow-lg border transition-all duration-500"
                 style={{ backgroundColor: brand.surface, borderColor: brand.primary + '30' }}>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: brand.text }}>
                  Implementation Example
                </h3>
                <div className="rounded-lg p-4 font-mono text-sm overflow-x-auto"
                     style={{ backgroundColor: brand.text, color: brand.surface }}>
                  <pre>{`// CSS Custom Properties (injected dynamically)
:root {
  --brand-primary: ${brand.primary};
  --brand-secondary: ${brand.secondary};
  --brand-accent: ${brand.accent};
  --brand-background: ${brand.background};
  --brand-surface: ${brand.surface};
  --brand-text: ${brand.text};
  --brand-text-light: ${brand.textLight};
}

// React Component Usage
<div className="bg-brand-primary text-brand-surface">
  <Home className="text-brand-accent" />
  <h1>{brandName} Support Center</h1>
</div>

// Tailwind Configuration
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
          // ... etc
        }
      }
    }
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Experience Immersion Guide */}
        <div className="mt-8 rounded-xl shadow-xl overflow-hidden transition-all duration-500">
          <div className={`p-8 bg-gradient-to-br ${brand.gradient}`}>
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3" style={{ color: brand.surface }}>
              <Sparkles size={32} />
              Brand Immersion Strategies
            </h2>
            <p className="text-lg opacity-90" style={{ color: brand.surface }}>
              Making users feel they're in the manufacturer's world
            </p>
          </div>
          <div className="p-6" style={{ backgroundColor: brand.surface }}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-lg border-2 transition-all duration-300 hover:shadow-lg"
                   style={{ borderColor: brand.primary + '40', backgroundColor: brand.background }}>
                <h3 className="font-bold mb-3 text-lg flex items-center gap-2" style={{ color: brand.primary }}>
                  <Palette size={20} />
                  Visual Consistency
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: brand.textLight }}>
                  <li>• Match exact brand Pantone/HEX colors</li>
                  <li>• Use manufacturer's official typography</li>
                  <li>• Incorporate brand pattern elements</li>
                  <li>• Mirror product line color schemes</li>
                  <li>• Branded loading states & animations</li>
                </ul>
              </div>
              <div className="p-5 rounded-lg border-2 transition-all duration-300 hover:shadow-lg"
                   style={{ borderColor: brand.secondary + '40', backgroundColor: brand.background }}>
                <h3 className="font-bold mb-3 text-lg flex items-center gap-2" style={{ color: brand.secondary }}>
                  <Target size={20} />
                  Contextual Adaptation
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: brand.textLight }}>
                  <li>• Product images with brand backgrounds</li>
                  <li>• Category-specific color accents</li>
                  <li>• Brand voice in all copy/messages</li>
                  <li>• Manufacturer-themed illustrations</li>
                  <li>• Consistent icon treatment</li>
                </ul>
              </div>
              <div className="p-5 rounded-lg border-2 transition-all duration-300 hover:shadow-lg"
                   style={{ borderColor: brand.accent + '40', backgroundColor: brand.background }}>
                <h3 className="font-bold mb-3 text-lg flex items-center gap-2" style={{ color: brand.text }}>
                  <Zap size={20} />
                  Dynamic Personalization
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: brand.textLight }}>
                  <li>• Real-time theme switching per product</li>
                  <li>• Brand logo in navigation header</li>
                  <li>• Manufacturer watermarks on media</li>
                  <li>• Contextual empty states</li>
                  <li>• Branded success/error messages</li>
                </ul>
              </div>
              <div className="p-5 rounded-lg border-2 transition-all duration-300 hover:shadow-lg"
                   style={{ borderColor: brand.primary + '40', backgroundColor: brand.background }}>
                <h3 className="font-bold mb-3 text-lg flex items-center gap-2" style={{ color: brand.primary }}>
                  <Music size={20} />
                  Emotional Connection
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: brand.textLight }}>
                  <li>• Micro-interactions matching brand personality</li>
                  <li>• Sound effects (optional, brand-aligned)</li>
                  <li>• Motion design reflecting brand values</li>
                  <li>• Branded celebration animations</li>
                  <li>• Authentic brand storytelling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 transition-colors duration-500" 
              style={{ backgroundColor: brand.surface, borderColor: brand.primary + '30' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm" style={{ color: brand.textLight }}>
            HSC JIT v3 Brandable Design System • Switch brands above to see real-time theming
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BrandableDesignSystem;