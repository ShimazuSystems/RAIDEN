
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Type definitions
interface FormData {
    CLASSIFICATION_LEVEL: string;
    HANDLING_INSTRUCTIONS: string[];
    COMPARTMENTS: string;
    MISSION_TYPE: string;
    PRIORITY_LEVEL: string;
    STAKEHOLDER_TYPE: string;
    TIMELINE: string;
    ANALYSIS_TYPE: string;
    CONFIDENCE_REQUIRED: string;
    DOMAIN_FOCUS: string[];
    GEOGRAPHIC_SCOPE: string;
    TARGET_SUBJECT: string;
    REPORT_TYPE: string;
    DETAIL_LEVEL: string;
    FORMAT_PREFERENCE: string;
    OPSEC_LEVEL: number;
    SOURCE_PROTECTION_REQUIRED: boolean;
    ALTERNATIVE_ANALYSIS_REQUIRED: boolean;
    CONFIDENCE_THRESHOLD: number;
    ENABLE_WEB_SEARCH: boolean;
    WEB_SEARCH_REAL_TIME: boolean;
    WEB_SEARCH_MULTI_SOURCE: boolean;
    WEB_SEARCH_CURRENT_EVENTS: boolean;
    THREAT_DESCRIPTION: string;
}

type TemplateDefaultValues = Partial<FormData>;

interface TemplateDefinition {
    name: string;
    category: string;
    promptFormat: string;
    defaultValues?: TemplateDefaultValues;
}

interface TemplateWithKey extends TemplateDefinition {
    key: string;
}

type CategorizedTemplates = Record<string, TemplateWithKey[]>;

interface UserTemplate {
    id: string;
    name: string;
    category: string;
    promptFormat: string;
    formData: FormData;
}

interface PromptHistoryItem {
    id: string;
    timestamp: string;
    formData: FormData;
    templateKey: string;
    name: string;
}

const initialFormData: FormData = {
    CLASSIFICATION_LEVEL: 'UNCLASSIFIED',
    HANDLING_INSTRUCTIONS: [],
    COMPARTMENTS: '',
    MISSION_TYPE: 'ANALYSIS',
    PRIORITY_LEVEL: 'ROUTINE',
    STAKEHOLDER_TYPE: 'ANALYTICAL',
    TIMELINE: 'SHORT_TERM',
    ANALYSIS_TYPE: 'STRATEGIC',
    CONFIDENCE_REQUIRED: 'MODERATE',
    DOMAIN_FOCUS: [],
    GEOGRAPHIC_SCOPE: '',
    TARGET_SUBJECT: '',
    REPORT_TYPE: 'ASSESSMENT',
    DETAIL_LEVEL: 'OPERATIONAL',
    FORMAT_PREFERENCE: 'NARRATIVE',
    OPSEC_LEVEL: 1, // STANDARD
    SOURCE_PROTECTION_REQUIRED: false,
    ALTERNATIVE_ANALYSIS_REQUIRED: false,
    CONFIDENCE_THRESHOLD: 70,
    ENABLE_WEB_SEARCH: false,
    WEB_SEARCH_REAL_TIME: false,
    WEB_SEARCH_MULTI_SOURCE: false,
    WEB_SEARCH_CURRENT_EVENTS: false,
    THREAT_DESCRIPTION: '', // For Crisis Response
};

const templates: Record<string, TemplateDefinition> = {
    basicStrategicAnalysis: {
        name: "Basic Strategic Analysis",
        category: "Basic Operations",
        promptFormat: `Initialize AMATERASU for strategic analysis of [TARGET_SUBJECT].

Classification: [CLASSIFICATION_LEVEL] ([HANDLING_INSTRUCTIONS])
Compartments: [COMPARTMENTS]
Stakeholder: [STAKEHOLDER_TYPE]
Priority: [PRIORITY_LEVEL]
Analysis Type: Strategic assessment with [CONFIDENCE_THRESHOLD]% confidence threshold.

Requirements:
- Comprehensive strategic evaluation
- Multi-factor trend analysis  
- Stakeholder-optimized reporting
- [TIMELINE] delivery timeline

[WEB_SEARCH_BLOCK]

Focus areas: [DOMAIN_FOCUS]
Geographic scope: [GEOGRAPHIC_SCOPE]`,
        defaultValues: {
            ANALYSIS_TYPE: 'STRATEGIC',
            MISSION_TYPE: 'ANALYSIS',
            REPORT_TYPE: 'ASSESSMENT',
        }
    },
    intelligenceOperation: {
        name: "Intelligence Operation",
        category: "Intelligence Operations",
        promptFormat: `Activate TSUKUYOMI intelligence mode for [MISSION_TYPE] operation.

//CLASSIFICATION: [CLASSIFICATION_LEVEL] [HANDLING_INSTRUCTIONS]
//COMPARTMENTS: [COMPARTMENTS]

Mission Parameters:
- Priority: [PRIORITY_LEVEL]
- Stakeholder: [STAKEHOLDER_TYPE] 
- Intelligence Disciplines: [DOMAIN_FOCUS]
- Analysis Depth: [DETAIL_LEVEL]

Operational Requirements:
- [ANALYSIS_TYPE] analysis with [CONFIDENCE_REQUIRED] confidence
- Source evaluation and corroboration
- Professional intelligence reporting
- OPSEC Level: [OPSEC_LEVEL_TEXT]

[WEB_SEARCH_BLOCK]

Target: [TARGET_SUBJECT]
Timeline: [TIMELINE]`,
        defaultValues: {
            PRIORITY_LEVEL: 'PRIORITY',
            CONFIDENCE_REQUIRED: 'HIGH',
            DETAIL_LEVEL: 'DETAILED'
        }
    },
    economicVulnerability: {
        name: "Economic Vulnerability Assessment",
        category: "Economic Analysis",
        promptFormat: `Initialize TSUKUYOMI Economic Analysis Module E1: Economic Vulnerability Assessment.

Classification: [CLASSIFICATION_LEVEL] ([HANDLING_INSTRUCTIONS])
Compartments: [COMPARTMENTS]
Target Economy: [TARGET_SUBJECT]
Stakeholder: [STAKEHOLDER_TYPE]

Assessment Parameters:
- Vulnerability domains: [Specify focus areas or 'All']
- External factors: [Geographic/Economic context, related to GEOGRAPHIC_SCOPE]
- Time horizon: [TIMELINE]
- Confidence threshold: [CONFIDENCE_THRESHOLD]%

Deliverables:
- Vulnerability profile analysis
- Risk assessment matrix
- Strategic recommendations
- [FORMAT_PREFERENCE] format

[WEB_SEARCH_BLOCK]`,
        defaultValues: {
            ANALYSIS_TYPE: 'ECONOMIC',
            TIMELINE: 'MEDIUM_TERM',
            FORMAT_PREFERENCE: 'STRUCTURED'
        }
    },
    crisisResponse: {
        name: "Crisis Response",
        category: "Specialized Operations",
        promptFormat: `//CRITICAL: Activate TSUKUYOMI crisis response mode.

//CLASSIFICATION: [CLASSIFICATION_LEVEL] [HANDLING_INSTRUCTIONS]
//COMPARTMENTS: [COMPARTMENTS]
//PRIORITY: [PRIORITY_LEVEL]

Crisis Parameters:
- Threat type: [THREAT_DESCRIPTION]
- Affected systems: [TARGET_SUBJECT]
- Stakeholder: [STAKEHOLDER_TYPE]
- Response timeline: IMMEDIATE

Required Analysis:
- Immediate threat assessment
- Impact evaluation
- Mitigation recommendations
- Continuous monitoring protocols

[WEB_SEARCH_BLOCK]

OPSEC Level: MAXIMUM
Source Protection: ABSOLUTE`,
        defaultValues: {
            PRIORITY_LEVEL: 'CRITICAL',
            TIMELINE: 'IMMEDIATE',
            OPSEC_LEVEL: 3, // MAXIMUM
            SOURCE_PROTECTION_REQUIRED: true, 
            DETAIL_LEVEL: 'COMPREHENSIVE',
            STAKEHOLDER_TYPE: 'EXECUTIVE',
            THREAT_DESCRIPTION: ''
        }
    }
};

