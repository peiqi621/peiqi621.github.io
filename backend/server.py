#!/usr/bin/env python3
import json
import os
import random
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
import requests
import re


HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5057"))
DATA_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(DATA_DIR, "data.json")
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")


def _now_ms() -> int:
    return int(time.time() * 1000)


def load_data():
    if not os.path.exists(DATA_PATH):
        return {"stats": {}, "chats": {}}
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"stats": {}, "chats": {}}


def save_data(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def random_init():
    now = _now_ms()
    return {
        "hunger": random.randint(40, 90),
        "affection": random.randint(30, 90),
        "cleanliness": random.randint(50, 100),
        "lastTs": now,
        "lastInitTs": now,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "CMBackend/0.1"

    def _set_cors(self):
        origin = self.headers.get("Origin") or "*"
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, obj, code=200):
        payload = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self._set_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            return self._send_json({"ok": True, "ts": _now_ms()})

        if parsed.path.startswith("/api/stats/"):
            _, _, char_key = parsed.path.partition("/api/stats/")
            data = load_data()
            stats = data.get("stats", {}).get(char_key)
            if stats is None:
                stats = random_init()
                data.setdefault("stats", {})[char_key] = stats
                save_data(data)
            return self._send_json({"stats": stats})

        self._send_json({"error": "not_found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8"))
        except Exception:
            body = {}

        if parsed.path.startswith("/api/stats/"):
            _, _, char_key = parsed.path.partition("/api/stats/")
            data = load_data()
            stats = body.get("stats") or {}
            if not isinstance(stats, dict):
                return self._send_json({"error": "invalid_stats"}, 400)
            data.setdefault("stats", {})[char_key] = stats
            save_data(data)
            return self._send_json({"ok": True})

        if parsed.path == "/api/chat":
            character_key = str(body.get("characterKey") or "pet")
            message = str(body.get("message") or "")
            stats = body.get("stats") or {}
            data = load_data()

            # prefer DeepSeek if configured
            reply = None
            source = "local"
            ds_error = None
            # load from env or config.json
            cfg = {}
            try:
                if os.path.exists(CONFIG_PATH):
                    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                        cfg = json.load(f) or {}
            except Exception:
                cfg = {}
            # OpenAI first (更低时延), fallback DeepSeek
            oa_key = os.getenv("OPENAI_API_KEY") or cfg.get("openai_api_key")
            oa_model = os.getenv("OPENAI_MODEL") or cfg.get("openai_model", "gpt-4o-mini")
            if oa_key:
                try:
                    reply = self._openai_reply(
                        message,
                        body.get("history") or [],
                        stats,
                        oa_key,
                        oa_model,
                        name=body.get("name"),
                        persona=body.get("persona"),
                    )
                    source = "openai"
                except Exception as e:
                    ds_error = str(e)
                    reply = None

            api_key = os.getenv("DEEPSEEK_API_KEY") or cfg.get("deepseek_api_key")
            model = os.getenv("DEEPSEEK_MODEL") or cfg.get("deepseek_model", "deepseek-chat")
            if reply is None and api_key:
                try:
                    reply = self._deepseek_reply(
                        message,
                        body.get("history") or [],
                        stats,
                        api_key,
                        model,
                        name=body.get("name"),
                        persona=body.get("persona"),
                    )
                    source = "deepseek"
                except Exception as e:
                    ds_error = str(e)
                    reply = None

            if not reply:
                # simple fallback
                reply = self._bot_reply(message, stats)
                source = "local"
            # sanitize reply (no emoji)
            reply = self._sanitize_reply(reply or "")

            chats = data.setdefault("chats", {}).setdefault(character_key, [])
            chats.append({"role": "me", "text": message})
            chats.append({"role": "npc", "text": reply})
            save_data(data)
            resp = {"reply": reply, "source": source}
            if ds_error and source == "local":
                resp["error"] = ds_error
            return self._send_json(resp)

        self._send_json({"error": "not_found"}, 404)

    @staticmethod
    def _bot_reply(user_input: str, stats: dict) -> str:
        hunger = stats.get("hunger", 60)
        affection = stats.get("affection", 60)
        cleanliness = stats.get("cleanliness", 60)
        if any(k in user_input.lower() for k in ["feed", "food", "eat"]):
            return "Nom nom! Thank you!"
        if any(k in user_input.lower() for k in ["play", "game"]):
            return "Let's play!"
        if any(k in user_input.lower() for k in ["clean", "wash"]):
            return "Shiny!"
        if affection > 70:
            return random.choice(["Yay! Let's play!", "I adore you!", "Best day ever!"])
        if hunger < 30:
            return random.choice(["So hungry...", "Feed me please?", "Yummy time?"])
        if cleanliness < 40:
            return random.choice(["I need cleaning...", "Sparkle time?", "Feeling a bit dusty"]) 
        return random.choice(["Nice to see you!", "Hello there!", "How are you today?"])

    @staticmethod
    def _deepseek_reply(message: str, history: list, stats: dict, api_key: str, model: str, name: str = None, persona: str = None) -> str:
        url = "https://api.deepseek.com/v1/chat/completions"
        # System persona
        header = []
        if name:
            header.append(f"Name: {name}.")
        if persona:
            header.append(f"Persona: {persona}")
        stats_text = f"Current stats -> hunger: {stats.get('hunger', 60)}, affection: {stats.get('affection', 60)}, cleanliness: {stats.get('cleanliness', 60)}."
        sys_prompt = (
            "使用简体中文进行回复，并严格保持人设。始终以第一人称自称，不要提及自己是虚拟、AI、宠物或角色。"
            "回复要简短（不超过20字），可使用ASCII卡通符号（如 (^_^) (o_o)），但禁止emoji。"
            + " ".join(header) + " " + stats_text
        )
        msgs = [{"role": "system", "content": sys_prompt}]
        # include at most last 6 turns, map roles to OpenAI schema
        for m in (history or [])[-6:]:
            r = str(m.get("role", "user"))
            role = "assistant" if r in ("assistant", "npc") else "user"
            msgs.append({"role": role, "content": str(m.get("text", ""))})
        msgs.append({"role": "user", "content": message})
        payload = {
            "model": model,
            "messages": msgs,
            "temperature": 0.7,
            "stream": False,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(url, headers=headers, json=payload, timeout=20)
        r.raise_for_status()
        data = r.json()
        content = (
            data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
        )
        if not content:
            raise RuntimeError("empty_reply")
        return content.strip()

    @staticmethod
    def _openai_reply(message: str, history: list, stats: dict, api_key: str, model: str, name: str = None, persona: str = None) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        header = []
        if name:
            header.append(f"Name: {name}.")
        if persona:
            header.append(f"Persona: {persona}")
        stats_text = f"Current stats -> hunger: {stats.get('hunger', 60)}, affection: {stats.get('affection', 60)}, cleanliness: {stats.get('cleanliness', 60)}."
        sys_prompt = (
            "使用简体中文进行回复，并严格保持人设。始终以第一人称自称，不要提及自己是虚拟、AI、宠物或角色。"
            "回复要简短（不超过20字），可使用ASCII卡通符号（如 (^_^) (o_o)），但禁止emoji。"
            + " ".join(header) + " " + stats_text
        )
        msgs = [{"role": "system", "content": sys_prompt}]
        for m in (history or [])[-6:]:
            r = str(m.get("role", "user"))
            role = "assistant" if r in ("assistant", "npc") else "user"
            msgs.append({"role": role, "content": str(m.get("text", ""))})
        msgs.append({"role": "user", "content": message})
        payload = {
            "model": model,
            "messages": msgs,
            "temperature": 0.7,
            "max_tokens": 64,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(url, headers=headers, json=payload, timeout=12)
        r.raise_for_status()
        data = r.json()
        content = (
            data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
        )
        if not content:
            raise RuntimeError("empty_reply")
        return content.strip()

    @staticmethod
    def _sanitize_reply(text: str) -> str:
        # Remove emoji by filtering out characters beyond BMP that are typically emoji
        # and common emoji ranges; then trim
        def is_emoji(ch: str) -> bool:
            cp = ord(ch)
            # Basic ranges for emoji and pictographs
            return (
                0x1F000 <= cp <= 0x1FAFF or
                0x1F300 <= cp <= 0x1F5FF or
                0x1F600 <= cp <= 0x1F64F or
                0x1F680 <= cp <= 0x1F6FF or
                0x1F900 <= cp <= 0x1F9FF or
                0x2600 <= cp <= 0x26FF or
                0x2700 <= cp <= 0x27BF
            )
        cleaned = ''.join(ch for ch in text if not is_emoji(ch))
        return cleaned.strip()


def main():
    httpd = HTTPServer((HOST, PORT), Handler)
    print(f"Serving API on http://{HOST}:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()


