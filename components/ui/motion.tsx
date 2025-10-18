"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { cn } from "@/lib/utils";

export const MotionCard: React.FC<React.ComponentProps<typeof Card>> = ({ className, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4 }}
    whileHover={{ y: -4 }}
    className={cn("will-change-transform", className)}
  >
    <Card {...props} />
  </motion.div>
);

export const MotionButton: React.FC<React.ComponentProps<typeof Button>> = ({ className, ...props }) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={cn("inline-flex", className)}>
    <Button {...props} />
  </motion.div>
);




