/**
 * ThemePicker — Color picker with preset swatches and custom hex input
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';

const PRESET_COLORS = [
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Cyan', hex: '#0891b2' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Fuchsia', hex: '#c026d3' },
  { name: 'Slate', hex: '#475569' },
  { name: 'Orange', hex: '#ea580c' },
];

const ThemePicker = ({ value, onChange }) => {
  const [customHex, setCustomHex] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomChange = (e) => {
    let val = e.target.value;
    // Auto-add # if missing
    if (val && !val.startsWith('#')) val = '#' + val;
    setCustomHex(val);

    // Validate hex
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Theme Color
      </label>

      {/* Preset swatches */}
      <div className="flex flex-wrap gap-2.5">
        {PRESET_COLORS.map((color) => (
          <motion.button
            key={color.hex}
            type="button"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onChange(color.hex);
              setCustomHex('');
              setShowCustom(false);
            }}
            className="relative w-9 h-9 rounded-xl shadow-md transition-all duration-200 group"
            style={{
              backgroundColor: color.hex,
              boxShadow: value === color.hex
                ? `0 0 0 2.5px #0f172a, 0 0 0 4.5px ${color.hex}`
                : `0 2px 8px ${color.hex}40`
            }}
            title={color.name}
          >
            {value === color.hex && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <FaCheck className="text-white text-xs drop-shadow-md" />
              </motion.div>
            )}
          </motion.button>
        ))}

        {/* Custom color trigger */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCustom(!showCustom)}
          className="w-9 h-9 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-300 transition-colors"
          title="Custom color"
        >
          <span className="text-lg font-light">+</span>
        </motion.button>
      </div>

      {/* Custom hex input */}
      {showCustom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-9 h-9 rounded-xl shadow-inner border border-gray-700 flex-shrink-0"
            style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : value }}
          />
          <input
            type="text"
            value={customHex}
            onChange={handleCustomChange}
            placeholder="#7c3aed"
            maxLength={7}
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono"
          />
        </motion.div>
      )}

      {/* Current color display */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div
          className="w-3.5 h-3.5 rounded-full border border-gray-700"
          style={{ backgroundColor: value }}
        />
        <span className="font-mono">{value}</span>
      </div>
    </div>
  );
};

export default ThemePicker;
