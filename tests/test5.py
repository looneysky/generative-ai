import requests

# URL для отправки запроса
url = "https://dragon.img2go.com/api/jobs/fab7a402-3b0d-4668-82b9-9347d240549c"

# Заголовки для запроса
headers = {
    "Cookie": "QGID=455efa76-bc4a-4660-9b11-1859acf0aef7; qgrole=unregistered; qg_locale_suggest=true; x-oc-download-password=a05337e75e25c99876d7bafbaf23a8cb78eeb7074b1b00a1f9d7b499f2931a44",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
}

# Выполнение GET-запроса
response = requests.get(url, headers=headers)

# Проверка результата
if response.status_code == 200:
    print("Запрос успешно выполнен.")
    print("Ответ:", response.json())  # Предполагается, что ответ в формате JSON
else:
    print("Произошла ошибка:", response.status_code, response.text)
