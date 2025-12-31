package com.moneygeneratorapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    WindowCompat.setDecorFitsSystemWindows(window, false)

    setContent {
      var isDark by remember { mutableStateOf(false) }

      MoneyGeneratorTheme(isDark) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background,
        ) {
          MoneyGeneratorScreen(onToggleTheme = { isDark = !isDark })
        }
      }
    }
  }
}

@Composable
private fun MoneyGeneratorScreen(onToggleTheme: () -> Unit) {
  val colorTokens = LocalColorTokens.current

  Column(
      modifier =
          Modifier
              .fillMaxSize()
              .background(colorTokens.background)
              .padding(
                  top = 48.dp,
                  start = 20.dp,
                  end = 20.dp,
                  bottom = 32.dp,
              )
              .verticalScroll(rememberScrollState()),
      verticalArrangement = Arrangement.spacedBy(22.dp),
  ) {
    HeroCard(
        title = "Money Generator OS for Gig Workers",
        description =
            "Orchestrate earnings, benefits, and workflows through a single Master Key. Aggregate jobs, automate financial health, and plug into verified third-party tools with enterprise-grade compliance.",
        badge = "Unified API Gateway",
        stats =
            listOf(
                StatItem("Market trajectory", "$2.1T by 2034"),
                StatItem("Coverage", "20+ partner APIs"),
                StatItem("Payout latency", "< 60s to card"),
                StatItem("Security", "SOC2 + KYC-first"),
            ),
        onPrimaryClick = onToggleTheme,
        onSecondaryClick = {},
    )

    Section(
        title = "Use-case specific workflows",
        description =
            "Ready-made control planes for common gig modes with smart automations baked in.",
    ) {
      CardGrid {
        workflows.forEach {
          CardContainer {
            CardHeader(title = it.title, pill = it.mode)
            CardBody(it.description)
            TagRow(tags = it.highlights)
          }
        }
      }
    }

    Section(
        title = "Integration Hub",
        description =
            "Pre-verified partners delivered through the Master Key so users never manage individual credentials.",
    ) {
      CardGrid {
        integrations.forEach {
          CardContainer {
            CardHeader(title = it.title, pill = it.category)
            CardBody(it.description)
            TagRow(tags = it.tags)
          }
        }
      }
    }

    Section(
        title = "Master Key architecture",
        description =
            "One token, many providers. Our proxy layer routes to the optimal downstream service with markup, KYC, and observability baked in.",
    ) {
      CardContainer {
        ArchitectureRow(items = architecture)
        CodeBlock(
            text =
                """
POST /api/v1/payout
Authorization: Bearer MASTER_KEY
{
  "amount": 150,
  "destination": "debit_card"
}"""
                    .trimIndent(),
            hint =
                "Proxy adds markup, checks tier, and routes to optimal provider (Stripe/Unit) using enterprise creds.",
        )
      }
    }

    Section(
        title = "Outbound calls & webhooks at scale",
        description =
            "Observable, idempotent delivery for provider callbacks, customer webhooks, and fan-out to internal services.",
    ) {
      CardContainer {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
          webhooks.forEach { item ->
            ListRow(title = item.title, description = item.description)
          }
        }
      }
    }

    Section(
        title = "Monetization & pricing",
        description =
            "Stacked revenue levers with transparent pricing that scales with throughput.",
    ) {
      CardGrid {
        monetization.forEach {
          CardContainer {
            CardHeader(title = it.title, pill = it.model)
            CardBody(it.description)
            TagRow(tags = it.notes)
          }
        }
      }
    }

    Section(
        title = "Risk & compliance guardrails",
        description = "Pre-baked controls to keep enterprise keys safe and traffic auditable.",
    ) {
      CardContainer {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
          risks.forEach { risk ->
            ListRow(title = risk.title, description = risk.description)
          }
        }
      }
    }

    Section(
        title = "Deployment readiness",
        description = "Prioritized next steps to ship the MVP and expand coverage fast.",
    ) {
      CardContainer {
        TagRow(tags = deployment)
      }
    }
  }
}

