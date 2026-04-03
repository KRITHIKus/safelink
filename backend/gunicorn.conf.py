import os

workers = 2
worker_class = "gthread"
threads = 4

timeout = 180
graceful_timeout = 30
keepalive = 5

port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# ── Logging 
accesslog = "-"
errorlog = "-"
loglevel = "info"

# ── Process naming 
proc_name = "bullseye"