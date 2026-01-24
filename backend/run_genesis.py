#!/usr/bin/env python3
"""Run the Genesis Builder to construct the app structure."""

from services.genesis_builder import GenesisBuilder

if __name__ == "__main__":
    builder = GenesisBuilder('')
    results = builder.construct_all_brands()
    print(f'\n✅ Genesis Build Complete!')
    print(f'Total brands: {len(results)}')