@Composable
private fun HeroCard(
    title: String,
    description: String,
    badge: String,
    stats: List<StatItem>,
    onPrimaryClick: () -> Unit,
    onSecondaryClick: () -> Unit,
) {
  val colors = LocalColorTokens.current

  Column(
      modifier =
          Modifier
              .fillMaxWidth()
              .background(colors.heroBackground, shape = RoundedCornerShape(20.dp))
              .padding(20.dp),
      verticalArrangement = Arrangement.spacedBy(14.dp),
  ) {
    Pill(text = badge, accent = true)
    Text(
        text = title,
        style = MaterialTheme.typography.headlineSmall.copy(
            color = colors.onHero, fontWeight = FontWeight.ExtraBold, lineHeight = 32.sp),
    )
    Text(
        text = description,
        style = MaterialTheme.typography.bodyMedium.copy(color = colors.subtle),
    )

    Row(
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
      Button(
          onClick = onPrimaryClick,
          colors =
              ButtonDefaults.buttonColors(
                  containerColor = colors.accent,
                  contentColor = colors.onAccent,
              ),
          shape = RoundedCornerShape(12.dp),
      ) {
        Text("Launch Control Center", style = MaterialTheme.typography.labelLarge)
      }
      OutlinedButton(
          onClick = onSecondaryClick,
          colors =
              ButtonDefaults.outlinedButtonColors(
                  containerColor = colors.card,
                  contentColor = colors.text,
              ),
          shape = RoundedCornerShape(12.dp),
          border = ButtonDefaults.outlinedButtonBorder.copy(width = 1.dp),
      ) { Text("View API Catalog", style = MaterialTheme.typography.labelLarge) }
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      stats.forEach {
        Column(
            modifier =
                Modifier
                    .weight(1f)
                    .border(width = 1.dp, color = colors.border, shape = RoundedCornerShape(12.dp))
                    .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
          Text(
              text = it.value,
              style = MaterialTheme.typography.titleMedium.copy(
                  fontWeight = FontWeight.ExtraBold, color = colors.text),
          )
          Text(
              text = it.label,
              style = MaterialTheme.typography.labelSmall.copy(color = colors.subtle),
          )
        }
      }
    }
  }
}

@Composable
private fun Section(
    title: String,
    description: String,
    content: @Composable () -> Unit,
) {
  val colors = LocalColorTokens.current

  Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
      Text(
          text = title,
          style = MaterialTheme.typography.titleLarge.copy(
              fontWeight = FontWeight.ExtraBold, color = colors.text),
      )
      Text(
          text = description,
          style = MaterialTheme.typography.bodyMedium.copy(color = colors.subtle),
      )
    }
    content()
  }
}

@Composable
private fun CardGrid(content: @Composable () -> Unit) {
  Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { content() }
}

@Composable
private fun CardContainer(content: @Composable () -> Unit) {
  val colors = LocalColorTokens.current
  Column(
      modifier =
          Modifier
              .fillMaxWidth()
              .background(colors.card, RoundedCornerShape(16.dp))
              .border(1.dp, colors.border, RoundedCornerShape(16.dp))
              .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    content()
  }
}

@Composable
private fun CardHeader(title: String, pill: String) {
  val colors = LocalColorTokens.current
  Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically,
  ) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium.copy(
            fontWeight = FontWeight.ExtraBold, color = colors.text),
        modifier = Modifier.weight(1f),
    )
    Pill(text = pill)
  }
}

@Composable
private fun CardBody(text: String) {
  val colors = LocalColorTokens.current
  Text(
      text = text,
      style = MaterialTheme.typography.bodySmall.copy(color = colors.subtle, lineHeight = 18.sp),
  )
}

@Composable
private fun Pill(text: String, accent: Boolean = false) {
  val colors = LocalColorTokens.current
  Box(
      modifier =
          Modifier
              .background(
                  color = if (accent) colors.accentSoft else colors.accentSoft,
                  shape = CircleShape,
              )
              .padding(horizontal = 12.dp, vertical = 8.dp),
      contentAlignment = Alignment.Center,
  ) {
    Text(
        text = text,
        style =
            MaterialTheme.typography.labelSmall.copy(
                color = if (accent) colors.accent else colors.accent, fontWeight = FontWeight.Bold),
    )
  }
}

