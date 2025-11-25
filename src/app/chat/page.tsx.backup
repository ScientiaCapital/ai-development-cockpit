'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Settings, Sun, Moon, User, Bot, Loader2, Copy, ThumbsUp, ThumbsDown, Zap, DollarSign } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useOrganization } from '../../hooks/useOrganization'
import { useInference } from '../../hooks/useInference'
import { ChatMessage } from '../../types/vllm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
  tokenCount?: number
  responseTime?: number
  cost?: number
  status?: 'sending' | 'streaming' | 'complete' | 'error'
}

export default function ChatPage() {
  const { theme, setTheme } = useTheme()
  const { currentOrganization } = useOrganization()
  const {
    state,
    models,
    setModel,
    getRecommendedModel,
    generateStreamingText,
    estimateCost,
    formatMessagesForModel
  } = useInference({ autoScale: true, enableMetrics: true, streamingEnabled: true })

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(
    currentOrganization?.slug === 'swaggystacks'
      ? 'You are a developer-focused AI assistant specializing in coding, debugging, and technical problem-solving.'
      : 'You are a professional financial AI advisor specializing in analysis, strategy, and investment insights.'
  )
  const [maxTokens, setMaxTokens] = useState(2048)
  const [temperature, setTemperature] = useState(0.7)
  const [autoModelSelection, setAutoModelSelection] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Update system prompt when organization changes
  useEffect(() => {
    if (currentOrganization) {
      setSystemPrompt(
        currentOrganization.slug === 'swaggystacks'
          ? 'You are a developer-focused AI assistant specializing in coding, debugging, and technical problem-solving.'
          : 'You are a professional financial AI advisor specializing in analysis, strategy, and investment insights.'
      )
    }
  }, [currentOrganization])

  // Determine task complexity for auto model selection
  const analyzeTaskComplexity = useCallback((prompt: string): 'simple' | 'complex' | 'enterprise' => {
    const words = prompt.toLowerCase()

    // Enterprise-level keywords
    const enterpriseKeywords = ['strategy', 'architecture', 'complex', 'analysis', 'comprehensive', 'detailed', 'enterprise', 'advanced']
    const hasEnterpriseKeywords = enterpriseKeywords.some(keyword => words.includes(keyword))

    // Complex task indicators
    const complexKeywords = ['explain', 'implement', 'design', 'create', 'build', 'develop', 'optimize']
    const hasComplexKeywords = complexKeywords.some(keyword => words.includes(keyword))

    // Length-based complexity
    const isLongPrompt = prompt.length > 200

    if (hasEnterpriseKeywords || isLongPrompt) return 'enterprise'
    if (hasComplexKeywords || prompt.length > 100) return 'complex'
    return 'simple'
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || state.isLoading || state.isStreaming) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    // Auto-select optimal model if enabled
    let selectedModel = state.currentModel
    if (autoModelSelection && selectedModel) {
      const complexity = analyzeTaskComplexity(inputValue)
      const recommendedModel = getRecommendedModel(complexity)
      if (recommendedModel.id !== selectedModel.id) {
        setModel(recommendedModel)
        selectedModel = recommendedModel
      }
    }

    // Estimate cost
    const estimatedCost = selectedModel ? estimateCost(inputValue, maxTokens, selectedModel) : 0

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model: selectedModel?.displayName,
      cost: estimatedCost,
      status: 'sending'
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInputValue('')

    try {
      // Prepare chat context
      const chatMessages: ChatMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      chatMessages.push({ role: 'user', content: userMessage.content })

      const formattedMessages = formatMessagesForModel(chatMessages, systemPrompt)

      const request = {
        prompt: userMessage.content,
        messages: formattedMessages,
        systemPrompt,
        maxTokens,
        temperature
      }

      const startTime = Date.now()
      let accumulatedContent = ''
      let tokenCount = 0

      // Handle streaming response
      await generateStreamingText(request, (chunk) => {
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
      })

      const responseTime = Date.now() - startTime

      // Final update
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
    }
  }, [
    inputValue,
    state.isLoading,
    state.isStreaming,
    state.currentModel,
    messages,
    systemPrompt,
    maxTokens,
    temperature,
    autoModelSelection,
    analyzeTaskComplexity,
    getRecommendedModel,
    setModel,
    estimateCost,
    formatMessagesForModel,
    generateStreamingText
  ])

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

  // Apply organization-specific styling
  const isSwaggyStacks = currentOrganization?.slug === 'swaggystacks'
  const organizationClasses = isSwaggyStacks
    ? 'bg-black text-green-400 font-mono' // Terminal theme for SwaggyStacks
    : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white' // Corporate theme for Scientia

  return (
    <div className={`flex flex-col h-screen transition-colors duration-200 ${organizationClasses}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isSwaggyStacks
          ? 'border-green-400 bg-gray-900'
          : 'border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isSwaggyStacks
              ? 'bg-green-400 text-black'
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-lg font-semibold ${
              isSwaggyStacks ? 'text-green-400' : 'text-gray-900 dark:text-white'
            }`}>
              {isSwaggyStacks ? 'SwaggyStacks AI' : 'Scientia Capital AI'}
            </h1>
            <p className={`text-sm ${
              isSwaggyStacks ? 'text-green-300' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Model: {state.currentModel?.displayName || 'Loading...'}
              {autoModelSelection && ' (Auto)'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Cost Display */}
          <div className={`px-2 py-1 text-xs rounded ${
            isSwaggyStacks
              ? 'bg-gray-800 text-green-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          }`}>
            <DollarSign className="w-3 h-3 inline mr-1" />
            ${state.totalCost.toFixed(4)}
          </div>

          {/* Model Selector */}
          <select
            value={state.currentModel?.id || ''}
            onChange={(e) => {
              const model = models.find(m => m.id === e.target.value)
              if (model) setModel(model)
            }}
            className={`px-3 py-1 text-sm border rounded-lg ${
              isSwaggyStacks
                ? 'border-green-400 bg-gray-800 text-green-400'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.displayName} - ${(model.costPerToken * 1000).toFixed(4)}/1K
              </option>
            ))}
          </select>

          {/* Auto Model Toggle */}
          <button
            onClick={() => setAutoModelSelection(!autoModelSelection)}
            className={`p-2 transition-colors ${
              autoModelSelection
                ? isSwaggyStacks ? 'text-green-400' : 'text-blue-500'
                : isSwaggyStacks ? 'text-green-600' : 'text-gray-400'
            }`}
            title="Auto model selection"
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 transition-colors ${
              isSwaggyStacks
                ? 'text-green-400 hover:text-green-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Theme Toggle (only for Scientia) */}
          {!isSwaggyStacks && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          {/* Clear Chat */}
          <button
            onClick={clearChat}
            className={`px-3 py-1 text-sm transition-colors ${
              isSwaggyStacks
                ? 'text-green-400 hover:text-green-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`p-4 border-b ${
          isSwaggyStacks
            ? 'bg-gray-900 border-green-400'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isSwaggyStacks ? 'text-green-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                Max Tokens
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                min={1}
                max={8192}
                className={`w-full px-3 py-1 text-sm border rounded ${
                  isSwaggyStacks
                    ? 'border-green-400 bg-gray-800 text-green-400'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isSwaggyStacks ? 'text-green-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                Temperature
              </label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                min={0}
                max={2}
                step={0.1}
                className={`w-full px-3 py-1 text-sm border rounded ${
                  isSwaggyStacks
                    ? 'border-green-400 bg-gray-800 text-green-400'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isSwaggyStacks ? 'text-green-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                System Prompt
              </label>
              <input
                type="text"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="System prompt..."
                className={`w-full px-3 py-1 text-sm border rounded ${
                  isSwaggyStacks
                    ? 'border-green-400 bg-gray-800 text-green-400'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isSwaggyStacks
                ? 'bg-green-400 text-black'
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${
              isSwaggyStacks ? 'text-green-400' : 'text-gray-900 dark:text-white'
            }`}>
              Welcome to {isSwaggyStacks ? 'SwaggyStacks AI' : 'Scientia Capital AI'}
            </h2>
            <p className={`max-w-md ${
              isSwaggyStacks ? 'text-green-300' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {isSwaggyStacks
                ? 'Your terminal-based AI assistant for coding, debugging, and development tasks. Powered by cost-optimized models that scale with your needs.'
                : 'Your professional AI advisor for financial analysis, strategic planning, and investment insights. Intelligent model selection for optimal cost-performance.'
              }
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
                      ? isSwaggyStacks ? 'bg-green-400 text-black' : 'bg-blue-500'
                      : isSwaggyStacks ? 'bg-gray-700 text-green-400' : 'bg-gradient-to-br from-green-500 to-blue-600'
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
                        ? isSwaggyStacks
                          ? 'bg-green-400 text-black'
                          : 'bg-blue-500 text-white'
                        : isSwaggyStacks
                          ? 'bg-gray-800 text-green-300 border border-green-400'
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
                    <div className={`flex items-center space-x-2 mt-1 text-xs ${
                      isSwaggyStacks ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className={`transition-colors ${
                          isSwaggyStacks
                            ? 'hover:text-green-300'
                            : 'hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className={`transition-colors ${
                        isSwaggyStacks
                          ? 'hover:text-green-300'
                          : 'hover:text-gray-700 dark:hover:text-gray-200'
                      }`}>
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button className={`transition-colors ${
                        isSwaggyStacks
                          ? 'hover:text-green-300'
                          : 'hover:text-gray-700 dark:hover:text-gray-200'
                      }`}>
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      {message.tokenCount && (
                        <span>{message.tokenCount} tokens</span>
                      )}
                      {message.responseTime && (
                        <span>{(message.responseTime / 1000).toFixed(1)}s</span>
                      )}
                      {message.cost && (
                        <span>${message.cost.toFixed(4)}</span>
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
      <div className={`p-4 border-t ${
        isSwaggyStacks
          ? 'border-green-400 bg-gray-900'
          : 'border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isSwaggyStacks ? '> Type your command...' : 'Type your message...'}
              rows={1}
              className={`w-full px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent ${
                isSwaggyStacks
                  ? 'border-green-400 bg-gray-800 text-green-400 placeholder-green-600 focus:ring-green-400'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500'
              }`}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={state.isLoading || state.isStreaming}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || state.isLoading || state.isStreaming}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isSwaggyStacks
                ? 'bg-green-400 text-black hover:bg-green-300'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {state.isLoading || state.isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Model Description and Stats */}
        <div className={`mt-2 text-xs ${
          isSwaggyStacks ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {state.currentModel?.description} • {state.currentModel?.capabilities.join(', ')}
          {state.requestCount > 0 && (
            <span className="ml-4">
              Requests: {state.requestCount} • Total Cost: ${state.totalCost.toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}