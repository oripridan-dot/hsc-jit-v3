/**
 * SubjectiveFieldsPanel - Display and edit unified catalog subjective fields
 *
 * ✅ Displays:
 * - User ratings (stars)
 * - User tags
 * - Internal notes
 * - Custom fields
 *
 * Allows editing and persisting custom fields per-product
 */

import { Star, Tag, X } from "lucide-react";
import React, { useState } from "react";
import type { SubjectiveFields } from "../../hooks/useUnifiedCatalog";

interface SubjectiveFieldsPanelProps {
  productId: string;
  productName: string;
  fields: SubjectiveFields | null;
  onUpdateField: (
    productId: string,
    fieldName: string,
    value: unknown,
  ) => Promise<void>;
  onClose?: () => void;
  isEditable?: boolean;
}

export const SubjectiveFieldsPanel: React.FC<SubjectiveFieldsPanelProps> = ({
  productId,
  productName,
  fields,
  onUpdateField,
  onClose,
  isEditable = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState<number>(
    (fields?.user_rating?.value as number) || 0,
  );
  const [tags, setTags] = useState<string[]>(
    (Array.isArray(fields?.user_tags?.value)
      ? (fields.user_tags.value as string[])
      : []) || [],
  );
  const [newTag, setNewTag] = useState("");
  const [notes, setNotes] = useState<string>(
    (fields?.internal_notes?.value as string) || "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (rating > 0) {
        await onUpdateField(productId, "user_rating", rating);
      }
      if (tags.length > 0) {
        await onUpdateField(productId, "user_tags", tags);
      }
      if (notes.trim()) {
        await onUpdateField(productId, "internal_notes", notes);
      }
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!fields) {
    return (
      <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-zinc-400">
        No custom fields yet
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-lg">{productName}</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Custom fields & user feedback
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X size={16} className="text-zinc-400" />
          </button>
        )}
      </div>

      {!isEditing ? (
        // VIEW MODE
        <div className="space-y-3">
          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-600"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-zinc-300">{rating.toFixed(1)}</span>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full flex items-center gap-1"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="p-2 bg-white/5 rounded text-sm text-zinc-300 border-l-2 border-zinc-600">
              {notes}
            </div>
          )}

          {/* Edit Button */}
          {isEditable && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full mt-3 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Edit Fields
            </button>
          )}
        </div>
      ) : (
        // EDIT MODE
        <div className="space-y-3">
          {/* Rating Picker */}
          <div>
            <label className="block text-sm text-zinc-300 mb-2">
              Rating ({rating}/5)
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => setRating(rating === i ? 0 : i)}
                  className="p-1 transition-colors"
                >
                  <Star
                    size={20}
                    className={
                      i <= rating
                        ? "fill-amber-400 text-amber-400 cursor-pointer"
                        : "text-zinc-600 cursor-pointer hover:text-zinc-400"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-300"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-zinc-300 mb-2">
              Internal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes..."
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded transition-colors font-medium"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