@Composable
@OptIn(ExperimentalLayoutApi::class)
private fun TagRow(tags: List<String>) {
  FlowRow(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(8.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp),
  ) { tags.forEach { Tag(text = it) } }
}

@Composable
private fun Tag(text: String) {
  val colors = LocalColorTokens.current
  Box(
      modifier =
          Modifier
              .background(colors.card, RoundedCornerShape(12.dp))
              .border(1.dp, colors.border, RoundedCornerShape(12.dp))
              .padding(horizontal = 12.dp, vertical = 8.dp),
      contentAlignment = Alignment.Center,
  ) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelSmall.copy(color = colors.text),
    )
  }
}

@Composable
private fun ArchitectureRow(items: List<ArchitectureItem>) {
  val colors = LocalColorTokens.current
  Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
    items.forEach { item ->
      Row(
          horizontalArrangement = Arrangement.spacedBy(10.dp),
          verticalAlignment = Alignment.Top,
          modifier = Modifier.fillMaxWidth(),
      ) {
        Box(
            modifier =
                Modifier
                    .background(colors.accentSoft, CircleShape)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
          Text(
              text = item.step,
              style = MaterialTheme.typography.labelSmall.copy(
                  color = colors.accent, fontWeight = FontWeight.Black),
          )
        }
        Column(verticalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.weight(1f)) {
          Text(
              text = item.title,
              style = MaterialTheme.typography.titleSmall.copy(
                  fontWeight = FontWeight.ExtraBold, color = colors.text),
          )
          Text(
              text = item.description,
              style = MaterialTheme.typography.bodySmall.copy(color = colors.subtle),
          )
        }
      }
    }
  }
}

@Composable
private fun CodeBlock(text: String, hint: String) {
  val colors = LocalColorTokens.current
  Column(
      verticalArrangement = Arrangement.spacedBy(8.dp),
      modifier =
          Modifier
              .fillMaxWidth()
              .background(colors.codeBackground, RoundedCornerShape(14.dp))
              .padding(14.dp),
  ) {
    Text(
        text = text,
        color = colors.codeText,
        fontFamily = FontFamily.Monospace,
        fontSize = 13.sp,
    )
    Text(
        text = hint,
        style = MaterialTheme.typography.bodySmall.copy(color = colors.subtle),
    )
  }
}

@Composable
private fun ListRow(title: String, description: String) {
  val colors = LocalColorTokens.current
  Row(
      modifier =
          Modifier
              .fillMaxWidth()
              .background(colors.card, RoundedCornerShape(14.dp))
              .border(1.dp, colors.border, RoundedCornerShape(14.dp))
              .padding(12.dp),
      horizontalArrangement = Arrangement.spacedBy(12.dp),
      verticalAlignment = Alignment.Top,
  ) {
    Box(
        modifier =
            Modifier
                .width(12.dp)
                .height(12.dp)
                .background(colors.accentSoft, CircleShape),
    )
    Column(verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.weight(1f)) {
      Text(
          text = title,
          style = MaterialTheme.typography.titleSmall.copy(
              color = colors.text, fontWeight = FontWeight.ExtraBold),
      )
      Text(
          text = description,
          style = MaterialTheme.typography.bodySmall.copy(color = colors.subtle),
      )
    }
  }
}

private data class StatItem(val label: String, val value: String)

private data class WorkflowItem(
    val title: String,
    val mode: String,
    val description: String,
    val highlights: List<String>,
)

private data class IntegrationItem(
    val title: String,
    val category: String,
    val description: String,
    val tags: List<String>,
)

private data class ArchitectureItem(val step: String, val title: String, val description: String)

private data class MonetizationItem(
    val title: String,
    val model: String,
    val description: String,
    val notes: List<String>,
)

private data class RiskItem(val title: String, val description: String)
private data class WebhookItem(val title: String, val description: String)

