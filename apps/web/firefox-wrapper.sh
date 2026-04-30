#!/bin/bash
# Wrapper to launch snap Firefox through snap run, bypassing namespace restrictions
exec snap run firefox "$@"
