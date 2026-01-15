#!/usr/bin/env python3
"""
DAILY REPORT GENERATOR v3.5
Generates comprehensive daily reports with trend analysis and anomaly detection
"""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any
import statistics

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_UNIFIED_DIR = DATA_DIR / "catalogs_unified"
LOGS_DIR = BACKEND_DIR / "logs"
REPORTS_DIR = LOGS_DIR / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / 'daily_report.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DailyReportGenerator:
    """Generates comprehensive daily ecosystem reports."""

    def __init__(self):
        self.report = {
            "date": datetime.now().date().isoformat(),
            "generated_at": datetime.now().isoformat(),
            "summary": {},
            "brand_metrics": {},
            "trends": {},
            "anomalies": [],
            "recommendations": [],
            "performance_stats": {}
        }

    def collect_metrics(self) -> Dict[str, Any]:
        """Collect current metrics from unified catalogs."""
        logger.info("📊 Collecting metrics...")

        total_products = 0
        primary_count = 0
        secondary_count = 0
        halilit_only_count = 0
        brand_metrics = {}

        # Collect per-brand metrics
        for catalog_file in CATALOGS_UNIFIED_DIR.glob("*_catalog.json"):
            try:
                with open(catalog_file) as f:
                    catalog = json.load(f)

                brand_id = catalog.get("brand_id", catalog_file.stem)
                products = catalog.get("products", [])
                stats = catalog.get("statistics", {})

                # Count by source
                primary = len(
                    [p for p in products if p.get("source") == "PRIMARY"])
                secondary = len(
                    [p for p in products if p.get("source") == "SECONDARY"])
                halilit = len(
                    [p for p in products if p.get("source") == "HALILIT_ONLY"])

                brand_metrics[brand_id] = {
                    "total": len(products),
                    "primary": primary,
                    "secondary": secondary,
                    "halilit_only": halilit,
                    "primary_percentage": round((primary / len(products) * 100) if products else 0, 2),
                    "last_sync": catalog.get("timestamp", "unknown")
                }

                total_products += len(products)
                primary_count += primary
                secondary_count += secondary
                halilit_only_count += halilit

            except Exception as e:
                logger.error(f"Error reading {catalog_file.name}: {e}")
                continue

        # Calculate global statistics
        primary_percentage = round(
            (primary_count / total_products * 100) if total_products else 0, 2
        )

        metrics = {
            "total_products": total_products,
            "primary_products": primary_count,
            "secondary_products": secondary_count,
            "halilit_only_products": halilit_only_count,
            "primary_percentage": primary_percentage,
            "brands_count": len(brand_metrics),
            "brand_metrics": brand_metrics
        }

        logger.info(f"  Total Products: {total_products}")
        logger.info(f"  PRIMARY: {primary_count} ({primary_percentage}%)")
        logger.info(f"  SECONDARY: {secondary_count}")
        logger.info(f"  HALILIT_ONLY: {halilit_only_count}")

        return metrics

    def analyze_trends(self, current_metrics: Dict) -> Dict[str, Any]:
        """Analyze trends from historical data."""
        logger.info("📈 Analyzing trends...")

        trends = {
            "primary_growth_24h": "unknown",
            "primary_growth_7d": "unknown",
            "best_performing_brands": [],
            "lowest_coverage_brands": []
        }

        # Get historical reports (if available)
        historical_reports = sorted(
            REPORTS_DIR.glob("report_*.json"), reverse=True)

        if historical_reports:
            # Compare with yesterday
            yesterday_report = None
            for report_file in historical_reports:
                try:
                    with open(report_file) as f:
                        report = json.load(f)
                        report_date = datetime.fromisoformat(
                            report.get("date", "2000-01-01")
                        )
                        if (datetime.now().date() - report_date.date()).days == 1:
                            yesterday_report = report
                            break
                except:
                    continue

            if yesterday_report:
                yesterday_primary = yesterday_report.get(
                    "summary", {}).get("primary_products", 0)
                current_primary = current_metrics["primary_products"]
                growth = current_primary - yesterday_primary
                growth_pct = round(
                    (growth / yesterday_primary * 100) if yesterday_primary else 0, 2)
                trends["primary_growth_24h"] = {
                    "count": growth,
                    "percentage": growth_pct,
                    "status": "📈 GROWING" if growth > 0 else "📉 DECLINING" if growth < 0 else "➡️  STABLE"
                }

        # Find top and bottom brands
        brand_coverage = [
            (brand_id, metrics["primary_percentage"])
            for brand_id, metrics in current_metrics["brand_metrics"].items()
        ]

        if brand_coverage:
            sorted_coverage = sorted(
                brand_coverage, key=lambda x: x[1], reverse=True)
            trends["best_performing_brands"] = sorted_coverage[:3]
            trends["lowest_coverage_brands"] = sorted_coverage[-3:]

        return trends

    def detect_anomalies(self, metrics: Dict, trends: Dict) -> List[str]:
        """Detect anomalies in data."""
        logger.info("🔍 Detecting anomalies...")

        anomalies = []

        # Anomaly 1: Sudden drop in PRIMARY coverage
        if trends.get("primary_growth_24h") != "unknown":
            growth = trends["primary_growth_24h"].get("count", 0)
            if growth < -10:
                anomalies.append(
                    f"⚠️  PRIMARY count dropped by {abs(growth)} in 24 hours"
                )

        # Anomaly 2: Brand with 0 products but should have Halilit items
        for brand_id, brand_metrics in metrics["brand_metrics"].items():
            if brand_metrics["total"] == 0:
                anomalies.append(
                    f"⚠️  {brand_id}: No products found (check scraper)"
                )
            elif brand_metrics["primary"] == 0 and brand_metrics["halilit_only"] > 50:
                anomalies.append(
                    f"⚠️  {brand_id}: No PRIMARY products despite {brand_metrics['halilit_only']} Halilit items"
                )

        # Anomaly 3: Missing recent syncs
        now = datetime.now()
        for brand_id, brand_metrics in metrics["brand_metrics"].items():
            last_sync = brand_metrics.get("last_sync")
            if last_sync:
                try:
                    sync_time = datetime.fromisoformat(last_sync)
                    hours_ago = (now - sync_time).total_seconds() / 3600
                    if hours_ago > 48:
                        anomalies.append(
                            f"⚠️  {brand_id}: Last sync {hours_ago:.0f} hours ago"
                        )
                except:
                    pass

        logger.info(f"  Found {len(anomalies)} anomalies")
        return anomalies

    def generate_recommendations(self, metrics: Dict, trends: Dict, anomalies: List[str]) -> List[str]:
        """Generate actionable recommendations."""
        logger.info("💡 Generating recommendations...")

        recommendations = []

        # Recommendation 1: Cover improvement
        primary_pct = metrics.get("primary_percentage", 0)
        if primary_pct < 20:
            recommendations.append(
                f"🔴 Priority: Increase PRIMARY coverage ({primary_pct}% → target 80%)"
            )
            recommendations.append(
                "   Action: Run enhanced Playwright scraper for Roland/Pearl/Mackie"
            )
        elif primary_pct < 50:
            recommendations.append(
                f"🟡 Focus: Continue PRIMARY growth ({primary_pct}% → target 80%)"
            )
            recommendations.append(
                "   Action: Optimize matching algorithms, improve selectors"
            )
        elif primary_pct < 80:
            recommendations.append(
                f"🟢 Almost there: {primary_pct}% → target 80%"
            )
            recommendations.append(
                "   Action: Fine-tune edge cases, optimize final brands"
            )

        # Recommendation 2: Address anomalies
        if anomalies:
            recommendations.append(
                f"🔧 Maintenance: {len(anomalies)} anomaly/anomalies detected"
            )
            for anomaly in anomalies[:3]:  # Top 3
                recommendations.append(f"   • {anomaly}")

        # Recommendation 3: Performance optimization
        poorly_performing = [
            (brand_id, metrics["brand_metrics"]
             [brand_id]["primary_percentage"])
            for brand_id in metrics["brand_metrics"]
            if metrics["brand_metrics"][brand_id]["primary_percentage"] == 0
        ]

        if poorly_performing:
            recommendations.append(
                f"🎯 Focus Areas: {len(poorly_performing)} brands need attention"
            )
            for brand_id, _ in poorly_performing[:3]:
                recommendations.append(
                    f"   • {brand_id}: Inspect selectors and scraper config"
                )

        logger.info(f"  Generated {len(recommendations)} recommendations")
        return recommendations

    def generate_html_report(self, metrics: Dict, trends: Dict, anomalies: List, recommendations: List) -> str:
        """Generate HTML visualization of report."""
        primary_pct = metrics.get("primary_percentage", 0)
        health_color = "🟢" if primary_pct >= 80 else "🟡" if primary_pct >= 50 else "🔴"

        html = f"""
        <html>
        <head>
            <title>HSC-JIT Daily Report - {self.report['date']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
                .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }}
                .metric {{ background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #3498db; }}
                .metric.warning {{ border-left-color: #f39c12; }}
                .metric.critical {{ border-left-color: #e74c3c; }}
                .metric.success {{ border-left-color: #27ae60; }}
                table {{ width: 100%; border-collapse: collapse; background: white; margin: 10px 0; }}
                th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background: #34495e; color: white; }}
                .anomaly {{ background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 3px; }}
                .recommendation {{ background: #d4edda; padding: 10px; margin: 5px 0; border-radius: 3px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>HSC-JIT Daily Report</h1>
                <p>Date: {self.report['date']} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>

            <div class="metric {'success' if primary_pct >= 80 else 'warning' if primary_pct >= 50 else 'critical'}">
                <h3>{health_color} Overall Health: {primary_pct}% PRIMARY Coverage</h3>
                <p>Target: 80% | Current: {primary_pct}% | Status: {'ON TRACK' if primary_pct >= 80 else 'BELOW TARGET'}</p>
            </div>

            <div class="metric">
                <h3>📊 Global Statistics</h3>
                <table>
                    <tr><td>Total Products</td><td>{metrics['total_products']}</td></tr>
                    <tr><td>PRIMARY (Brand + Price)</td><td>{metrics['primary_products']} ({primary_pct}%)</td></tr>
                    <tr><td>SECONDARY (Brand Only)</td><td>{metrics['secondary_products']}</td></tr>
                    <tr><td>HALILIT_ONLY</td><td>{metrics['halilit_only_products']}</td></tr>
                    <tr><td>Total Brands</td><td>{metrics['brands_count']}</td></tr>
                </table>
            </div>

            <div class="metric">
                <h3>🏆 Top Performing Brands</h3>
                <table>
                    <tr><th>Brand</th><th>PRIMARY Count</th><th>Coverage %</th></tr>
        """

        for brand_id, coverage_pct in trends.get("best_performing_brands", [])[:5]:
            primary_count = metrics["brand_metrics"][brand_id]["primary"]
            html += f"<tr><td>{brand_id}</td><td>{primary_count}</td><td>{coverage_pct}%</td></tr>"

        html += """
                </table>
            </div>
        """

        if anomalies:
            html += "<div class='metric warning'><h3>⚠️  Anomalies Detected</h3>"
            for anomaly in anomalies:
                html += f"<div class='anomaly'>{anomaly}</div>"
            html += "</div>"

        if recommendations:
            html += "<div class='metric'><h3>💡 Recommendations</h3>"
            for rec in recommendations:
                html += f"<div class='recommendation'>{rec}</div>"
            html += "</div>"

        html += """
        </body>
        </html>
        """

        return html

    def run(self) -> Dict[str, Any]:
        """Generate complete daily report."""
        logger.info(
            "════════════════════════════════════════════════════════════")
        logger.info("📋 DAILY ECOSYSTEM REPORT GENERATOR")
        logger.info(
            "════════════════════════════════════════════════════════════")

        # Collect metrics
        metrics = self.collect_metrics()
        self.report["summary"] = {
            k: v for k, v in metrics.items() if k != "brand_metrics"
        }
        self.report["brand_metrics"] = metrics["brand_metrics"]

        # Analyze trends
        trends = self.analyze_trends(metrics)
        self.report["trends"] = trends

        # Detect anomalies
        anomalies = self.detect_anomalies(metrics, trends)
        self.report["anomalies"] = anomalies

        # Generate recommendations
        recommendations = self.generate_recommendations(
            metrics, trends, anomalies)
        self.report["recommendations"] = recommendations

        # Save JSON report
        report_file = REPORTS_DIR / \
            f"report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.report, f, indent=2)
        logger.info(f"✅ JSON report saved: {report_file}")

        # Generate HTML report
        html = self.generate_html_report(
            metrics, trends, anomalies, recommendations)
        html_file = REPORTS_DIR / \
            f"report_{datetime.now().strftime('%Y%m%d')}.html"
        with open(html_file, 'w') as f:
            f.write(html)
        logger.info(f"✅ HTML report saved: {html_file}")

        # Print summary
        logger.info("\n" + "="*60)
        logger.info("📊 SUMMARY")
        logger.info("="*60)
        logger.info(f"Primary Coverage: {metrics['primary_percentage']}%")
        logger.info(f"Total Products: {metrics['total_products']}")
        logger.info(f"Anomalies: {len(anomalies)}")
        logger.info(f"Recommendations: {len(recommendations)}")

        return self.report


def main():
    generator = DailyReportGenerator()
    report = generator.run()
    logger.info("\n✅ Daily report generation complete")


if __name__ == "__main__":
    main()
