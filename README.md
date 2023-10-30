# themeworkmakesthedreamwork
A theme for deploying robertwenink.com and robertwenink.xyz, based on the [hugoloveit](https://hugoloveit.com/) theme.

Additionally includes:
- Automatic conversion of images (png, jpeg, jpg, tif, tiff) to webp, with a more functional {{< image >}} shortcode.
- SEO and accessibility improvements
- Citations support through the {{< cite "yourcitation" >}} shortcode, based on [hugo-cite](https://github.com/loup-brun/hugo-cite). 
  Supports textcite through appending the citekey with a '-' like {{< cite "yourcitation-" >}}.
- Proper Katex support, with horizontally scrolling equations for mobile and a makeshift referencing system (not available through built-in Katex) using \cref{..} and \label{..}.
- Corrected lightgallery style
- Posts section layout with filtering options per categorie
- Added possibility to add a posts series (also displayed in the Posts section)
- Many small style and formatting improvements that make more sense to me

## Add the theme
Add the theme to your hugo project using:

```
git submodule add https://github.com/robertwenink/themeworkmakesthedreamwork.git themes/themeworkmakesthedreamwork
```
