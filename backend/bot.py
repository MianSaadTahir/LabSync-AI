# file: tiny_bot.py
import os
import time
import requests

# --- Configuration ---
BOT_TOKEN = os.getenv("TG_BOT_TOKEN", "8070477398:AAHbSXb1vHl1nWuhFqSBNbForcfmoWvIBtA")
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"


# --- Send a message to a user ---
def send_message(chat_id, text):
    url = f"{API_URL}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    try:
        resp = requests.post(url, json=payload)
        print("Telegram response:", resp.text)  # Debug print
        resp.raise_for_status()  # Raises error if not 200
        return resp.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error sending message: {e}")
        return None


# --- Poll for updates (messages) ---
def poll_updates(offset=None, timeout=20):
    url = f"{API_URL}/getUpdates"
    params = {"timeout": timeout}
    if offset:
        params["offset"] = offset
    try:
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error polling updates: {e}")
        return {}


# --- Main bot loop ---
def main():
    last_offset = None
    print("🤖 Bot started. Listening for messages... (Press Ctrl+C to stop)")
    while True:
        data = poll_updates(offset=last_offset)

        for upd in data.get("result", []):
            last_offset = upd["update_id"] + 1
            if "message" in upd:
                chat_id = upd["message"]["chat"]["id"]
                text = upd["message"].get("text", "")
                print(f"📩 Got message from {chat_id}: {text}")

                # Simple echo bot
                reply = f"You said: {text}"
                print("💬 Sending reply...")
                send_message(chat_id, reply)
                print("✅ Reply sent.\n")

        time.sleep(1)


# --- Run the bot ---
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Bot stopped by user.")
