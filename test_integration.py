#!/usr/bin/env python3
"""
Quick test script to verify unified router implementation
Run: python test_integration.py
"""

from backend.app.services.unified_router import UnifiedQueryRouter, QueryIntent, ProductMatch
from unittest.mock import Mock, AsyncMock
import asyncio
import sys
sys.path.insert(0, 'backend')


async def test_intent_analysis():
    """Test query intent analysis"""
    print("\n🧪 Testing Intent Analysis...")

    # Create minimal router
    router = UnifiedQueryRouter(
        sniffer_service=Mock(),
        catalog_service=Mock(),
        fetcher_service=Mock(),
        llm_service=Mock(),
        cache=Mock()
    )

    # Test product search
    intent1 = await router._analyze_intent("show me moog synthesizers")
    assert intent1.type == 'product_search', f"Expected product_search, got {intent1.type}"
    assert 'moog' in intent1.keywords
    print("  ✅ Product search intent detected correctly")

    # Test technical question
    intent2 = await router._analyze_intent("how do I connect MIDI")
    assert intent2.type == 'technical_question', f"Expected technical_question, got {intent2.type}"
    print("  ✅ Technical question intent detected correctly")

    # Test troubleshooting
    intent3 = await router._analyze_intent("my synth is not working")
    assert intent3.type == 'troubleshooting', f"Expected troubleshooting, got {intent3.type}"
    print("  ✅ Troubleshooting intent detected correctly")

    # Test comparison
    intent4 = await router._analyze_intent("compare Moog vs Nord")
    assert intent4.type == 'comparison', f"Expected comparison, got {intent4.type}"
    print("  ✅ Comparison intent detected correctly")


async def test_product_selection():
    """Test product selection logic"""
    print("\n🧪 Testing Product Selection...")

    router = UnifiedQueryRouter(
        sniffer_service=Mock(),
        catalog_service=Mock(),
        fetcher_service=Mock(),
        llm_service=Mock(),
        cache=Mock()
    )

    products = [
        ProductMatch('id1', 'Moog Muse', 'Moog', 0.95, 'Synth',
                     'http://manual1.pdf', '/img1.jpg'),
        ProductMatch('id2', 'Nord Stage', 'Nord', 0.85, 'Piano',
                     'http://manual2.pdf', '/img2.jpg'),
    ]

    # Mock WebSocket
    ws = Mock()
    ws.send_json = AsyncMock()

    # Create context
    from backend.app.services.unified_router import QueryContext
    context = QueryContext(
        query="test",
        intent=QueryIntent('product_search', 0.9, ['test'], False),
        source='explorer'
    )

    # Test auto-selection (should pick highest score)
    selected = await router._select_product(context, products, ws)
    assert selected.id == 'id1', f"Expected id1, got {selected.id}"
    assert selected.score == 0.95
    print("  ✅ Auto-selects highest scoring product")

    # Test context product preservation
    context.selected_product = products[1]
    selected2 = await router._select_product(context, products, ws)
    assert selected2.id == 'id2', "Should preserve context product"
    print("  ✅ Preserves context product when available")


async def test_session_management():
    """Test session management"""
    print("\n🧪 Testing Session Management...")

    router = UnifiedQueryRouter(
        sniffer_service=Mock(),
        catalog_service=Mock(),
        fetcher_service=Mock(),
        llm_service=Mock(),
        cache=Mock()
    )

    intent = QueryIntent('product_search', 0.9, ['moog'], False)

    # Create new session
    ctx1 = router._get_or_create_context(
        'session1', 'query1', intent, 'explorer')
    assert 'session1' in router.sessions
    assert ctx1.query == 'query1'
    print("  ✅ Creates new session correctly")

    # Update existing session
    intent2 = QueryIntent('technical_question', 0.85, ['how'], True)
    ctx2 = router._get_or_create_context(
        'session1', 'query2', intent2, 'promptbar')
    assert ctx2.query == 'query2'
    assert ctx2.source == 'promptbar'
    assert router.sessions['session1'] == ctx2
    print("  ✅ Updates existing session correctly")

    # Multiple sessions
    ctx3 = router._get_or_create_context(
        'session2', 'query3', intent, 'explorer')
    assert len(router.sessions) == 2
    print("  ✅ Handles multiple sessions correctly")


async def main():
    """Run all tests"""
    print("=" * 60)
    print("🚀 HSC JIT v3.3 - Unified Router Integration Tests")
    print("=" * 60)

    try:
        await test_intent_analysis()
        await test_product_selection()
        await test_session_management()

        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\n📝 Next steps:")
        print("  1. Start Redis: redis-server")
        print("  2. Start backend: cd backend && uvicorn app.main:app --reload")
        print("  3. Start frontend: cd frontend && pnpm dev")
        print("  4. Open http://localhost:5173 and test manually")
        return 0

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n💥 ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
