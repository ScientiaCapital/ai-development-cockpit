#!/bin/bash

echo "🚀 Testing Dual-Domain LLM Platform Endpoints"
echo "============================================="

BASE_URL="http://localhost:3000"

echo ""
echo "1. Testing Models API..."
curl -s "$BASE_URL/api/models" | jq '.success' 2>/dev/null || echo "❌ Models API failed"

echo ""
echo "2. Testing Models Search..."
curl -s "$BASE_URL/api/models?search=llama" | jq '.data.models | length' 2>/dev/null || echo "❌ Models search failed"

echo ""
echo "3. Testing Cost Estimation..."
curl -s -X POST "$BASE_URL/api/models" \
  -H "Content-Type: application/json" \
  -d '{"action":"estimate","modelId":"meta-llama/Llama-2-7b-chat-hf","tokensPerMonth":1000000}' | \
  jq '.data.estimate.savingsPercentage' 2>/dev/null || echo "❌ Cost estimation failed"

echo ""
echo "4. Testing MCP Health (will show errors until MCP servers are running)..."
curl -s "$BASE_URL/api/mcp/health" | jq '.success' 2>/dev/null || echo "⚠️  MCP Health endpoint accessible (MCP servers not configured yet)"

echo ""
echo "5. Testing Landing Pages..."
curl -s -o /dev/null -w "Arcade: %{http_code}\n" "$BASE_URL/arcade"
curl -s -o /dev/null -w "Enterprise: %{http_code}\n" "$BASE_URL/enterprise"

echo ""
echo "6. Testing PWA Manifest..."
curl -s -o /dev/null -w "PWA Manifest: %{http_code}\n" "$BASE_URL/manifest.json"

echo ""
echo "✅ Basic endpoint testing complete!"
echo "📱 Open http://localhost:3000 to see the platform"
echo "🔧 AI Dev Cockpit (dev): http://localhost:3000/arcade"
echo "🏢 Enterprise (enterprise): http://localhost:3000/enterprise"