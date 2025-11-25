'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Settings, Sun, Moon, User, Bot, Loader2, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { VLLMService } from '../../services/runpod/vllm.service'
import { InferenceRequest, InferenceResponse, StreamingInferenceResponse, ChatMessage } from '../../types/vllm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
  tokenCount?: number
  responseTime?: number
  status?: 'sending' | 'streaming' | 'complete' | 'error'
}

interface ModelOption {
  id: string
  name: string
  displayName: string
  costPerToken: number
  description: string
  capabilities: string[]
}

const DEFAULT_MODELS: ModelOption[] = [
  {
    id: 'meta-llama/Llama-3.2-3B-Instruct',
    name: 'llama-3.2-3b',
    displayName: 'Llama 3.2 3B',
    costPerToken: 0.0001,
    description: 'Fast and efficient for simple tasks',
    capabilities: ['chat', 'basic-reasoning']
  },
  {
    id: 'microsoft/DialoGPT-medium',
    name: 'dialogpt-medium',
    displayName: 'DialoGPT Medium',
    costPerToken: 0.0002,
    description: 'Optimized for conversational AI',
    capabilities: ['chat', 'dialogue', 'multi-turn']
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'mistral-7b',
    displayName: 'Mistral 7B Instruct',
    costPerToken: 0.0003,
    description: 'Balanced performance and capability',
    capabilities: ['chat', 'reasoning', 'code']
  }
]

export function ModernChatInterface() {
  const { theme, setTheme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelOption>(DEFAULT_MODELS[0])
  const [showSettings, setShowSettings] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.')
  const [maxTokens, setMaxTokens] = useState(2048)
  const [temperature, setTemperature] = useState(0.7)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const vllmService = useRef<VLLMService | null>(null)

  // Initialize vLLM service
  useEffect(() => {
    const config = {
      endpointId: process.env.NEXT_PUBLIC_RUNPOD_ENDPOINT_ID || '',
      apiKey: process.env.RUNPOD_API_KEY || '',
      modelName: process.env.NEXT_PUBLIC_RUNPOD_VLLM_MODEL_NAME || selectedModel.name,
      timeout: parseInt(process.env.VLLM_TIMEOUT || '120000'),
      retries: parseInt(process.env.VLLM_RETRIES || '3')
    }

    if (config.endpointId && config.apiKey) {
      vllmService.current = new VLLMService(config)
    }
  }, [selectedModel])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !vllmService.current) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model: selectedModel.displayName,
      status: 'sending'
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Prepare chat messages for context
      const chatMessages: ChatMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      chatMessages.push({ role: 'user', content: userMessage.content })

      const request: InferenceRequest = {
        prompt: userMessage.content,
        messages: chatMessages,
        systemPrompt,
        maxTokens,
        temperature,
        stream: true,
        apiType: 'openai' // Use OpenAI-compatible for chat
      }

      const startTime = Date.now()
      let accumulatedContent = ''
      let tokenCount = 0

      // Update message status to streaming
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, status: 'streaming' }
          : msg
      ))

      // Handle streaming response
      await vllmService.current.generateStreamingText(
        request,
        (chunk: StreamingInferenceResponse) => {
          if (chunk.chunk) {
            accumulatedContent += chunk.chunk
            tokenCount = chunk.usage?.completionTokens || tokenCount + 1

            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: accumulatedContent,
                    tokenCount,
                    status: chunk.isComplete ? 'complete' : 'streaming'
                  }
                : msg
            ))
          }
        }
      )

      const responseTime = Date.now() - startTime

      // Final update with response time
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              content: accumulatedContent,
              tokenCount,
              responseTime,
              status: 'complete'
            }
          : msg
      ))

    } catch (error) {
      console.error('Error generating response:', error)

      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              content: 'Sorry, I encountered an error while processing your request. Please try again.',
              status: 'error'
            }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, messages, selectedModel, systemPrompt, maxTokens, temperature])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Model: {selectedModel.displayName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Model Selector */}
          <select
            value={selectedModel.id}
            onChange={(e) => {
              const model = DEFAULT_MODELS.find(m => m.id === e.target.value)
              if (model) setSelectedModel(model)
            }}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {DEFAULT_MODELS.map(model => (
              <option key={model.id} value={model.id}>
                {model.displayName} - ${(model.costPerToken * 1000).toFixed(4)}/1K tokens
              </option>
            ))}
          </select>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Clear Chat */}
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                min={1}
                max={8192}
                className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temperature
              </label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                min={0}
                max={2}
                step={0.1}
                className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                System Prompt
              </label>
              <input
                type="text"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="System prompt..."
                className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to AI Assistant
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Your gateway to MCP servers for AI Dev Cockpit and Enterprise.
              Choose from cost-effective models for different task complexities.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-blue-500'
                      : 'bg-gradient-to-br from-green-500 to-blue-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    } ${message.status === 'streaming' ? 'animate-pulse' : ''}`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                      {message.status === 'streaming' && (
                        <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Message Actions and Metadata */}
                  {message.role === 'assistant' && message.content && (
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      {message.tokenCount && (
                        <span>{message.tokenCount} tokens</span>
                      )}
                      {message.responseTime && (
                        <span>{(message.responseTime / 1000).toFixed(1)}s</span>
                      )}
                      {message.model && (
                        <span>{message.model}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Model Description */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {selectedModel.description} • {selectedModel.capabilities.join(', ')}
        </div>
      </div>
    </div>
  )
}