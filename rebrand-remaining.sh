#!/bin/bash

# AI Development Cockpit - Complete Rebranding Script
# Replaces all SwaggyStacks and Scientia Capital references

set -e

echo "Starting rebranding process..."

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to safely replace in file
replace_in_file() {
    local file=$1
    local search=$2
    local replace=$3

    if [ -f "$file" ]; then
        if grep -q "$search" "$file"; then
            sed -i '' "s/$search/$replace/g" "$file"
            echo -e "${GREEN}✓${NC} Updated: $file"
        fi
    fi
}

# Target files list
FILES=(
    "src/app/api/manifest/route.ts"
    "src/app/api/metrics/route.ts"
    "src/app/api/monitoring/alerts/route.ts"
    "src/app/api/monitoring/dashboard/route.ts"
    "src/app/api/optimize/stats/route.ts"
    "src/app/auth-test/page.tsx"
    "src/app/offline/page.tsx"
    "src/components/chat/ModernChatInterface.tsx"
    "src/components/monitoring/MonitoringDashboard.tsx"
    "src/components/pwa/InstallPrompt.tsx"
    "src/components/pwa/MobileNavigation.tsx"
    "src/components/pwa/PWAProvider.tsx"
    "src/components/pwa/WebVitalsOptimizer.tsx"
    "src/components/terminal/TerminalWindow.tsx"
    "src/hooks/useInference.ts"
    "src/hooks/useOptimizer.ts"
    "src/lib/huggingface-api.ts"
    "src/services/huggingface/credentials.service.ts"
    "src/services/huggingface/integration-test.ts"
    "src/services/huggingface/integration.service.ts"
    "src/services/huggingface/rate-limiter.ts"
    "src/services/inference/streaming.service.ts"
    "src/services/modelDiscovery.ts"
    "src/services/monitoring/logging.service.ts"
    "src/types/vllm.ts"
)

echo -e "\n${BLUE}Phase 1: Updating organization identifiers${NC}"

for file in "${FILES[@]}"; do
    # Replace organization slugs
    replace_in_file "$file" "'swaggystacks'" "'arcade'"
    replace_in_file "$file" '"swaggystacks"' '"arcade"'
    replace_in_file "$file" "swaggystacks:" "arcade:"
    replace_in_file "$file" "'scientiacapital'" "'enterprise'"
    replace_in_file "$file" '"scientiacapital"' '"enterprise"'
    replace_in_file "$file" "scientiacapital:" "enterprise:"
    replace_in_file "$file" "scientia_capital" "enterprise"
    replace_in_file "$file" "scientia-capital" "enterprise"
done

echo -e "\n${BLUE}Phase 2: Updating display names and comments${NC}"

for file in "${FILES[@]}"; do
    # Replace display names
    replace_in_file "$file" "SwaggyStacks" "AI Dev Cockpit"
    replace_in_file "$file" "Scientia Capital" "Enterprise"
    replace_in_file "$file" "ScientiaCapital" "Enterprise"
    replace_in_file "$file" "SWAGGY" "COCKPIT"
done

echo -e "\n${BLUE}Phase 3: Updating environment variable names${NC}"

for file in "${FILES[@]}"; do
    # Update env var references
    replace_in_file "$file" "SWAGGYSTACKS_" "ARCADE_"
    replace_in_file "$file" "SCIENTIACAPITAL_" "ENTERPRISE_"
done

echo -e "\n${GREEN}Rebranding complete!${NC}"
echo ""
echo "Summary of changes:"
echo "  - 'swaggystacks' → 'arcade'"
echo "  - 'scientiacapital' → 'enterprise'"
echo "  - 'SwaggyStacks' → 'AI Dev Cockpit'"
echo "  - 'Scientia Capital' → 'Enterprise'"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Run tests: npm test"
echo "  3. Update environment variables in .env files"
echo "  4. Commit changes: git add . && git commit -m 'refactor: complete rebrand to AI Dev Cockpit'"
