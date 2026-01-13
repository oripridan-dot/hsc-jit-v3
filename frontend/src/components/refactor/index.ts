/**
 * Refactored Components Index
 * Central export point for all new UI components
 */

// Core Components
export { ProductCard } from './ProductCard';
export { ProductGrid } from './ProductGrid';
export { ProductDetail } from './ProductDetail';
export { ImageCarousel } from './ImageCarousel';
export { AIChat } from './AIChat';
export { SpecificationsPanel } from './SpecificationsPanel';
export { EmptyState } from './EmptyState';

// UI Components
export { Button, IconButton, ButtonGroup } from './Button';
export { Input, Textarea, Checkbox, Radio, Select } from './Input';
export { SearchBar } from './SearchBar';

// Typography
export {
  Heading,
  Text,
  Badge,
  CodeBlock,
  HelperText,
  TruncatedText,
  LineClampedText,
} from './Typography';

// Loading & Error States
export {
  SkeletonCard,
  SkeletonGrid,
  SkeletonDetail,
  Spinner,
  LoadingOverlay,
  Pulse,
  DotsLoader,
  ProgressBar,
} from './LoadingStates';

export { ErrorBoundary, ErrorAlert } from './ErrorBoundary';

// Grid Variants
export { VirtualProductGrid, SimpleVirtualGrid } from './VirtualGrid';
