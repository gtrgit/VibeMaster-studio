# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VibeMaster Studio is a voice-driven game content creation tool that converts voice descriptions into structured game data (JSON). The project is a web-based application that integrates speech-to-text, AI narrative generation, and game content export functionality.

## Core Architecture

### Technology Stack
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **AI Integration**: Claude API for narrative parsing, ElevenLabs for speech-to-text
- **Proxy Server**: https://audio.netrunners.xyz/vibemaster for API routing
- **Output Format**: Ink dialogue scripts and JSON game data
- **Development**: Live Server for local development

### Key Components
1. **Voice Recording System**: Browser MediaRecorder API with audio processing
2. **Speech-to-Text Pipeline**: ElevenLabs STT via proxy server
3. **AI Narrative Engine**: Claude API for scene parsing and dialogue generation
4. **Scene Editor**: Interactive UI for game object management
5. **Export System**: JSON generation and file download

## Development Commands

### Start Development Server
```bash
npm start
# or
live-server --port=5500
```

### Testing
```bash
npm test
# Currently returns "No tests yet"
```

## Project Structure

- `vibemaster-studio.html` - Main application interface
- `package.json` - Project configuration and scripts
- `setup-vibemaster.ps1` - PowerShell setup script
- `VIBEMASTER_NARRATIVE_ARCHITECTURE.md` - AI narrative system design
- `VIBEMASTER_NARRATIVE_IMPLEMENTATION.md` - Implementation patterns
- `assets/` - Static resources (fonts, icons, images)
- `css/` - Stylesheets (currently empty - styles are inline)
- `js/` - JavaScript modules (currently empty - scripts are inline)
- `docs/` - Documentation
- `examples/` - Example content
- `server/` - Server-side components

## Key Implementation Patterns

### State Management
The application uses a global `state` object to manage:
- Recording status and audio data
- Transcription results
- Scene data from AI parsing
- User settings (API keys, proxy URLs)

### API Integration Pattern
All external API calls route through a proxy server for CORS handling:
```javascript
const response = await fetch(`${state.settings.proxyUrl}/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* request data */ })
});
```

### Audio Processing
- Uses MediaRecorder with enhanced audio settings
- Converts audio blobs to base64 for API transmission
- Implements proper stream cleanup

### Voice-to-Game-Data Pipeline
1. Voice recording → Base64 audio
2. STT via ElevenLabs → Text transcription
3. Claude AI parsing → Structured scene data
4. Scene editor → User refinement
5. Export system → JSON download

## Configuration

### Required API Keys
- **ElevenLabs API Key**: For speech-to-text processing
- **Claude API Key**: For AI narrative generation and scene parsing
- **Proxy URL**: Default `https://audio.netrunners.xyz/vibemaster`

### Settings Storage
User settings persist in localStorage as `vibemaster_settings`.

## AI Narrative Integration

The project implements a sophisticated AI narrative system that:
- Converts voice descriptions into structured game data
- Generates dynamic dialogue using Claude
- Supports complex character relationships and story states
- Outputs Ink dialogue scripts for game engines

Key narrative features:
- Character emotion and goal tracking
- Relationship dynamics
- Crisis detection and response
- Multiple dialogue templates (crisis, ambient, quest follow-up)
- Variable tracking for game state

## Development Notes

- All code is currently inline in `vibemaster-studio.html`
- No build process required - runs directly in browser
- Uses modern browser APIs (MediaRecorder, localStorage, fetch)
- Responsive design with CSS Grid
- Error handling includes user feedback and console logging
- CORS issues handled via proxy server

## Common Tasks

### Adding New Features
1. Extend the global `state` object for new data
2. Add UI elements to the HTML structure
3. Implement functionality in inline JavaScript
4. Update settings/localStorage if needed

### API Integration
- All external APIs must route through the proxy server
- Use consistent error handling patterns
- Log activities to the console for debugging

### Voice/Audio Features
- Test with different audio formats and settings
- Ensure proper stream cleanup to avoid memory leaks
- Handle microphone permission edge cases

This project represents an innovative approach to AI-assisted game development, combining voice input, natural language processing, and structured content generation into a cohesive workflow.