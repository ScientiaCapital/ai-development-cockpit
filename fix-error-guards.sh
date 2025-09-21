#!/bin/bash

# Fix TypeScript error handling in test files
# Replace catch (error) with catch (error: unknown) across test files

find tests/ -name "*.ts" -type f -exec sed -i '' 's/catch (error)/catch (error: unknown)/g' {} \;

echo "✅ Fixed error type guards in test files"