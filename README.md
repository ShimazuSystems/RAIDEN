# RAIDEN INTELLIGENCE ORCHESTRATION SYSTEM

[![Version](https://img.shields.io/badge/version-1.0.0-cyan.svg)](https://github.com/ShimazuSystems/raiden)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/framework-TSUKUYOMI-blue.svg)](https://github.com/ShimazuSystems/TSUKUYOMI)
[![Powered by](https://img.shields.io/badge/powered%20by-Gemini%20AI-orange.svg)](https://ai.google.dev/)

> **Advanced Prompt Orchestration Interface for the TSUKUYOMI Intelligence Framework**

## Overview

RAIDEN is a sophisticated web-based orchestration system designed to generate optimized prompts for the [TSUKUYOMI Intelligence Framework](https://github.com/ShimazuSystems/TSUKUYOMI). Featuring a cyberpunk-inspired terminal interface, RAIDEN bridges the gap between complex intelligence requirements and precise AI prompting through advanced template engineering and real-time advisory capabilities.

## 🎯 Key Features

### **Intelligent Prompt Orchestration**
- **Template-Based Generation**: Pre-configured templates for various intelligence operations
- **Dynamic Parameter Mapping**: Automated variable substitution and optimization
- **Classification-Aware Processing**: IC-standard security parameter handling
- **Real-Time Preview**: Live prompt generation with instant feedback

### **Advanced Advisory System**
- **RAIDEN AI Assistant**: Integrated Gemini-powered advisory for system guidance
- **Voice Integration**: Speech recognition and synthesis capabilities
- **Contextual Help**: Domain-specific guidance for intelligence operations
- **Interactive Query Processing**: Real-time assistance with prompt engineering

### **Professional Intelligence Standards**
- **IC Classification Support**: UNCLASSIFIED through TOP SECRET handling
- **Operational Security (OPSEC)**: Multi-level security configurations
- **Stakeholder Optimization**: Audience-specific prompt adaptation
- **Mission Parameter Integration**: Comprehensive operational context handling

### **Enterprise-Grade Workflow Management**
- **Custom Template Creation**: User-defined prompt templates with persistent storage
- **Prompt History Tracking**: Complete audit trail of generated prompts
- **Session Persistence**: Local storage integration for seamless workflow continuity
- **Export Capabilities**: Multiple output formats for integration

## 🚀 Quick Start

### Prerequisites

- Modern web browser with ES2020+ support
- **Optional**: Google Gemini API key for RAIDEN Advisory features

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ShimazuSystems/raiden.git
   cd raiden
   ```

2. **Configure Environment** (Optional - for AI Advisory)
   ```bash
   # Create environment file
   echo "API_KEY=your_gemini_api_key_here" > .env
   ```

3. **Deploy**
   - **Static Hosting**: Upload files to any static web server
   - **Local Development**: Serve using any HTTP server
   - **CDN Deployment**: Compatible with Netlify, Vercel, GitHub Pages

### Access

Navigate to your deployment URL. The system initializes automatically with a splash screen.

## 🎮 Usage Guide

### **Basic Operation**

1. **System Initialization**
   - Wait for the initialization sequence to complete
   - System status indicators will show "ONLINE" when ready

2. **Template Selection**
   - Choose from pre-configured operational templates in the left sidebar
   - Templates are categorized by operation type and complexity

3. **Parameter Configuration**
   - Configure classification levels and handling instructions
   - Set mission parameters and stakeholder requirements
   - Adjust analysis configuration and content parameters
   - Customize advanced options as needed

4. **Prompt Generation**
   - Real-time prompt preview updates automatically
   - Copy generated prompt to clipboard or download as text file
   - Prompts are optimized for direct use with TSUKUYOMI-enabled AI systems

### **Available Templates**

#### **Basic Operations**
- **Strategic Analysis**: Comprehensive strategic evaluation and trend analysis
- **Intelligence Operation**: Full-spectrum intelligence operations with IC compliance

#### **Economic Analysis**
- **Economic Vulnerability Assessment**: Systematic economic weakness evaluation
- **Trade Network Analysis**: Trade relationship and disruption impact assessment
- **Resource Security Analysis**: Supply chain and critical resource evaluation
- **Financial Stability Assessment**: Financial system risk and contagion analysis

#### **Specialized Operations**
- **Crisis Response**: Emergency response with maximum OPSEC and immediate timeline
- **Infrastructure Assessment**: Critical infrastructure evaluation and dependency mapping
- **Actor Capability Assessment**: Geopolitical actor capability and intention analysis

### **RAIDEN Advisory System**

The integrated AI advisory provides real-time assistance with:

- **System Feature Guidance**: Comprehensive help with RAIDEN functionality
- **Prompt Engineering**: Best practices for TSUKUYOMI prompt optimization
- **Intelligence Tradecraft**: Professional standards and methodological guidance
- **Operational Procedures**: Step-by-step operational workflow assistance

**Voice Integration**:
- Click `MIC ○` to activate voice input
- Click `SPK ON/OFF` to toggle voice output
- Supports hands-free operation for operational environments

## ⚙️ Configuration Reference

### **Classification Parameters**

| Level | Description | Use Case |
|-------|-------------|----------|
| `UNCLASSIFIED` | Public or internal use information | Training, exercises, public analysis |
| `CONFIDENTIAL` | Information requiring protection | Internal operations, preliminary assessments |
| `SECRET` | Information requiring substantial protection | Operational intelligence, strategic assessments |
| `TOP SECRET` | Information requiring maximum protection | Critical operations, sensitive sources |

### **Handling Instructions**

- **NOFORN**: No foreign nationals access
- **REL TO**: Releasable to specified countries
- **EYES ONLY**: Restricted to named individuals
- **ORCON**: Originator controlled dissemination
- **LIMDIS**: Limited distribution

### **Mission Parameters**

| Parameter | Options | Purpose |
|-----------|---------|---------|
| **Mission Type** | COLLECTION, ANALYSIS, ASSESSMENT, WARNING | Primary operational focus |
| **Priority Level** | ROUTINE, PRIORITY, IMMEDIATE, FLASH, CRITICAL | Urgency and resource allocation |
| **Stakeholder Type** | EXECUTIVE, OPERATIONAL, ANALYTICAL, FIELD, PARTNER | Audience optimization |
| **Timeline** | IMMEDIATE, SHORT_TERM, MEDIUM_TERM, LONG_TERM | Delivery requirements |

## 🏗️ Technical Architecture

### **Frontend Stack**
- **React 19.1.0**: Modern component-based architecture
- **TypeScript**: Type-safe development with enhanced IDE support
- **ESM Imports**: Modern module system via import maps
- **CSS3**: Custom theme with responsive design

### **AI Integration**
- **Google Generative AI**: Gemini 2.5 Flash for advisory capabilities
- **Real-time Processing**: Streaming responses with error handling
- **Context Management**: Persistent conversation state

### **Browser APIs**
- **Speech Recognition**: Voice input with cross-browser compatibility
- **Speech Synthesis**: Text-to-speech with voice selection
- **Local Storage**: Persistent user preferences and history
- **Clipboard API**: Seamless prompt copying

### **Security Features**
- **Client-Side Processing**: No server-side data transmission
- **Local Storage Encryption**: Sensitive data protection
- **OPSEC-Aware Design**: Classification-appropriate information handling

## 🔧 Advanced Configuration

### **Custom Template Development**

Create custom templates by:

1. Configure desired parameters using the form interface
2. Generate and verify the prompt output
3. Save as custom template with descriptive name
4. Templates persist across sessions automatically

### **Environment Variables**

```bash
# Google Gemini API Configuration
API_KEY=your_gemini_api_key_here

# Optional: Custom model configuration
GEMINI_MODEL=gemini-2.5-flash-preview-04-17
```

### **Deployment Options**

#### **Static Hosting**
```bash
# Upload all files to web server root
# Ensure proper MIME type handling for .tsx files
```

#### **GitHub Pages**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/deploy-pages@v1
```

#### **CDN Integration**
- **Cloudflare Pages**: Direct GitHub integration
- **Netlify**: Drag-and-drop deployment
- **Vercel**: Git-based continuous deployment

## 🤝 Integration with TSUKUYOMI

RAIDEN generates prompts specifically optimized for the TSUKUYOMI Intelligence Framework:

1. **Direct Compatibility**: Prompts include proper initialization sequences
2. **Module Targeting**: Specific module invocation and parameter passing
3. **Security Context**: Appropriate classification and handling instructions
4. **Workflow Optimization**: Multi-phase operation support

### **Example Integration Workflow**

```
RAIDEN → Generate Prompt → Copy to AI System → TSUKUYOMI Activation
```

## 📊 Performance Specifications

- **Load Time**: <3 seconds on modern browsers
- **Prompt Generation**: Real-time (<100ms response)
- **Memory Usage**: <50MB typical operation
- **Offline Capability**: Full functionality without internet (except AI Advisory)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 🔒 Security Considerations

### **Classification Handling**
- Client-side processing ensures no data transmission to external servers
- Local storage encryption for sensitive configuration data
- Automatic sanitization of prompts based on classification level

### **OPSEC Compliance**
- No telemetry or analytics data collection
- Source protection through intelligent prompt sanitization
- Compartmentalization support for classified operations

### **Privacy Protection**
- No personally identifiable information (PII) collection
- Optional AI features with explicit user consent
- Complete user control over data persistence

## 🛠️ Development

### **Local Development Setup**

```bash
# Clone repository
git clone https://github.com/ShimazuSystems/raiden.git
cd raiden

# Install development server (optional)
npm install -g http-server

# Serve locally
http-server . -p 8080

# Access at http://localhost:8080
```

### **Code Structure**

```
raiden/
├── index.html              # Main application entry point
├── index.tsx               # React application logic
├── index.css               #     Styling
├── metadata.json           # Application metadata
└── README.md              # This file
```

### **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[TSUKUYOMI Framework](https://github.com/ShimazuSystems/TSUKUYOMI)**: Core intelligence analysis framework
- **[Shimazu Systems](https://github.com/ShimazuSystems)**: Complete intelligence system ecosystem

## 📞 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Comprehensive guides available in the repository wiki
- **Community**: Join discussions in GitHub Discussions

## 🏆 Acknowledgments

- **TSUKUYOMI Framework**: Core intelligence capabilities
- **Google Generative AI**: Advisory system foundation
- **Open Source Community**: Modern web development tools and libraries

---

**RAIDEN**: *Orchestrating Intelligence Through Advanced Prompt Engineering*

> *"In the convergence of human intelligence and artificial capability lies the future of analytical operations."*

---

<div align="center">

[![Built with TSUKUYOMI](https://img.shields.io/badge/built%20with-TSUKUYOMI-blue.svg)](https://github.com/ShimazuSystems/TSUKUYOMI)
[![Shimazu Systems](https://img.shields.io/badge/Shimazu-Systems-cyan.svg)](https://github.com/ShimazuSystems)

</div>
