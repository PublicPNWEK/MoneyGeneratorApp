package com.moneygeneratorapp

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class Card(
    val title: String,
    val subtitle: String,
    val bullets: List<String>? = null,
    val tag: String? = null
)

data class Highlight(
    val title: String,
    val items: List<String>
)

object AppColors {
    val background = Color(0xFF0c1220)
    val cardBackground = Color(0xFF121b2e)
    val heroBackground = Color(0xFF111a2d)
    val pillBackground = Color(0xFF1d2b45)
    val metricBackground = Color(0xFF142035)
    val flowBackground = Color(0xFF101a2d)
    val highlightBackground = Color(0xFF10192c)
    val badge = Color(0xFF243657)
    val border = Color(0x0DFFFFFF)
    val bulletDot = Color(0xFF5ea8ff)
    
    val textPrimary = Color(0xFFf7fbff)
    val textSecondary = Color(0xFFc7d6f6)
    val textTertiary = Color(0xFFb8c8e8)
    val pillText = Color(0xFFbcd4ff)
    val badgeText = Color(0xFFd8e3ff)
}

val jobBoardCategories = listOf(
    Card(
        title = "Local Missions",
        subtitle = "TaskRabbit, Instawork, handyman and on-demand errand work.",
        bullets = listOf("Geofenced availability", "Instant cash-out toggle", "Mileage tracker"),
        tag = "Location-first"
    ),
    Card(
        title = "Digital Services",
        subtitle = "Fiverr, Upwork, Contra, and niche marketplaces for specialized work.",
        bullets = listOf("Portfolio-forward profiles", "Reusable proposal templates", "Cross-platform rating sync"),
        tag = "Remote"
    ),
    Card(
        title = "Shift-Based Ops",
        subtitle = "Rideshare, delivery, warehouse shifts, and hospitality gigs.",
        bullets = listOf("Shift bidding", "Live earnings heatmap", "Optimal route guidance"),
        tag = "Real-time"
    )
)


val workflowBundles = listOf(
    Highlight(
        title = "Smart Workflows",
        items = listOf(
            "Delivery Mode: mileage + fuel cost tracking, surge alerts, rest timers.",
            "Freelance Mode: contract templates, time tracking, milestone billing.",
            "Support Mode: ticket queues, canned responses, on-call calendar sync."
        )
    ),
    Highlight(
        title = "Automation",
        items = listOf(
            "Auto-create expenses from receipts, invoices, and bank feeds.",
            "Prebuilt Zapier/Make triggers for payouts, offers, and KYC approvals.",
            "Usage-based throttling aligned to subscription tier and SLA."
        )
    )
)

val financialStack = listOf(
    Card(
        title = "Financial Liquidity",
        subtitle = "EarnIn-style advances with configurable limits (up to \$150/day).",
        bullets = listOf("Instant payout rails", "Eligibility scoring per provider", "Transparent fees + markup"),
        tag = "Cash Out"
    ),
    Card(
        title = "Benefits Safety Net",
        subtitle = "Catch-style tax withholding, health, retirement, and rainy-day buckets.",
        bullets = listOf("Auto-reserve % of earnings", "Portable benefits per gig", "Audit-ready receipts"),
        tag = "Benefits"
    ),
    Card(
        title = "Expense Intelligence",
        subtitle = "Expensify-grade receipt scanning and mileage logging.",
        bullets = listOf("Card-level enrichment", "Policy rules by tier", "CSV + API exports"),
        tag = "Expenses"
    )
)

val integrationHub = listOf(
    Highlight(
        title = "Unified API Gateway",
        items = listOf(
            "Single Master Key per user -> routed to enterprise providers behind the scenes.",
            "Provider selection logic (Stripe vs Unit) based on tier, geo, and limits.",
            "Centralized observability: latency, error budgets, and per-API markup."
        )
    ),
    Highlight(
        title = "White-Label Marketplace",
        items = listOf(
            "3P tools listed as plugins with revenue share (15–30% markup).",
            "Configurable bundles for industries (writers, drivers, technicians).",
            "Rate-limit tiers: Free, Pro, and Enterprise with burst tokens."
        )
    )
)

