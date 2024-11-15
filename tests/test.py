import requests
import json

# The URL to which the POST request is being sent
url = 'http://localhost:3000/webhook'  # Replace with your actual URL

# The data to send in the POST request
payload = {
    "actually_paid": 0,
    "actually_paid_at_fiat": 0,
    "fee": {
        "currency": "usdttrc20",
        "depositFee": 0,
        "serviceFee": 0,
        "withdrawalFee": 0
    },
    "invoice_id": None,
    "order_description": '7259949651',
    "order_id": "dd4abd66761561622eafc9a56d09f160",
    "outcome_amount": 192.728833,
    "outcome_currency": "usdttrc20",
    "parent_payment_id": None,
    "pay_address": "TUTruUEpoLAgSdkLUbLAx4wPmSCVqXNx2c",
    "pay_amount": 199,
    "pay_currency": "usdttrc20",
    "payin_extra_id": None,
    "payment_extra_ids": None,
    "payment_id": 6033754129,
    "payment_status": "finished",
    "price_amount": 199,
    "price_currency": "usdttrc20",
    "purchase_id": "6236048111"
}

# Send the POST request with the JSON payload
response = requests.post(url, json=payload)

# Print the response from the server
if response.status_code == 200:
    print("Request successful:", response.text)
else:
    print("Request failed with status code:", response.status_code)
    print("Response: ", response.text)
