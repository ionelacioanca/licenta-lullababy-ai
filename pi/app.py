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
NOTIFICATION_COOLDOWN = 60  # 1 minut între notificări pentru motion/wakeup/sleep
CRYING_ALERT_COOLDOWN = 180  # 3 minute pentru alerta generală de plâns
CRYING_REASON_COOLDOWN = 60  # 1 minut pentru clasificarea plânsului (mai des)
last_motion_notification_time = 0
last_wakeup_notification_time = 0
last_sleeping_notification_time = 0
last_crying_alert_time = 0  # Cooldown pentru "baby is crying"
last_crying_reason_time = 0  # Cooldown pentru clasificare

# Variabile pentru detectarea plânsului
crying_detected = False
crying_start_time = None
last_crying_detection_time = 0  # Ultima dată când s-a detectat plâns (pentru logica de somn)
CRYING_CONFIRMATION_SECONDS = 1  # Confirmă plâns după 1 secundă (redus pentru sensibilitate)

# Control pentru audio streaming (suspendă monitorizarea când streamăm live)
audio_streaming_active = False
streaming_lock = threading.Lock()

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
                                
                                # Pentru somn: verificăm ATÂT lipsa mișcării ȘI lipsa plânsului
                                global last_crying_detection_time
                                time_since_last_crying = time.time() - last_crying_detection_time
                                
                                # Considerăm somn DOAR dacă:
                                # 1. Nu e mișcare de 30s
                                # 2. ȘI nu s-a detectat plâns de 30s (sau niciodată)
                                if (current_baby_status != "Adormit" and 
                                    time_since_last_move > SLEEP_THRESHOLD_SECONDS and
                                    time_since_last_crying > SLEEP_THRESHOLD_SECONDS):
                                    start_sleep_in_atlas()
                                    current_baby_status = "Adormit"
                                    status_start_time = time.time()
                                    print("--- [EVENT] Bebelușul a adormit (Liniște completă detectată: fără mișcare + fără plâns) ---")
                                    
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

