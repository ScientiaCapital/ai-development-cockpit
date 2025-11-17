import { EventBus, AgentEvent } from '@/orchestrator/EventBus'

describe('EventBus', () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
  })

  it('should emit and receive events', () => {
    const handler = jest.fn()
    eventBus.on(AgentEvent.ReviewStarted, handler)

    const data = { projectId: 'test-123', repoPath: '/path/to/repo' }
    eventBus.emit(AgentEvent.ReviewStarted, data)

    expect(handler).toHaveBeenCalledWith(data)
  })

  it('should support multiple listeners for same event', () => {
    const handler1 = jest.fn()
    const handler2 = jest.fn()

    eventBus.on(AgentEvent.CodeGenerated, handler1)
    eventBus.on(AgentEvent.CodeGenerated, handler2)

    const data = { projectId: 'test-123', agentId: 'agent-1', files: ['test.ts'] }
    eventBus.emit(AgentEvent.CodeGenerated, data)

    expect(handler1).toHaveBeenCalledWith(data)
    expect(handler2).toHaveBeenCalledWith(data)
  })

  it('should unsubscribe listeners', () => {
    const handler = jest.fn()
    eventBus.on(AgentEvent.AgentStarted, handler)
    eventBus.off(AgentEvent.AgentStarted, handler)

    eventBus.emit(AgentEvent.AgentStarted, { projectId: 'test-123', agentType: 'CodeArchitect', agentId: 'agent-1' })

    expect(handler).not.toHaveBeenCalled()
  })
})
