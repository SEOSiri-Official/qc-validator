'use client';

import { useState, useEffect } from 'react';
import { Command } from 'cmdk';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  savedChecklists: any[]; // Pass your checklists data here
  router: any; // Pass Next.js router
}

export default function CommandPalette({ open, setOpen, savedChecklists, router }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label="Global Command Menu"
      shouldFilter={false} // Prevents stuck filtering
      // --- UPDATE: Inline Styles to FORCE correct display ---
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '640px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxHeight: '80vh'
      }}
    >
      <div className="sr-only">Global Command Menu</div>

      <Command.Input 
        placeholder="Search projects or run commands..." 
        // --- UPDATE: Inline Styles for Input ---
        style={{
            width: '100%',
            fontSize: '18px',
            padding: '20px',
            border: 'none',
            borderBottom: '1px solid #eee',
            outline: 'none'
        }}
      />
      
      {/* --- UPDATE: Inline Styles for List --- */}
      <Command.List style={{ overflowY: 'auto', maxHeight: '400px', padding: '8px' }}>
        <Command.Empty style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No results found.
        </Command.Empty>

        {/* Group 1: Actions */}
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => runCommand(() => router.push('/press/create'))}>
            ✍️ Create New Press Release
          </Command.Item>
          <Command.Item onSelect={() => runCommand(() => {
              const element = document.getElementById('project-setup');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
          })}>
            ➕ Create New QC Project
          </Command.Item>
        </Command.Group>

        {/* Group 2: Projects */}
        {savedChecklists && savedChecklists.length > 0 && (
            <Command.Group heading="Compliance Reports">
            {savedChecklists.map((list) => (
                <Command.Item 
                key={list.id} 
                value={`${list.title} ${list.standard} ${list.industry}`}
                onSelect={() => runCommand(() => router.push(`/report/${list.id}`))}
                >
                <div className="flex justify-between w-full items-center">
                    <span>{list.title}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{list.standard}</span>
                </div>
                </Command.Item>
            ))}
            </Command.Group>
        )}
        
        {/* Group 3: Navigation */}
        <Command.Group heading="Navigation">
            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard'))}>🏠 Dashboard</Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/press'))}>📰 QC Press</Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/marketplace'))}>🏛️ QC Val Town Hall</Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/standards'))}>🌍 Standards Hub</Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/faq'))}>❓ Help & FAQ</Command.Item>
        </Command.Group>

      </Command.List>
    </Command.Dialog>
  );
}