'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TerminalWindow, TerminalOutput, TerminalOutputLine } from '@/components/terminal'
import { useTypingEffect, useCommandHistory, useTerminalTheme } from '@/hooks/useTypingEffect'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import styles from '@/styles/terminal.module.css'

export default function ScientiaCapitalPage() {
  const [currentCommand, setCurrentCommand] = useState('')
  const [outputLines, setOutputLines] = useState<TerminalOutputLine[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [enterpriseMetrics, setEnterpriseMetrics] = useState({
    costSavings: 0,
    modelsDeployed: 0,
    uptime: 0,
    compliance: 0
  })

  const { theme, applyTheme, themes } = useTerminalTheme()
  const { addCommand, getPreviousCommand, getNextCommand } = useCommandHistory()

  // Enterprise-focused terminal theme
  useEffect(() => {
    applyTheme('classic') // Professional green-on-black
  }, [applyTheme])

  // Animate enterprise metrics on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnterpriseMetrics({
        costSavings: 97,
        modelsDeployed: 500000,
        uptime: 99.9,
        compliance: 100
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const addOutput = (type: TerminalOutputLine['type'], text: string, progress?: number) => {
    setOutputLines(prev => [...prev, { type, text, progress, delay: 500 }])
  }

  const clearTerminal = () => {
    setOutputLines([])
  }

  const handleCommand = async (command: string) => {
    const cmd = command.toLowerCase().trim()
    addCommand(command)
    addOutput('command', command)
    setIsProcessing(true)

    await new Promise(resolve => setTimeout(resolve, 300))

    if (cmd === 'help') {
      showHelp()
    } else if (cmd === 'demo') {
      requestDemo()
    } else if (cmd === 'roi') {
      calculateROI()
    } else if (cmd === 'compliance') {
      showCompliance()
    } else if (cmd === 'metrics') {
      showMetrics()
    } else if (cmd === 'security') {
      showSecurity()
    } else if (cmd === 'pricing') {
      showPricing()
    } else if (cmd === 'clear') {
      clearTerminal()
    } else if (cmd === 'status') {
      showSystemStatus()
    } else if (cmd === 'contact') {
      showContact()
    } else if (cmd.startsWith('deploy ')) {
      const model = cmd.substring(7)
      deployEnterpriseModel(model)
    } else {
      addOutput('error', `Command not found: ${cmd}. Type 'help' for available commands.`)
    }

    setIsProcessing(false)
  }

  const showHelp = () => {
    const helpText = `
╔═══════════════════════════════════════════════════════════╗
║                 SCIENTIA CAPITAL AI PLATFORM             ║
║                   EXECUTIVE COMMAND CENTER               ║
╚═══════════════════════════════════════════════════════════╝

ENTERPRISE COMMANDS:
  demo        - Schedule executive demonstration
  roi         - Calculate return on investment  
  compliance  - View security & compliance status
  metrics     - Display enterprise performance metrics
  security    - Review security architecture
  pricing     - View enterprise pricing models
  status      - Check system health & uptime
  contact     - Connect with enterprise sales
  deploy <model> - Deploy enterprise AI model
  clear       - Clear terminal output

ENTERPRISE FEATURES:
  • 97% cost reduction vs traditional AI APIs
  • 500,000+ models with enterprise SLA
  • SOC 2, GDPR, HIPAA compliance ready
  • 99.9% uptime guarantee with 24/7 support
  • Fortune 500 security architecture
  • C-suite reporting & analytics dashboard

TYPE ANY COMMAND TO BEGIN YOUR AI TRANSFORMATION
`
    addOutput('info', helpText)
  }

  const requestDemo = () => {
    addOutput('loading', 'Connecting to Enterprise Sales Team...')
    setTimeout(() => {
      addOutput('success', '✓ Demo request submitted successfully')
      addOutput('info', 'Executive demo scheduled for next business day')
      addOutput('info', 'You will receive calendar invite within 1 hour')
      addOutput('info', 'Demo includes: ROI analysis, security review, implementation timeline')
      addOutput('ascii', `
┌────────────────────────────────────────┐
│  📊 EXECUTIVE BRIEFING PREPARED        │
│  💼 C-SUITE PRESENTATION READY        │
│  🔒 SECURITY ASSESSMENT INCLUDED      │
│  💰 ROI CALCULATOR PERSONALIZED       │
└────────────────────────────────────────┘`)
    }, 2000)
  }

  const calculateROI = () => {
    addOutput('loading', 'Calculating enterprise ROI based on Fortune 500 benchmarks...')
    
    setTimeout(() => {
      addOutput('success', '✓ ROI Analysis Complete')
      addOutput('ascii', `
╔══════════════════════════════════════════════════════════╗
║                   ROI ANALYSIS REPORT                    ║
╠══════════════════════════════════════════════════════════╣
║  Current AI Spending:        $2,400,000/year           ║
║  Scientia Capital Cost:        $72,000/year            ║
║  Annual Savings:            $2,328,000/year            ║
║  ROI:                           3,133%                 ║
║  Payback Period:               11 days                 ║
║                                                        ║
║  Additional Benefits:                                   ║
║  • Reduced DevOps overhead: $480,000/year             ║
║  • Faster time-to-market: $1,200,000 value           ║
║  • Risk mitigation: $960,000 value                   ║
╚══════════════════════════════════════════════════════════╝`)
      addOutput('info', 'Contact our CFO Advisory team for detailed financial analysis')
    }, 3000)
  }

  const showCompliance = () => {
    addOutput('info', 'Loading compliance & security certifications...')
    setTimeout(() => {
      addOutput('success', '✓ All compliance frameworks verified')
      addOutput('ascii', `
🏛️  COMPLIANCE & CERTIFICATIONS STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SOC 2 Type II Certified
✅ GDPR Compliant (EU Data Residency)
✅ HIPAA Ready for Healthcare
✅ ISO 27001 Information Security
✅ PCI DSS for Payment Data
✅ FedRAMP Authorized (In Progress)

🔒 SECURITY ARCHITECTURE:
   • Zero-trust network model
   • End-to-end encryption (AES-256)
   • Multi-factor authentication
   • Role-based access control
   • Continuous vulnerability scanning
   • 24/7 SOC monitoring

📋 AUDIT & REPORTING:
   • Real-time compliance dashboard
   • Automated audit trails
   • Executive compliance reports
   • Risk assessment framework`)
    }, 2000)
  }

  const showMetrics = () => {
    addOutput('info', 'Retrieving enterprise performance metrics...')
    setTimeout(() => {
      addOutput('success', '✓ Metrics dashboard loaded')
      addOutput('progress', 'Cost Savings: 97%', 97)
      addOutput('progress', 'Model Availability: 99.9%', 99.9)
      addOutput('progress', 'Deployment Speed: 95%', 95)
      addOutput('progress', 'Security Score: 100%', 100)
      
      addOutput('ascii', `
📊 EXECUTIVE PERFORMANCE DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FINANCIAL METRICS:
├─ Monthly Cost Reduction: $194,000
├─ Annual Savings Projection: $2.33M  
├─ Infrastructure ROI: 3,133%
└─ TCO Reduction: 97%

OPERATIONAL METRICS:
├─ Models Deployed: 500,000+
├─ Average Deployment Time: 23 seconds
├─ System Uptime: 99.97%
└─ Support Response: <15 minutes

STRATEGIC METRICS:
├─ Time to Market Improvement: 340%
├─ Developer Productivity: +280%
├─ Innovation Cycles: +450%
└─ Competitive Advantage: SIGNIFICANT`)
    }, 2500)
  }

  const showSecurity = () => {
    addOutput('loading', 'Scanning security infrastructure...')
    setTimeout(() => {
      addOutput('success', '✓ Security posture: EXCELLENT')
      addOutput('ascii', `
🛡️  ENTERPRISE SECURITY ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NETWORK SECURITY:
├─ Zero Trust Architecture         ✅ ACTIVE
├─ VPC Isolation                   ✅ ACTIVE  
├─ WAF Protection                  ✅ ACTIVE
├─ DDoS Mitigation                 ✅ ACTIVE
└─ SSL/TLS Everywhere              ✅ ACTIVE

DATA PROTECTION:
├─ AES-256 Encryption at Rest      ✅ ACTIVE
├─ TLS 1.3 in Transit             ✅ ACTIVE
├─ Key Management (HSM)            ✅ ACTIVE
├─ Data Residency Controls         ✅ ACTIVE
└─ PII/PHI Detection              ✅ ACTIVE

ACCESS CONTROL:
├─ Multi-Factor Authentication     ✅ ACTIVE
├─ Single Sign-On (SAML/OIDC)     ✅ ACTIVE
├─ Role-Based Permissions          ✅ ACTIVE
├─ Just-in-Time Access            ✅ ACTIVE
└─ Privileged Access Management    ✅ ACTIVE

MONITORING & RESPONSE:
├─ 24/7 Security Operations Center ✅ ACTIVE
├─ SIEM Integration               ✅ ACTIVE
├─ Threat Intelligence            ✅ ACTIVE
├─ Incident Response Plan         ✅ ACTIVE
└─ Penetration Testing (Quarterly) ✅ ACTIVE`)
    }, 2500)
  }

  const showPricing = () => {
    addOutput('info', 'Loading enterprise pricing calculator...')
    setTimeout(() => {
      addOutput('success', '✓ Pricing models retrieved')
      addOutput('ascii', `
💼 ENTERPRISE PRICING MODELS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STARTER ENTERPRISE
├─ Up to 1M tokens/month: $2,000/month
├─ 99.5% SLA, 8x5 support
├─ SOC 2 compliance included
└─ 30-day implementation

PROFESSIONAL ENTERPRISE  
├─ Up to 10M tokens/month: $12,000/month
├─ 99.9% SLA, 24x7 support
├─ Dedicated success manager
├─ Custom compliance frameworks
└─ 14-day implementation

ENTERPRISE UNLIMITED
├─ Unlimited tokens: $48,000/month
├─ 99.95% SLA, priority support
├─ Dedicated infrastructure
├─ Custom security controls
├─ White-glove onboarding
└─ 7-day implementation

💡 COST COMPARISON:
   Traditional AI APIs: $200,000+/month
   Scientia Capital:    $4,000-48,000/month
   YOUR SAVINGS:        92-98% reduction

📞 CONTACT ENTERPRISE SALES FOR CUSTOM QUOTES`)
    }, 2000)
  }

  const showSystemStatus = () => {
    addOutput('loading', 'Checking enterprise system health...')
    setTimeout(() => {
      addOutput('success', '✓ All systems operational')
      addOutput('ascii', `
⚡ ENTERPRISE SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFRASTRUCTURE HEALTH:
├─ API Gateway:           🟢 OPERATIONAL (99.97%)
├─ Model Orchestrator:    🟢 OPERATIONAL (99.99%)
├─ Load Balancer:         🟢 OPERATIONAL (100%)
├─ Database Cluster:      🟢 OPERATIONAL (99.98%)
└─ Monitoring Systems:    🟢 OPERATIONAL (100%)

REGIONAL STATUS:
├─ US-East (Primary):     🟢 HEALTHY
├─ US-West (Secondary):   🟢 HEALTHY  
├─ EU-Central:           🟢 HEALTHY
├─ APAC-Southeast:       🟢 HEALTHY
└─ Data Residency:       🟢 COMPLIANT

ENTERPRISE SERVICES:
├─ Model Deployment:      🟢 AVAILABLE (avg 23s)
├─ Enterprise Support:    🟢 AVAILABLE (avg 8m response)
├─ Security Monitoring:   🟢 ACTIVE (24/7 SOC)
├─ Compliance Reporting:  🟢 CURRENT (updated hourly)
└─ Backup Systems:       🟢 SYNCHRONIZED (3x redundancy)

Current Uptime: 99.97% (Last 30 days)
Next Maintenance: Scheduled for Sunday 3:00 AM EST`)
    }, 2000)
  }

  const showContact = () => {
    addOutput('info', 'Connecting to enterprise sales team...')
    setTimeout(() => {
      addOutput('success', '✓ Enterprise sales team notified')
      addOutput('ascii', `
📞 ENTERPRISE SALES & SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SALES TEAM:
├─ Enterprise Sales: sales@scientiacapital.com
├─ C-Suite Briefings: executives@scientiacapital.com
├─ Technical Architects: solutions@scientiacapital.com
└─ Security Reviews: security@scientiacapital.com

SUPPORT CHANNELS:
├─ Priority Support: +1 (555) SCIENTIA
├─ Emergency Escalation: +1 (555) AI-URGENT
├─ Account Management: success@scientiacapital.com
└─ Technical Support: support@scientiacapital.com

OFFICE LOCATIONS:
├─ New York (HQ): Financial District
├─ San Francisco: SOMA Tech Hub
├─ London: Canary Wharf  
├─ Singapore: Marina Bay
└─ Frankfurt: Banking Quarter

🚀 NEXT STEPS:
   1. Executive demo call (available within 24 hours)
   2. Technical architecture review
   3. Security & compliance audit
   4. Pilot program deployment (7-14 days)
   5. Enterprise rollout & training`)
    }, 2000)
  }

  const deployEnterpriseModel = (model: string) => {
    addOutput('loading', `Deploying enterprise model: ${model}`)
    addOutput('info', 'Initializing secure enterprise deployment pipeline...')
    
    setTimeout(() => {
      addOutput('success', '✓ Security validation passed')
      addOutput('info', 'Provisioning dedicated enterprise infrastructure...')
    }, 1000)
    
    setTimeout(() => {
      addOutput('success', '✓ Enterprise infrastructure ready')
      addOutput('info', 'Deploying model with enterprise SLA guarantees...')
      addOutput('progress', 'Deployment Progress', 45)
    }, 2000)
    
    setTimeout(() => {
      addOutput('progress', 'Deployment Progress', 75)
      addOutput('info', 'Configuring compliance & audit logging...')
    }, 3000)
    
    setTimeout(() => {
      addOutput('progress', 'Deployment Progress', 100)
      addOutput('success', `✓ ${model} deployed successfully`)
      addOutput('ascii', `
🏢 ENTERPRISE MODEL DEPLOYMENT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Model: ${model}
Status: PRODUCTION READY
Endpoint: https://api.scientiacapital.com/v1/models/${model}
SLA: 99.9% uptime guarantee
Security: SOC 2 compliant endpoint
Support: 24/7 enterprise support included

Ready for Fortune 500 workloads!`)
    }, 4000)
  }

  const retroBanner = `
╔══════════════════════════════════════════════════════════════╗
║  ██████  ██████ ██ ███████ ███    ██ ████████ ██  █████      ║
║  ██      ██      ██ ██      ████   ██    ██    ██ ██   ██     ║
║  ███████ ██      ██ █████   ██ ██  ██    ██    ██ ███████     ║
║       ██ ██      ██ ██      ██  ██ ██    ██    ██ ██   ██     ║
║  ██████   ██████ ██ ███████ ██   ████    ██    ██ ██   ██     ║
║                                                              ║
║   ██████  █████  ██████  ██ ████████  █████  ██              ║
║  ██      ██   ██ ██   ██ ██    ██    ██   ██ ██              ║
║  ██      ███████ ██████  ██    ██    ███████ ██              ║
║  ██      ██   ██ ██      ██    ██    ██   ██ ██              ║
║   ██████ ██   ██ ██      ██    ██    ██   ██ ███████         ║
║                                                              ║
║        🏢 ENTERPRISE AI COMMAND CENTER 🏢                   ║
║                                                              ║
║    Fortune 500 Grade • C-Suite Ready • 97% Cost Savings     ║
╚══════════════════════════════════════════════════════════════╝

EXECUTIVE SUMMARY: Transform your enterprise AI infrastructure
TYPE 'help' for executive command reference
TYPE 'demo' to schedule C-suite presentation
TYPE 'roi' for financial impact analysis
`

  return (
    <div className={`min-h-screen ${styles.terminalContainer} theme-enterprise`}>
      {/* Executive Header */}
      <div className={styles.enterpriseHeader}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-amber-400">SCIENTIA CAPITAL</div>
            <div className="text-sm text-green-400">Enterprise AI Platform</div>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">SOC 2 COMPLIANT</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">99.9% UPTIME</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-amber-400">ENTERPRISE READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Terminal Interface */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Terminal */}
          <div className="lg:col-span-2">
            <TerminalWindow 
              title="Scientia Capital Enterprise Command Center"
              onCommand={handleCommand}
              currentCommand={currentCommand}
              setCurrentCommand={setCurrentCommand}
              isProcessing={isProcessing}
              bootMessage={retroBanner}
            >
              <TerminalOutput 
                lines={outputLines}
                typeSpeed={30}
                showCursor={!isProcessing}
              />
            </TerminalWindow>
          </div>

          {/* Enterprise Metrics Dashboard */}
          <div className="space-y-6">
            {/* Cost Savings */}
            <Card className={styles.enterpriseMetricCard}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-400">Cost Reduction</h3>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    ACTIVE
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {enterpriseMetrics.costSavings}%
                </div>
                <Progress value={enterpriseMetrics.costSavings} className="mb-3" />
                <p className="text-sm text-gray-400">vs traditional AI APIs</p>
              </div>
            </Card>

            {/* Model Access */}
            <Card className={styles.enterpriseMetricCard}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-400">Models Available</h3>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                    UNLIMITED
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {enterpriseMetrics.modelsDeployed.toLocaleString()}+
                </div>
                <p className="text-sm text-gray-400">Enterprise-grade models</p>
              </div>
            </Card>

            {/* System Uptime */}
            <Card className={styles.enterpriseMetricCard}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-400">SLA Uptime</h3>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    GUARANTEED
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {enterpriseMetrics.uptime}%
                </div>
                <Progress value={enterpriseMetrics.uptime} className="mb-3" />
                <p className="text-sm text-gray-400">24/7 monitoring & support</p>
              </div>
            </Card>

            {/* Compliance Score */}
            <Card className={styles.enterpriseMetricCard}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-400">Compliance</h3>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    CERTIFIED
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {enterpriseMetrics.compliance}%
                </div>
                <Progress value={enterpriseMetrics.compliance} className="mb-3" />
                <p className="text-sm text-gray-400">SOC 2, GDPR, HIPAA ready</p>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className={styles.enterpriseMetricCard}>
              <div className="p-6">
                <h3 className="text-lg font-bold text-green-400 mb-4">Executive Actions</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full text-amber-400 border-amber-400 hover:bg-amber-400/10"
                    onClick={() => handleCommand('demo')}
                  >
                    📊 Schedule C-Suite Demo
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-green-400 border-green-400 hover:bg-green-400/10"
                    onClick={() => handleCommand('roi')}
                  >
                    💰 Calculate ROI
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
                    onClick={() => handleCommand('compliance')}
                  >
                    🔒 View Compliance
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Status */}
        <div className={`${styles.enterpriseFooter} mt-8 p-4 text-center`}>
          <div className="flex justify-center items-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Fortune 500 Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span>Enterprise Support 24/7</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>C-Suite Analytics Dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
