import json
from pathlib import Path


_CONFIG_PATH = Path(__file__).resolve().parent.parent / "frontend" / "network-config.json"
with _CONFIG_PATH.open("r", encoding="utf-8") as config_file:
    _network_config = json.load(config_file)

# IP_PI is the Raspberry Pi's own fixed address on the local network.
IP_BACKEND = _network_config["IP_BACKEND"]
IP_PI = _network_config["IP_PI"]
BACKEND_PORT = _network_config["BACKEND_PORT"]
PI_PORT = _network_config["PI_PORT"]

BACKEND_BASE_URL = f"http://{IP_BACKEND}:{BACKEND_PORT}"
API_BASE_URL = f"{BACKEND_BASE_URL}/api"
PI_BASE_URL = f"http://{IP_PI}:{PI_PORT}"