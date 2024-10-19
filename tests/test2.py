import requests

url = "https://dragon.img2go.com/api/jobs/8e5a3608-bc9b-4c9e-8e18-93b41b6beb6f?async=true"
headers = {
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.img2go.com",
    "Referer": "https://www.img2go.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
    "Cookie": "QGID=455efa76-bc4a-4660-9b11-1859acf0aef7; qgrole=unregistered; qg_locale_suggest=true; x-oc-download-password=a05337e75e25c99876d7bafbaf23a8cb78eeb7074b1b00a1f9d7b499f2931a44",
    "Accept-Language": "ru,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
    "sec-ch-ua": '"Microsoft Edge";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "priority": "u=1, i"
}

response = requests.get(url, headers=headers)

print("Status Code:", response.status_code)
print("Response Headers:", response.text)
