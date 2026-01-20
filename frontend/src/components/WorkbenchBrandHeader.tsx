/**
 * WorkbenchBrandHeader - Brand-specific header for the Workbench
 * Displays brand logo, name, and themed background when product is selected
 */
import React from 'react';
import { useBrandData } from '../hooks/useBrandData';
import { X } from 'lucide-react';

interface WorkbenchBrandHeaderProps {
  brandName?: string;
  productName?: string;
  onClose?: () => void;
}

export const WorkbenchBrandHeader: React.FC<WorkbenchBrandHeaderProps> = ({
  brandName,
  productName,
  onClose
}) => {
  const brandData = useBrandData(brandName);

  if (!brandData) {
    return null;
  }

  return (
    <div
      className="h-20 border-b flex items-center justify-between px-6 flex-shrink-0 transition-all duration-300 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${brandData.brandColor}, ${brandData.secondaryColor})`,
        borderColor: brandData.brandColor,
      }}
    >
      {/* Brand Info Section */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Brand Logo */}
        {brandData.logoUrl && (
          <img
            src={brandData.logoUrl}
            alt={brandData.name}
            className="h-12 object-contain flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* Text Info */}
        <div className="min-w-0">
          <h2
            className="text-sm font-bold tracking-wide truncate"
            style={{ color: brandData.textColor }}
          >
            {brandData.name.toUpperCase()}
          </h2>
          {productName && (
            <p
              className="text-xs truncate opacity-80"
              style={{ color: brandData.textColor }}
            >
              {productName}
            </p>
          )}
        </div>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto flex-shrink-0 p-2 hover:opacity-80 transition-opacity"
          style={{ color: brandData.textColor }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
