#!/usr/bin/env bash
# Build the orbital mechanics shared library for the current platform.
# Usage: bash scripts/build_engine.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SRC="$PROJECT_ROOT/orbital_mechanics.cpp"

if [ ! -f "$SRC" ]; then
    echo "Error: $SRC not found." >&2
    exit 1
fi

OS="$(uname -s)"

case "$OS" in
    Linux)
        OUT="$PROJECT_ROOT/liborbital.so"
        echo "Building for Linux -> $OUT"
        g++ -O2 -shared -fPIC -o "$OUT" "$SRC"
        ;;
    Darwin)
        OUT="$PROJECT_ROOT/liborbital.dylib"
        echo "Building for macOS -> $OUT"
        g++ -O2 -shared -fPIC -o "$OUT" "$SRC"
        ;;
    MINGW*|MSYS*)
        OUT="$PROJECT_ROOT/orbital.dll"
        echo "Building for Windows (MSYS/MinGW) -> $OUT"
        g++ -O2 -shared -o "$OUT" "$SRC"
        ;;
    *)
        echo "Error: Unsupported OS '$OS'." >&2
        exit 1
        ;;
esac

echo "Build successful: $OUT"
