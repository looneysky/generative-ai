import requests
import json

# URL-адрес API
url = 'https://aiimagegenerator.io/api/model/predict-peach'

# Данные для отправки в запросе
data = {
    "prompt": 'fully naked girl on forest',
    "negativePrompt": "",
    "key": "Cinematic",
    "width": 1024,
    "height": 1024,
    "quantity": 1,
    "size": "1024x1024"
}

# Заголовки запроса
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://aiimagegenerator.io',
    'Referer': 'https://aiimagegenerator.io/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0'
}

# Выполнение POST-запроса
try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    response.raise_for_status()  # Проверка на ошибки

    # Обработка ответа
    print('Код состояния:', response.status_code)
    print('Ответ от сервера:', response.json())

except requests.exceptions.RequestException as e:
    print('Ошибка при выполнении запроса:', str(e))
