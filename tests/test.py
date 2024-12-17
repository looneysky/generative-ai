import requests
import hashlib

# URL вашего вебхука
url = 'https://test-project-generative-ai-v2.3gpeil.easypanel.host/webhook'

# Ваш секретный ключ для расчета хэша
secret = 'NpVh2NNjOstzy0gUFJmsWzlw'

# Количество запросов
num_requests = 1

for i in range(num_requests):
    # Данные для отправки
    data = {
        'notification_type': 'p2p-incoming',
        'operation_id': f'test-notification-{i}',  # Уникальный operation_id для каждого запроса
        'amount': '199',
        'currency': '643',
        'datetime': '2024-10-08T22:35:05Z',
        'sender': '41001000040',
        'codepro': 'false',
        'label': '1620011186'  # userId
    }

    # Создаем строку для хэша в правильном порядке
    hash_string = f"{data['notification_type']}&{data['operation_id']}&{data['amount']}&{data['currency']}&{data['datetime']}&{data['sender']}&{data['codepro']}&{secret}&{data['label']}"

    # Вычисляем sha1 хэш
    sha1_hash = hashlib.sha1(hash_string.encode('utf-8')).hexdigest()

    # Добавляем хэш в данные
    data['sha1_hash'] = sha1_hash

    # Отправляем POST запрос
    response = requests.post(url, data=data)

    # Печатаем результат
    print(f'Request {i + 1}: Status code: {response.status_code}, Response body: {response.text}')
