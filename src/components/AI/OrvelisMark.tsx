import React from 'react';
import { Ionicons } from '@expo/vector-icons';

/** Clean, high-precision Orvelis AI icon */
export function OrvelisMark({ size = 24, color = '#D9E4FF' }: { size?: number; color?: string }) {
  return <Ionicons name="sparkles" size={size} color={color} />;
}
