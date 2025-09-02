'use client';

import { useState, useEffect, useRef } from 'react';
import { ToastContainer, useToast } from '@/components/Toast';

export default function Home() {
  const [content, setContent] = useState('');
  const contentRef = useRef('');
  const [contentSource, setContentSource] = useState<'server' | 'user_input'>('server');
  const [clipboardId, setClipboardId] = useState('default');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastServerTimestamp, setLastServerTimestamp] = useState(0);
  const lastServerTimestampRef = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const { toasts, addToast, removeToast } = useToast();

  // Load content on mount and when ID changes
  useEffect(() => {
    loadContent();
    
    // Start polling for changes from other devices
    const startPolling = () => {
      pollIntervalRef.current = setInterval(async () => {
        // Only poll when window is not focused to avoid race conditions
        if (document.hasFocus()) return;
        
        try {
          const response = await fetch(`/api/clipboard?id=${clipboardId}`);
          const data = await response.json();
          const serverContent = data.content ?? '';
          const serverTimestamp = data.timestamp || 0;
          
          console.log('Polling check:', new Date().toISOString(), {
            serverContent,
            serverTimestamp,
            lastServerTimestamp: lastServerTimestampRef.current,
            currentContent: contentRef.current,
            contentSource,
            focused: document.hasFocus(),
            timestampNewer: serverTimestamp > lastServerTimestampRef.current,
            contentDifferent: serverContent !== contentRef.current,
            willUpdate: serverTimestamp > lastServerTimestampRef.current && serverContent !== contentRef.current
          });
          
          // Only update if server has newer timestamp and content is different
          if (serverTimestamp > lastServerTimestampRef.current && serverContent !== contentRef.current) {
            console.log('Updating content from server:', serverContent);
            setContent(serverContent);
            contentRef.current = serverContent;
            setContentSource('server');
            setLastServerTimestamp(serverTimestamp);
            lastServerTimestampRef.current = serverTimestamp;
            addToast('Content updated from another device', 'info', 2000);
          }
        } catch (error) {
          // Silently handle polling errors
        }
      }, 2000); // Poll every 2 seconds when unfocused
    };
    
    startPolling();
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [clipboardId]);

  // Auto-save content when it changes (only for user input)
  useEffect(() => {
    console.log('Auto-save check:', { content, contentSource, willAutoSave: contentSource === 'user_input' });
    
    // Only auto-save if content came from user input
    if (contentSource !== 'user_input') {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (debounced)
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Auto-saving content:', content);
      saveContent(content);
    }, 500); // Save after 500ms of no typing
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, contentSource, clipboardId]);

  const loadContent = async () => {
    console.log('Loading content for clipboardId:', clipboardId);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clipboard?id=${clipboardId}`);
      const data = await response.json();
      const newContent = data.content ?? '';
      const timestamp = data.timestamp || 0;
      console.log('Loaded content:', { content: newContent, timestamp });
      setContent(newContent);
      contentRef.current = newContent;
      setContentSource('server');
      setLastServerTimestamp(timestamp);
      lastServerTimestampRef.current = timestamp;
      addToast('Content loaded', 'success', 1500);
    } catch (error) {
      addToast('Failed to load content', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const saveContent = async (contentToSave: string) => {
    console.log('Saving content:', contentToSave);
    setIsSaving(true);
    try {
      const response = await fetch('/api/clipboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: contentToSave, id: clipboardId }),
      });
      
      if (response.ok) {
        // Update our timestamp to reflect the save
        const newTimestamp = Date.now();
        setLastServerTimestamp(newTimestamp);
        lastServerTimestampRef.current = newTimestamp;
        console.log('Save successful, timestamp:', newTimestamp);
        addToast('Auto-saved', 'success', 1500);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      addToast('Failed to auto-save', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      addToast('Copied to clipboard!', 'success', 2000);
    } catch (error) {
      addToast('Failed to copy', 'error', 2000);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
      contentRef.current = text;
      setContentSource('user_input');
      addToast('Pasted from clipboard!', 'success', 2000);
    } catch (error) {
      addToast('Failed to paste - please paste manually', 'error', 3000);
    }
  };

  // Debug: Log current state
  console.log('Render state:', { content, contentSource, lastServerTimestamp });

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Online Clipboard</h1>
          
          <div className="mb-4">
            <label htmlFor="clipboardId" className="block text-sm font-medium text-gray-300 mb-2">
              Clipboard ID (use the same ID to access from another device)
            </label>
            <input
              type="text"
              id="clipboardId"
              value={clipboardId}
              onChange={(e) => setClipboardId(e.target.value || 'default')}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a unique ID or leave as 'default'"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => {
                console.log('Textarea onChange:', e.target.value);
                setContent(e.target.value);
                contentRef.current = e.target.value;
                setContentSource('user_input');
              }}
              className="w-full h-64 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              placeholder="Paste or type your content here..."
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div></div>
            {isSaving && (
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Syncing...</span>
              </div>
            )}
          </div>


          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-2">How to use:</h2>
            <ol className="list-decimal list-inside text-gray-300 space-y-1 text-sm">
              <li>Enter a unique ID (or use 'default') to create your personal clipboard</li>
              <li>Paste or type content in the text area - it will auto-save</li>
              <li>Access from another device using the same ID</li>
              <li>Content syncs automatically between devices</li>
            </ol>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </main>
  );
}