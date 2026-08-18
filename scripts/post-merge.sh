#!/usr/bin/env bash
set -e

# Install dependencies for both packages after a merge.
npm install --prefix client
npm install --prefix server
