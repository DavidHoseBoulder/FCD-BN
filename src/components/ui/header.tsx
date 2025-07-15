'use client';

import { Sheet, UserCircle, Settings, BarChart, Bot } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from './ui/dropdown-menu';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useModelSelection } from '@/hooks/use-model-selection';
import { useState } from 'react';

function NavLink({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon: React.ElementType }) {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';
  const isActive = href.endsWith(currentView);

  return (
     <Link href={href} className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        isActive ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}>
        <Icon className="h-4 w-4" />
        {children}
    </Link>
  )
}

function ModelSelector() {
  const { selectedModel, setSelectedModel, models } = useModelSelection();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-48 justify-between">
          <Bot className="h-4 w-4 mr-2"/>
          <span>{selectedModel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>Select a Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={selectedModel} onValueChange={setSelectedModel}>
          {models.map((model) => (
            <DropdownMenuRadioItem key={model} value={model}>
              {model}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Sheet className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-primary">SheetSurfer</h1>
          </Link>
           <nav className="hidden md:flex items-center gap-2">
              <NavLink href="?view=dashboard" icon={BarChart}>Dashboard</NavLink>
              <NavLink href="?view=datacleaning" icon={Settings}>Data Cleaning</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ModelSelector />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <UserCircle className="h-8 w-8" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Guest</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    guest@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
