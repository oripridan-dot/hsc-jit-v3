import React from 'react';
import { motion, useMotionValue, useTransform, useSpring, MotionValue } from 'framer-motion';

interface DockItemProps {
  mouseX: MotionValue;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}

const DockItem = ({ mouseX, icon, label, onClick, href }: DockItemProps) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      className="aspect-square rounded-2xl bg-bg-surface/50 border border-border-base backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer hover:bg-bg-surface relative group"
      onClick={onClick}
      whileHover={{ y: -10 }}
    >
      <div className="w-6 h-6 text-text-primary group-hover:scale-125 transition-transform duration-200">
        {icon}
      </div>
      
      {/* Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-bg-base text-text-primary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-border-base">
        {label}
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
};

interface DockProps {
  items: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    href?: string;
  }[];
}

export const Dock: React.FC<DockProps> = ({ items }) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <div 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 pb-3"
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
    >
      <div className="flex items-end gap-2 p-3 bg-bg-base/40 backdrop-blur-xl border border-border-subtle rounded-3xl shadow-2xl">
        {items.map((item, idx) => (
          <DockItem key={idx} mouseX={mouseX} {...item} />
        ))}
      </div>
    </div>
  );
};