private val workflows =
    listOf(
        WorkflowItem(
            title = "Delivery mode",
            mode = "Mileage + batching",
            description =
                "ShiftMate logic optimizes routes, logs mileage, and surfaces surge zones across DoorDash, Uber, and Instacart.",
            highlights = listOf("Live surge overlays", "Auto mileage logs", "Smart batching"),
        ),
        WorkflowItem(
            title = "Freelance mode",
            mode = "Time + proposals",
            description =
                "Templates for writing, design, and dev gigs with proposal history, escrow reminders, and auto-invoicing hooks.",
            highlights = listOf("Proposal vault", "Escrow triggers", "Client CRM"),
        ),
        WorkflowItem(
            title = "Local services mode",
            mode = "Trusted labor",
            description =
                "TaskRabbit-style workflows with background checks, insurance flags, and standardized checklists.",
            highlights = listOf("Checklist templates", "Background checks", "Insurance proof"),
        ),
    )

private val integrations =
    listOf(
        IntegrationItem(
            title = "EarnIn",
            category = "Liquidity",
            description =
                "Instant cash-out up to $150/day routed via our treasury partner; respects payout limits per tier.",
            tags = listOf("Cash advances", "Payout routing", "Treasury controls"),
        ),
        IntegrationItem(
            title = "Catch",
            category = "Benefits",
            description =
                "Automated tax withholding, portable health and retirement contributions linked to every payout.",
            tags = listOf("Tax vaults", "Health + retirement", "Auto percentages"),
        ),
        IntegrationItem(
            title = "Expensify",
            category = "Expenses",
            description =
                "Receipt OCR, category rules, and reimbursement flows fed into analytics for true profit tracking.",
            tags = listOf("OCR", "Policy rules", "Profitability"),
        ),
        IntegrationItem(
            title = "ShiftMate",
            category = "Optimization",
            description =
                "Shift tracking, mileage logging, and earnings analysis to maximize active time across platforms.",
            tags = listOf("Shift IQ", "Mileage", "Multi-app"),
        ),
        IntegrationItem(
            title = "Task boards",
            category = "Demand",
            description =
                "Unified feed for TaskRabbit, Fiverr, and Upwork with skills filters and response timers.",
            tags = listOf("Unified feed", "Skill filters", "Fast reply"),
        ),
    )

private val architecture =
    listOf(
        ArchitectureItem(
            step = "01",
            title = "Authenticate once",
            description =
                "Users receive a Master Key after KYC; traffic is signed and replay-protected with rotating keys.",
        ),
        ArchitectureItem(
            step = "02",
            title = "Route intelligently",
            description =
                "Router picks best provider (Stripe/Unit/EarnIn) per tier, geography, and SLA, applying markup automatically.",
        ),
        ArchitectureItem(
            step = "03",
            title = "Observe everything",
            description =
                "Full audit logs, latency SLOs, and incident webhooks so ops teams can intervene quickly.",
        ),
        ArchitectureItem(
            step = "04",
            title = "Fail over safely",
            description =
                "Provider health checks, circuit breakers, and queued retries keep payouts flowing even during outages.",
        ),
    )

private val monetization =
    listOf(
        MonetizationItem(
            title = "Tiered subscriptions",
            model = "Freemium → Pro",
            description =
                "Free tier for tracking; Pro ($10–$20/mo) unlocks advanced analytics, instant cash-out, and automated tax rules.",
            notes = listOf("Free onboarding", "Usage gates", "Seat-based add-ons"),
        ),
        MonetizationItem(
            title = "Marketplace revenue share",
            model = "15–30% markup",
            description =
                "White-label third-party tools sold inside the hub. Users pay once; we handle billing and provider splits.",
            notes = listOf("Bundled billing", "Provider split", "Churn-safe"),
        ),
        MonetizationItem(
            title = "Utility markup",
            model = "Cost-plus",
            description =
                "Apply a 15–30% premium on wholesale API costs (e.g., background checks, payouts) for turnkey access.",
            notes = listOf("Transparent fees", "Tier-aware", "Rate limits"),
        ),
        MonetizationItem(
            title = "Float interest (regulated)",
            model = "Treasury",
            description =
                "For eligible regions, hold funds in staging wallets and capture float while observing compliance boundaries.",
            notes = listOf("BaaS only", "Segregated funds", "Audit-ready"),
        ),
    )

