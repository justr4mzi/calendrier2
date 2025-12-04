# Perfect Circle Game

A modern, interactive web game that challenges players to draw the most perfect circle possible. Built with vanilla HTML, CSS, and JavaScript with advanced circle detection algorithms and beautiful UI.

## Features

- **Advanced Circle Detection**: Sophisticated algorithm that measures circularity, completeness, and smoothness
- **Real-time Scoring**: Instant feedback with percentage-based scoring system
- **Sound Effects**: Dynamic audio feedback based on performance
- **Statistics Tracking**: Persistent stats with best score, attempts, and averages
- **Progressive Web App**: Installable with offline functionality
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Accessibility**: Full keyboard navigation and screen reader support
- **Modern UI**: Beautiful gradient backgrounds, smooth animations, and professional styling

## How to Play

1. Click "Start Drawing" or press the spacebar
2. Click and drag to draw your perfect circle
3. Release to see your perfection score (0-100%)
4. Try to beat your high score!

### Keyboard Shortcuts

- **Space/Enter**: Start game or reset
- **S**: Share your score
- **M**: Toggle sound on/off

## Scoring Algorithm

The game uses a sophisticated multi-factor scoring system:

- **Circularity (50%)**: How close your shape is to a perfect circle
- **Completeness (30%)**: How close the start and end points are
- **Smoothness (20%)**: How smooth and consistent your drawing is

## Installation

### Local Development

1. Clone or download the project files
2. Open `index.html` in a modern web browser
3. Start playing!

### Web Deployment

1. Upload all files to your web server
2. Ensure all files are in the root directory
3. Access via your domain (e.g., perfectcirclegame.com)

### PWA Installation

Users can install the game as a Progressive Web App:
- On desktop: Click the install button in the address bar
- On mobile: Use "Add to Home Screen" option

## Technical Details

- **No Dependencies**: Pure vanilla JavaScript, HTML, and CSS
- **Offline Support**: Service worker enables offline gameplay
- **Performance Optimized**: Efficient canvas rendering and calculations
- **Cross-Browser Compatible**: Works on all modern browsers
- **Mobile Optimized**: Touch-friendly interface with proper event handling

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Files Structure

```
perfect-circle-game/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── script.js           # Game logic and algorithms
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline support
└── README.md          # This file
```

## Customization

The game is easily customizable:

- **Colors**: Modify CSS custom properties in `:root`
- **Scoring**: Adjust weights in the `calculateScore()` method
- **Sounds**: Modify frequency and duration in sound methods
- **Canvas Size**: Change canvas dimensions in HTML and CSS

## Performance Features

- **Efficient Drawing**: Optimized canvas rendering
- **Smart Caching**: Service worker caches resources
- **Responsive**: Adapts to different screen sizes
- **Smooth Animations**: CSS transitions and keyframe animations
- **Memory Efficient**: Proper cleanup and garbage collection

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.

---

Built with ❤️ for perfectcirclegame.com
