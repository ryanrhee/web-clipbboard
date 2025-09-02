'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ToastContainer, useToast } from '@/components/Toast';

interface ClipboardState {
  content: string;
  contentSource: 'server' | 'user_input';
  lastServerTimestamp: number;
}

export default function Home() {
  const [clipboardState, setClipboardState] = useState<ClipboardState>({
    content: '',
    contentSource: 'server',
    lastServerTimestamp: 0,
  });
  const [clipboardId, setClipboardId] = useState('default');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const loadContent = useCallback(async () => {
    console.log('🔥 Loading content for clipboardId:', clipboardId, 'call #', Date.now());
    
    
    try {
      const response = await fetch(`/api/clipboard?id=${clipboardId}`);
      const data = await response.json();
      const newContent = data.content ?? '';
      const timestamp = data.timestamp || 0;
      console.log('🔥 Loaded content from server:', { content: newContent, timestamp });
      
      // Don't overwrite user input - check if user has started typing
      setClipboardState(prevState => {
        if (prevState.contentSource === 'user_input') {
          console.log('🔥 Skipping server content update - user is typing');
          return prevState;
        }
        
        console.log('🔥 Setting content to:', newContent);
        return {
          content: newContent,
          contentSource: 'server',
          lastServerTimestamp: timestamp,
        };
      });
      // Don't show toast on content load - it's unnecessary
    } catch (error) {
      console.error('Failed to load content:', error);
      addToast('Failed to load content', 'error', 3000);
    }
  }, [clipboardId, addToast]);

  const saveContent = useCallback(async (contentToSave: string) => {
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
        setClipboardState(prevState => ({
          ...prevState,
          lastServerTimestamp: newTimestamp,
        }));
        console.log('Save successful, timestamp:', newTimestamp);
        addToast('Auto-saved', 'success', 1500);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to auto-save:', error);
      addToast('Failed to auto-save', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  }, [clipboardId, addToast]);

  // Auto-save content when it changes (only for user input)
  const autoSave = useCallback((newContent: string) => {
    console.log('Auto-save triggered for user input:', newContent);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (debounced)
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Auto-saving content:', newContent);
      saveContent(newContent);
    }, 500); // Save after 500ms of no typing
  }, [saveContent]);

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
          
          setClipboardState(prevState => {
            console.log('Polling check:', new Date().toISOString(), {
              serverContent,
              serverTimestamp,
              lastServerTimestamp: prevState.lastServerTimestamp,
              currentContent: prevState.content,
              contentSource: prevState.contentSource,
              focused: document.hasFocus(),
              timestampNewer: serverTimestamp > prevState.lastServerTimestamp,
              contentDifferent: serverContent !== prevState.content,
              willUpdate: serverTimestamp > prevState.lastServerTimestamp && serverContent !== prevState.content
            });
            
            // Only update if server has newer timestamp and content is different
            if (serverTimestamp > prevState.lastServerTimestamp && serverContent !== prevState.content) {
              console.log('Updating content from server:', serverContent);
              addToast('Content updated from another device', 'info', 2000);
              return {
                content: serverContent,
                contentSource: 'server',
                lastServerTimestamp: serverTimestamp,
              };
            }
            
            return prevState;
          });
        } catch {
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
  }, [clipboardId, loadContent, addToast]);



  // Debug: Log current state
  console.log('Render state:', clipboardState);

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
              value={clipboardState.content}
              onChange={(e) => {
                console.log('Textarea onChange:', e.target.value);
                setClipboardState(prevState => ({
                  ...prevState,
                  content: e.target.value,
                  contentSource: 'user_input',
                }));
                autoSave(e.target.value);
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
              <li>Enter a unique ID (or use &lsquo;default&rsquo;) to create your personal clipboard</li>
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