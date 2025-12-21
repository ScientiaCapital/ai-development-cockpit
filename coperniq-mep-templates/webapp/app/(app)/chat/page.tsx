'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, FileText, Briefcase, FileOutput, Loader2 } from 'lucide-react'

const agents = [
  {
    id: 'formfiller',
    name: 'FormFiller',
    icon: FileText,
    description: 'Auto-fill templates with job data',
    color: 'bg-blue-500',
    examples: [
      'Fill out AC inspection for 456 Elm St',
      'Complete furnace safety for Martinez job',
    ],
  },
  {
    id: 'jobhelper',
    name: 'JobHelper',
    icon: Briefcase,
    description: 'Search jobs and customer history',
    color: 'bg-green-500',
    examples: [
      "What's on my schedule today?",
      'Show me all jobs for Jennifer Chen',
    ],
  },
  {
    id: 'docgen',
    name: 'DocGen',
    icon: FileOutput,
    description: 'Generate invoices and proposals',
    color: 'bg-purple-500',
    examples: [
      'Create invoice for the Martinez AC repair',
      'Generate proposal for new HVAC system',
    ],
  },
]

export default function ChatPage() {
  const [activeAgent, setActiveAgent] = useState('formfiller')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || isLoading) return

    const userMessage = message
    setMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: activeAgent,
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      })

      const data = await response.json()

      if (data.error) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error}` },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.message },
        ])
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${error instanceof Error ? error.message : 'Failed to connect'}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const currentAgent = agents.find(a => a.id === activeAgent)!

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Chat with specialized AI agents to help with your work
          </p>
        </div>

        {/* Agent Tabs */}
        <div className="flex gap-2 mb-6">
          {agents.map(agent => {
            const Icon = agent.icon
            return (
              <Button
                key={agent.id}
                variant={activeAgent === agent.id ? 'default' : 'outline'}
                className={activeAgent === agent.id ? 'bg-coperniq-primary hover:bg-coperniq-primary-hover' : ''}
                onClick={() => setActiveAgent(agent.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {agent.name}
              </Button>
            )
          })}
        </div>

        {/* Agent Info */}
        <Card className="mb-6">
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentAgent.color}`} />
              {currentAgent.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-sm text-muted-foreground mb-3">{currentAgent.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {currentAgent.examples.map(example => (
                <Badge
                  key={example}
                  variant="outline"
                  className="cursor-pointer hover:bg-coperniq-primary/10"
                  onClick={() => setMessage(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="mb-4">
          <CardContent className="p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Start a conversation with {currentAgent.name}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-coperniq-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Ask ${currentAgent.name}...`}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            className="bg-coperniq-primary hover:bg-coperniq-primary-hover"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
