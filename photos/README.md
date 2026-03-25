# Photos folder

Drop your photos here (JPG, PNG, WEBP, etc.)

Then open `index.html` and uncomment/add `<div class="gallery-item">` blocks inside `#gallery-grid`:

```html
<div class="gallery-item">
  <img src="photos/my-photo.jpg" alt="Description" loading="lazy" />
  <span class="caption">My Caption</span>
</div>
```

**Tips:**
- Keep filenames lowercase with no spaces (use hyphens: `trip-2025.jpg`)
- Resize images to max 1200px wide before uploading to save bandwidth
- For best layout, square or landscape aspect ratios work well in the grid