def classify_crying_pattern(rms_values, crying_ratios, fft_magnitudes, fft_freqs):
    """
    Clasifică tiparul de plâns bazat pe caracteristici audio
    Returnează: ('hunger'|'pain'|'tiredness'|'discomfort', confidence_score)
    """
    import numpy as np
    
    # Calculăm caracteristici statistice
    avg_rms = np.mean(rms_values)
    std_rms = np.std(rms_values)
    max_rms = np.max(rms_values)
    
    # Trend-ul RMS (crește sau scade?)
    if len(rms_values) > 5:
        first_half_rms = np.mean(rms_values[:len(rms_values)//2])
        second_half_rms = np.mean(rms_values[len(rms_values)//2:])
        rms_trend = (second_half_rms - first_half_rms) / (first_half_rms + 0.0001)
    else:
        rms_trend = 0
    
    # Variabilitate (cât de mult fluctuează)
    variability = std_rms / (avg_rms + 0.0001)
    
    # Frecvență dominantă medie
    dominant_freqs = []
    for fft_mag, fft_freq in zip(fft_magnitudes, fft_freqs):
        if len(fft_mag) > 0:
            idx = np.argmax(fft_mag)
            dominant_freqs.append(fft_freq[idx])
    avg_dominant_freq = np.mean(dominant_freqs) if dominant_freqs else 400
    
    # Sistem de scoruri pentru fiecare tip
    scores = {
        'hunger': 0,      # Foame
        'pain': 0,        # Durere
        'tiredness': 0,   # Oboseală
        'discomfort': 0   # Disconfort
    }
    
    # FOAME: Ritmic, intensitate crescândă, frecvențe medii (300-500 Hz)
    if rms_trend > 0.1:  # Intensitate în creștere
        scores['hunger'] += 30
    if 0.15 < variability < 0.4:  # Moderat variabil (ritmic)
        scores['hunger'] += 25
    if 300 <= avg_dominant_freq <= 500:  # Frecvențe medii
        scores['hunger'] += 25
    if avg_rms > 0.0008:  # Intensitate medie-mare
        scores['hunger'] += 20
    
    # DURERE: Brusc, foarte intens, frecvențe înalte (>500 Hz)
    if max_rms > 0.0015:  # Foarte intens
        scores['pain'] += 35
    if avg_dominant_freq > 500:  # Frecvențe înalte
        scores['pain'] += 30
    if variability > 0.5:  # Foarte variabil (brusc)
        scores['pain'] += 20
    if rms_trend > 0.2:  # Crește rapid
        scores['pain'] += 15
    
    # OBOSEALĂ: Intermitent, variabil, scade treptat, frecvențe joase (<350 Hz)
    if rms_trend < -0.05:  # Scade treptat
        scores['tiredness'] += 30
    if variability > 0.4:  # Foarte variabil (intermitent)
        scores['tiredness'] += 25
    if avg_dominant_freq < 350:  # Frecvențe joase
        scores['tiredness'] += 25
    if avg_rms < 0.0010:  # Intensitate mai redusă
        scores['tiredness'] += 20
    
    # DISCONFORT: Moderat constant, frecvențe medii, moderată intensitate
    if -0.05 <= rms_trend <= 0.1:  # Relativ constant
        scores['discomfort'] += 30
    if 0.2 < variability < 0.4:  # Variabilitate medie
        scores['discomfort'] += 25
    if 350 <= avg_dominant_freq <= 450:  # Frecvențe medii
        scores['discomfort'] += 25
    if 0.0006 <= avg_rms <= 0.0012:  # Intensitate moderată
        scores['discomfort'] += 20
    
    # Găsim tiparul cu scorul maxim
    crying_type = max(scores, key=scores.get)
    confidence = scores[crying_type]
    
    return crying_type, confidence

def background_audio_monitor():
    """
    Monitorizare continuă audio pentru detectarea și clasificarea plânsului
    Folosește SLIDING WINDOW + pattern classification
    COOLDOWN SEPARAT: Alertă (3 min) | Clasificare (1 min)
    """
    global crying_detected, crying_start_time, last_crying_detection_time
    global last_crying_alert_time, last_crying_reason_time
    
    from collections import deque
    
    # Praguri pentru detectare - STRICT pentru a evita false positive
    ABSOLUTE_MIN_RMS = 0.0005  # Volum minim absolut - sub asta e doar zgomot de fundal
    RMS_THRESHOLD_HIGH = 0.0015  # Pattern moderat - MĂRIT substanțial
    RMS_THRESHOLD_LOW = 0.0010   # Pattern foarte clar - MĂRIT
    RMS_THRESHOLD_ULTRA_LOW = 0.0005  # Pattern SUPER clar - MĂRIT x5
    CRYING_FREQ_MIN = 250  # Hz - spectrul plânsului
    CRYING_FREQ_MAX = 700  # Hz - spectrul plânsului
    CRYING_RATIO_MODERATE = 0.20  # Pattern plâns moderat - MĂRIT
    CRYING_RATIO_HIGH = 0.35      # Pattern plâns FOARTE clar - MĂRIT
    CRYING_RATIO_ULTRA_HIGH = 0.50  # Pattern SUPER clar - MĂRIT
    MIN_CONFIDENCE = 40  # Nu trimite clasificare dacă confidence < 40
    SAMPLE_RATE = 16000
    CHUNK_SIZE = 1024  # Samples per chunk
    
    # SLIDING WINDOW - analizăm media ultimelor chunk-uri pentru a netezi fluctuațiile
    WINDOW_SIZE = 15  # Analizăm ultimele 15 chunk-uri (~1 secundă)
    rms_window = deque(maxlen=WINDOW_SIZE)
    crying_ratio_window = deque(maxlen=WINDOW_SIZE)
    
    # Pentru clasificarea tiparului de plâns - colectăm date mai extinse
    PATTERN_WINDOW_SIZE = 50  # 50 chunk-uri (~3 secunde) pentru clasificare
    pattern_rms_history = deque(maxlen=PATTERN_WINDOW_SIZE)
    pattern_crying_ratio_history = deque(maxlen=PATTERN_WINDOW_SIZE)
    pattern_fft_magnitude_history = deque(maxlen=PATTERN_WINDOW_SIZE)
    pattern_fft_freq_history = deque(maxlen=PATTERN_WINDOW_SIZE)
    
    # HYSTERESIS - threshold diferit pentru start vs stop (evită reset prematur)
    DETECTION_RATIO_START = 0.50  # 50% pentru a ÎNCEPE detectarea
    DETECTION_RATIO_STOP = 0.30   # 30% pentru a OPRI (permite fluctuații)
    
    print("🎤 [SISTEM] ========================================")
    print("🎤 [SISTEM] MONITORIZARE AUDIO PORNITĂ!")
    print(f"🎤 [SISTEM] Device: {ALSA_MICROPHONE_DEVICE}")
    print(f"🎤 [SISTEM] VOLUM MINIM ABSOLUT: {ABSOLUTE_MIN_RMS} (sub asta = zgomot)")
    print(f"🎤 [SISTEM] RMS Thresholds: Ultra-Low: {RMS_THRESHOLD_ULTRA_LOW} | Low: {RMS_THRESHOLD_LOW} | High: {RMS_THRESHOLD_HIGH}")
    print(f"🎤 [SISTEM] Crying Ratio: Moderate {CRYING_RATIO_MODERATE} | High {CRYING_RATIO_HIGH} | Ultra {CRYING_RATIO_ULTRA_HIGH}")
    print(f"🎤 [SISTEM] Crying Range: {CRYING_FREQ_MIN}-{CRYING_FREQ_MAX} Hz")
    print(f"🎤 [SISTEM] Min Confidence: {MIN_CONFIDENCE}% pentru clasificare")
    print("🧠 [SISTEM] CLASIFICARE PATTERN ACTIVATĂ: Foame | Durere | Oboseală | Disconfort")
    print("🎤 [SISTEM] ========================================")
    
    cmd = [
        'arecord',
        '-D', ALSA_MICROPHONE_DEVICE,
        '-f', 'S16_LE',
        '-r', str(SAMPLE_RATE),
        '-c', '1',
        '-t', 'raw'
    ]
    
    try:
        print(f"🎤 [SISTEM] Pornesc arecord cu comanda: {' '.join(cmd)}")
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        chunk_counter = 0
        log_counter = 0  # Pentru a reduce spam-ul de log-uri
        while True:
            try:
                # Verificăm dacă audio streaming e activ - dacă da, SUSPENDĂM monitorizarea
                global audio_streaming_active
                if audio_streaming_active:
                    if chunk_counter % 100 == 0:  # Mesaj ocazional
                        print("⏸️ [AUDIO] Monitorizare suspendată - Audio streaming activ")
                    time.sleep(0.5)  # Pauză scurtă
                    continue  # SKIP procesarea audio
                
                # Citim chunk de audio
                raw_data = process.stdout.read(CHUNK_SIZE * 2)  # 2 bytes per sample (S16_LE)
                
                chunk_counter += 1
                log_counter += 1
                
                if chunk_counter % 50 == 0:  # La fiecare 50 de chunk-uri (aprox 3 secunde)
                    print(f"🎤 [SISTEM] Thread audio activ - procesat {chunk_counter} chunk-uri")
                
                if not raw_data:
                    print("⚠️ [AUDIO] Nu primesc date de la arecord!")
                    break
                    
                if len(raw_data) < CHUNK_SIZE * 2:
                    print(f"⚠️ [AUDIO] Chunk incomplet: {len(raw_data)} bytes în loc de {CHUNK_SIZE * 2}")
                    continue
                
                # Convertim în numpy array
                audio_data = np.frombuffer(raw_data, dtype=np.int16)
                
                # Layer 1: Calculăm RMS (Root Mean Square) - indicator de volum
                mean_square = np.mean(audio_data**2)
                if mean_square > 0 and np.isfinite(mean_square):
                    rms = np.sqrt(mean_square) / 32768.0  # Normalizare la 0-1
                else:
                    rms = 0.0
                
                # Layer 2: Analiză frecvență cu FFT
                fft_data = np.fft.rfft(audio_data)
                fft_freq = np.fft.rfftfreq(len(audio_data), 1.0/SAMPLE_RATE)
                fft_magnitude = np.abs(fft_data)
                
                # Găsim frecvența dominantă în range-ul plânsului
                crying_range_mask = (fft_freq >= CRYING_FREQ_MIN) & (fft_freq <= CRYING_FREQ_MAX)
                crying_range_magnitude = np.sum(fft_magnitude[crying_range_mask])
                total_magnitude = np.sum(fft_magnitude)
                
                # Calculăm procentul de energie în range-ul plânsului
                if total_magnitude > 0:
                    crying_ratio = crying_range_magnitude / total_magnitude
                else:
                    crying_ratio = 0
                
                # Adăugăm valorile în ferestre
                rms_window.append(rms)
                crying_ratio_window.append(crying_ratio)
                
                # Adăugăm în istoricul pentru clasificarea pattern-ului
                pattern_rms_history.append(rms)
                pattern_crying_ratio_history.append(crying_ratio)
                pattern_fft_magnitude_history.append(fft_magnitude)
                pattern_fft_freq_history.append(fft_freq)
                
                # DEBUG: Afișăm doar când e sunet relevant (reducem spam-ul)
                if log_counter % 50 == 0:  # La fiecare 50 chunk-uri (~3 secunde)
                    avg_rms = sum(rms_window) / len(rms_window) if rms_window else 0
                    # Afișăm DOAR dacă RMS > volum minim (altfel e doar zgomot)
                    if avg_rms > ABSOLUTE_MIN_RMS:
                        avg_crying_ratio = sum(crying_ratio_window) / len(crying_ratio_window) if crying_ratio_window else 0
                        ultra_count = sum(1 for cr in crying_ratio_window if cr > CRYING_RATIO_ULTRA_HIGH)
                        high_count = sum(1 for cr in crying_ratio_window if CRYING_RATIO_HIGH < cr <= CRYING_RATIO_ULTRA_HIGH)
                        moderate_count = sum(1 for cr in crying_ratio_window if CRYING_RATIO_MODERATE < cr <= CRYING_RATIO_HIGH)
                        print(f"🔊 [AUDIO] RMS: {avg_rms:.4f} | Cry ratio: {avg_crying_ratio:.3f} | ULTRA:{ultra_count} HIGH:{high_count} MOD:{moderate_count}")
                    log_counter = 0
                
                # Așteptăm să avem fereastră completă înainte de a analiza
                if len(rms_window) < WINDOW_SIZE:
                    continue
                
                # Analizăm fereastra: câte chunk-uri îndeplinesc criteriile? (ADAPTIV)
                chunks_meeting_criteria = 0
                for i in range(len(rms_window)):
                    # LOGICĂ ADAPTIVĂ: threshold RMS depinde de cât de clar e pattern-ul de frecvență
                    if crying_ratio_window[i] > CRYING_RATIO_ULTRA_HIGH:
                        # Pattern SUPER clar (>0.4) - acceptă orice volum audibil
                        if rms_window[i] > RMS_THRESHOLD_ULTRA_LOW:
                            chunks_meeting_criteria += 1
                    elif crying_ratio_window[i] > CRYING_RATIO_HIGH:
                        # Pattern FOARTE clar (>0.25) - permite RMS foarte mic
                        if rms_window[i] > RMS_THRESHOLD_LOW:
                            chunks_meeting_criteria += 1
                    elif crying_ratio_window[i] > CRYING_RATIO_MODERATE:
                        # Pattern moderat (>0.12) - cere RMS puțin mai mare
                        if rms_window[i] > RMS_THRESHOLD_HIGH:
                            chunks_meeting_criteria += 1
                
                # Calculăm procentul din fereastră care arată pattern de plâns
                detection_percentage = chunks_meeting_criteria / WINDOW_SIZE
                
                # HYSTERESIS: threshold diferit pentru start vs stop
                if crying_detected:
                    # Deja detectat - folosește threshold mai permisiv pentru stop
                    is_crying_pattern = detection_percentage >= DETECTION_RATIO_STOP
                else:
                    # Nu e detectat încă - folosește threshold strict pentru start
                    is_crying_pattern = detection_percentage >= DETECTION_RATIO_START
                
                if is_crying_pattern:
                    avg_rms = sum(rms_window) / len(rms_window)
                    avg_crying_ratio = sum(crying_ratio_window) / len(crying_ratio_window)
                    
                    # VERIFICARE CRITICĂ: Ignorăm dacă volumul e sub minimul absolut
                    if avg_rms < ABSOLUTE_MIN_RMS:
                        # E doar zgomot de fundal - IGNORĂM complet
                        if crying_detected:
                            print(f"❌ [AUDIO] Pattern oprit - volum sub minim ({avg_rms:.4f} < {ABSOLUTE_MIN_RMS})")
                            crying_detected = False
                            crying_start_time = None
                        continue  # SKIP complet dacă nu e volum real
                    
                    # Actualizăm timestamp-ul ultimei detectări de plâns (pentru logica de somn)
                    last_crying_detection_time = time.time()
                    
                    if not crying_detected:
                        # Începem detectarea (FĂRĂ să blocăm cu continue pentru cooldown)
                        crying_detected = True
                        crying_start_time = time.time()
                        ultra_count = sum(1 for cr in crying_ratio_window if cr > CRYING_RATIO_ULTRA_HIGH)
                        high_count = sum(1 for cr in crying_ratio_window if CRYING_RATIO_HIGH < cr <= CRYING_RATIO_ULTRA_HIGH)
                        print(f"🔊 [AUDIO] ⚠️ POSIBIL PLÂNS DETECTAT!")
                        print(f"🔊 [AUDIO] RMS avg: {avg_rms:.4f}, Crying ratio avg: {avg_crying_ratio:.2f}")
                        print(f"🔊 [AUDIO] {chunks_meeting_criteria}/{WINDOW_SIZE} chunk-uri ({detection_percentage*100:.0f}%) match | ULTRA:{ultra_count} HIGH:{high_count}")
                        print(f"🔊 [AUDIO] Aștept {CRYING_CONFIRMATION_SECONDS}s pentru confirmare...")
                    else:
                        # Verificăm dacă a plâns suficient timp pentru confirmare
                        duration = time.time() - crying_start_time
                        if log_counter % 5 == 0:  # Afișăm progresul la fiecare 5 chunk-uri
                            print(f"🔊 [AUDIO] Plâns continuu: {duration:.1f}s / {CRYING_CONFIRMATION_SECONDS}s ({detection_percentage*100:.0f}% match)")
                        
                        if duration >= CRYING_CONFIRMATION_SECONDS:
                            # PLÂNS CONFIRMAT - afișăm statistici
                            current_time = time.time()
                            print(f"😭 [PLÂNS CONFIRMAT] Detectat după {duration:.1f}s")
                            print(f"😭 [STATS] RMS avg: {avg_rms:.4f}, Crying ratio avg: {avg_crying_ratio:.2f}, Match: {detection_percentage*100:.0f}%")
                            
                            # PASUL 1: Trimitem notificarea generală (cu cooldown)
                            if current_time - last_crying_alert_time > CRYING_ALERT_COOLDOWN:
                                print(f"📤 [NOTIFICARE 1/2] Trimit alertă: Baby is crying")
                                threading.Thread(target=send_notification, args=('baby-crying',)).start()
                                last_crying_alert_time = current_time
                            else:
                                time_remaining = int(CRYING_ALERT_COOLDOWN - (current_time - last_crying_alert_time))
                                print(f"🔇 [COOLDOWN ALERTĂ] Prima notificare blocată - {time_remaining}s rămase din {CRYING_ALERT_COOLDOWN}s")
                            
                            # PASUL 2: CLASIFICĂM TIPARUL DE PLÂNS (ÎNTOTDEAUNA)
                            crying_type = None
                            if len(pattern_rms_history) >= 20:  # Avem suficiente date
                                crying_type, confidence = classify_crying_pattern(
                                    list(pattern_rms_history),
                                    list(pattern_crying_ratio_history),
                                    list(pattern_fft_magnitude_history),
                                    list(pattern_fft_freq_history)
                                )
                                
                                # Traducere tipuri în română pentru consolă
                                type_names = {
                                    'hunger': 'FOAME',
                                    'pain': 'DURERE',
                                    'tiredness': 'OBOSEALĂ',
                                    'discomfort': 'DISCONFORT'
                                }
                                type_ro = type_names.get(crying_type, 'NECUNOSCUT')
                                print(f"🧠 [CLASIFICARE] Tip plâns: {type_ro} (Confidence: {confidence}/100)")
                                
                                # PASUL 3: Trimitem notificarea cu MOTIVUL DOAR dacă confidence >= MIN_CONFIDENCE
                                if confidence >= MIN_CONFIDENCE:
                                    if current_time - last_crying_reason_time > CRYING_REASON_COOLDOWN:
                                        print(f"📤 [NOTIFICARE 2/2] Trimit motivul: {type_ro} (Confidence {confidence}%)")
                                        time.sleep(2)  # Delay pentru a nu trimite simultan cu prima
                                        threading.Thread(target=send_notification, args=('crying-reason-identified', None, None, crying_type)).start()
                                        last_crying_reason_time = current_time
                                    else:
                                        time_remaining = int(CRYING_REASON_COOLDOWN - (current_time - last_crying_reason_time))
                                        print(f"🔇 [COOLDOWN CLASIFICARE] A doua notificare blocată - {time_remaining}s rămase")
                                else:
                                    print(f"⚠️ [CLASIFICARE] Confidence prea mic ({confidence}% < {MIN_CONFIDENCE}%) - NU trimit notificare")
                            else:
                                print(f"🧠 [CLASIFICARE] Date insuficiente ({len(pattern_rms_history)}/20 chunk-uri)")
                            
                            # Reset pentru următoarea detectare
                            crying_detected = False
                            crying_start_time = None
                            # Curățăm istoricul de pattern
                            pattern_rms_history.clear()
                            pattern_crying_ratio_history.clear()
                            pattern_fft_magnitude_history.clear()
                            pattern_fft_freq_history.clear()
                else:
                    # Nu e pattern de plâns în fereastră
                    if crying_detected:
                        print(f"❌ [AUDIO] Pattern de plâns oprit ({detection_percentage*100:.0f}% match < {DETECTION_RATIO_STOP*100:.0f}% necesar)")
                        crying_detected = False
                        crying_start_time = None
                        
            except Exception as e:
                print(f"❌ [AUDIO] Eroare procesare audio chunk: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(0.1)
                
    except Exception as e:
        print(f"❌ [AUDIO] Eroare CRITICĂ monitorizare audio: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if process:
            # Verificăm dacă arecord a dat vreo eroare
            stderr_output = process.stderr.read()
            if stderr_output:
                print(f"⚠️ [AUDIO] Erori de la arecord: {stderr_output.decode('utf-8', errors='ignore')}")
            process.terminate()
            process.wait()
        print("🎤 [SISTEM] Monitorizare audio OPRITĂ")

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

def send_notification(notification_type, user_id=None, baby_id=None, crying_type=None):
    """
    Trimite notificare push către backend prin cerere POST
    notification_type: 'motion-detected', 'baby-woke-up', 'baby-crying', 'crying-reason-identified'
    crying_type: 'hunger', 'pain', 'tiredness', 'discomfort' (pentru clasificare)
    """
    try:
        url = f"{BACKEND_SERVER}/api/notifications/{notification_type}"
        # Construim obiectul data astfel încât să nu trimitem 'None' dacă nu avem ID-uri
        data = {}
        if user_id:
            data['userId'] = user_id
        if baby_id:
            data['babyId'] = baby_id
        if crying_type:  # Trimitem cryingType pentru ORICE notificare care îl are
            data['cryingType'] = crying_type
        
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
print("📹 [SISTEM] Thread cameră pornit")

# Pornim monitorizarea audio în fundal pentru detectarea plânsului
audio_monitor_thread = threading.Thread(target=background_audio_monitor, daemon=True)
print("🎤 [SISTEM] Pornesc thread monitorizare audio...")
audio_monitor_thread.start()
print("🎤 [SISTEM] Thread audio pornit cu succes")

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
    SUSPENDĂ automat monitorizarea plânsului pentru a evita conflictul pe microfon
    """
    def generate_audio():
        global audio_streaming_active
        process = None
        
        try:
            # SUSPENDĂM monitorizarea automată
            with streaming_lock:
                audio_streaming_active = True
            print("🎤 [STREAM] Audio streaming pornit - Monitorizare suspendată")
            
            # Configurare arecord pentru streaming audio
            cmd = [
                'arecord',
                '-D', ALSA_MICROPHONE_DEVICE,  # Acum putem folosi hw:1,0 direct
                '-f', 'S16_LE',
                '-r', '16000',
                '-c', '1',
                '-t', 'wav',
                '-'  # Output la stdout
            ]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                bufsize=4096
            )
            
            while True:
                chunk = process.stdout.read(4096)
                if not chunk:
                    break
                yield chunk
                
        except Exception as e:
            print(f"❌ [STREAM] Eroare audio stream: {e}")
        finally:
            # REACTIVĂM monitorizarea automată
            with streaming_lock:
                audio_streaming_active = False
            print("🎤 [STREAM] Audio streaming oprit - Monitorizare reactivată")
            
            if process:
                process.terminate()
                process.wait()
    
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