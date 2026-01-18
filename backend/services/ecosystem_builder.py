"""
Ecosystem Builder - Creates Product Hierarchy from Scraped Data
Organizes products into: Domain -> Brand -> Family -> Product structure
"""
import json
import re
from pathlib import Path
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

# Galaxy Map: Product Domains (Categories)
BRAND_DOMAINS = {
    "Drums": ["Roland", "Pearl", "Paiste", "Remo", "Vic Firth", "Dixon"],
    "Keys": ["Nord", "Roland", "Moog", "Oberheim", "Studiologic", "Kawai"],
    "Pro Audio": ["Presonus", "Mackie", "RCF", "Warm Audio", "Allen & Heath"],
    "Guitars": ["Washburn", "Cort", "Ampeg", "Blackstar", "Orange"],
    "Studio": ["Steinberg", "Avid", "M-Audio", "KRK", "Focusrite"],
    "DJ": ["Pioneer", "Native Instruments", "Numark", "Rane"],
    "Live Sound": ["Shure", "Sennheiser", "Behringer", "QSC"],
    "Recording": ["Neumann", "AKG", "Audio-Technica", "Rode"]
}

# Product Relationship Types
class ProductType:
    ROOT = "root"           # Standalone products (TD-17KVX)
    ACCESSORY = "accessory" # Dependent on root (kick pedal for TD-17)
    RELATED = "related"     # Can be standalone but commonly used together
    VARIATION = "variation" # Different version of same product (TD-17KVX vs TD-17KV)


def detect_family(name: str, category: str = None) -> str:
    """
    Extract product family from name.
    Examples:
      - "Roland TD-17KVX" -> "TD-17 Series"
      - "Nord Stage 3 88" -> "Stage Series"
      - "Yamaha P-125" -> "P Series"
    """
    # Pattern 1: Letters + Dash + Numbers (TD-17, P-125, RD-2000)
    match = re.search(r"([A-Z]{1,4}-?\d{1,4})", name, re.IGNORECASE)
    if match:
        base = match.group(1).upper()
        # Remove trailing numbers for series grouping
        series = re.sub(r'\d{1,2}$', '', base)
        return f"{series} Series"
    
    # Pattern 2: Word Series (Stage, Electro, Grand)
    match = re.search(r"(Stage|Electro|Grand|Piano|Workstation)", name, re.IGNORECASE)
    if match:
        return f"{match.group(1).title()} Series"
    
    # Fallback to category
    return category or "General"


def detect_product_type(product: Dict[str, Any]) -> str:
    """
    Determine if product is root, accessory, related, or variation.
    Uses name patterns, category, and metadata.
    """
    name = product.get("name", "").lower()
    category = product.get("category", "").lower()
    
    # Accessories: explicit keywords
    accessory_keywords = [
        "pedal", "stand", "cable", "case", "bag", "cover", "adapter", 
        "power supply", "mount", "bracket", "holder", "strap", "stick"
    ]
    if any(kw in name or kw in category for kw in accessory_keywords):
        return ProductType.ACCESSORY
    
    # Variations: same family, different suffix
    if re.search(r"(mk\s?2|gen\s?2|ii|v2|pro|plus|ex|x)", name, re.IGNORECASE):
        return ProductType.VARIATION
    
    # Related: headphones, monitors, interfaces (can be standalone)
    related_keywords = ["headphone", "monitor", "speaker", "interface", "mixer"]
    if any(kw in name or kw in category for kw in related_keywords):
        return ProductType.RELATED
    
    # Default: root product
    return ProductType.ROOT


def extract_accessories(products: List[Dict], root_product: Dict) -> List[Dict]:
    """
    Find accessories that belong to a specific root product.
    Uses fuzzy matching on product family/series.
    """
    root_family = detect_family(root_product["name"], root_product.get("category"))
    accessories = []
    
    for p in products:
        if detect_product_type(p) == ProductType.ACCESSORY:
            # Check if accessory name mentions the root family
            if root_family.split()[0].lower() in p["name"].lower():
                accessories.append(p)
    
    return accessories


def extract_related_products(products: List[Dict], root_product: Dict) -> List[Dict]:
    """
    Find related products (monitors, interfaces, etc.) commonly used with root.
    """
    root_category = root_product.get("category", "").lower()
    related = []
    
    for p in products:
        if detect_product_type(p) == ProductType.RELATED:
            # Same category = related
            if p.get("category", "").lower() == root_category:
                related.append(p)
    
    return related[:5]  # Limit to 5 related items


