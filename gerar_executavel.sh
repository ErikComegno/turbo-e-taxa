#!/usr/bin/env bash
# Gera o executável para Linux ou Mac em dist/TurboETaxa. Uso: ./gerar_executavel.sh
cd "$(dirname "$0")"
[ -x ".venv/bin/python" ] || python3 -m venv .venv
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -r requirements.txt pyinstaller
.venv/bin/python -m PyInstaller --noconfirm --clean --onefile --name TurboETaxa --add-data "static:static" app.py
echo "Pronto: dist/TurboETaxa"
