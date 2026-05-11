/**
 * LogoUpload — Drag & drop logo uploader with preview
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCloudUploadAlt, FaTrash, FaImage } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];

const LogoUpload = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only PNG, JPG, and JPEG files are allowed');
      return false;
    }
    if (file.size > MAX_SIZE) {
      toast.error('File size must be under 2MB');
      return false;
    }
    return true;
  };

  const uploadFile = async (file) => {
    if (!validateFile(file)) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const { data } = await axios.post('/api/tenant/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onChange(data.url);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const logoUrl = value
    ? (value.startsWith('http') ? value : `http://localhost:5000${value}`)
    : '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Logo
      </label>

      <AnimatePresence mode="wait">
        {value ? (
          /* ─── Preview Mode ─────────────────────────────────────────── */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative group"
          >
            <div className="w-full h-32 rounded-xl border border-gray-700 bg-gray-800/50 overflow-hidden flex items-center justify-center">
              <img
                src={logoUrl}
                alt="Logo preview"
                className="max-h-28 max-w-full object-contain"
              />
            </div>

            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-white/20 rounded-lg text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                title="Change logo"
              >
                <FaImage className="text-sm" />
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRemove}
                className="p-2.5 bg-red-500/30 rounded-lg text-red-300 backdrop-blur-sm hover:bg-red-500/50 transition-colors"
                title="Remove logo"
              >
                <FaTrash className="text-sm" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* ─── Upload Zone ──────────────────────────────────────────── */
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              w-full h-32 rounded-xl border-2 border-dashed cursor-pointer
              flex flex-col items-center justify-center gap-2
              transition-all duration-200
              ${isDragging
                ? 'border-violet-400 bg-violet-500/10'
                : 'border-gray-700 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
              }
              ${uploading ? 'opacity-60 pointer-events-none' : ''}
            `}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Uploading...</p>
              </div>
            ) : (
              <>
                <FaCloudUploadAlt className={`text-2xl ${isDragging ? 'text-violet-400' : 'text-gray-500'}`} />
                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    <span className="text-violet-400 font-medium">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">PNG, JPG up to 2MB</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default LogoUpload;