val monetization = listOf(
    Highlight(
        title = "Cost-Plus Billing",
        items = listOf(
            "Utility markup on wholesale APIs (15–30%).",
            "Transaction fees on instant payouts and cross-wallet transfers.",
            "Float yield on staged funds where regulation allows."
        )
    ),
    Highlight(
        title = "Subscriptions & Add-ons",
        items = listOf(
            "Freemium tracking, Pro analytics (\$10–\$20/mo), Enterprise SLAs.",
            "Optional compliance packs: KYC, KYB, fraud rules, PEP/sanctions checks.",
            "Add-on seats for collaborators, clients, or fleet managers."
        )
    )
)

val compliance = listOf(
    Highlight(
        title = "Guardrails",
        items = listOf(
            "Enterprise/API partner agreements only—no personal key resale.",
            "Full KYC/KYB prior to key issuance; velocity checks for fraud.",
            "GDPR/CCPA-ready data handling with scoped tokens and rotation."
        )
    ),
    Highlight(
        title = "Operational Playbooks",
        items = listOf(
            "Incident response with automated provider failover.",
            "Service health SLOs per integration and per user tier.",
            "Audit trails for every routed request and pricing decision."
        )
    )
)

@Composable
fun App() {
    MaterialTheme(
        colorScheme = darkColorScheme(
            background = AppColors.background,
            surface = AppColors.cardBackground,
            primary = AppColors.bulletDot
        )
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = AppColors.background
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                item { Hero() }
                item { MetricStrip() }
                
                item {
                    SectionHeader(
                        title = "Categorized Job Boards",
                        subtitle = "Unified feed for TaskRabbit-style local work, Fiverr-grade digital jobs, and shift-based ops."
                    )
                }
                item { CardList(cards = jobBoardCategories) }
                
                item {
                    SectionHeader(
                        title = "Use-Case Workflows & Automation",
                        subtitle = "Prebuilt modes adapt to the active gig, with automation hooks ready for deployment."
                    )
                }
                item { Highlights(items = workflowBundles) }
                
                item {
                    SectionHeader(
                        title = "Financial Management Stack",
                        subtitle = "Liquidity, benefits, and expense intelligence bundled into the Money Generator."
                    )
                }
                item { CardList(cards = financialStack) }
                
                item {
                    SectionHeader(
                        title = "Integration Hub & White-Label Platform",
                        subtitle = "Curated plugin marketplace backed by a unified API gateway and provider-aware routing."
                    )
                }
                item { Highlights(items = integrationHub) }
                
                item {
                    SectionHeader(
                        title = "Master Key Architecture",
                        subtitle = "Facade routing, per-tier rate limits, and markup-ready billing across every provider."
                    )
                }
                item { MasterKeyFlow() }
                
                item {
                    SectionHeader(
                        title = "Monetization Engine",
                        subtitle = "Blend subscriptions, cost-plus usage, marketplace commissions, and payout fees."
                    )
                }
                item { Highlights(items = monetization) }
                
                item {
                    SectionHeader(
                        title = "Compliance & Resilience",
                        subtitle = "Enterprise-grade guardrails to avoid reseller traps and stay audit-ready."
                    )
                }
                item { Highlights(items = compliance) }
                
                item {
                    SectionHeader(
                        title = "Launch Roadmap",
                        subtitle = "From MVP aggregation to enterprise white-label deployments."
                    )
                }
                item { Roadmap() }
            }
        }
    }
}

@Composable
fun Hero() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(AppColors.heroBackground)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "Unified Gig OS",
            modifier = Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(AppColors.badge)
                .padding(horizontal = 12.dp, vertical = 6.dp),
            color = AppColors.badgeText,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = "Money Generator: Master Key Marketplace",
            color = AppColors.textPrimary,
            fontSize = 24.sp,
            fontWeight = FontWeight.ExtraBold,
            lineHeight = 32.sp
        )
        Text(
            text = "Build once, deploy everywhere. A single control center for earning, managing, and thriving—combining job aggregation, smart workflows, and a unified API gateway with markup-ready billing.",
            color = AppColors.textSecondary,
            fontSize = 15.sp,
            lineHeight = 22.sp
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("Job Boards", "Workflows", "Fintech", "API Gateway").forEach {
                Pill(label = it)
            }
        }
    }
}

