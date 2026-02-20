import re
import os

def get_file_content(path):
    if not os.path.exists(path):
        return ""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

html_content = get_file_content(r'd:\etb_trip_schedule\index.html')
js_content = get_file_content(r'd:\etb_trip_schedule\app.js')
css_content = get_file_content(r'd:\etb_trip_schedule\styles.css')

# Extract IDs from HTML
html_ids = re.findall(r'id=["\']([^"\']+)["\']', html_content)
html_ids = set(html_ids)

# Extract Classes from HTML
html_classes = set()
class_matches = re.findall(r'class=["\']([^"\']+)["\']', html_content)
for match in class_matches:
    for cls in match.split():
        html_classes.add(cls)

# Extract Classes from CSS
css_classes = set()
# Simple regex for .classname {
css_matches = re.findall(r'\.([a-zA-Z0-9_-]+)(?::[a-z-]+)?\s*\{', css_content) # This is too simple, misses .foo.bar, .foo .bar
# Better CSS class extractor
# iterate line by line to capture .class
css_tokens = re.findall(r'\.([a-zA-Z0-9_-]+)', css_content)
css_classes = set(css_tokens)

# Analyze HTML IDs
unused_html_ids = []
for i in html_ids:
    # Check if used in JS (simple string search)
    if i not in js_content and i not in css_content:
        unused_html_ids.append(i)

# Analyze CSS Classes
unused_css_classes = []
# Classes can be used in HTML or JS
for c in css_classes:
    if c not in html_classes and c not in js_content:
        # Check if it might be constructed dynamically?
        # Maybe check against "known dynamic patterns" manually later
        unused_css_classes.append(c)

print("--- POTENTIALLY UNUSED HTML IDs ---")
for i in sorted(unused_html_ids):
    print(i)

print("\n--- POTENTIALLY UNUSED CSS CLASSES ---")
for c in sorted(unused_css_classes):
    print(c)

print("\n--- JS ANALYSIS ---")

# Check for specific function definitions that are never called
# Regex for function definition: function foo(
defined_funcs = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', js_content)
unused_funcs = []
for f in defined_funcs:
    # simple check: count occurrences. Definition is 1. Usage > 1?
    # Actually, definition might be 'function foo' (1) and usage 'foo()' (2).
    # But filtering out the definition itself is tricky with just string count.
    # checking for `f` in js_content excluding "function f"
    
    # Remove the definition from content to see if it remains
    content_no_def = js_content.replace(f'function {f}', '')
    if f not in content_no_def and f not in html_content: # e.g. onclick="foo()"
        unused_funcs.append(f)

print("Potentially unused functions:")
for f in sorted(unused_funcs):
    print(f)
