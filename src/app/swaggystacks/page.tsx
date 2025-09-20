'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function SwaggyStacksPage() {
  const [terminalText, setTerminalText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  const fullText = '> npm install @ai/everything --save-dev'

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTerminalText(fullText.slice(0, i + 1))
        i++
      } else {
        setIsTyping(false)
        clearInterval(timer)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white theme-swaggystacks">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-green-400 rounded-lg"></div>
              <span className="text-xl font-bold">SwaggyStacks</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a>
              <a href="#docs" className="hover:text-purple-400 transition-colors">Docs</a>
            </div>
            <button className="bg-gradient-to-r from-purple-500 to-green-500 px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-green-600 transition-all">
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-green-400 to-yellow-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Ship AI Products
            <br />
            <span className="terminal-glow">10x Faster</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Access 500,000+ AI models for <span className="text-green-400 font-semibold">$0.001/token</span> instead of
            <span className="text-red-400 line-through"> $0.03/token</span>.
            Mobile-first discovery, one-click deployment.
          </motion.p>

          {/* Terminal Animation */}
          <motion.div
            className="bg-black/60 rounded-lg p-6 max-w-2xl mx-auto mb-8 font-mono text-left border border-green-500/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="flex items-center mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="ml-4 text-gray-400">terminal</span>
            </div>
            <div className="text-green-400">
              {terminalText}
              {isTyping && <span className="animate-terminal-cursor">|</span>}
            </div>
            {!isTyping && (
              <motion.div
                className="mt-2 text-green-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                ✓ Connected to 500,000+ models
                <br />
                ✓ RunPod serverless ready
                <br />
                ✓ Cost optimized: 97% savings
              </motion.div>
            )}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button className="bg-gradient-to-r from-purple-500 to-green-500 px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-green-600 transition-all transform hover:scale-105">
              Start Building Free
            </button>
            <button className="border border-purple-500 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-500/20 transition-all">
              View GitHub
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Developer-First Features</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Mobile Discovery",
                description: "Browse 500k+ models on your phone. Save favorites, compare performance metrics.",
                icon: "📱",
              },
              {
                title: "One-Click Deploy",
                description: "RunPod serverless endpoints created instantly. No YAML, no Docker, no pain.",
                icon: "🚀",
              },
              {
                title: "Cost Optimizer",
                description: "Automatically route to cheapest model that meets your quality requirements.",
                icon: "💰",
              },
              {
                title: "IDE Integration",
                description: "QR codes to sync configs with Cursor, VS Code, Claude Code. Works offline.",
                icon: "🔧",
              },
              {
                title: "Western LLM Bridge",
                description: "Drop-in replacement for OpenAI/Anthropic APIs. Same interface, 97% savings.",
                icon: "🌉",
              },
              {
                title: "Open Source",
                description: "MIT licensed. Self-host, modify, contribute. No vendor lock-in ever.",
                icon: "🔓",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-800/50 p-6 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-purple-400">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Stop Overpaying for AI</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-900/30 p-8 rounded-lg border border-red-500/30">
              <h3 className="text-2xl font-bold mb-4 text-red-400">Traditional APIs</h3>
              <div className="text-4xl font-bold mb-4 text-red-400">$0.03/1K tokens</div>
              <ul className="text-left space-y-2 text-gray-300">
                <li>• OpenAI GPT-4: $30/1M tokens</li>
                <li>• Anthropic Claude: $15/1M tokens</li>
                <li>• Google Gemini: $7/1M tokens</li>
                <li>• Limited model selection</li>
                <li>• No customization</li>
              </ul>
            </div>

            <div className="bg-green-900/30 p-8 rounded-lg border border-green-500/30">
              <h3 className="text-2xl font-bold mb-4 text-green-400">SwaggyStacks</h3>
              <div className="text-4xl font-bold mb-4 text-green-400">$0.001/1K tokens</div>
              <ul className="text-left space-y-2 text-gray-300">
                <li>• 500,000+ open-source models</li>
                <li>• Fine-tuned for your use case</li>
                <li>• RunPod serverless scaling</li>
                <li>• 97% cost reduction</li>
                <li>• Full customization</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-green-400 rounded-lg"></div>
            <span className="text-xl font-bold">SwaggyStacks</span>
          </div>
          <p className="text-gray-400 mb-4">Built by developers, for developers</p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Discord</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Docs</a>
            <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  )
}