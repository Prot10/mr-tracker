"use client";
import { Eye, EyeOff } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(
  ({ className, type, showPasswordToggle, ...props }, ref) => {
    const radius = 100;
    const [visible, setVisible] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
      let { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
      radial-gradient(
        ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
        #3b82f6,
        transparent 80%
      )
    `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300 relative"
      >
        <input
          type={showPasswordToggle && showPassword ? "text" : type}
          className={cn(
            `shadow-input dark:placeholder-text-neutral-600 flex h-10 w-full rounded-md border-none bg-gray-50 px-3 py-2 text-sm text-black transition duration-400 group-hover/input:shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:ring-[2px] focus-visible:ring-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:shadow-[0px_0px_1px_1px_#404040] dark:focus-visible:ring-neutral-600`,
            className
          )}
          ref={ref}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-3 flex items-center text-gray-400"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </motion.div>
    );
  }
);

Input.displayName = "Input";

export { Input };
