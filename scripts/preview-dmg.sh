#!/bin/bash
# usage: preview-dmg.sh <Ardia.app> <out dir>
#   Packs an ad-hoc signed build as "Ardia Preview" (its own bundle id and data folder, no update feed)
#   into an unsigned DMG beside the real Ardia, and prints the DMG's path.
set -euo pipefail

usage="usage: preview-dmg.sh <Ardia.app> <out dir>"
case "${1:-}" in -h | --help) sed -n '2,4p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;; esac
app="${1:?$usage}"
out="${2:?$usage}"
name="Ardia Preview"
bundle_id="com.ardia.browser.preview"
die() { echo "error: $*" >&2; exit 1; }

[ -d "$app/Contents/Frameworks/Chromium Framework.framework" ] || die "$app has no Chromium Framework.framework"
mkdir -p "$out"
staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT
preview="$staging/$name.app"
ditto "$app" "$preview"

plist="$preview/Contents/Info.plist"
buddy() { /usr/libexec/PlistBuddy -c "$1" "$plist"; }
buddy "Set :CFBundleIdentifier $bundle_id"
buddy "Set :CFBundleName $name"
buddy "Delete :CFBundleDisplayName" 2>/dev/null || true
buddy "Add :CFBundleDisplayName string $name"
for key in SUFeedURL SUPublicEDKey SUEnableAutomaticChecks SUAutomaticallyUpdate SUScheduledCheckInterval; do
  buddy "Delete :$key" 2>/dev/null || true
done

codesign --force --sign - "$preview"
codesign --verify --deep --strict "$preview" || die "the preview's signature doesn't verify"

version="$(buddy "Print :CFBundleShortVersionString")"
commit="$(git -C "$(dirname "$0")/.." rev-parse --short HEAD 2>/dev/null || echo local)"
dmg="$out/Ardia-Preview-$version-$commit.dmg"
ln -s /Applications "$staging/Applications"
hdiutil create -volname "$name" -srcfolder "$staging" -format UDZO -fs HFS+ -ov "$dmg" >/dev/null
echo "$dmg"
