#!/bin/bash
# wx-debug install script
# Usage: curl -fsSL https://raw.githubusercontent.com/tonetcn/wx-debug/master/install.sh | bash

set -e

REPO="tonetcn/wx-debug"
BRANCH="master"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
TARGET_DIR=".claude/skills/wx-debug"

echo ""
echo "wx-debug installer"
echo "=================="
echo ""

# Create target directory
echo "Creating directory: ${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"

# Download files
echo "Downloading files..."

echo "  - SKILL.md"
curl -fsSL "${BASE_URL}/SKILL.md" -o "${TARGET_DIR}/SKILL.md"

echo "  - wx-debug.js"
curl -fsSL "${BASE_URL}/bin/wx-debug.js" -o "${TARGET_DIR}/wx-debug.js"

echo "  - lib/"
mkdir -p "${TARGET_DIR}/lib"
curl -fsSL "${BASE_URL}/lib/cli.js" -o "${TARGET_DIR}/lib/cli.js"
curl -fsSL "${BASE_URL}/lib/cdp.js" -o "${TARGET_DIR}/lib/cdp.js"
curl -fsSL "${BASE_URL}/lib/config.js" -o "${TARGET_DIR}/lib/config.js"

echo "  - lib/commands/"
mkdir -p "${TARGET_DIR}/lib/commands"
for cmd in read screenshot console errors network dom css eval storage click input; do
    curl -fsSL "${BASE_URL}/lib/commands/${cmd}.js" -o "${TARGET_DIR}/lib/commands/${cmd}.js"
done

echo "  - package.json"
curl -fsSL "${BASE_URL}/package.json" -o "${TARGET_DIR}/package.json"

# Install dependencies
echo "Installing dependencies..."
cd "${TARGET_DIR}"
npm install --production 2>/dev/null || echo "Warning: npm install failed, please run manually: cd ${TARGET_DIR} && npm install"
cd - > /dev/null

echo ""
echo "Done! wx-debug installed to: ${TARGET_DIR}/"
echo ""
echo "Usage:"
echo "  1. Start WeChat DevTools with debug port:"
echo '     "WeChat DevTools.exe" --remote-debugging-port=19890'
echo ""
echo "  2. Use in Claude Code:"
echo "     /wx-debug read"
echo "     /wx-debug screenshot"
echo "     /wx-debug console"
echo ""
echo "Docs: https://github.com/${REPO}"
echo ""
