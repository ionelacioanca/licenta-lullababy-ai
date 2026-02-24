import os
import cv2
import numpy as np
import subprocess
import time
import threading
import datetime
import requests
from pymongo import MongoClient
from flask import Flask, Response, request, jsonify, send_from_directory, send_file

app = Flask(__name__)

# --- CONFIGURARE ---
ALSA_DEVICE = "hw:0,0"  # Device pentru boxă (output)
ALSA_MICROPHONE_DEVICE = "hw:1,0"  # Device pentru microfon (input)
BACKEND_SERVER = "http://192.168.1.50:5000"  # Backend server pentru notificări

current_playback = {
    "status": "stopped",
    "url": None,
    "volume": 50 # Procent 0-100
}

CONNECTION_STRING = "mongodb+srv://ionelaccl:licenta@ionelascluster.bij1odp.mongodb.net/lullababy?retryWrites=true&w=majority"
try:
    client = MongoClient(CONNECTION_STRING)
    # Testăm conexiunea
    client.admin.command('ping')
    print("Conexiune reușită la MongoDB Atlas!")

    db = client['lullababy'] # Numele bazei de date
    sleep_collection = db['sleep_events'] # Numele colecției
except Exception as e:
    print(f"Eroare la conectarea în Atlas: {e}")

RECORDINGS_DIR = "/home/pi/recordings"
if not os.path.exists(RECORDINGS_DIR):
    os.makedirs(RECORDINGS_DIR)

# Cooldown pentru notificări (în secunde)
NOTIFICATION_COOLDOWN = 60  # 1 minut între notificări
last_motion_notification_time = 0
last_wakeup_notification_time = 0
last_sleeping_notification_time = 0

last_frame = None
frame_lock = threading.Lock()
motion_detected = False
# Variabile pentru logica de somn
current_baby_status = "Necunoscut"
last_activity_time = time.time()
status_start_time = time.time()
current_sleep_session_id = None
motion_start_time = None
AWAKE_CONFIRMATION_SECONDS = 5

# Praguri (le poți ajusta ulterior)
# Dacă nu e mișcare timp de 300 secunde (5 minute), considerăm că doarme
SLEEP_THRESHOLD_SECONDS = 30

