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
      // Added z-50 and positioning to ensure it appears above the overlay
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[640px] w-[90%] bg-white rounded-lg shadow-2xl overflow-hidden z-50"
    >
      {/* 
         ACCESSIBILITY FIX: 
         This title satisfies the DialogTitle requirement. 
         'sr-only' hides it visually but keeps it for screen readers.
         Do NOT use display:none. 
      */}
      <div className="sr-only">Global Command Menu</div>

      <Command.Input placeholder="Search projects or run commands..." />
      
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        {/* Group 1: Actions */}
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => runCommand(() => router.push('/press/create'))}>
            ✍️ Create New Press Release
          </Command.Item>
          <Command.Item onSelect={() => runCommand(() => {
              // Smooth scroll to the project setup section
              const element = document.getElementById('project-setup');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
          })}>
            ➕ Create New QC Project
          </Command.Item>
        </Command.Group>

        {/* Group 2: Projects */}
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