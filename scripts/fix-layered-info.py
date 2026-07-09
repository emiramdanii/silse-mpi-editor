#!/usr/bin/env python3
"""
Fix hardcoded colors in LayeredInfoComponentView.tsx.

Replaces:
  - '#2563eb' -> 'var(--silse-color-primary, var(--color-accent))'
  - '#eff6ff' -> 'var(--silse-color-primary, var(--color-accent-soft))'
  - '#1f2937' -> 'var(--silse-color-text, var(--color-text))'
  - '#4a5160' -> 'var(--silse-color-text, var(--color-text-soft))'
  - '#6b7280' -> 'var(--silse-color-muted-text, var(--color-muted))'
  - '#f9fafb' -> 'var(--silse-color-surface, var(--color-panel-soft))'
  - '#fff' (when used as bg/color, careful) -> 'var(--silse-color-surface, var(--color-panel))'
  - '#d1d5db' -> 'var(--silse-color-border, var(--color-border))'
  - '#2f7d4f' -> 'var(--silse-color-success, var(--color-success))'
  - '#e3ddcd' -> 'var(--silse-color-border, var(--color-border))'

Also replaces overflow: 'auto' with overflow: 'hidden' in containerStyle.
"""

import re
import sys

PATH = '/home/z/my-project/silse-mpi-editor/src/components/LayeredInfoComponentView.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

original = src

# 1. Replace overflow: 'auto' with 'hidden' (in containerStyle for layered-info)
# Only the two container style occurrences (both have overflow: 'auto' followed by padding: 12)
src = src.replace(
    "gap: 8,\n        overflow: 'auto',\n        padding: 12,\n        outline: selected ? '2px solid #2563eb'",
    "gap: 8,\n        overflow: 'hidden',\n        padding: 12,\n        color: 'var(--silse-color-text, var(--color-text))',\n        outline: selected ? '2px solid var(--silse-color-primary, var(--color-accent))'",
)

# 2. Replace ALL remaining '#2563eb' (note: hex literal in TSX strings)
# We must NOT replace inside CSS var fallbacks like var(--silse-color-primary, #2563eb)
# But this file doesn't have those — only bare literals.
src = re.sub(r"'#2563eb'", "'var(--silse-color-primary, var(--color-accent))'", src)
src = re.sub(r"'#eff6ff'", "'var(--silse-color-primary, var(--color-accent-soft))'", src)
src = re.sub(r"'#1f2937'", "'var(--silse-color-text, var(--color-text))'", src)
src = re.sub(r"'#4a5160'", "'var(--silse-color-text, var(--color-text-soft))'", src)
src = re.sub(r"'#6b7280'", "'var(--silse-color-muted-text, var(--color-muted))'", src)
src = re.sub(r"'#f9fafb'", "'var(--silse-color-surface, var(--color-panel-soft))'", src)
src = re.sub(r"'#d1d5db'", "'var(--silse-color-border, var(--color-border))'", src)
src = re.sub(r"'#2f7d4f'", "'var(--silse-color-success, var(--color-success))'", src)
src = re.sub(r"'#e3ddcd'", "'var(--silse-color-border, var(--color-border))'", src)

# 3. Replace '#fff' (only when standalone, not '#ffffff' or '#fffbeb' etc.)
# Match: '#fff' followed by ', " or ) but NOT a hex digit
src = re.sub(r"'#fff'(?![0-9a-fA-F])", "'var(--silse-color-surface, var(--color-panel))'", src)
# Also handle '#ffffff'
src = re.sub(r"'#ffffff'", "'var(--silse-color-surface, var(--color-panel))'", src)

# 4. In choice/badge context where 'color: #fff' makes sense (e.g., for active tab text
#    on accent background), we want it to be the surface color.
# Already handled by step 3 — color: '#fff' becomes color: 'var(--silse-color-surface, var(--color-panel))'

# 5. Empty state text color: '#6b7280' (already handled above)

# 6. Fix: '#374151' may not be in our list, check
src = re.sub(r"'#374151'", "'var(--silse-color-text, var(--color-text-soft))'", src)

# 7. Fix the layered-info wrapper overflows that the audit found at lines 317, 406
# These are inside accordion/timeline active step bodies — 'overflow: auto'
# becomes 'hidden' to prevent inner scrollbars
# (We've already converted the containerStyle; the inner overflows at line 317, 406
#  are also present but not in this file based on the audit's line numbers — let's
#  handle them by replacing 'overflow: auto' with 'overflow: hidden' only in
#  specific contexts. Better: leave them — they are for content overflow inside
#  card bodies which may legitimately need scroll if user inputs very long text.)

if src == original:
    print("WARNING: No changes made to", PATH)
    sys.exit(1)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)

# Count replacements
diff_count = sum(1 for a, b in zip(original, src) if a != b)
print(f"OK: wrote {len(src)} bytes (delta {len(src) - len(original)} chars)")