def background_frame_reader():
    global current_baby_status, last_activity_time, status_start_time, motion_detected, last_frame, motion_start_time

    os.system("sudo killall -9 rpicam-vid > /dev/null 2>&1")
    time.sleep(0.5)

    cmd = [
        'rpicam-vid', '-t', '0', '--inline', '--width', '1280', '--height', '720',
        '--framerate', '15', '--codec', 'mjpeg', '--flush', '--nopreview',
        '--saturation', '0', '-o', '-'
    ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=0)
    buffer = b""

    prev_gray = None
    recording_until = 0
    frame_count = 0 

    print("--- [SISTEM] Analiza video a pornit ---")

    while True:
        try:
            chunk = process.stdout.read(8192)
            if not chunk: break
            buffer += chunk

            a = buffer.find(b'\xff\xd8')
            b = buffer.find(b'\xff\xd9')

            if a != -1 and b != -1:
                jpg_data = buffer[a:b+2]
                buffer = buffer[b+2:]

                with frame_lock:
                    last_frame = jpg_data

                frame_count += 1
                if frame_count % 10 == 0:
                    nparr = np.frombuffer(jpg_data, np.uint8)
                    full_frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                    if full_frame is not None:
                        frame_small = cv2.resize(full_frame, (320, 180))
                        gray = cv2.cvtColor(frame_small, cv2.COLOR_BGR2GRAY)
                        gray = cv2.GaussianBlur(gray, (21, 21), 0)

                        if prev_gray is not None:
                            frame_diff = cv2.absdiff(prev_gray, gray)
                            thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)[1]
                            thresh = cv2.dilate(thresh, None, iterations=2)
                            motion_score = np.sum(thresh)

                            # LOGICĂ MIȘCARE / ÎNREGISTRARE
                            is_moving = motion_score > 50000
                            
                            if is_moving:
                                # Update timestamp pentru ultima mișcare
                                global last_sleeping_notification_time
                                
                                # Trimite notificare de motion detected cu cooldown
                                global last_motion_notification_time
                                current_time = time.time()
                                if current_time - last_motion_notification_time > NOTIFICATION_COOLDOWN:
                                    print("📤 [NOTIFICARE] Trimit notificare de motion detected")
                                    threading.Thread(target=send_notification, args=('motion-detected',)).start()
                                    last_motion_notification_time = current_time
                                else:
                                    time_remaining = int(NOTIFICATION_COOLDOWN - (current_time - last_motion_notification_time))
                                    print(f"⏳ [NOTIFICARE] Cooldown activ - {time_remaining}s rămase până la următoarea notificare")
                                
                                last_activity_time = time.time() # Update activitate
                                if not motion_detected:
                                    print(f"DEBUG: Miscare detectata (Score: {motion_score})")
                                    start_recording_event()
                                    motion_detected = True
                                recording_until = time.time() + 20
                            
                            if time.time() > recording_until:
                                motion_detected = False
                            
                            # LOGICĂ SOMN
                            if is_moving:
                                if current_baby_status == "Adormit":
                                    if motion_start_time is None:
                                        motion_start_time = time.time()
                                    elif time.time() - motion_start_time > AWAKE_CONFIRMATION_SECONDS:
                                        duration_mins = (time.time() - status_start_time) / 60
                                        finalize_sleep_in_atlas(duration_mins)
                                        current_baby_status = "Treaz"
                                        status_start_time = time.time()
                                        motion_start_time = None
                                        print("--- [EVENT] Bebelușul s-a trezit! ---")
                                        
                                        # Trimite notificare că bebelușul s-a trezit cu cooldown
                                        global last_wakeup_notification_time
                                        current_time = time.time()
                                        if current_time - last_wakeup_notification_time > NOTIFICATION_COOLDOWN:
                                            print("📤 [NOTIFICARE] Trimit notificare de baby woke up")
                                            threading.Thread(target=send_notification, args=('baby-woke-up',)).start()
                                            last_wakeup_notification_time = current_time
                                        else:
                                            time_remaining = int(NOTIFICATION_COOLDOWN - (current_time - last_wakeup_notification_time))
                                            print(f"⏳ [NOTIFICARE] Cooldown activ pentru wake-up - {time_remaining}s rămase")
                            else:
                                # NU e mișcare
                                motion_start_time = None # Resetăm confirmarea trezirii
                                time_since_last_move = time.time() - last_activity_time
                                
                                if current_baby_status != "Adormit" and time_since_last_move > SLEEP_THRESHOLD_SECONDS:
                                    start_sleep_in_atlas()
                                    current_baby_status = "Adormit"
                                    status_start_time = time.time()
                                    print("--- [EVENT] Bebelușul a adormit (Liniste detectata) ---")
                                    
                                    # Trimite notificare că bebelușul a adormit cu cooldown
                                    global last_sleeping_notification_time
                                    current_time = time.time()
                                    if current_time - last_sleeping_notification_time > NOTIFICATION_COOLDOWN:
                                        print("📤 [NOTIFICARE] Trimit notificare de baby fell asleep")
                                        threading.Thread(target=send_notification, args=('baby-might-be-sleeping',)).start()
                                        last_sleeping_notification_time = current_time
                                    else:
                                        time_remaining = int(NOTIFICATION_COOLDOWN - (current_time - last_sleeping_notification_time))
                                        print(f"⏳ [NOTIFICARE] Cooldown activ pentru sleep - {time_remaining}s rămase")

                        prev_gray = gray
        except Exception as e:
            print(f"Eroare procesare cadru: {e}")
            time.sleep(0.1)

