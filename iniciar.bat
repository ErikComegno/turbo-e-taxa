@echo off
chcp 65001 > nul
title Turbo e Taxa
cd /d "%~dp0"

where python > nul 2>&1
if errorlevel 1 (
    echo.
    echo  Python nao encontrado.
    echo  Instale em https://www.python.org/downloads/ e marque "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
    echo  Preparando o sistema pela primeira vez. Isso leva menos de 1 minuto...
    python -m venv .venv
    ".venv\Scripts\python.exe" -m pip install --quiet --upgrade pip
    ".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt
)

".venv\Scripts\python.exe" app.py
pause
