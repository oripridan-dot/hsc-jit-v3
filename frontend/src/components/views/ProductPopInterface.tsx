import { X } from "lucide-react";
import { useNavigationStore } from "../../store/navigationStore";

export const ProductPopInterface = ({ productId }: { productId: string }) => {
  const { closeProductPop } = useNavigationStore();

  return (
    <div className="w-full max-w-4xl h-[80vh] bg-zinc-900 border border-zinc-700 rounded-xl relative shadow-2xl flex flex-col overflow-hidden">
      {/* Flight Case Header */}
      <div className="h-12 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-2 text-xs font-mono text-zinc-400">
            PRODUCT_ID: {productId}
          </span>
        </div>
        <button
          onClick={closeProductPop}
          className="text-zinc-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Flight Case View
          </h2>
          <p className="text-zinc-400">Details for Product {productId}</p>
          <p className="text-xs text-zinc-600 mt-4">
            (This is a placeholder component)
          </p>
        </div>
      </div>
    </div>
  );
};
