
#!/bin/bash
set -euo pipefail

set -a
source .env
set +a

echo "source      -> $SRC_DIR"
echo "destination -> $DEST_DIR"

# SRC="/Volumes/edata/vscode/moeits_staff-astro-htmx"
# DEST="/Volumes/www/"
EXCLUDE_FILE="${SRC_DIR}/.rsyncignore"

# -a archive, -v verbose, -h human, --delete mirror deletions, --progress progress bar
rsync -avh --progress --delete \
  --exclude-from="$EXCLUDE_FILE" \
  "$SRC_DIR" "$DEST_DIR"

echo "Files successfully synced from $SRC_DIR to $DEST_DIR"
``
