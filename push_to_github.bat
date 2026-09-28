@echo off
title Push SpotSiNi to GitHub
color 0A
echo =================================================================
echo             SPOTSINI - PUSH KE GITHUB REPOSITORY
echo =================================================================
echo.
echo Target Repository : https://github.com/aeonsenpai123-bit/SpotSini.git
echo Branch            : main
echo Folder            : %~dp0
echo.
cd /d "%~dp0"

echo Menghubungkan dan melakukan push ke GitHub...
"C:\Program Files\Git\cmd\git.exe" push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =================================================================
    echo [SUKSES] Seluruh perubahan berhasil di-push ke GitHub!
    echo =================================================================
) else (
    echo.
    echo =================================================================
    echo [INFO] Jika diminta login, silakan ikuti petunjuk browser 
    echo atau gunakan GitHub Personal Access Token (PAT).
    echo =================================================================
)
echo.
pause