def start_recording_event():
    def record():
        out = None
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        filepath = os.path.join(RECORDINGS_DIR, f"motion_{timestamp}.avi")

        try:
            # --- MODIFICARE AICI: Setăm FPS la 10.0 ---
            fps_real = 10.0
            fourcc = cv2.VideoWriter_fourcc(*'MJPG')
            out = cv2.VideoWriter(filepath, fourcc, fps_real, (1280, 720))

            if not out.isOpened():
                return

            start_time = time.time()
            while time.time() - start_time < 15:
                with frame_lock:
                    if last_frame is not None:
                        nparr = np.frombuffer(last_frame, np.uint8)
                        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                        if img is not None:
                            out.write(img)

                # --- MODIFICARE AICI: Sleep de 0.1 corelează cu 10 FPS ---
                time.sleep(0.1)

        except Exception as e:
            print(f"Eroare: {e}")
        finally:
            if out is not None:
                out.release()

            # --- MODIFICARE AICI: Adăugăm flag-ul -r 10 în FFmpeg ---
            avi_path = filepath
            mp4_path = filepath.replace('.avi', '.mp4')

            if os.path.exists(avi_path):
                try:
                    subprocess.run([
                        'ffmpeg', '-i', avi_path,
                        '-r', '10', # <--- Această linie fixează viteza
                        '-c:v', 'copy',
                        mp4_path, '-y'
                    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
                    os.remove(avi_path)
                    print(f"Conversie OK: {mp4_path}")
                except Exception as e:
                    print(f"Eroare FFmpeg: {e}")

    threading.Thread(target=record).start()

def send_notification(notification_type, user_id=None, baby_id=None):
    """
    Trimite notificare push către backend prin cerere POST
    notification_type: 'motion-detected', 'baby-woke-up', 'baby-crying'
    """
    try:
        url = f"{BACKEND_SERVER}/api/notifications/{notification_type}"
        # Construim obiectul data astfel încât să nu trimitem 'None' dacă nu avem ID-uri
        data = {}
        if user_id:
            data['userId'] = user_id
        if baby_id:
            data['babyId'] = baby_id
        
        # DEBUG: Afișăm exact ce trimitem
        print(f"🔄 [NOTIFICARE] Trimit către: {url}")
        print(f"🔄 [NOTIFICARE] Cu date: {data}")
            
        # Trimitem cererea cu un timeout de 5 secunde
        response = requests.post(url, json=data, timeout=5)
        
        # DEBUG: Afișăm răspunsul complet
        print(f"🔄 [NOTIFICARE] Status Code: {response.status_code}")
        print(f"🔄 [NOTIFICARE] Response: {response.text}")
        
        if response.status_code == 200:
            print(f"✅ [NOTIFICARE] Backend-ul a procesat alerta: {notification_type}")
        else:
            print(f"⚠️ [NOTIFICARE] Backend-ul a răspuns cu codul: {response.status_code}")
    except requests.exceptions.Timeout:
        print(f"⏱️ [NOTIFICARE] Timeout - Backend-ul nu răspunde în 5 secunde")
    except requests.exceptions.ConnectionError as e:
        print(f"🔌 [NOTIFICARE] Eroare de conexiune - Backend offline sau probleme de rețea")
        print(f"🔌 [NOTIFICARE] Detalii: {e}")
    except requests.exceptions.RequestException as e:
        print(f"❌ [NOTIFICARE] Eroare de rețea: {e}")
    except Exception as e:
        print(f"❌ [NOTIFICARE] Eroare neprevăzută: {e}")

def save_status_to_atlas(status, duration_minutes):
    try:
        event = {
            "status": status,
            "start_time": datetime.datetime.fromtimestamp(status_start_time),
            "end_time": datetime.datetime.now(),
            "duration_minutes": round(duration_minutes, 2),
            "device_id": "lullababypi_01"
        }
        sleep_collection.insert_one(event)
        print(f"--- [ATLAS] Stare salvată: {status} ({round(duration_minutes, 2)} min) ---")
    except Exception as e:
        print(f"Eroare la salvarea în Atlas: {e}")

def start_sleep_in_atlas():
    global current_sleep_session_id
    try:
        event = {
            "status": "In desfasurare",
            "start_time": datetime.datetime.now(),
            "end_time": None,
            "duration_minutes": 0,
            "device_id": "lullababypi_01"
        }
        result = sleep_collection.insert_one(event)
        current_sleep_session_id = result.inserted_id # Salvăm ID-ul documentului creat
        print(f"--- [ATLAS] Sesiune de somn inceputa (ID: {current_sleep_session_id}) ---")
    except Exception as e:
        print(f"Eroare start_sleep: {e}")

def finalize_sleep_in_atlas(duration_mins):
    global current_sleep_session_id
    if current_sleep_session_id:
        try:
            sleep_collection.update_one(
                {"_id": current_sleep_session_id},
                {
                    "$set": {
                        "status": "Finalizat",
                        "end_time": datetime.datetime.now(),
                        "duration_minutes": round(duration_mins, 2)
                    }
                }
            )
            print(f"--- [ATLAS] Sesiune finalizata. Durata: {round(duration_mins, 2)} min ---")
            current_sleep_session_id = None # Resetăm ID-ul pentru următorul somn
        except Exception as e:
            print(f"Eroare finalize_sleep: {e}")

@app.route('/get_thumbnail/<filename>')
def get_thumbnail(filename):
    try:
        # Generăm numele jpg din mp4
        thumbnail_name = filename.replace('.mp4', '.jpg').replace('.avi', '.jpg')
        thumbnail_path = os.path.join(RECORDINGS_DIR, thumbnail_name)

        if not os.path.exists(thumbnail_path):
            video_path = os.path.join(RECORDINGS_DIR, filename)
            # Extragem un frame de la secunda 1
            cmd = ['ffmpeg', '-i', video_path, '-ss', '00:00:01', '-vframes', '1', thumbnail_path, '-y']
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)

        return send_file(thumbnail_path, mimetype='image/jpeg')
    except Exception as e:
        return str(e), 404

@app.route('/get_video/<filename>')
def get_video(filename):
    return send_from_directory(RECORDINGS_DIR, filename, mimetype='video/mp4')

# Endpoint pentru Frontend să vadă lista de videoclipuri
@app.route('/list_recordings')
def list_recordings():
    try:
        # Verificăm dacă folderul chiar există înainte de listare
        if not os.path.exists(RECORDINGS_DIR):
            return jsonify({"error": "Folderul nu exista"}), 404

        # Luăm toate fișierele care sunt video (avi, mp4, h264)
        files = [f for f in os.listdir(RECORDINGS_DIR)
                 if f.lower().endswith(('.avi', '.mp4', '.h264'))]

        # Sortăm să fie cele mai noi primele
        files.sort(reverse=True)

        print(f"Am gasit {len(files)} inregistrari.") # Debug in terminalul Pi
        return jsonify(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint pentru ștergere automată
def cleanup_loop():
    while True:
        try:
            now = time.time()
            for f in os.listdir(RECORDINGS_DIR):
                p = os.path.join(RECORDINGS_DIR, f)
                # Șterge fișiere mai vechi de 24h (86400 secunde)
                if os.stat(p).st_mtime < now - 86400:
                    os.remove(p)
                    print(f"Sters automat: {f}")
        except Exception as e:
            print(f"Eroare cleanup: {e}")
        time.sleep(3600) # Verifică o dată pe oră

@app.route('/api/baby_stats')
def get_baby_stats():
    try:
        # Luăm ultimele 5 evenimente din Atlas
        events = list(sleep_collection.find().sort("start_time", -1).limit(5))

        # Formatăm datele pentru JSON (convertim ID-ul și obiectele date în string-uri)
        for e in events:
            e['_id'] = str(e['_id'])
            e['start_time'] = e['start_time'].strftime("%H:%M")
            if 'end_time' in e:
                e['end_time'] = e['end_time'].strftime("%H:%M")

        return jsonify({
            "status": current_baby_status,
            "last_move": datetime.datetime.fromtimestamp(last_activity_time).strftime("%H:%M:%S"),
            "history": events
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Pornim citirea camerei în fundal CÂND pornește serverul
camera_thread = threading.Thread(target=background_frame_reader, daemon=True)
camera_thread.start()

@app.route('/snapshot')
def snapshot():
    with frame_lock:
        if last_frame is None:
            return "Camera se incarca...", 503
        return Response(last_frame, mimetype='image/jpeg', headers={
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        })

@app.route('/audio_stream')
def audio_stream():
    """
    Stream audio live de la microfon către aplicație
    Folosește arecord pentru captură și streaming în format WAV
    """
    def generate_audio():
        # Configurare arecord pentru streaming audio
        # -D hw:1,0 = device ALSA pentru microfon
        # -f S16_LE = format 16-bit signed little-endian
        # -r 16000 = sample rate 16kHz (suficient pentru voce/sunete bebeluș)
        # -c 1 = mono (economisește bandwidth)
        cmd = [
            'arecord',
            '-D', ALSA_MICROPHONE_DEVICE,  # Device ALSA pentru microfon
            '-f', 'S16_LE',
            '-r', '16000',
            '-c', '1',
            '-t', 'wav',
            '-'  # Output la stdout
        ]
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                bufsize=4096
            )
            
            print("🎤 Audio streaming pornit...")
            
            while True:
                chunk = process.stdout.read(4096)
                if not chunk:
                    break
                yield chunk
                
        except Exception as e:
            print(f"Eroare audio stream: {e}")
        finally:
            if process:
                process.terminate()
                process.wait()
            print("🎤 Audio streaming oprit")
    
    return Response(
        generate_audio(),
        mimetype='audio/wav',
        headers={
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    )

@app.route('/status', methods=['GET'])
def get_status():
    check_process = os.system("pgrep mpg123 > /dev/null")
    if check_process != 0:
        current_playback["status"] = "stopped"
        current_playback["url"] = None
    return jsonify(current_playback), 200

@app.route('/play_lullaby', methods=['POST'])
def play_lullaby():
    data = request.get_json(silent=True)
    song_url = data.get('url')

    if not song_url:
        return jsonify({"error": "No URL provided"}), 400

    os.system("killall mpg123 curl > /dev/null 2>&1")

    try:
        # CALCUL VOLUM SOFTWARE: mpg123 foloseste valori intre 0 si 32768
        # Daca volumul e 50%, factorul va fi 16384
        vol_factor = int((current_playback["volume"] * 32768) / 100)

        # Adaugam parametrul -f urmat de valoarea calculata
        cmd = f"curl -A 'Mozilla/5.0' -L -s '{song_url}' | mpg123 -a {ALSA_DEVICE} -f {vol_factor} -b 1024 -"
        subprocess.Popen(cmd, shell=True)

        current_playback["status"] = "playing"
        current_playback["url"] = song_url
        print(f"▶️ Start: {song_url} la volum {current_playback['volume']}%")
        return jsonify(current_playback), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/set_volume', methods=['POST'])
def set_volume():
    data = request.get_json(silent=True)
    vol = data.get('volume', 0.5)
    volume_percent = int(float(vol) * 100)

    # Încercăm să setăm volumul pe Card 0
    # La aceste plăci USB, controlul se numește de obicei 'Speaker' sau 'PCM'
    os.system(f"amixer -c 0 sset 'Speaker' {volume_percent}% > /dev/null 2>&1")
    os.system(f"amixer -c 0 sset 'PCM' {volume_percent}% > /dev/null 2>&1")

    current_playback["volume"] = volume_percent
    print(f"🔊 Volum setat pe Card 0 la: {volume_percent}%")
    return jsonify(current_playback), 200

@app.route('/stop_audio', methods=['POST'])
def stop_audio():
    os.system("killall mpg123 curl > /dev/null 2>&1")
    current_playback["status"] = "stopped"
    current_playback["url"] = None
    return jsonify(current_playback), 200

@app.route('/talkback', methods=['POST'])
def talkback():
    if 'audio' not in request.files:
        return "No audio file", 400

    audio_file = request.files['audio']
    audio_path = "/tmp/talkback_audio"
    audio_file.save(audio_path)

    os.system("killall -STOP mpg123 > /dev/null 2>&1")
    try:
        my_env = os.environ.copy()
        my_env["AUDIODEV"] = ALSA_DEVICE
        cmd = ["ffplay", "-nodisp", "-autoexit", "-v", "quiet", audio_path]
        subprocess.run(cmd, env=my_env)
    finally:
        os.system("killall -CONT mpg123 > /dev/null 2>&1")
        if os.path.exists(audio_path):
            os.remove(audio_path)
    return "OK", 200

# Pornim thread-ul de curățare automată a înregistrărilor vechi
cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
cleanup_thread.start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, threaded=True)