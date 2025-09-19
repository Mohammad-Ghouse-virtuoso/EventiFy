#!/usr/bin/env python3
import secrets
import base64

def gen_key(bytes_len: int = 64) -> str:
    raw = secrets.token_bytes(bytes_len)
    return base64.urlsafe_b64encode(raw).decode('utf-8').rstrip('=')

if __name__ == '__main__':
    print(gen_key())
