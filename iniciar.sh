#!/usr/bin/env bash
# Abre o Turbo e Taxa no Linux ou Mac. Uso: ./iniciar.sh
cd "$(dirname "$0")"
if ! command -v python3 > /dev/null; then
  echo "Python 3 não encontrado. Instale em https://www.python.org/downloads/"
  exit 1
fi
if [ ! -x ".venv/bin/python" ]; then
  echo "Preparando o sistema pela primeira vez..."
  python3 -m venv .venv
  .venv/bin/python -m pip install --quiet --upgrade pip
  .venv/bin/python -m pip install --quiet -r requirements.txt
fi
.venv/bin/python app.py
