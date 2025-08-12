'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import {
  ArrowUp,
  Settings as SettingsIcon,
  // Plus,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttachedFile } from '@/lib/types';

interface ChatInputProps {
  onSendMessage: (
    message: string,
    attachedFiles?: AttachedFile[]
  ) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onOpenSettings?: () => void;
  onAddIndex?: () => void;
  leftExtras?: React.ReactNode;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Message localGPT...',
  className = '',
  onOpenSettings,
  // onAddIndex: _onAddIndex,
  leftExtras,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!message.trim() && attachedFiles.length === 0) ||
      disabled ||
      isLoading
    )
      return;

    const messageToSend = message.trim();
    const filesToSend = [...attachedFiles];
    setMessage('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      await onSendMessage(messageToSend, filesToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message and files on error
      setMessage(messageToSend);
      setAttachedFiles(filesToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log('🔧 Frontend: File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      if (
        file.type === 'application/pdf' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword' ||
        file.type === 'text/html' ||
        file.type === 'text/markdown' ||
        file.type === 'text/plain' ||
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.docx') ||
        file.name.toLowerCase().endsWith('.doc') ||
        file.name.toLowerCase().endsWith('.html') ||
        file.name.toLowerCase().endsWith('.htm') ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.txt')
      ) {
        newFiles.push({
          id: window.crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
        });
      } else {
        console.log(
          '🔧 Frontend: File rejected - unsupported format:',
          file.type
        );
      }
    }

    setAttachedFiles((prev) => [...prev, ...newFiles]);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`border-t border-white/10 bg-black/60 backdrop-blur-sm p-4 ${className}`}
    >
      <form onSubmit={handleSubmit} className='max-w-4xl mx-auto'>
        {/* Attached Files Display */}
        {attachedFiles.length > 0 && (
          <div className='mb-3 space-y-2'>
            <div className='text-sm font-medium text-gray-400'>
              Attached Files:
            </div>
            <div className='space-y-2'>
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className='flex items-center gap-3 p-3 bg-gray-800 rounded-lg'
                >
                  <FileText className='w-5 h-5 text-red-400' />
                  <div className='flex-1 min-w-0'>
                    <div className='text-sm text-white truncate'>
                      {file.name}
                    </div>
                    <div className='text-xs text-gray-400'>
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => removeFile(file.id)}
                    className='p-1 transition-colors rounded hover:bg-gray-700'
                  >
                    <X className='w-4 h-4 text-gray-400 hover:text-white' />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='px-5 pt-4 pb-3 space-y-2 border bg-white/5 backdrop-blur border-white/10 rounded-2xl'>
          {/* Hidden file input (kept for future use) */}
          <input
            ref={fileInputRef}
            type='file'
            accept='.pdf,.docx,.doc,.html,.htm,.md,.txt'
            multiple
            onChange={handleFileChange}
            className='hidden'
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              attachedFiles.length > 0
                ? 'Ask questions about your attached files...'
                : placeholder
            }
            disabled={disabled || isLoading}
            rows={1}
            className='w-full overflow-y-hidden text-base text-white placeholder-gray-400 bg-transparent border-none resize-none focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed'
            style={{ maxHeight: '120px', minHeight: '44px' }}
          />

          {/* Action row */}
          <div className='flex items-center justify-between mt-1'>
            <div className='flex items-center gap-4'>
              <button
                type='button'
                onClick={() => onOpenSettings && onOpenSettings()}
                disabled={disabled || isLoading}
                className='flex items-center gap-1 p-2 text-gray-400 transition-colors rounded-full hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
                title='Chat settings'
              >
                <SettingsIcon className='w-5 h-5' />
                <span className='hidden text-xs sm:inline'>Settings</span>
              </button>
              {leftExtras}
            </div>
            <Button
              type='submit'
              size='sm'
              disabled={
                (!message.trim() && attachedFiles.length === 0) ||
                disabled ||
                isLoading
              }
              className='w-8 h-8 p-0 text-black bg-white rounded-full hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400'
            >
              {isLoading ? (
                <div className='w-4 h-4 border-2 border-gray-400 rounded-full border-t-transparent animate-spin' />
              ) : (
                <ArrowUp className='w-4 h-4' />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
