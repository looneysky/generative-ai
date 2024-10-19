import requests
import base64

def upload_file(url, filename, content_type, text):
    # Преобразуем текст в Base64
    encoded_text = base64.b64encode(text.encode('utf-8')).decode('utf-8')

    # Формирование JSON-объекта с параметрами
    json_data = {
        "content": f"data:{content_type};base64,{encoded_text}",
        "filename": filename,
        "options": {"type": filename.split('.')[0]}  # Используем имя файла для типа
    }
    
    # Заголовки для запроса
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "X-OC-Token": "557974f20ead6efc17a200a0b14d14a1",  # Убедитесь, что токен актуален
        "Origin": "https://www.img2go.com",
        "Referer": "https://www.img2go.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
    }

    # Отправка POST-запроса
    try:
        response = requests.post(url, headers=headers, json=json_data)
        
        # Проверка результата
        if response.status_code == 200:
            print(f"Запрос для {filename} успешно выполнен.")
            print("Ответ:", response.json())
        else:
            print(f"Произошла ошибка при загрузке {filename}:", response.status_code)
            print("Ответ сервера:", response.text)

    except Exception as e:
        print("Исключение:", str(e))

# URL для отправки запроса
url = "https://www14.img2go.com/v2/dl/web7/upload-base64/aa3175a8-f8bc-4b1f-bc04-efcee204ee00"  # Убедитесь, что этот URL актуален

# Ваш текст
prompt_text = "snowl"
negative_prompt_text = "some negative prompt"  # Добавьте текст для негативного запроса

# Выполнение загрузки
upload_file(url, "prompt.txt", "text/plain", prompt_text)
upload_file(url, "negative_prompt.txt", "text/plain", negative_prompt_text)
