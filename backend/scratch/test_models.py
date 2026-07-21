import httpx, os

api_key = os.environ.get("GEMINI_API_KEY", "")
r = httpx.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}", timeout=10)
models = r.json().get("models", [])

print("=== Available Gemini Models (generateContent) ===")
for m in models:
    if "generateContent" in m.get("supportedGenerationMethods", []):
        name = m["name"]
        desc = m.get("description", "")[:60]
        input_limit = m.get("inputTokenLimit", "?")
        print(f"  {name} | tokens={input_limit} | {desc}")

# Test the lite model
print("\n=== Testing gemini-2.0-flash-lite ===")
test_model = "gemini-2.0-flash-lite"
endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{test_model}:generateContent?key={api_key}"
try:
    payload = {
        "contents": [{"parts": [{"text": "In one sentence: what is a gas turbine?"}]}],
        "generationConfig": {"temperature": 0.0}
    }
    with httpx.Client(timeout=15.0) as client:
        res = client.post(endpoint, json=payload)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            text = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            print(f"Response: {text}")
        else:
            print(f"Error: {res.text[:200]}")
except Exception as e:
    print(f"Exception: {e}")
