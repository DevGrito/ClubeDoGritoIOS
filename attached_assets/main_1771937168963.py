import psycopg2
import requests
import urllib3
import time
import threading
from flask import Flask, jsonify
from flask_cors import CORS

# Configurações de segurança
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
app = Flask(__name__)
CORS(app)

# --- CONFIGURAÇÕES DO INSTITUTO O GRITO ---
WEBHOOK_API = "https://clubedogrito.institutoogrito.com.br/api/presenca"

DB_CONFIG = {
    "host": "127.0.0.1",
    "database": "backend",        
    "user": "postgres",
    "password": "_P!d_1nt3lbr@S_", 
    "port": 4440                    
}

def monitorar_presenca():
    ultimo_id_lido = 0
    print(f"🚀 Vigiador Ativo! Lendo tabela 'tb_eventos_dispositivos'...")
    
    while True:
        conn = None
        try:
            conn = psycopg2.connect(**DB_CONFIG, connect_timeout=5)
            cur = conn.cursor()
            
            # Usando os nomes que descobrimos no seu banco
            cur.execute("SELECT id, nr_pessoa_id, de_data_evento FROM backend.tb_eventos_dispositivos ORDER BY id DESC LIMIT 1")
            evento = cur.fetchone()
            
            if evento:
                idx, aluno_id, timestamp = evento
                if ultimo_id_lido != 0 and idx > ultimo_id_lido and aluno_id:
                    print(f"📢 Catraca girou! ID Aluno: {aluno_id}")
                    payload = {"aluno_id": str(aluno_id), "timestamp": str(timestamp), "origem": "Hardware Local"}
                    try:
                        res = requests.post(WEBHOOK_API, json=payload, timeout=10)
                        if res.status_code in [200, 201]:
                            print(f"✅ Presença enviada para o site!")
                    except Exception as e:
                        print(f"⚠️ Erro ao enviar: {e}")
                ultimo_id_lido = idx
            cur.close()
        except Exception as e:
            print(f"⚠️ Erro no Banco: {e}")
            time.sleep(5)
        finally:
            if conn: conn.close()
        time.sleep(2)

if __name__ == "__main__":
    # Mudança aqui: vamos garantir que o monitor comece antes do servidor
    monitor_thread = threading.Thread(target=monitorar_presenca, daemon=True)
    monitor_thread.start()
    
    print("🔥 Ponte O Grito -> API Ativa na porta 5000")
    # Se der erro aqui, ele vai dizer se a porta 5000 já está ocupada
    try:
        app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
    except Exception as e:
        print(f"❌ O servidor Flask parou: {e}")