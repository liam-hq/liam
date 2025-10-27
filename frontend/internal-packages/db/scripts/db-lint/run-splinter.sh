#!/bin/bash
set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPLINTER_SQL="${SCRIPT_DIR}/splinter.sql"

if [ -z "${DATABASE_URL}" ]; then
  echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
  echo "Please set DATABASE_URL to your Supabase database connection string"
  exit 1
fi

if [ ! -f "${SPLINTER_SQL}" ]; then
  echo -e "${RED}Error: splinter.sql not found at ${SPLINTER_SQL}${NC}"
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Running Splinter Database Lints${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

TEMP_RESULTS=$(mktemp)

psql "${DATABASE_URL}" -t -A -F$'\t' -q -c "$(cat "${SPLINTER_SQL}")" > "${TEMP_RESULTS}" 2>&1
psql_status=$?

if [ "${SPLINTER_DEBUG:-0}" != "0" ]; then
  echo "DEBUG: Raw output line count: $(wc -l < "${TEMP_RESULTS}")"
  echo "DEBUG: First 5 lines:"
  head -5 "${TEMP_RESULTS}"
  echo "DEBUG: Hex dump of first line:"
  if [ -s "${TEMP_RESULTS}" ]; then
    head -1 "${TEMP_RESULTS}" | od -An -tx1
  else
    echo "(empty)"
  fi
  echo "DEBUG: Exit status from psql: ${psql_status}"
fi

if [ ${psql_status} -ne 0 ]; then
  echo -e "${RED}Error executing Splinter query:${NC}"
  cat "${TEMP_RESULTS}"
  rm -f "${TEMP_RESULTS}"
  exit 1
fi

# Count only lines with non-empty name field (first column)
ISSUE_COUNT=$(awk -F$'\t' '$1 != ""' "${TEMP_RESULTS}" | wc -l | tr -d ' ')

if [ "${ISSUE_COUNT}" -eq 0 ]; then
  echo -e "${GREEN}✓ No database schema issues found!${NC}"
  echo ""
  rm -f "${TEMP_RESULTS}"
  exit 0
fi

echo -e "${YELLOW}Found ${ISSUE_COUNT} database schema issue(s):${NC}"
echo ""

ERROR_COUNT=0
WARN_COUNT=0
INFO_COUNT=0

while IFS=$'\t' read -r name title level facing categories description detail remediation metadata cache_key; do
  if [ -z "${name}" ]; then
    continue
  fi
  
  case "${level}" in
    ERROR)
      ERROR_COUNT=$((ERROR_COUNT + 1))
      LEVEL_COLOR="${RED}"
      ;;
    WARN)
      WARN_COUNT=$((WARN_COUNT + 1))
      LEVEL_COLOR="${YELLOW}"
      ;;
    INFO)
      INFO_COUNT=$((INFO_COUNT + 1))
      LEVEL_COLOR="${BLUE}"
      ;;
    *)
      LEVEL_COLOR="${NC}"
      ;;
  esac
  
  echo -e "${LEVEL_COLOR}[${level}] ${title}${NC}"
  echo -e "  ${detail}"
  if [ -n "${remediation}" ] && [ "${remediation}" != "null" ]; then
    echo -e "  📖 Remediation: ${remediation}"
  fi
  echo ""
done < "${TEMP_RESULTS}"

rm -f "${TEMP_RESULTS}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "  ${RED}Errors: ${ERROR_COUNT}${NC}"
echo -e "  ${YELLOW}Warnings: ${WARN_COUNT}${NC}"
echo -e "  ${BLUE}Info: ${INFO_COUNT}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "${ERROR_COUNT}" -gt 0 ] || [ "${WARN_COUNT}" -gt 0 ] || [ "${INFO_COUNT}" -gt 0 ]; then
  if [ "${ERROR_COUNT}" -gt 0 ]; then
    echo -e "${RED}❌ Database lint failed due to ERROR level issues${NC}"
  elif [ "${WARN_COUNT}" -gt 0 ]; then
    echo -e "${YELLOW}❌ Database lint failed due to WARNING level issues${NC}"
  else
    echo -e "${BLUE}❌ Database lint failed due to INFO level issues${NC}"
  fi
  exit 1
fi

echo -e "${GREEN}✓ Database lint passed${NC}"
exit 0
