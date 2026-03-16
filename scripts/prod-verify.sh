#!/usr/bin/env bash
# Production Verification Script - MoneyGeneratorApp v1.3.1
# Usage:
#   API_URL=https://api.moneygenerator.app \
#   AUTH_ADMIN_TOKEN=xxx \
#   USER_EMAIL=user@example.com \
#   USER_PASS=secret \
#   bash scripts/prod-verify.sh
#
# All four env vars are optional with sensible fallbacks; the checks that
# depend on a missing value are automatically marked FAIL and skipped.

set -euo pipefail

API="${API_URL:-https://api.moneygenerator.app}"
ADMIN_TOKEN="${AUTH_ADMIN_TOKEN:-}"
USER_EMAIL="${USER_EMAIL:-}"
USER_PASS="${USER_PASS:-}"

PASS_COUNT=0
FAIL_COUNT=0
FAILURE_LIST=""
TMPDIR="${TMPDIR:-/tmp}"

pass_check() {
  echo "  PASS  $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail_check() {
  echo "  FAIL  $1 -- $2"
  FAIL_COUNT=$((FAIL_COUNT + 1))
  FAILURE_LIST="${FAILURE_LIST}  - $1: $2\n"
}

check_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"

  if [ "$actual" = "$expected" ]; then
    pass_check "$label (HTTP $actual)"
  else
    fail_check "$label" "expected HTTP $expected, got HTTP $actual"
  fi
}

json_field() {
  local file="$1"
  local expr="$2"

  python3 -c "import json; d=json.load(open('$file')); print($expr)" 2>/dev/null \
    || node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('$file','utf8')); console.log($expr);" 2>/dev/null \
    || echo ""
}

check_webhook() {
  local path="$1"
  local status

  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API$path" \
    -H "Content-Type: application/json" \
    -d '{}')

  if [ "$status" = "404" ]; then
    fail_check "POST $path" "HTTP 404 -- route not found (deployment issue?)"
  elif [ "$status" = "400" ]; then
    pass_check "POST $path (HTTP 400 -- signature rejected, route reachable)"
  else
    pass_check "POST $path (HTTP $status -- route reachable)"
  fi
}

echo ""
echo "========================================================"
echo "  MoneyGeneratorApp -- Production Verification v1.3.1"
echo "  API endpoint : $API"
echo "========================================================"
echo ""

echo "[1/10] Health check -- GET /health"
HEALTH_STATUS=$(curl -s -o "$TMPDIR/mgapp_health.json" -w "%{http_code}" "$API/health")
check_status "GET /health" "200" "$HEALTH_STATUS"
if [ "$HEALTH_STATUS" = "200" ]; then
  if grep -q '"status":"ok"' "$TMPDIR/mgapp_health.json"; then
    pass_check 'Health body contains {"status":"ok"}'
  else
    fail_check "Health body content" 'expected "status":"ok" in response body'
  fi
fi

echo ""
echo "[2/10] Login -- POST /auth/login"
USER_TOKEN=""
if [ -z "$USER_EMAIL" ] || [ -z "$USER_PASS" ]; then
  fail_check "POST /auth/login" "USER_EMAIL and/or USER_PASS not set; skipping login and dependent checks"
else
  LOGIN_STATUS=$(curl -s -o "$TMPDIR/mgapp_login.json" -w "%{http_code}" \
    -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${USER_EMAIL}\",\"password\":\"${USER_PASS}\"}")
  check_status "POST /auth/login" "200" "$LOGIN_STATUS"
  if [ "$LOGIN_STATUS" = "200" ]; then
    USER_TOKEN=$(json_field "$TMPDIR/mgapp_login.json" "d['data']['token']")
    if [ -n "$USER_TOKEN" ]; then
      pass_check "Login token captured"
    else
      fail_check "Login token extraction" "could not parse token from response"
    fi
  fi
fi

echo ""
echo "[3/10] Authenticated profile -- GET /auth/me"
if [ -z "$USER_TOKEN" ]; then
  fail_check "GET /auth/me" "no user token available (login failed or skipped)"