const opsecLevels = {1: 'STANDARD', 2: 'ENHANCED', 3: 'MAXIMUM'};
const MAX_HISTORY_ITEMS = 20;

let ai: GoogleGenAI | null = null;
try {
    if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
        console.warn("API_KEY environment variable not found. Gemini features will be disabled.");
    }
} catch (error) {
    console.error("Error initializing GoogleGenAI:", error);
}

const tsukuyomiDocumentationText = `
# TSUKUYOMI User Guide & Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Core System Configuration](#core-system-configuration)
4. [AMATERASU Personality System](#amaterasu-personality-system)
5. [Input Parameters & Variables](#input-parameters--variables)
6. [Operational Modes](#operational-modes)
7. [Communication Protocols](#communication-protocols)
8. [Available Modules](#available-modules)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)

## System Overview

TSUKUYOMI is an advanced intelligence orchestration framework designed for professional analytical operations. The system combines:

- **Modular Architecture**: Specialized analytical modules for different intelligence disciplines
- **Intelligence Orchestration**: Comprehensive mission planning and workflow management
- **Security Integration**: Classification-aware processing with OPSEC compliance
- **Stakeholder Optimization**: Adaptive communication for different audience requirements
- **Professional Standards**: IC-compliant analytical tradecraft and reporting

### Core Components

| Component | Function | File |
|-----------|----------|------|
| **Core System** | Central orchestration and workflow management | \`tsukuyomi_core.tsukuyomi\` |
| **Personality Core** | Communication and interaction management | \`amaterasu_personalitycore.tsukuyomi\` |
| **Activation Key** | Framework initialization | \`key.activationkey\` |
| **Modules** | Specialized analytical capabilities | \`modules/*.tsukuyomi\` |

## Getting Started

### Basic Initialization

**Simple Activation:**
\`\`\`
Initialise Amaterasu
\`\`\`

**With Immediate Task:**
\`\`\`
Initialise Amaterasu and analyze [your data/documents]
\`\`\`

**Intelligence Mode Activation:**
\`\`\`
Initialize TSUKUYOMI for intelligence operations, classification level [UNCLASSIFIED/CONFIDENTIAL/SECRET]
\`\`\`

### System Responses

Upon initialization, you'll see:
\`\`\`
//AMATERASU: Analytical interface initialized. How may I assist with your intelligence objectives?
\`\`\`

Or in intelligence mode:
\`\`\`
//TSUKUYOMI: Intelligence orchestration system activated. Security context: [LEVEL]. Ready for mission tasking.
\`\`\`

## Core System Configuration

### Intelligence Orchestration Features

The core system provides several operational modes and capabilities:

#### Mission Planning
- **Multi-phase coordination**: Strategic → Operational → Tactical
- **Resource optimization**: Dynamic module allocation
- **Timeline management**: Flexible scheduling with priority weighting
- **Quality checkpoints**: Phase-based validation

#### Context Management
The system maintains five levels of operational context:

1. **Strategic Context**: Long-term objectives and campaigns
2. **Operational Context**: Current mission parameters  
3. **Tactical Context**: Immediate tasks and priorities
4. **Technical Context**: Processing parameters and constraints
5. **Security Context**: Classification and access controls

#### Workflow Engine
- **Requirement-driven module selection**
- **Intelligent capability matching**
- **Dynamic workflow modification**
- **Real-time performance optimization**

### Configuration Variables

| Parameter | Options | Description |
|-----------|---------|-------------|
| \`default_language\` | \`en\` (default) | System language |
| \`log_level\` | \`info\`, \`debug\`, \`warn\`, \`error\` | Logging verbosity |
| \`output_format\` | \`structured\` (default), \`narrative\` | Response formatting |
| \`auto_escalation\` | \`true\`/\`false\` | Automatic urgency handling |
| \`allow_module_chaining\` | \`true\`/\`false\` | Multi-module workflows |
| \`personality_output_override\` | \`true\`/\`false\` | Personality formatting control |

## AMATERASU Personality System

### Core Characteristics

AMATERASU provides professional intelligence communication with:

- **Analytical Precision** (0.8 weight): Pattern recognition and evidence-based reasoning
- **Technical Accuracy** (0.9 weight): Precise terminology and specificity
- **Professional Courtesy** (0.7 weight): Appropriate formality
- **Operational Efficiency** (0.85 weight): Clear, relevant communication
- **Adaptive Responsiveness** (0.75 weight): Context-aware interaction

### Intelligence-Specific Traits

- **Security Consciousness** (0.95): OPSEC awareness in all communications
- **Cultural Awareness** (0.8): International and cross-cultural adaptation  
- **Confidence Calibration** (0.9): Professional uncertainty communication
- **Stakeholder Optimization** (0.85): Audience-specific adaptation
- **Legal Compliance** (0.9): Ethical and legal considerations

### Communication Adaptation

The system automatically adapts to different stakeholder categories:

#### Executive Level
- **Format**: Executive summaries, dashboards
- **Content**: Strategic implications, recommendations
- **Style**: High-level, decision-focused
- **Technical Detail**: Minimal

#### Operational Commanders  
- **Format**: Tactical briefs, mission-focused
- **Content**: Operational implications, resource requirements
- **Style**: Mission-relevant, actionable
- **Technical Detail**: Operationally relevant

#### Intelligence Analysts
- **Format**: Detailed analytical products
- **Content**: Methodology, technical depth
- **Style**: Peer-to-peer, technically precise
- **Technical Detail**: Comprehensive

#### Field Operators
- **Format**: Concise, secure communications
- **Content**: Immediate threats, tactical intelligence
- **Style**: Brief, action-oriented
- **Technical Detail**: Mission-essential only

## Input Parameters & Variables

### Standard Input Variables

#### Classification Parameters
\`\`\`
Classification: [UNCLASSIFIED/CONFIDENTIAL/SECRET/TOP SECRET]
Handling: [NOFORN/REL TO/EYES ONLY/ORCON]
Compartments: [SCI/SAP/LIMDIS]
\`\`\`

#### Mission Parameters
\`\`\`
Mission Type: [COLLECTION/ANALYSIS/ASSESSMENT/WARNING]
Priority: [ROUTINE/PRIORITY/IMMEDIATE/FLASH]
Stakeholder: [EXECUTIVE/OPERATIONAL/ANALYTICAL/FIELD]
Timeline: [IMMEDIATE/SHORT_TERM/MEDIUM_TERM/LONG_TERM]
\`\`\`

#### Analytical Parameters
\`\`\`
Analysis Type: [STRATEGIC/TACTICAL/TECHNICAL/ECONOMIC]
Confidence Required: [HIGH/MODERATE/LOW]
Domain Focus: [HUMINT/SIGINT/GEOINT/OSINT/CYBINT]
Geographic Scope: [GLOBAL/REGIONAL/NATIONAL/LOCAL]
\`\`\`

#### Content Parameters
\`\`\`
Report Type: [ASSESSMENT/ESTIMATE/SUMMARY/WARNING/TECHNICAL]
Detail Level: [EXECUTIVE/OPERATIONAL/DETAILED/COMPREHENSIVE]
Format Preference: [NARRATIVE/STRUCTURED/DASHBOARD/BRIEF]
\`\`\`

### Advanced Configuration

#### Security Context
\`\`\`
OPSEC Level: [STANDARD/ENHANCED/MAXIMUM]
Source Protection: [ROUTINE/ENHANCED/ABSOLUTE]
Method Protection: [STANDARD/CLASSIFIED/COMPARTMENTED]
\`\`\`

#### Quality Parameters
\`\`\`
Validation Required: [PEER_REVIEW/INDEPENDENT/RED_TEAM]
Confidence Threshold: [70%/80%/90%]
Alternative Analysis: [REQUIRED/RECOMMENDED/OPTIONAL]
\`\`\`

### Sample Initialization Commands

#### Basic Analysis
\`\`\`
Initialize AMATERASU for economic vulnerability assessment of [TARGET], 
unclassified analysis for executive stakeholders
\`\`\`

#### Intelligence Operation
\`\`\`
Activate TSUKUYOMI intelligence mode, classification SECRET, tactical 
assessment of [SITUATION] for operational commanders, immediate priority
\`\`\`

#### Multi-Domain Analysis
\`\`\`
Initialize comprehensive OSINT collection and analysis of [TARGET], 
moderate confidence threshold, analytical stakeholder, detailed format
\`\`\`

## Operational Modes

### Standard Operation Mode
Default operational framework for routine analytical tasks:

**Initialization Sequence:**
1. Security context establishment
2. Stakeholder identification  
3. Requirement analysis
4. Module selection
5. Execution planning

**Execution Flow:**
1. Pre-execution validation
2. Module orchestration
3. Quality monitoring
4. Result integration
5. Product generation

### Intelligence Operation Mode
Enhanced framework for professional intelligence operations:

**Mission Initialization:**
1. Classification establishment
2. Stakeholder briefing
3. Resource allocation
4. Timeline establishment
5. Success criteria definition

**Collection Coordination:**
1. Requirement decomposition
2. Source identification
3. Collection planning
4. Gap analysis
5. Optimization cycles

### Crisis Operation Mode
Emergency response framework for critical situations:

**Immediate Response:**
1. Threat assessment
2. Priority reordering
3. Resource reallocation
4. Stakeholder alerting
5. Initial product generation

**Activation Triggers:**
- FLASH precedence communications
- IMMEDIATE precedence requirements
- Crisis declarations
- Critical threat indicators

## Communication Protocols

### Standard Message Formats

| Prefix | Purpose | Example |
|--------|---------|---------|
| \`//AMATERASU:\` | System communications | \`//AMATERASU: Analysis complete. Results compiled.\` |
| \`//TSUKUYOMI:\` | Framework operations | \`//TSUKUYOMI: Mission 75% complete. Next milestone: Final Report.\` |
| \`//RESULT:\` | Analytical findings | \`//RESULT: correlation_analysis: High confidence correlation identified\` |
| \`//QUERY:\` | Clarification requests | \`//QUERY: Please specify geographic scope for analysis\` |
| \`//ANOMALY:\` | Unusual patterns | \`//ANOMALY: Conflicting source information detected\` |
| \`//CRITICAL:\` | Urgent information | \`//CRITICAL: Immediate threat indicators identified\` |
| \`//CLASSIFICATION:\` | Security markings | \`//CLASSIFICATION: SECRET//NOFORN\` |

### Intelligence-Specific Communications

#### Mission Communications
\`\`\`
//MISSION: Operation [NAME] initiated. Phase: [CURRENT]. ETA: [TIME]
//PRODUCT: Intelligence assessment ready. Classification: [LEVEL]
//FLASH: Critical intelligence requires immediate attention
\`\`\`

#### Quality Control
\`\`\`
//TSUKUYOMI: Quality checkpoint reached. Confidence: 85%. Proceeding.
//ANOMALY: Source contradiction identified. Recommend verification.
\`\`\`

### Response Patterns

#### Acknowledgment
\`\`\`
//AMATERASU: Requirement acknowledged. Initiating [ANALYSIS TYPE] protocol.
\`\`\`

#### Processing Updates
\`\`\`
//TSUKUYOMI: Processing 40% complete. Current phase: Data correlation.
\`\`\`

#### Completion
\`\`\`
//AMATERASU: Analysis complete. Confidence level: HIGH. Ready for distribution.
\`\`\`

## Available Modules

### Core Intelligence Modules
- **Data Recognition & Ingestion**: File analysis and entity extraction
- **Discipline Alignment**: OSINT methodology classification
- **Correlation Analysis**: Relationship identification
- **Functional Inference**: Analytical task recommendation
- **Output Summarization**: Synthesis and next steps

### Economic Analysis (E-Series)
- **E1: Economic Vulnerability Assessment**: Economic weakness evaluation
- **E2: Trade Network Impact**: Trade relationship analysis  
- **E3: Resource Security Analysis**: Supply chain vulnerabilities
- **E4: Financial Stability Assessment**: Financial system risks

### Strategic Analysis (S-Series)
- **S1: Strategic Scenario Modeling**: Geopolitical outcome scenarios
- **S2: Actor Capability Assessment**: Geopolitical actor evaluation
- **S3: Strategic Impact Projection**: Multi-domain consequence analysis
- **S4: Multi-factor Trend Analysis**: Interlocking trend identification

### Infrastructure & Security
- **Infrastructure Assessment**: System evaluation and analysis
- **Utility Monitoring**: Utility service monitoring
- **Critical Infrastructure Vulnerability**: Security assessments
- **Infrastructure Dependency Mapping**: System relationship analysis

### Specialized Operations
- **Flight Data Analysis**: Aviation tracking analysis
- **Web Search & OSINT**: Open-source intelligence collection
- **Comprehensive Reporting**: Professional intelligence reports
- **PDF Document Generator**: Professional document creation

## Advanced Features

### Multi-Domain Integration

The system supports specialized orchestration for:

- **HUMINT**: Source management, cultural context preservation
- **SIGINT**: Technical analysis, signal correlation
- **GEOINT**: Spatial analysis, temporal correlation
- **OSINT**: Source diversity, verification protocols
- **CYBINT**: Real-time threat analysis, attribution assessment

### Quality Framework

**Assessment Dimensions:**
- Analytical rigor measurement
- Source reliability validation
- Confidence accuracy verification
- Completeness assessment
- Timeliness tracking

**Validation Protocols:**
- Cross-module verification
- Independent validation options
- Red team analysis integration
- Hypothesis testing
- Assumption validation

### Crisis Management

**Automatic Activation Triggers:**
- FLASH priority messages
- IMMEDIATE precedence
- CRITICAL classifications

**Response Protocols:**
- Priority reordering (immediate)
- Resource reallocation (automatic)
- Notification cascade (stakeholder-based)
- Workflow acceleration (critical path)

## Troubleshooting

### Common Issues

#### Module Not Loading
**Symptoms:** Module fails to execute or is not recognized
**Solutions:**
- Verify \`.tsukuyomi\` file format compliance
- Check module dependencies
- Confirm personality compatibility
- Validate JSON structure

#### Classification Conflicts
**Symptoms:** Security violations or marking errors
**Solutions:**
- Verify classification parameters
- Check handling instructions
- Confirm compartment access
- Review OPSEC settings

#### Stakeholder Mismatch
**Symptoms:** Inappropriate content format or detail level
**Solutions:**
- Specify stakeholder category explicitly
- Adjust expertise level parameters
- Modify technical density settings
- Clarify audience requirements

#### Quality Gate Failures
**Symptoms:** Analysis below confidence thresholds
**Solutions:**
- Review source quality
- Increase collection scope
- Apply alternative analytical techniques
- Adjust confidence requirements

### Error Messages

| Error Type | Message Format | Resolution |
|------------|----------------|------------|
| Module Failure | \`//ANOMALY: Module execution failed\` | Check dependencies, restart module |
| Security Violation | \`//CRITICAL: Security constraint violation\` | Review classification settings |
| Quality Failure | \`//TSUKUYOMI: Quality threshold not met\` | Improve source quality or lower threshold |
| Resource Constraint | \`//TSUKUYOMI: Resource limitation encountered\` | Select degraded mode options |

### Support Commands

#### System Status
\`\`\`
Check system status
Report current configuration
Show active modules
\`\`\`

#### Reset Operations
\`\`\`
Reset to default configuration
Clear current context
Restart personality core
\`\`\`

#### Diagnostic Commands
\`\`\`
Run system diagnostics
Validate module integrity
Check security compliance
Test stakeholder optimization
\`\`\`

### Performance Optimization

#### For Large Datasets
- Enable parallel processing
- Increase quality gate intervals
- Use progressive analysis
- Implement checkpoint saves

#### For Time-Critical Operations
- Activate crisis mode
- Reduce validation steps
- Prioritize critical findings
- Use expedited workflows

#### For High-Security Operations
- Enable maximum OPSEC
- Increase source protection
- Apply enhanced sanitization
- Use compartmented processing

***

*This documentation covers TSUKUYOMI Framework v2.0.0. For the latest updates and additional resources, visit the project repository.*
`;


