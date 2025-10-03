#!/usr/bin/env python3
import re
import sys
from pathlib import Path

def add_dark_mode_classes(content):
    """Add dark mode classes to common patterns"""
    
    # Title/heading text colors
    content = re.sub(r'text-gray-900(?![\w-])', r'text-gray-900 dark:text-white', content)
    
    # Body text colors
    content = re.sub(r'text-gray-600(?![\w-])', r'text-gray-600 dark:text-gray-300', content)
    content = re.sub(r'text-gray-700(?![\w-])', r'text-gray-700 dark:text-gray-300', content)
    content = re.sub(r'text-gray-800(?![\w-])', r'text-gray-800 dark:text-gray-200', content)
    
    # Background colors
    content = re.sub(r'bg-white(?![\w-])', r'bg-white dark:bg-gray-800', content)
    content = re.sub(r'bg-gray-50(?![\w-])', r'bg-gray-50 dark:bg-gray-900', content)
    content = re.sub(r'bg-gray-100(?![\w-])', r'bg-gray-100 dark:bg-gray-700', content)
    
    # Border colors
    content = re.sub(r'border-gray-200(?![\w-])', r'border-gray-200 dark:border-gray-700', content)
    content = re.sub(r'border-gray-300(?![\w-])', r'border-gray-300 dark:border-gray-600', content)
    
    return content

def main():
    files_to_fix = [
        'src/pages/CreateEvent.jsx',
        'src/pages/EventAnalytics.jsx',
        'src/pages/Events.jsx',
        'src/pages/Dashboard.jsx',
        'src/pages/EditEvent.jsx',
    ]
    
    for file_path in files_to_fix:
        path = Path(file_path)
        if not path.exists():
            print(f"Skipping {file_path} - not found")
            continue
            
        print(f"Processing {file_path}...")
        content = path.read_text()
        
        # Skip if already has many dark: classes
        dark_count = content.count('dark:')
        if dark_count > 20:
            print(f"  Skipping - already has {dark_count} dark mode classes")
            continue
        
        new_content = add_dark_mode_classes(content)
        
        if new_content != content:
            path.write_text(new_content)
            print(f"  ✓ Updated with dark mode classes")
        else:
            print(f"  No changes needed")

if __name__ == '__main__':
    main()