else
  ME_STATUS=$(curl -s -o "$TMPDIR/mgapp_me.json" -w "%{http_code}" \
    "$API/auth/me" \
    -H "Authorization: Bearer $USER_TOKEN")
  check_status "GET /auth/me" "200" "$ME_STATUS"
  if [ "$ME_STATUS" = "200" ]; then
    if grep -q '"success":true' "$TMPDIR/mgapp_me.json"; then
      pass_check "Session confirmed -- success:true in /auth/me"
    else
      fail_check "GET /auth/me body" "expected success:true in response"
    fi
  fi
fi

echo ""
echo "[4/10] Ops overview -- GET /api/v2/ops/overview"
if [ -z "$ADMIN_TOKEN" ]; then
  fail_check "GET /api/v2/ops/overview" "AUTH_ADMIN_TOKEN not set; skipping"
else
  OPS_STATUS=$(curl -s -o "$TMPDIR/mgapp_ops.json" -w "%{http_code}" \
    "$API/api/v2/ops/overview" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  check_status "GET /api/v2/ops/overview" "200" "$OPS_STATUS"
  if [ "$OPS_STATUS" = "401" ] || [ "$OPS_STATUS" = "403" ]; then
    fail_check "Ops overview auth" "HTTP $OPS_STATUS -- verify AUTH_ADMIN_TOKEN has admin/operator/support role"
  fi
fi

echo ""
echo "[5/10] Dashboard data -- GET /api/v1/dashboard"
DASH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/v1/dashboard?userId=smoke-verify")
check_status "GET /api/v1/dashboard" "200" "$DASH_STATUS"

echo ""
echo "[6/10] Reports data -- GET /api/v2/reporting/reports"
if [ -n "$USER_TOKEN" ]; then
  RPT_STATUS=$(curl -s -o "$TMPDIR/mgapp_reports.json" -w "%{http_code}" \
    "$API/api/v2/reporting/reports" \
    -H "Authorization: Bearer $USER_TOKEN")
else
  RPT_STATUS=$(curl -s -o "$TMPDIR/mgapp_reports.json" -w "%{http_code}" \
    "$API/api/v2/reporting/reports" \
    -H "x-user-id: smoke-verify")
fi
check_status "GET /api/v2/reporting/reports" "200" "$RPT_STATUS"

echo ""
echo "[7/10] Jobs/gig platforms -- GET /api/v1/platforms and /api/v1/jobs"
PLAT_STATUS=$(curl -s -o "$TMPDIR/mgapp_platforms.json" -w "%{http_code}" "$API/api/v1/platforms")
check_status "GET /api/v1/platforms" "200" "$PLAT_STATUS"

JOBS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/v1/jobs?userId=smoke-verify")
check_status "GET /api/v1/jobs" "200" "$JOBS_STATUS"

echo ""
echo "[8/10] Storefront public -- GET /catalog (unauthenticated)"
CAT_STATUS=$(curl -s -o "$TMPDIR/mgapp_catalog.json" -w "%{http_code}" "$API/catalog")
check_status "GET /catalog" "200" "$CAT_STATUS"
if [ "$CAT_STATUS" = "200" ]; then
  if grep -q '"products"' "$TMPDIR/mgapp_catalog.json"; then
    pass_check "Catalog body contains products array"
  else
    fail_check "Catalog body" "expected products array in response"
  fi
fi

echo ""
echo "[9/10] Webhook reachability (expect HTTP 400 signature error, NOT 404)"
check_webhook "/webhooks/paypal"
check_webhook "/webhooks/plaid"
check_webhook "/api/connect/webhooks/accounts"
check_webhook "/api/payments/webhook"

echo ""
echo "[10/10] Token rejection -- GET /auth/me with an invalid token"
INVALID_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API/auth/me" \
  -H "Authorization: Bearer this.is.a.deliberately.invalid.token")
check_status "Invalid token rejection" "401" "$INVALID_STATUS"

echo ""
echo "========================================================"
echo "  Verification Summary"
echo "========================================================"
echo "  PASS : $PASS_COUNT"
echo "  FAIL : $FAIL_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo ""
  echo "  Failures:"
  printf "%b" "$FAILURE_LIST"
  echo ""
  echo "  See PRODUCTION_OPERATIONS_RUNBOOK.md -> Failure Triggers for escalation steps."
  echo ""
  exit 1
fi

echo ""
echo "  All checks passed. Production environment healthy."
echo ""
