import requests

url = "https://dragon.img2go.com/api/jobs"
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.img2go.com",
    "Referer": "https://www.img2go.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
    "Cookie": "QGID=455efa76-bc4a-4660-9b11-1859acf0aef7; qgrole=unregistered; qg_locale_suggest=true; x-oc-download-password=15d4d7c80be00c211b5f0139b7bf2951fc0ea147da711f2a270d0016ff747b9d"
}

data = {
    "operation": "aicreatorstudio",
    "async": True
}

response = requests.post(url, headers=headers, json=data)

print("Status Code:", response.status_code)
print("Response JSON:", response.json())
