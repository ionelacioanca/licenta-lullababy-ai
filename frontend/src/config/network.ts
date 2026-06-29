import networkConfig from "../../network-config.json";

// IP_PI is the Raspberry Pi's own fixed address on the local network.
export const IP_BACKEND = networkConfig.IP_BACKEND;
export const IP_PI = networkConfig.IP_PI;

export const BACKEND_PORT = networkConfig.BACKEND_PORT;
export const PI_PORT = networkConfig.PI_PORT;

export const BACKEND_BASE_URL = `http://${IP_BACKEND}:${BACKEND_PORT}`;
export const API_BASE_URL = `${BACKEND_BASE_URL}/api`;
export const PI_BASE_URL = `http://${IP_PI}:${PI_PORT}`;