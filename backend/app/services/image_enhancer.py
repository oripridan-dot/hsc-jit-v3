"""
Image Enhancement Service
Overlays documentation-derived annotations on product images
to highlight and explain device controls, displays, and features.

Enhanced with:
- High-resolution text detection and rendering
- Context-based selective enhancement (text-focused)
- Screen/display content extraction
- Readable label identification
"""
import logging
from typing import Dict, Any, List
import re

logger = logging.getLogger(__name__)


class ImageEnhancer:
    """
    Analyzes product documentation to extract information about
    device controls, displays, screens, and buttons, then generates
    annotation data that can be overlaid on product images.
    """

    def __init__(self):
        pass

    async def extract_readable_text(
        self,
        documentation_content: str
    ) -> Dict[str, Any]:
        """
        Extract readable text that appears on device displays/screens/labels.
        Focus on text that should be rendered crisply on device surfaces.
        
        Returns:
            Dictionary with text elements, their locations, and sizes
        """
        text_elements = {
            'display_labels': [],
            'button_labels': [],
            'screen_text': [],
            'indicator_labels': [],
            'menu_items': []
        }
        
        # Extract display/screen labels
        display_labels = re.findall(
            r'(?:label|shows?|display|screen|indicates?)\s+["\']?([A-Z][A-Za-z0-9\s\-/]+)["\']?',
            documentation_content,
            re.IGNORECASE
        )
        for label in display_labels[:5]:
            if len(label) < 50:  # Reasonable text length
                text_elements['display_labels'].append({
                    'text': label.strip(),
                    'context': 'display',
                    'importance': 'high',
                    'size': 'large'
                })
        
        # Extract button labels (common patterns)
        button_patterns = [
            r'(?:button|key)\s+["\']?([A-Z][A-Za-z\s]+)["\']?',
            r'(?:Press|Push|Tap)\s+(?:the\s+)?["\']?([A-Z][A-Za-z\s]+)["\']?\s+(?:button|key)',
        ]
        for pattern in button_patterns:
            matches = re.findall(pattern, documentation_content, re.IGNORECASE)
            for match in matches[:3]:
                if len(match) < 30:
                    text_elements['button_labels'].append({
                        'text': match.strip(),
                        'context': 'button',
                        'importance': 'medium',
                        'size': 'medium'
                    })
        
        # Extract menu item names
        menu_patterns = [
            r'(?:menu|page|screen)\s+(?:named?|called?|titled?)\s+["\']?([A-Z][A-Za-z0-9\s\-]+)["\']?',
            r'(?:select|choose)\s+["\']?([A-Z][A-Za-z0-9\s]+)["\']?\s+(?:from|in)',
        ]
        for pattern in menu_patterns:
            matches = re.findall(pattern, documentation_content, re.IGNORECASE)
            for match in matches[:3]:
                if len(match) < 40:
                    text_elements['menu_items'].append({
                        'text': match.strip(),
                        'context': 'menu',
                        'importance': 'medium',
                        'size': 'small'
                    })
        
        # Extract screen/LCD text
        screen_patterns = [
            r'(?:LCD|screen|display)\s+(?:shows?|displays?)\s+["\']?([^.]+?)["\']?(?:\.|,)',
        ]
        for pattern in screen_patterns:
            matches = re.findall(pattern, documentation_content, re.IGNORECASE)
            for match in matches[:3]:
                clean_text = match.strip()
                if len(clean_text) < 60 and len(clean_text) > 5:
                    text_elements['screen_text'].append({
                        'text': clean_text,
                        'context': 'screen',
                        'importance': 'high',
                        'size': 'large'
                    })
        
        # Extract LED/indicator labels
        indicator_patterns = [
            r'(?:LED|indicator|light)\s+(?:labeled?|named?)\s+["\']?([A-Z][A-Za-z0-9\s]+)["\']?',
            r'(?:LED|light)\s+(?:for|shows?)\s+["\']?([A-Z][A-Za-z0-9\s]+)["\']?',
        ]
        for pattern in indicator_patterns:
            matches = re.findall(pattern, documentation_content, re.IGNORECASE)
            for match in matches[:2]:
                if len(match) < 30:
                    text_elements['indicator_labels'].append({
                        'text': match.strip(),
                        'context': 'indicator',
                        'importance': 'low',
                        'size': 'small'
                    })
        
        logger.info(f"Extracted text elements: {sum(len(v) for v in text_elements.values())} total")
        return text_elements

    async def detect_text_zones(
        self,
        text_elements: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Identify zones on the image where text should be rendered/highlighted.
        Returns positioning hints for high-resolution text display.
        """
        zones = []
        
        # Center zone for main display/screen text (usually center of device)
        if text_elements['screen_text'] or text_elements['display_labels']:
            zones.append({
                'zone': 'center',
                'type': 'display',
                'priority': 'high',
                'zoom_level': 'extra',
                'text_size': 'large',
                'items': text_elements['screen_text'] + text_elements['display_labels']
            })
        
        # Button zones (distributed around edges)
        if text_elements['button_labels']:
            zones.append({
                'zone': 'edges',
                'type': 'buttons',
                'priority': 'medium',
                'zoom_level': 'high',
                'text_size': 'medium',
                'items': text_elements['button_labels']
            })
        
        # Menu/navigation zones
        if text_elements['menu_items']:
            zones.append({
                'zone': 'topleft',
                'type': 'menu',
                'priority': 'medium',
                'zoom_level': 'high',
                'text_size': 'small',
                'items': text_elements['menu_items']
            })
        
        # Indicator zones (typically small, on corners or edges)
        if text_elements['indicator_labels']:
            zones.append({
                'zone': 'corners',
                'type': 'indicators',
                'priority': 'low',
                'zoom_level': 'medium',
                'text_size': 'small',
                'items': text_elements['indicator_labels']
            })
        
        return zones

    async def analyze_device_features(
        self,
        product_data: Dict[str, Any],
        documentation_content: str
    ) -> List[Dict[str, Any]]:
        """
        Extract device features from documentation that should be highlighted on images.
        
        Args:
            product_data: Product catalog data
            documentation_content: Extracted text from PDF/HTML manual
            
        Returns:
            List of annotations with position hints and descriptions
        """
        annotations = []
        
        # Common patterns for device features in manuals
        patterns = [
            # Display/Screen mentions
            (r'(?:LCD|LED|OLED|display|screen)\s+(?:shows|displays|indicates)\s+([^.]+)', 'display'),
            # Button descriptions
            (r'(?:press|push|tap)\s+(?:the\s+)?(\w+\s+button)\s+(?:to|for)\s+([^.]+)', 'button'),
            # Control descriptions
            (r'(\w+\s+(?:knob|dial|slider|fader))\s+(?:adjusts|controls)\s+([^.]+)', 'control'),
            # Port/Connection descriptions
            (r'(\w+\s+(?:port|jack|input|output))\s+(?:for|to|connects)\s+([^.]+)', 'port'),
            # LED indicators
            (r'(\w+\s+LED)\s+(?:indicates|shows|lights up when)\s+([^.]+)', 'indicator'),
        ]
        
        for pattern, feature_type in patterns:
            matches = re.finditer(pattern, documentation_content, re.IGNORECASE)
            for match in matches:
                if feature_type == 'display':
                    annotations.append({
                        'type': 'display',
                        'feature': 'Display/Screen',
                        'description': match.group(1).strip(),
                        'position': 'center',  # Hint for frontend positioning
                        'importance': 'high'
                    })
                elif feature_type == 'button':
                    annotations.append({
                        'type': 'button',
                        'feature': match.group(1).strip(),
                        'description': match.group(2).strip(),
                        'position': 'auto',
                        'importance': 'medium'
                    })
                elif feature_type == 'control':
                    annotations.append({
                        'type': 'control',
                        'feature': match.group(1).strip(),
                        'description': match.group(2).strip(),
                        'position': 'auto',
                        'importance': 'medium'
                    })
                elif feature_type == 'port':
                    annotations.append({
                        'type': 'port',
                        'feature': match.group(1).strip(),
                        'description': match.group(2).strip(),
                        'position': 'sides',
                        'importance': 'low'
                    })
                elif feature_type == 'indicator':
                    annotations.append({
                        'type': 'indicator',
                        'feature': match.group(1).strip(),
                        'description': match.group(2).strip(),
                        'position': 'auto',
                        'importance': 'low'
                    })
        
        # Limit annotations to most relevant (top 10)
        annotations = annotations[:10]
        
        logger.info(f"Extracted {len(annotations)} device features from documentation")
        return annotations

    async def extract_display_content(
        self, 
        documentation_content: str
    ) -> Dict[str, str]:
        """
        Extract information about what's typically shown on device displays/screens.
        
        Returns:
            Dictionary with display zone descriptions
        """
        display_info = {}
        
        # Look for screen/display descriptions
        display_patterns = [
            (r'(?:main\s+)?screen\s+(?:displays|shows)\s+([^.]+)', 'main_screen'),
            (r'LCD\s+(?:window|panel)\s+(?:displays|shows)\s+([^.]+)', 'lcd'),
            (r'(?:upper|top)\s+display\s+(?:shows|indicates)\s+([^.]+)', 'upper_display'),
            (r'(?:lower|bottom)\s+display\s+(?:shows|indicates)\s+([^.]+)', 'lower_display'),
        ]
        
        for pattern, zone in display_patterns:
            match = re.search(pattern, documentation_content, re.IGNORECASE)
            if match:
                display_info[zone] = match.group(1).strip()
        
        return display_info

    async def generate_enhancement_data(
        self,
        product_data: Dict[str, Any],
        documentation_content: str
    ) -> Dict[str, Any]:
        """
        Generate complete enhancement data for a product image.
        
        Includes:
        - Device feature annotations (controls, ports, etc.)
        - High-resolution text zones for displays/screens
        - Context-based selective enhancement (text-focused)
        - Zoom levels and rendering hints
        
        Returns:
            Enhancement data structure with annotations, text zones, and rendering info
        """
        annotations = await self.analyze_device_features(product_data, documentation_content)
        display_content = await self.extract_display_content(documentation_content)
        text_elements = await self.extract_readable_text(documentation_content)
        text_zones = await self.detect_text_zones(text_elements)
        
        # Determine if this is text-heavy (for context-based enhancement)
        has_text_content = sum(len(v) for v in text_elements.values()) > 0
        text_density = 'high' if sum(len(v) for v in text_elements.values()) >= 5 else 'medium' if has_text_content else 'low'
        
        return {
            'product_id': product_data.get('id'),
            'product_name': product_data.get('name'),
            'annotations': annotations,
            'display_content': display_content,
            'text_elements': text_elements,
            'text_zones': text_zones,
            'has_enhancements': len(annotations) > 0 or len(display_content) > 0,
            'has_text_content': has_text_content,
            'text_density': text_density,
            'zoom_config': {
                'enable_extra_zoom': has_text_content,
                'max_zoom_level': 300 if text_density == 'high' else 250 if text_density == 'medium' else 200,
                'high_res_mode': True,
                'text_rendering': 'crisp' if has_text_content else 'standard',
                'enhancement_mode': 'text-focused' if text_density == 'high' else 'balanced' if text_density == 'medium' else 'features-only'
            }
        }


# Singleton instance
_image_enhancer_instance = None

def get_image_enhancer() -> ImageEnhancer:
    """Get or create the singleton ImageEnhancer instance"""
    global _image_enhancer_instance
    if _image_enhancer_instance is None:
        _image_enhancer_instance = ImageEnhancer()
    return _image_enhancer_instance
