# Audio Speed Scheduler

A powerful audio playlist management tool that supports setting different playback speeds for each audio file with multiple playback modes.

**English** | [简体中文](./README.zh-CN.md)

## Features

### 🎵 Audio File Management
- **Multi-file Upload**: Support uploading multiple audio files simultaneously
- **Drag & Drop Upload**: Support file drag and drop operations
- **Format Support**: Support mainstream audio formats like MP3, WAV, AAC, OGG
- **File Preview**: Preview audio file information and independent playback after upload
- **Independent Preview**: File preview playback is completely independent from playlist playback

### 💾 Smart Caching System
- **Audio File Caching**: Use IndexedDB to store audio files, support large files and offline access
- **Playlist Persistence**: Use localStorage to save playlist, playback state, play mode, and playback time
- **Auto-sync**: Automatically monitor data changes and update cache
- **Smart Recovery**: Automatically restore cached data on page load with data validation
- **Selective Clear**: Support clearing specific types of cache or all cache data

### 📋 Playlist Management
- **Add Items**: Add audio files to the playlist
- **Speed Control**: Set individual playback speed for each playlist item (0.5x - 3.0x)
- **Item Sorting**: Support moving playlist items up and down to adjust playback order
- **Item Deletion**: Support removing specific items from playlist
- **Batch Operations**: Support clearing playlist and random shuffle

### 🎮 Playback Control
- **Play/Pause**: Basic playback control functionality
- **Previous/Next**: Support manual switching between playlist items
- **Progress Control**: Drag progress bar to quickly seek to any position
- **Multiple Playback Modes**:
  - **Single Play**: Stop after playing current audio
  - **Sequential Play**: Play all audio in order then stop
  - **List Loop**: Loop through the entire playlist
  - **Random Play**: Play audio randomly from the playlist
- **Progress Display**: Real-time display of playback progress and time information
- **Speed Application**: Automatically apply set playback speed during playback

### 🎨 User Interface
- **Responsive Design**: Adapt to different screen sizes
- **Dark Mode**: Support dark/light theme switching
- **Intuitive Operation**: Clean and clear user interface design
- **Real-time Feedback**: Real-time status display during operations

### 🌐 Internationalization Support
- **Multi-language**: Support Simplified Chinese and English interfaces
- **Language Switcher**: Language switcher provided at page bottom
- **Dynamic Switching**: Real-time interface language switching without page refresh

## Tech Stack

- **Framework**: Nuxt 3 + Vue 3 (Composition API)
- **UI Components**: Nuxt UI
- **Styling**: UnoCSS + Tailwind CSS
- **Icons**: Lucide Icons
- **Internationalization**: @nuxtjs/i18n
- **Type Checking**: TypeScript
- **Package Manager**: PNPM
- **Storage**: unstorage (IndexedDB + localStorage)

## Project Structure

```
app/
├── components/              # Functional components
│   ├── AudioFileManager.vue    # Audio file management component
│   ├── AudioProgressBar.vue    # Reusable progress bar component
│   ├── PlaylistManager.vue     # Playlist management component
│   ├── PlaybackControls.vue    # Playback control component
│   ├── PlayModeDescription.vue # Play mode description component
│   └── LanguageSwitcher.vue    # Language switcher component
├── composables/             # Composable functions
│   ├── usePlaylistCache.ts     # Playlist caching system
│   └── usePlayModes.ts         # Play mode related logic
├── utils/                   # Utility functions and types
│   └── audio.ts                # Audio related types, enums and utilities
├── pages/
│   └── index.vue               # Main page
└── app.vue                     # Application root component

i18n/
└── locales/                 # Internationalization language files
    ├── zh.json                 # Simplified Chinese translations
    └── en.json                 # English translations
```

## Usage

### 1. Select Language
- Language switcher provided at page bottom
- Support Simplified Chinese and English interfaces
- Real-time switching after selection, settings are saved

### 2. Upload Audio Files
- Click upload area or directly drag audio files to upload area
- Support selecting multiple audio files simultaneously
- Files will be displayed in file list after successful upload

### 3. Preview Audio Files
- Click play button in file list to preview audio
- Preview playback is completely independent from playlist playback
- Support pause, reset, and progress dragging

### 4. Create Playlist
- Click "Add to Playlist" button in uploaded audio files
- Files will be added to the playlist on the right side
- Each playlist item has default playback speed of 1.0x

### 5. Adjust Playback Speed
- Use +/- buttons in playlist to fine-tune speed
- Directly input precise speed value in input box
- Support speed range from 0.5x to 3.0x

### 6. Select Playback Mode
- Select appropriate playback mode in playlist title bar
- **Single Play**: Suitable for repeatedly practicing a specific audio
- **Sequential Play**: Suitable for learning or enjoying in order
- **List Loop**: Suitable for background playback or continuous practice
- **Random Play**: Suitable for random review or entertainment

### 7. Manage Playlist
- Use up/down arrow buttons to adjust playback order
- Click trash icon to delete unwanted items
- Use "Clear Playlist" and "Random Shuffle" for batch operations

### 8. Playback Control
- Click play button to start playing playlist
- Use previous/next buttons to manually switch audio
- Drag progress bar to quickly seek to specified position
- Automatically apply set playback speed for each item during playback
- Automatically handle behavior after playback ends based on selected play mode

## Development

### Requirements
- Node.js 16+
- PNPM 7+

### Install Dependencies
```bash
pnpm install
```

### Start Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Code Linting
```bash
pnpm lint
```

### Type Checking
```bash
pnpm typecheck
```

## Use Cases

- **Language Learning**: Adjust listening material playback speed to adapt to different learning stages
- **Music Practice**: Slow playback for instrument practice, loop practice for specific segments
- **Podcast Listening**: Speed up playback to save time, or slow down for better understanding
- **Meeting Recordings**: Adjust playback speed based on content importance
- **Audiobooks**: Personalize reading experience, random playback for added interest
- **Study Review**: Use random playback mode for knowledge point review
- **Course Training**: Set appropriate playback speeds for different difficulty course content

## Key Features

### 🔄 Dual Audio System
- Preview playback and playlist playback are completely independent
- Can preview new files while playing playlist
- Avoid operation conflicts, enhance user experience

### ⚡ Modern Architecture
- Based on Nuxt 3 and Vue 3 Composition API
- Complete TypeScript type support
- Modular component design, easy to maintain and extend

### 🎯 Precise Control
- Support 0.1x precision speed adjustment
- Drag progress bar for precise positioning
- Real-time playback status feedback

### 💾 Persistent Storage
- Audio files cached in IndexedDB for offline access
- Playlist state and playback position automatically saved
- Smart recovery on page reload

## License

MIT License

---

© 2025 [Byron](https://github.com/byronogis). All rights reserved.
