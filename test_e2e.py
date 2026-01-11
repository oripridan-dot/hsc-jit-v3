#!/usr/bin/env python3
"""E2E Test: Verify WebSocket flow with Roland TD-17KVX query"""
import asyncio
import json
import sys
from websockets import connect

async def test_roland_query():
    """Test the full flow: typing → prediction → query → answer stream"""
    uri = "ws://localhost:8000/ws"
    
    print("🧪 Connecting to WebSocket...")
    async with connect(uri) as ws:
        print("✓ Connected\n")
        
        # Step 1: Send typing event to get predictions
        print("1️⃣ Sending typing event: 'roland'")
        await ws.send(json.dumps({
            "type": "typing",
            "content": "roland"
        }))
        
        response = await ws.recv()
        data = json.loads(response)
        print(f"   Response type: {data.get('type')}")
        
        if data.get("type") == "prediction":
            predictions = data.get("data", [])
            print(f"   Predictions: {len(predictions)} products")
            if predictions:
                first = predictions[0]
                product_name = first.get("product", {}).get("name")
                confidence = first.get("confidence")
                brand_name = first.get("brand", {}).get("name")
                print(f"   Top match: {product_name} ({brand_name}) - {confidence}% confidence")
                product_id = first.get("product", {}).get("id")
                
                # Step 2: Send query for the top product
                print(f"\n2️⃣ Sending query for product: {product_id}")
                await ws.send(json.dumps({
                    "type": "query",
                    "product_id": product_id,
                    "query": "What audio interfaces does this work with?"
                }))
                
                # Step 3: Listen for streaming response
                print("   Listening for stream...\n")
                answer_chunks = []
                while True:
                    msg_raw = await ws.recv()
                    msg = json.loads(msg_raw)
                    msg_type = msg.get("type")
                    
                    if msg_type == "status":
                        print(f"   📡 Status: {msg.get('msg')}")
                    elif msg_type == "answer_chunk":
                        chunk = msg.get("content", "")
                        answer_chunks.append(chunk)
                        print(chunk, end="", flush=True)
                    elif msg_type == "context":
                        brand = msg.get("data", {}).get("brand", {})
                        related = msg.get("data", {}).get("related_items", [])
                        print(f"\n\n   📦 Brand: {brand.get('name')} (HQ: {brand.get('hq')})")
                        print(f"   🔗 Related items: {len(related)}")
                    elif msg_type == "final_answer":
                        print("\n\n   ✅ Stream complete")
                        break
                    elif msg_type == "error":
                        print(f"\n\n   ❌ Error: {msg.get('message')}")
                        return False
                
                full_answer = "".join(answer_chunks)
                if len(full_answer) > 0:
                    print(f"\n✅ Test PASSED: Received {len(full_answer)} chars")
                    return True
                else:
                    print("\n❌ Test FAILED: Empty answer")
                    return False
        else:
            print(f"   ❌ Unexpected response type: {data.get('type')}")
            return False

if __name__ == "__main__":
    try:
        result = asyncio.run(test_roland_query())
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f"\n💥 Exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