def build_ecosystem(data_dir: str = None) -> Dict[str, Any]:
    """
    Main function: Build the complete product hierarchy.
    Returns: JSON structure ready for frontend navigation.
    """
    logger.info("✨ Halileo is mapping the known universe...")
    
    if data_dir is None:
        data_dir = Path(__file__).parent.parent / "data" / "catalogs"
    else:
        data_dir = Path(data_dir)
    
    ecosystem = {
        "name": "Halilit Universe",
        "type": "galaxy",
        "children": []
    }
    
    # Structure: Domain -> Brand -> Family -> Product
    domain_map: Dict[str, Dict[str, Dict[str, List[Dict]]]] = {
        domain: {} for domain in BRAND_DOMAINS
    }
    
    all_products = []  # Collect all products for relationship detection
    
    # Load all catalog JSONs
    catalog_files = list(data_dir.glob("*_catalog.json"))
    logger.info(f"📂 Found {len(catalog_files)} catalog files")
    
    for file in catalog_files:
        try:
            with open(file, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                # Handle both array format and object format with "products" key
                if isinstance(data, list):
                    products = data
                elif isinstance(data, dict) and "products" in data:
                    products = data["products"]
                else:
                    logger.warning(f"   ⚠️  Unknown format in {file.name}, skipping")
                    continue
                
                all_products.extend(products)
                logger.info(f"   Loaded {len(products)} products from {file.name}")
        except Exception as e:
            logger.error(f"   ❌ Failed to load {file.name}: {e}")
    
    logger.info(f"📊 Total products loaded: {len(all_products)}")
    
    # Organize products into hierarchy
    for product in all_products:
        brand = product.get("brand", "Unknown")
        name = product.get("name", "Unknown")
        product_type = detect_product_type(product)
        
        # Skip accessories for now (we'll attach them to roots later)
        if product_type == ProductType.ACCESSORY:
            continue
        
        # Find Domain
        domain = "Other"
        for d, brands in BRAND_DOMAINS.items():
            if brand in brands:
                domain = d
                break
        
        if domain == "Other":
            continue  # Skip unclassified for now
        
        # Find Family
        family = detect_family(name, product.get("category", ""))
        
        # Build Tree
        if brand not in domain_map[domain]:
            domain_map[domain][brand] = {}
        if family not in domain_map[domain][brand]:
            domain_map[domain][brand][family] = []
        
        # Enrich product with relationships
        enriched_product = {
            **product,
            "product_type": product_type,
            "family": family,
            "accessories": extract_accessories(all_products, product),
            "related": extract_related_products(all_products, product)
        }
        
        domain_map[domain][brand][family].append(enriched_product)
    
    # Convert to standard Tree format for Frontend
    for domain, brands in domain_map.items():
        if not brands:  # Skip empty domains
            continue
            
        domain_node = {
            "name": domain,
            "type": "domain",
            "children": [],
            "product_count": 0
        }
        
        for brand, families in brands.items():
            brand_node = {
                "name": brand,
                "type": "brand",
                "children": [],
                "product_count": 0
            }
            
            for family, prods in families.items():
                family_node = {
                    "name": family,
                    "type": "family",
                    "children": prods,
                    "product_count": len(prods)
                }
                brand_node["children"].append(family_node)
                brand_node["product_count"] += len(prods)
            
            domain_node["children"].append(brand_node)
            domain_node["product_count"] += brand_node["product_count"]
        
        ecosystem["children"].append(domain_node)
    
    # Sort by product count (most popular domains first)
    ecosystem["children"].sort(key=lambda x: x["product_count"], reverse=True)
    
    logger.info(f"✅ Ecosystem built: {len(ecosystem['children'])} domains")
    for domain in ecosystem["children"]:
        logger.info(f"   {domain['name']}: {domain['product_count']} products")
    
    return ecosystem


def save_ecosystem(output_path: str = None):
    """
    Build and save the ecosystem to JSON file.
    Default output: frontend/public/data/halilit_universe.json
    """
    if output_path is None:
        base_path = Path(__file__).parent.parent.parent
        output_path = base_path / "frontend" / "public" / "data" / "halilit_universe.json"
    else:
        output_path = Path(output_path)
    
    # Ensure directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    ecosystem = build_ecosystem()
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(ecosystem, f, indent=2, ensure_ascii=False)
    
    logger.info(f"🚀 Map coordinates uploaded to Navigation Computer: {output_path}")
    return ecosystem


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    save_ecosystem()