@Composable
fun Pill(label: String) {
    Text(
        text = label,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(AppColors.pillBackground)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        color = AppColors.pillText,
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold
    )
}

@Composable
fun MetricStrip() {
    val metrics = listOf(
        "Market Trajectory" to "\$2.1T gig economy by 2034",
        "Key Value" to "One Master Key for every provider",
        "Monetization" to "Subscriptions + usage markup + commissions"
    )
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        metrics.forEach { (label, value) ->
            Column(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(AppColors.metricBackground)
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = label,
                    color = Color(0xFF9fb5dd),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = value,
                    color = Color(0xFFe9f1ff),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    lineHeight = 20.sp
                )
            }
        }
    }
}

@Composable
fun SectionHeader(title: String, subtitle: String? = null) {
    Column(
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text(
            text = title,
            color = Color(0xFFf2f6ff),
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )
        subtitle?.let {
            Text(
                text = it,
                color = AppColors.textTertiary,
                fontSize = 14.sp,
                lineHeight = 20.sp
            )
        }
    }
}

@Composable
fun CardList(cards: List<Card>) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        cards.forEach { card ->
            CardItem(card = card)
        }
    }
}

@Composable
fun CardItem(card: Card) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(AppColors.cardBackground)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = card.title,
                color = Color(0xFFf5f8ff),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f)
            )
            card.tag?.let { Pill(label = it) }
        }
        Text(
            text = card.subtitle,
            color = Color(0xFFc2d2f2),
            fontSize = 14.sp,
            lineHeight = 20.sp
        )
        card.bullets?.let { bullets ->
            Column(
                verticalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.padding(top = 4.dp)
            ) {
                bullets.forEach { bullet ->
                    BulletPoint(text = bullet)
                }
            }
        }
    }
}

@Composable
fun BulletPoint(text: String) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .padding(top = 6.dp)
                .size(6.dp)
                .clip(CircleShape)
                .background(AppColors.bulletDot)
        )
        Text(
            text = text,
            color = Color(0xFFd4e2ff),
            fontSize = 13.sp,
            lineHeight = 19.sp,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun Highlights(items: List<Highlight>) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items.forEach { highlight ->
            HighlightCard(highlight = highlight)
        }
    }
}

@Composable
fun HighlightCard(highlight: Highlight) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(AppColors.highlightBackground)
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = highlight.title,
            color = Color(0xFFf5f7ff),
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold
        )
        highlight.items.forEach { item ->
            BulletPoint(text = item)
        }
    }
}

@Composable
fun MasterKeyFlow() {
    val steps = listOf(
        "User clicks Instant Cash Out.",
        "Gateway validates Master Token + subscription tier.",
        "Router selects provider (Stripe, Unit, or partner) and applies markup.",
        "Execution with enterprise credentials; audit trail + analytics logged."
    )
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(AppColors.flowBackground)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(
            text = "Master Key Flow",
            color = Color(0xFFf5f8ff),
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold
        )
        steps.forEachIndexed { index, step ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(26.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF1c2b45)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "${index + 1}",
                        color = Color(0xFFa5c6ff),
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = step,
                    color = Color(0xFFd6e5ff),
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
fun Roadmap() {
    val milestones = listOf(
        Card(
            title = "MVP Launch",
            subtitle = "Unified job feed, smart workflows, and Master Key auth with sandbox providers.",
            bullets = listOf("Job aggregation + filtering", "Basic payouts & expense capture", "Tiered access and rate limits"),
            tag = "Now"
        ),
        Card(
            title = "Scale",
            subtitle = "Bring on enterprise partners, expand plugins, and deepen analytics.",
            bullets = listOf("Provider redundancy + failover", "Marketplace revenue share", "Universal gig reputation graph"),
            tag = "Next"
        ),
        Card(
            title = "Enterprise",
            subtitle = "OEM-ready white-label kits for platforms and staffing firms.",
            bullets = listOf("Co-branded portals", "Custom SLAs", "Compliance attestation + audits"),
            tag = "Later"
        )
    )
    CardList(cards = milestones)
}
