@echo off
chcp 65001 > nul
title Gerando TurboETaxa.exe
cd /d "%~dp0"

where python > nul 2>&1
if errorlevel 1 (
    echo  Python nao encontrado. Instale em https://www.python.org/downloads/
    pause
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" python -m venv .venv
".venv\Scripts\python.exe" -m pip install --quiet --upgrade pip
".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt pyinstaller

".venv\Scripts\python.exe" -m PyInstaller --noconfirm --clean --onefile ^
    --name TurboETaxa ^
    --icon icone.ico ^
    --add-data "static;static" ^
    app.py

echo.
if exist "dist\TurboETaxa.exe" (
    echo  Pronto! O executavel esta em: dist\TurboETaxa.exe
    echo  De dois cliques nele para abrir o sistema.
) else (
    echo  Algo deu errado. Veja as mensagens acima.
)
echo.
pause
