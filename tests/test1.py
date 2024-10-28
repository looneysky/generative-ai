import requests
import math
import random

# Generate a random 12-digit number as a string
myrandomstr = str(random.randint(0, 99999999999))

# Hash function similar to the JavaScript version
def myhashfunction(input_str):
    a = [int(4294967296 * abs(math.sin(i + 1))) & 0xFFFFFFFF for i in range(64)]
    
    def md5_transform(c):
        d, e = 1732584193, 4023233417
        f = ~d & 0xFFFFFFFF
        g = ~e & 0xFFFFFFFF
        h = []
        l = (c + "\u0080").encode('utf-8')
        l += b'\x00' * ((56 - len(l) % 64) % 64) + (len(c) * 8).to_bytes(8, 'little')
        
        for i in range(0, len(l), 64):
            b = l[i:i + 64]
            w = [int.from_bytes(b[j:j + 4], 'little') for j in range(0, 64, 4)]
            k = [d, e, f, g]
            
            for i in range(64):
                if i < 16:
                    f = (k[1] & k[2]) | (~k[1] & k[3])
                    j = i
                elif i < 32:
                    f = (k[3] & k[1]) | (~k[3] & k[2])
                    j = (5 * i + 1) % 16
                elif i < 48:
                    f = k[1] ^ k[2] ^ k[3]
                    j = (3 * i + 5) % 16
                else:
                    f = k[2] ^ (k[1] | ~k[3])
                    j = (7 * i) % 16
                
                f = (f + k[0] + a[i] + w[j]) & 0xFFFFFFFF
                k[0], k[1], k[2], k[3] = (
                    (k[1] + ((f << (7 if i % 4 == 0 else (12 if i % 4 == 1 else (17 if i % 4 == 2 else 22))) | f >> (32 - (7 if i % 4 == 0 else (12 if i % 4 == 1 else (17 if i % 4 == 2 else 22)))))) & 0xFFFFFFFF) & 0xFFFFFFFF,
                    k[0], k[1], k[2]
                )
            
            d = (d + k[0]) & 0xFFFFFFFF
            e = (e + k[1]) & 0xFFFFFFFF
            f = (f + k[2]) & 0xFFFFFFFF
            g = (g + k[3]) & 0xFFFFFFFF

        return ''.join(f'{x:08x}' for x in [d, e, f, g])

    return md5_transform(input_str)

# Generate the API key
user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
tryitApiKey = 'tryit-' + myrandomstr + '-' + myhashfunction(user_agent + myhashfunction(user_agent + myhashfunction(user_agent + myrandomstr + 'i_am_a_smelly_hacker_yes_i_am')))
print("Generated API Key:", tryitApiKey)

# Set up headers with the generated API key
headers = {
    "accept": "*/*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "ru,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
    "Api-Key": tryitApiKey,
    "User-Agent": user_agent
}

# Prepare form data
url = "https://api.deepai.org/api/text2img"
files = {
    "text": (None, "girl"),
    "image_generator_version": (None, "hd"),
    "use_old_model": (None, "false"),
    "quality": (None, "true")
}

# Send the request
response = requests.post(url, headers=headers, files=files)

# Output the response
if response.status_code == 200:
    print("Request successful!")
    print(response.json())
else:
    print(f"Error: {response.status_code}")
    print(response.text)