private val risks =
    listOf(
        RiskItem(
            title = "Enterprise-only credentials",
            description =
                "Avoid the reseller trap; operate under OEM or platform agreements (Unit, Treasury Prime, Stripe, EarnIn).",
        ),
        RiskItem(
            title = "KYC before issuance",
            description =
                "IDV + AML screening prior to issuing Master Keys, with ongoing watchlist monitoring.",
        ),
        RiskItem(
            title = "Data privacy posture",
            description =
                "GDPR/CCPA alignment with encryption in transit and at rest, scoped tokens, and minimal data retention.",
        ),
        RiskItem(
            title = "Abuse and fraud detection",
            description =
                "Velocity rules, device fingerprinting, and anomaly scoring to shut down risky routes in real time.",
        ),
    )

private val webhooks =
    listOf(
        WebhookItem(
            title = "Idempotent delivery",
            description =
                "Signed, idempotent event payloads with replay protection and exponential backoff to avoid duplicate downstream effects.",
        ),
        WebhookItem(
            title = "Fan-out router",
            description =
                "One inbound provider event can broadcast to customer webhooks, internal queues, and monitoring sinks without blocking the request thread.",
        ),
        WebhookItem(
            title = "Dead-letter + replays",
            description =
                "Failed deliveries land in a DLQ with manual and automated replay, keeping partner SLAs intact during third-party outages.",
        ),
        WebhookItem(
            title = "Observability by default",
            description =
                "Per-endpoint latency, error rates, and delivery logs exposed in the control center for instant triage.",
        ),
    )

private val deployment =
    listOf(
        "Finalize BaaS + treasury partner (Unit/Treasury Prime)",
        "Ship payouts + job feed MVP with three providers",
        "Stand up audit logging + observability dashboards",
        "Open plugin SDK for third-party tool vendors",
    )

private data class ColorTokens(
    val background: Color,
    val card: Color,
    val text: Color,
    val subtle: Color,
    val border: Color,
    val accent: Color,
    val accentSoft: Color,
    val onAccent: Color,
    val heroBackground: Color,
    val onHero: Color,
    val codeBackground: Color,
    val codeText: Color,
)

private val LightTokens =
    ColorTokens(
        background = Color(0xFFF4F5F7),
        card = Color(0xFFFFFFFF),
        text = Color(0xFF0B1222),
        subtle = Color(0xFF4B5563),
        border = Color(0xFFE5E7EB),
        accent = Color(0xFF7C3AED),
        accentSoft = Color(0xFFEDE9FE),
        onAccent = Color(0xFF0B1222),
        heroBackground = Color(0xFF0F172A),
        onHero = Color(0xFFF8FAFC),
        codeBackground = Color(0xFF0B1222),
        codeText = Color(0xFFE5E7EB),
    )

private val DarkTokens =
    ColorTokens(
        background = Color(0xFF0B1222),
        card = Color(0xFF11182B),
        text = Color(0xFFF8FAFC),
        subtle = Color(0xFFAAB3C5),
        border = Color(0xFF1F2937),
        accent = Color(0xFFA78BFA),
        accentSoft = Color(0xFF1E1B4B),
        onAccent = Color(0xFF0B1222),
        heroBackground = Color(0xFF0F172A),
        onHero = Color(0xFFF8FAFC),
        codeBackground = Color(0xFF11182B),
        codeText = Color(0xFFE5E7EB),
    )

@Composable
private fun MoneyGeneratorTheme(isDark: Boolean, content: @Composable () -> Unit) {
  val colors = if (isDark) DarkTokens else LightTokens
  val scheme =
      androidx.compose.material3.lightColorScheme(
          primary = colors.accent,
          onPrimary = colors.onAccent,
          background = colors.background,
          surface = colors.card,
      )

  CompositionLocalProvider(LocalColorTokens provides colors) {
    MaterialTheme(
        colorScheme = scheme,
        typography =
            MaterialTheme.typography.copy(
                headlineSmall =
                    MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                labelLarge = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
            ),
        content = content,
    )
  }
}

private val LocalColorTokens = androidx.compose.runtime.staticCompositionLocalOf { LightTokens }
