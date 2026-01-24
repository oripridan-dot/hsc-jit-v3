from services.halilit_brand_registry import HalilitBrandRegistry
import json

registry = HalilitBrandRegistry()
roster = registry.fetch_official_roster()
print(json.dumps(roster, indent=2))
