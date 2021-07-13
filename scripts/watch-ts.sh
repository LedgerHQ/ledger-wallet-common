#!/bin/bash

set -e
PATH=$(yarn bin):$PATH

rm -rf lib src/data/icons/react*
bash ./scripts/sync-families-dispatch.sh
node scripts/buildReactIcons.js

tsc --watch

# (
#     cd ../../flow-support
#     yarn copy
# )
