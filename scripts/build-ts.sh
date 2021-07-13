#!/bin/bash

set -e
PATH=$(yarn bin):$PATH

rm -rf lib src/data/icons/react*
bash ./scripts/sync-families-dispatch.sh
node scripts/buildReactIcons.js
node scripts/buildReactFlags.js

export NODE_ENV=production
tsc --project src/tsconfig.json


# (
#     cd ../../flow-support
#     yarn copy
# )
