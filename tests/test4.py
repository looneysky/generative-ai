import requests
import json

# URL для отправки запроса
url = "https://dragon.img2go.com/api/jobs/fab7a402-3b0d-4668-82b9-9347d240549c/conversions"

# Данные для отправки
data = {
    "target": "text-to-image",
    "category": "operation",
    "options": {
        "aspect_ratio": "1:1",
        "style": "photography",
        "allow_multiple_outputs": True,
        "cfg_scale": 7,
        "num_inference_steps": 20,
        "batch_size": 1,
        "batch_count": 1
    }
}

# Заголовки для запроса
headers = {
    "Content-Type": "application/json",
    "Cookie": "QGID=455efa76-bc4a-4660-9b11-1859acf0aef7; qgrole=unregistered; qg_locale_suggest=true; x-oc-download-password=a05337e75e25c99876d7bafbaf23a8cb78eeb7074b1b00a1f9d7b499f2931a44"
}

# Отправка POST-запроса
response = requests.post(url, headers=headers, json=data)

# Проверка результата
if response.status_code == 200:
    print("Запрос успешно выполнен.")
    print("Ответ:", response.json())
else:
    print("Произошла ошибка:", response.status_code, response.text)