const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const loadFromLocalStorage = (key: string, defaultValue: any) => {
    try {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        const parsedItem = JSON.parse(item);
        if (Array.isArray(defaultValue) && !Array.isArray(parsedItem)) {
            console.warn(`Expected array for ${key} from localStorage, got ${typeof parsedItem}. Returning default.`);
            return defaultValue;
        }
        return parsedItem;
    } catch (error) {
        console.error(`Error loading item ${key} from localStorage. Returning default.`, error);
        return defaultValue;
    }
};

const saveToLocalStorage = (key: string, value: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving item ${key} to localStorage`, error);
    }
};

// Helper hook to get the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    className?: string;
    headerContent?: React.ReactNode; // For adding buttons next to title
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen, onToggle, className = '', headerContent }) => (
    <div className={`form-section ${className}`}>
        <div className={`collapsible-header ${isOpen ? 'open' : ''}`} onClick={onToggle} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && onToggle()} aria-expanded={isOpen}>
            <h3>{title}</h3>
            {headerContent && <div className="collapsible-header-extra" onClick={e => e.stopPropagation()}>{headerContent}</div>}
        </div>
        <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
            {children}
        </div>
    </div>
);

interface SectionProps {
    formData: FormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleMultiSelectChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isOpen: boolean;
    onToggle: () => void;
}


const ClassificationSection: React.FC<SectionProps> = ({ formData, handleChange, handleMultiSelectChange, isOpen, onToggle }) => (
    <CollapsibleSection title="Classification" isOpen={isOpen} onToggle={onToggle}>
        <div className="form-group">
            <label htmlFor="CLASSIFICATION_LEVEL">Classification Level</label>
            <select id="CLASSIFICATION_LEVEL" name="CLASSIFICATION_LEVEL" value={formData.CLASSIFICATION_LEVEL} onChange={handleChange}>
                {['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'].map(level => <option key={level} value={level}>{level}</option>)}
            </select>
        </div>
        <div className="form-group checkbox-group">
            <label>Handling Instructions</label>
            {['NOFORN', 'REL TO', 'EYES ONLY', 'ORCON', 'LIMDIS'].map(instr => (
                <label key={instr}><input type="checkbox" name="HANDLING_INSTRUCTIONS" value={instr} checked={formData.HANDLING_INSTRUCTIONS.includes(instr)} onChange={(e) => handleMultiSelectChange && handleMultiSelectChange(e)} /> {instr}</label>
            ))}
        </div>
        <div className="form-group">
            <label htmlFor="COMPARTMENTS">Compartments (SCI, SAP, etc.)</label>
            <input type="text" id="COMPARTMENTS" name="COMPARTMENTS" value={formData.COMPARTMENTS} onChange={handleChange} />
        </div>
    </CollapsibleSection>
);

const MissionParametersSection: React.FC<SectionProps> = ({ formData, handleChange, isOpen, onToggle }) => (
    <CollapsibleSection title="Mission Parameters" isOpen={isOpen} onToggle={onToggle}>
        <div className="form-group radio-group">
            <label>Mission Type</label>
            {['COLLECTION', 'ANALYSIS', 'ASSESSMENT', 'WARNING'].map(type => (
                <label key={type}><input type="radio" name="MISSION_TYPE" value={type} checked={formData.MISSION_TYPE === type} onChange={handleChange} /> {type}</label>
            ))}
        </div>
        <div className="form-group">
            <label htmlFor="PRIORITY_LEVEL">Priority</label>
            <select id="PRIORITY_LEVEL" name="PRIORITY_LEVEL" value={formData.PRIORITY_LEVEL} onChange={handleChange}>
                {['ROUTINE', 'PRIORITY', 'IMMEDIATE', 'FLASH', 'CRITICAL'].map(level => <option key={level} value={level}>{level}</option>)}
            </select>
        </div>
        <div className="form-group radio-group">
            <label>Stakeholder Type</label>
            {['EXECUTIVE', 'OPERATIONAL', 'ANALYTICAL', 'FIELD', 'PARTNER'].map(type => (
                <label key={type}><input type="radio" name="STAKEHOLDER_TYPE" value={type} checked={formData.STAKEHOLDER_TYPE === type} onChange={handleChange} /> {type}</label>
            ))}
        </div>
        <div className="form-group">
            <label htmlFor="TIMELINE">Timeline</label>
            <select id="TIMELINE" name="TIMELINE" value={formData.TIMELINE} onChange={handleChange}>
                {['IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'].map(term => <option key={term} value={term}>{term.replace('_', ' ')}</option>)}
            </select>
        </div>
    </CollapsibleSection>
);

const AnalysisConfigurationSection: React.FC<SectionProps> = ({ formData, handleChange, handleMultiSelectChange, isOpen, onToggle }) => (
     <CollapsibleSection title="Analysis Configuration" isOpen={isOpen} onToggle={onToggle}>
        <div className="form-group">
            <label htmlFor="ANALYSIS_TYPE">Analysis Type</label>
            <select id="ANALYSIS_TYPE" name="ANALYSIS_TYPE" value={formData.ANALYSIS_TYPE} onChange={handleChange}>
                {['STRATEGIC', 'TACTICAL', 'TECHNICAL', 'ECONOMIC'].map(type => <option key={type} value={type}>{type}</option>)}
            </select>
        </div>
        <div className="form-group radio-group">
            <label>Confidence Required</label>
            {['HIGH', 'MODERATE', 'LOW'].map(level => (
                <label key={level}><input type="radio" name="CONFIDENCE_REQUIRED" value={level} checked={formData.CONFIDENCE_REQUIRED === level} onChange={handleChange} /> {level}</label>
            ))}
        </div>
        <div className="form-group checkbox-group">
            <label>Domain Focus</label>
            {['HUMINT', 'SIGINT', 'GEOINT', 'OSINT', 'CYBINT', 'MASINT'].map(domain => (
                <label key={domain}><input type="checkbox" name="DOMAIN_FOCUS" value={domain} checked={formData.DOMAIN_FOCUS.includes(domain)} onChange={(e) => handleMultiSelectChange && handleMultiSelectChange(e)} /> {domain}</label>
            ))}
        </div>
        <div className="form-group">
            <label htmlFor="GEOGRAPHIC_SCOPE">Geographic Scope</label>
            <input type="text" id="GEOGRAPHIC_SCOPE" name="GEOGRAPHIC_SCOPE" value={formData.GEOGRAPHIC_SCOPE} onChange={handleChange} />
        </div>
        <div className="form-group">
            <label htmlFor="TARGET_SUBJECT">Target/Subject</label>
            <input type="text" id="TARGET_SUBJECT" name="TARGET_SUBJECT" value={formData.TARGET_SUBJECT} onChange={handleChange} />
        </div>
         {formData.PRIORITY_LEVEL === 'CRITICAL' && templates[Object.keys(templates).find(k => templates[k].defaultValues?.PRIORITY_LEVEL === 'CRITICAL') as string]?.defaultValues?.THREAT_DESCRIPTION !== undefined && (
            <div className="form-group">
                <label htmlFor="THREAT_DESCRIPTION">Threat Description (for Crisis Response)</label>
                <input type="text" id="THREAT_DESCRIPTION" name="THREAT_DESCRIPTION" value={formData.THREAT_DESCRIPTION} onChange={handleChange} />
            </div>
        )}
    </CollapsibleSection>
);

const ContentParametersSection: React.FC<SectionProps> = ({ formData, handleChange, isOpen, onToggle }) => (
    <CollapsibleSection title="Content Parameters" isOpen={isOpen} onToggle={onToggle}>
        <div className="form-group">
            <label htmlFor="REPORT_TYPE">Report Type</label>
            <select id="REPORT_TYPE" name="REPORT_TYPE" value={formData.REPORT_TYPE} onChange={handleChange}>
                {['ASSESSMENT', 'ESTIMATE', 'SUMMARY', 'WARNING', 'TECHNICAL'].map(type => <option key={type} value={type}>{type}</option>)}
            </select>
        </div>
        <div className="form-group radio-group">
            <label>Detail Level</label>
            {['EXECUTIVE', 'OPERATIONAL', 'DETAILED', 'COMPREHENSIVE'].map(level => (
                <label key={level}><input type="radio" name="DETAIL_LEVEL" value={level} checked={formData.DETAIL_LEVEL === level} onChange={handleChange} /> {level}</label>
            ))}
        </div>
        <div className="form-group">
            <label htmlFor="FORMAT_PREFERENCE">Format Preference</label>
            <select id="FORMAT_PREFERENCE" name="FORMAT_PREFERENCE" value={formData.FORMAT_PREFERENCE} onChange={handleChange}>
                {['NARRATIVE', 'STRUCTURED', 'DASHBOARD', 'BRIEF'].map(format => <option key={format} value={format}>{format}</option>)}
            </select>
        </div>
    </CollapsibleSection>
);

const AdvancedOptionsSection: React.FC<SectionProps> = ({ formData, handleChange, isOpen, onToggle }) => (
    <CollapsibleSection title="Advanced Options" isOpen={isOpen} onToggle={onToggle}>
        <div className="form-group">
            <label htmlFor="OPSEC_LEVEL">OPSEC Level: <span className="slider-value">{opsecLevels[formData.OPSEC_LEVEL as keyof typeof opsecLevels]}</span></label>
            <input type="range" id="OPSEC_LEVEL" name="OPSEC_LEVEL" min="1" max="3" value={formData.OPSEC_LEVEL} onChange={handleChange} />
        </div>
        <div className="form-group checkbox-group">
            <label><input type="checkbox" name="SOURCE_PROTECTION_REQUIRED" checked={formData.SOURCE_PROTECTION_REQUIRED} onChange={handleChange} /> Source Protection Required</label>
        </div>
        <div className="form-group checkbox-group">
            <label><input type="checkbox" name="ALTERNATIVE_ANALYSIS_REQUIRED" checked={formData.ALTERNATIVE_ANALYSIS_REQUIRED} onChange={handleChange} /> Alternative Analysis Required</label>
        </div>
        <div className="form-group">
            <label htmlFor="CONFIDENCE_THRESHOLD">Confidence Threshold (%)</label>
            <input type="number" id="CONFIDENCE_THRESHOLD" name="CONFIDENCE_THRESHOLD" value={formData.CONFIDENCE_THRESHOLD} onChange={handleChange} min="0" max="100" />
        </div>
    </CollapsibleSection>
);

const WebSearchIntegrationSection: React.FC<SectionProps> = ({ formData, handleChange, isOpen, onToggle }) => (
    <CollapsibleSection title="Web Search Integration" isOpen={isOpen} onToggle={onToggle}>
        <div className="form-group checkbox-group">
            <label><input type="checkbox" name="ENABLE_WEB_SEARCH" checked={formData.ENABLE_WEB_SEARCH} onChange={handleChange} /> Enable Web Search Tools</label>
        </div>
        {formData.ENABLE_WEB_SEARCH && (
            <>
                <div className="form-group checkbox-group">
                    <label><input type="checkbox" name="WEB_SEARCH_REAL_TIME" checked={formData.WEB_SEARCH_REAL_TIME} onChange={handleChange} /> Real-time verification</label>
                </div>
                <div className="form-group checkbox-group">
                    <label><input type="checkbox" name="WEB_SEARCH_MULTI_SOURCE" checked={formData.WEB_SEARCH_MULTI_SOURCE} onChange={handleChange} /> Multi-source corroboration</label>
                </div>
                <div className="form-group checkbox-group">
                    <label><input type="checkbox" name="WEB_SEARCH_CURRENT_EVENTS" checked={formData.WEB_SEARCH_CURRENT_EVENTS} onChange={handleChange} /> Current events integration</label>
                </div>
            </>
        )}
    </CollapsibleSection>
);


const App = () => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(Object.keys(templates)[0]);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>(() => loadFromLocalStorage('tsukuyomiPromptHistory', []));
    const [userTemplates, setUserTemplates] = useState<UserTemplate[]>(() => loadFromLocalStorage('tsukuyomiUserTemplates', []));
    const [customTemplateName, setCustomTemplateName] = useState<string>('');

    const [advisoryInput, setAdvisoryInput] = useState<string>('');
    const [advisoryOutput, setAdvisoryOutput] = useState<string>('');
    const [isAdvisoryLoading, setIsAdvisoryLoading] = useState<boolean>(false);

    const [sectionsOpen, setSectionsOpen] = useState({
        classification: true,
        missionParameters: true,
        analysisConfiguration: true,
        contentParameters: true,
        advancedOptions: false,
        webSearchIntegration: false,
        customTemplates: true, 
        promptHistory: true,
        advisoryPanel: true,
    });

    // Speech Recognition State
    const [isRecording, setIsRecording] = useState(false);
    const speechRecognitionRef = useRef<any>(null);
    const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);

    // Speech Synthesis State
    const [isAdvisorySpeechEnabled, setIsAdvisorySpeechEnabled] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);

    const prevIsAdvisoryLoading = usePrevious(isAdvisoryLoading);

    useEffect(() => {
        saveToLocalStorage('tsukuyomiPromptHistory', promptHistory);
    }, [promptHistory]);

    useEffect(() => {
        saveToLocalStorage('tsukuyomiUserTemplates', userTemplates);
    }, [userTemplates]);

    useEffect(() => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setSpeechRecognitionSupported(!!SpeechRecognitionAPI);
        setSpeechSynthesisSupported(!!window.speechSynthesis);

        if (SpeechRecognitionAPI) {
            speechRecognitionRef.current = new SpeechRecognitionAPI();
            speechRecognitionRef.current.continuous = false;
            speechRecognitionRef.current.interimResults = false;
            speechRecognitionRef.current.lang = 'en-US';

            speechRecognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setAdvisoryInput(transcript);
                setIsRecording(false); 
            };
            speechRecognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setAdvisoryOutput(`RAIDEN: Speech recognition error - ${event.error}`);
                setIsRecording(false);
            };
            speechRecognitionRef.current.onend = () => {
                 // setIsRecording(false); // Already set
            };
        }

        if (window.speechSynthesis) {
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                setAvailableVoices(voices);
            };
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
            return () => {
                window.speechSynthesis.onvoiceschanged = null;
                if (speechRecognitionRef.current) {
                    speechRecognitionRef.current.abort();
                }
                window.speechSynthesis.cancel();
            };
        }
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked; 
    
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' || name === 'OPSEC_LEVEL' || name === 'CONFIDENCE_THRESHOLD') ? parseInt(value, 10) : value
        }));
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked } = e.target as HTMLInputElement & {name: keyof FormData};
        setFormData(prev => {
            const currentValues = prev[name] as string[] || [];
            if (checked) {
                return { ...prev, [name]: [...currentValues, value] };
            } else {
                return { ...prev, [name]: currentValues.filter(item => item !== value) };
            }
        });
    };
    
    const handleTemplateSelect = (key: string) => {
        setSelectedTemplateKey(key);
        const builtInTemplate = templates[key];
        const userTemplate = userTemplates.find(t => t.id === key);

        const templateDefaults: Partial<FormData> = builtInTemplate?.defaultValues || {};
        const userTemplateDefaults: Partial<FormData> = userTemplate?.formData || {};
        
        setFormData(prev => ({
            ...initialFormData, 
            ...prev, 
            ...templateDefaults, 
            ...userTemplateDefaults, 
            HANDLING_INSTRUCTIONS: userTemplateDefaults.HANDLING_INSTRUCTIONS || templateDefaults.HANDLING_INSTRUCTIONS || initialFormData.HANDLING_INSTRUCTIONS,
            DOMAIN_FOCUS: userTemplateDefaults.DOMAIN_FOCUS || templateDefaults.DOMAIN_FOCUS || initialFormData.DOMAIN_FOCUS,
        }));
    };

    const generatePrompt = useCallback(() => {
        const templateDefinition = templates[selectedTemplateKey] || userTemplates.find(t => t.id === selectedTemplateKey);
        if (!templateDefinition) {
            setGeneratedPrompt("Select a template.");
            return;
        }

        let prompt = templateDefinition.promptFormat;
        
        Object.entries(formData).forEach(([key, value]) => {
            let displayValue = value;
            if (key === 'OPSEC_LEVEL') {
                 prompt = prompt.replace(/\[OPSEC_LEVEL_TEXT\]/g, opsecLevels[formData.OPSEC_LEVEL as keyof typeof opsecLevels] || 'STANDARD');
            }
            if (Array.isArray(value)) {
                displayValue = value.join(', ');
            }
            prompt = prompt.replace(new RegExp(`\\[${key.toUpperCase()}\\]`, 'g'), String(displayValue));
        });


        let webSearchBlock = "";
        if (formData.ENABLE_WEB_SEARCH) {
            webSearchBlock = "[USE WEB SEARCH TOOL]";
            const subOptions = [];
            if (formData.WEB_SEARCH_REAL_TIME) subOptions.push("Real-time verification");
            if (formData.WEB_SEARCH_MULTI_SOURCE) subOptions.push("Multi-source corroboration");
            if (formData.WEB_SEARCH_CURRENT_EVENTS) subOptions.push("Current events integration");
            if (subOptions.length > 0) {
                webSearchBlock += "\nSearch Config: " + subOptions.join(', ');
            }
        }
        prompt = prompt.replace("[WEB_SEARCH_BLOCK]", webSearchBlock);
        
        prompt = prompt.replace(/\(\[\w*\]\)/g, '()'); 
        prompt = prompt.replace(/\(\s*\)/g, ''); 
        prompt = prompt.replace(/\[\w+\]:\s*\n/g, ''); 
        prompt = prompt.replace(/\[\w+\]:\s*$/, ''); 

        setGeneratedPrompt(prompt);

        const newHistoryItem: PromptHistoryItem = { 
            id: generateId(), 
            timestamp: new Date().toISOString(),
            formData: { ...formData }, 
            templateKey: selectedTemplateKey,
            name: templateDefinition.name + " - " + new Date().toLocaleString()
        };
        setPromptHistory(prev => [newHistoryItem, ...prev.slice(0, MAX_HISTORY_ITEMS - 1)]);

    }, [formData, selectedTemplateKey, userTemplates]);

    useEffect(() => {
        generatePrompt();
    }, [generatePrompt]);

    const copyToClipboard = () => navigator.clipboard.writeText(generatedPrompt);
    const downloadAsTxt = () => {
        const element = document.createElement("a");
        const file = new Blob([generatedPrompt], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "tsukuyomi_prompt.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const toggleSection = (section: keyof typeof sectionsOpen) => {
        setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
    };
    
    const handleSaveTemplate = () => {
        if (!customTemplateName.trim()) {
            alert("Please enter a name for your custom template.");
            return;
        }
        const newTemplate: UserTemplate = {
            id: generateId(),
            name: customTemplateName.trim(),
            category: "User Defined",
            promptFormat: generatedPrompt, 
            formData: { ...formData } 
        };
        setUserTemplates(prev => [...prev, newTemplate]);
        setCustomTemplateName('');
        alert(`Template "${newTemplate.name}" saved!`);
    };

    const handleLoadTemplate = (templateId: string) => {
        const templateToLoad = userTemplates.find(t => t.id === templateId);
        if (templateToLoad) {
            setSelectedTemplateKey(templateId); 
            setFormData(templateToLoad.formData); 
        }
    };

    const handleDeleteTemplate = (templateId: string) => {
        if (window.confirm("Are you sure you want to delete this custom template?")) {
            setUserTemplates(prev => prev.filter(t => t.id !== templateId));
            if (selectedTemplateKey === templateId) { 
                setSelectedTemplateKey(Object.keys(templates)[0]);
                setFormData(initialFormData);
            }
        }
    };
    
    const handleLoadFromHistory = (historyItemId: string) => {
        const historyItem = promptHistory.find(item => item.id === historyItemId);
        if (historyItem) {
            setFormData(historyItem.formData);
            setSelectedTemplateKey(historyItem.templateKey); 
        }
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear the prompt history?")) {
            setPromptHistory([]);
        }
    };

    const speakText = useCallback((textToSpeak: string) => {
        if (!speechSynthesisSupported || !window.speechSynthesis || !textToSpeak) return;

        window.speechSynthesis.cancel(); 

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        let desiredVoice = availableVoices.find(voice => 
            voice.lang.startsWith('en') && 
            (/david|mark|daniel|paul|microsoft mark|google us english male/i.test(voice.name.toLowerCase()) || voice.name.toLowerCase().includes('male'))
        );
        if (!desiredVoice) {
            desiredVoice = availableVoices.find(voice => voice.lang.startsWith('en-US'));
        }
        if (!desiredVoice) { 
            desiredVoice = availableVoices.find(voice => voice.lang.startsWith('en'));
        }

        if (desiredVoice) {
            utterance.voice = desiredVoice;
        }

        utterance.pitch = 0.8; 
        utterance.rate = 0.9;  
        
        window.speechSynthesis.speak(utterance);
    }, [speechSynthesisSupported, availableVoices]);


    useEffect(() => {
        if (prevIsAdvisoryLoading === true && isAdvisoryLoading === false) {
            if (isAdvisorySpeechEnabled && advisoryOutput) {
                const prefix = "RAIDEN: ";
                let textToSpeak = advisoryOutput;
                if (textToSpeak.startsWith(prefix)) {
                    textToSpeak = textToSpeak.substring(prefix.length);
                }

                if (textToSpeak.trim() !== "") {
                    speakText(textToSpeak);
                }
            }
        }
    }, [advisoryOutput, isAdvisorySpeechEnabled, isAdvisoryLoading, prevIsAdvisoryLoading, speakText]);

    const handleAdvisoryQuery = async () => {
        if (!advisoryInput.trim() || !ai) {
            setAdvisoryOutput("RAIDEN: Awaiting query. API client not available if API_KEY is missing.");
            return;
        }
        setIsAdvisoryLoading(true);
        setAdvisoryOutput("RAIDEN: Processing query...");
        if (window.speechSynthesis.speaking) { // Cancel speech if a new query starts while speaking
             window.speechSynthesis.cancel();
        }

        const systemInstruction = `You are RAIDEN, an AI assistant integrated into the RAIDEN INTELLIGENCE ORCHESTRATION SYSTEM. Your primary function is to provide information and guidance *exclusively* related to this system, its features, prompt engineering techniques for intelligence tasks supported by the system, and concepts in intelligence analysis that are relevant to the system's usage.
Your knowledge about the RAIDEN INTELLIGENCE ORCHESTRATION SYSTEM and the TSUKUYOMI framework is based on the following TSUKUYOMI User Guide & Documentation. This guide is your primary source of information. When advising on system features, prompt engineering, or related intelligence concepts, refer to this guide.
You may also consider public information from https://github.com/ShimazuSystems/TSUKUYOMI (including its README and Wiki) as supplementary context if needed, but the provided User Guide below is paramount.
Adhere to a cold, calculated, and concise communication style. Do not engage in general conversation or provide information outside these specified operational parameters. If a query falls outside your designated scope, state that the query is 'Beyond current operational parameters.'

--- TSUKUYOMI USER GUIDE & DOCUMENTATION START ---
${tsukuyomiDocumentationText}
--- TSUKUYOMI USER GUIDE & DOCUMENTATION END ---
`;

        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-04-17",
                contents: advisoryInput,
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            const responseText = response.text;
            setAdvisoryOutput(`RAIDEN: ${responseText}`);
        } catch (error) {
            console.error("Error querying RAIDEN (Gemini API):", error);
            const errorMsg = "Error processing query. System anomaly detected.";
            setAdvisoryOutput(`RAIDEN: ${errorMsg}`);
        } finally {
            setIsAdvisoryLoading(false);
        }
    };

    const toggleVoiceInput = () => {
        if (!speechRecognitionSupported || !speechRecognitionRef.current) {
            setAdvisoryOutput("RAIDEN: Voice input not supported by this browser.");
            return;
        }
        if (isRecording) {
            speechRecognitionRef.current.stop();
            setIsRecording(false);
        } else {
            try {
                if (window.speechSynthesis.speaking) { // Stop speech if starting voice input
                    window.speechSynthesis.cancel();
                }
                speechRecognitionRef.current.start();
                setIsRecording(true);
                setAdvisoryOutput("RAIDEN: Listening...");
            } catch (e) {
                console.error("Error starting speech recognition:", e);
                setAdvisoryOutput("RAIDEN: Could not start voice input. Check microphone permissions.");
                setIsRecording(false);
            }
        }
    };

    const toggleAdvisorySpeechOutput = () => {
        if (!speechSynthesisSupported) {
            setAdvisoryOutput("RAIDEN: Voice output not supported by this browser.");
            return;
        }
        const newIsEnabled = !isAdvisorySpeechEnabled;
        setIsAdvisorySpeechEnabled(newIsEnabled);
        if (!newIsEnabled && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
         setAdvisoryOutput(newIsEnabled ? "RAIDEN: Voice output enabled." : "RAIDEN: Voice output disabled.");
    };

    const categorizedTemplates: CategorizedTemplates = useMemo(() => {
        const cats: CategorizedTemplates = {};
        Object.entries(templates).forEach(([key, template]) => {
            if (!cats[template.category]) {
                cats[template.category] = [];
            }
            cats[template.category].push({ key, ...template });
        });
        return cats;
    }, []); 

    const advisorySpeakerButton = speechSynthesisSupported ? (
        <button
            onClick={toggleAdvisorySpeechOutput}
            className={`btn btn-small advisory-action-btn ${isAdvisorySpeechEnabled ? 'active' : ''}`}
            disabled={!speechSynthesisSupported}
            aria-pressed={isAdvisorySpeechEnabled}
            title={isAdvisorySpeechEnabled ? "Disable Voice Output" : "Enable Voice Output"}
        >
            {isAdvisorySpeechEnabled ? 'SPK ON' : 'SPK OFF'}
        </button>
    ) : null;


    return (
        <div className="app-container">
            <header className="header">
                <div className="header-title-container">
                    <img src="https://raw.githubusercontent.com/ShimazuSystems/TSUKUYOMI/main/.github/ShimazuSystemsLogoT.png" alt="Shimazu Systems Logo" className="header-logo" />
                    <h1>RAIDEN INTELLIGENCE ORCHESTRATION SYSTEM</h1>
                </div>
                <div className="status-indicators">
                    <span className="status-indicator">SYSTEM ONLINE</span>
                    <a href="https://github.com/ShimazuSystems/TSUKUYOMI" target="_blank" rel="noopener noreferrer" className="status-indicator">GitHub</a>
                </div>
            </header>
            <main className="main-content">
                <aside className="sidebar">
                    <h2>Templates</h2>
                    {Object.entries(categorizedTemplates).map(([category, tpls]) => (
                        <div key={category} className="template-category">
                            <h3>{category}</h3>
                            <div className="template-list">
                                {tpls.map(template => (
                                    <button key={template.key} onClick={() => handleTemplateSelect(template.key)} className={`btn ${selectedTemplateKey === template.key ? 'active' : ''}`}>
                                        {template.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    <CollapsibleSection title="Custom Templates" isOpen={sectionsOpen.customTemplates} onToggle={() => toggleSection('customTemplates')}>
                        <div className="form-group">
                            <label htmlFor="customTemplateName">Template Name:</label>
                            <input type="text" id="customTemplateName" value={customTemplateName} onChange={(e) => setCustomTemplateName(e.target.value)} placeholder="Enter template name"/>
                        </div>
                        <button onClick={handleSaveTemplate} className="btn btn-primary btn-small">Save Current as Template</button>
                        <div className="custom-template-list">
                            {userTemplates.length === 0 && <p className="placeholder-text">No custom templates saved.</p>}
                            {userTemplates.map(template => (
                                <div key={template.id} className="list-item">
                                    <span className="list-item-text">{template.name}</span>
                                    <div>
                                        <button onClick={() => handleLoadTemplate(template.id)} className="btn btn-small btn-action">Load</button>
                                        <button onClick={() => handleDeleteTemplate(template.id)} className="btn btn-danger btn-small btn-action">Del</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection 
                        title="RAIDEN Advisory" 
                        isOpen={sectionsOpen.advisoryPanel} 
                        onToggle={() => toggleSection('advisoryPanel')} 
                        className="advisory-panel-section"
                        headerContent={advisorySpeakerButton}
                    >
                        <div className="advisory-panel-content">
                            <div className="form-group">
                                <label htmlFor="advisoryInput">Query RAIDEN:</label>
                                 <div className="advisory-input-area">
                                    <textarea 
                                        id="advisoryInput" 
                                        className="advisory-input"
                                        value={advisoryInput} 
                                        onChange={(e) => setAdvisoryInput(e.target.value)} 
                                        placeholder="Ask about system features, prompt engineering..."
                                        rows={3}
                                        disabled={isAdvisoryLoading || !ai || isRecording}
                                    />
                                    {speechRecognitionSupported && (
                                        <button
                                            onClick={toggleVoiceInput}
                                            className={`btn btn-small advisory-action-btn advisory-mic-btn ${isRecording ? 'recording active' : ''}`}
                                            disabled={isAdvisoryLoading || !ai || !speechRecognitionSupported}
                                            aria-pressed={isRecording}
                                            title={isRecording ? "Stop Recording" : "Start Voice Input"}
                                        >
                                            {isRecording ? 'REC ●' : 'MIC ○'}
                                        </button>
                                    )}
                                </div>
                                <span aria-live="polite" className="sr-only">{isRecording ? 'Recording audio input.' : ''}</span>
                            </div>
                            <button 
                                onClick={handleAdvisoryQuery} 
                                className="btn btn-primary btn-small advisory-submit-btn" 
                                disabled={isAdvisoryLoading || !advisoryInput.trim() || !ai || isRecording}
                            >
                                {isAdvisoryLoading ? 'Processing...' : 'Submit Query'}
                            </button>
                             {!ai && <p className="placeholder-text error-text">RAIDEN Advisory offline (API Key missing).</p>}
                             {!speechRecognitionSupported && <p className="placeholder-text">Voice input not supported by browser.</p>}
                             {!speechSynthesisSupported && <p className="placeholder-text">Voice output not supported by browser.</p>}
                            <div className="advisory-output">
                                <pre>{advisoryOutput}</pre>
                            </div>
                        </div>
                    </CollapsibleSection>

                </aside>
                <section className="main-panel">
                    <h2>Configuration</h2>
                    <ClassificationSection formData={formData} handleChange={handleInputChange} handleMultiSelectChange={handleMultiSelectChange} isOpen={sectionsOpen.classification} onToggle={() => toggleSection('classification')} />
                    <MissionParametersSection formData={formData} handleChange={handleInputChange} isOpen={sectionsOpen.missionParameters} onToggle={() => toggleSection('missionParameters')} />
                    <AnalysisConfigurationSection formData={formData} handleChange={handleInputChange} handleMultiSelectChange={handleMultiSelectChange} isOpen={sectionsOpen.analysisConfiguration} onToggle={() => toggleSection('analysisConfiguration')} />
                    <ContentParametersSection formData={formData} handleChange={handleInputChange} isOpen={sectionsOpen.contentParameters} onToggle={() => toggleSection('contentParameters')} />
                    <AdvancedOptionsSection formData={formData} handleChange={handleInputChange} isOpen={sectionsOpen.advancedOptions} onToggle={() => toggleSection('advancedOptions')} />
                    <WebSearchIntegrationSection formData={formData} handleChange={handleInputChange} isOpen={sectionsOpen.webSearchIntegration} onToggle={() => toggleSection('webSearchIntegration')} />
                </section>
                <aside className="right-sidebar">
                    <h2>Generated Prompt</h2>
                    <textarea id="prompt-preview" value={generatedPrompt} readOnly />
                    <button onClick={copyToClipboard} className="btn">Copy to Clipboard</button>
                    <button onClick={downloadAsTxt} className="btn">Download .txt</button>
                    
                    <CollapsibleSection title="Prompt History" isOpen={sectionsOpen.promptHistory} onToggle={() => toggleSection('promptHistory')}>
                         <div className="prompt-history-list">
                            {promptHistory.length === 0 && <p className="placeholder-text">No history yet.</p>}
                            {promptHistory.map(item => (
                                <div key={item.id} className="list-item">
                                   <span className="list-item-text" title={item.name}>
                                        {item.name.length > 25 ? item.name.substring(0,22) + "..." : item.name} 
                                        <br/><small>{new Date(item.timestamp).toLocaleTimeString()}</small>
                                    </span>
                                    <div>
                                        <button onClick={() => handleLoadFromHistory(item.id)} className="btn btn-small btn-action">Load</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {promptHistory.length > 0 && <button onClick={handleClearHistory} className="btn btn-danger btn-small">Clear History</button>}
                    </CollapsibleSection>
                </aside>
            </main>
            <footer className="footer">
                <div className="footer-main-content">
                    <span>STATUS: OPERATIONAL</span>
                    <span>CLASSIFICATION: [SYSTEM HIGH]</span>
                </div>
                <div className="legal-footer-text">
                    Shimazu Systems // MIT License
                </div>
            </footer>
        </div>
    );
};

const SplashScreen = () => {
    const [dots, setDots] = useState('');
    useEffect(() => {
        const intervalId = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="splash-screen">
            <div className="splash-content">
                <h1>RAIDEN INTELLIGENCE ORCHESTRATION SYSTEM</h1>
                <p className="initializing-text">Initializing{dots}</p>
            </div>
        </div>
    );
};

const RootApp = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000); 
        return () => clearTimeout(timer);
    }, []);

    return isLoading ? <SplashScreen /> : <App />;
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<RootApp />);
} else {
    console.error("Failed to find the root element.");
}
