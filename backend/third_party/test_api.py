import asyncio
from third_party.virustotal_api import check_virustotal  

test_url = "http://allegrolokalnie.pl-ogloszenie2562.shop"  

async def test_virustotal():
    print(f"🔍 Testing URL: {test_url}")

    result = await check_virustotal(test_url) 

    print("🛡️ VirusTotal API Response:")
    print(result)

asyncio.run(test_virustotal())
