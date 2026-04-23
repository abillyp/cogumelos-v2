@echo off
setlocal enabledelayedexpansion
echo.
echo  Sistema de Cogumelos
echo  --------------------
echo.

where docker >nul 2>&1
if !errorlevel! neq 0 (
    echo  [ERRO] Docker nao encontrado.
    echo  Instale em: https://www.docker.com/products/docker-desktop/
    goto fim
)

docker info >nul 2>&1
if !errorlevel! neq 0 (
    echo  Docker Desktop nao esta rodando. Abrindo...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  Aguardando Docker iniciar...
    echo.
    timeout /t 10 /nobreak >nul
    docker info >nul 2>&1 && goto docker_ok
    timeout /t 10 /nobreak >nul
    docker info >nul 2>&1 && goto docker_ok
    timeout /t 10 /nobreak >nul
    docker info >nul 2>&1 && goto docker_ok
    timeout /t 10 /nobreak >nul
    docker info >nul 2>&1 && goto docker_ok
    timeout /t 10 /nobreak >nul
    docker info >nul 2>&1 && goto docker_ok
    timeout /t 10 /nobreak >nul
    docker info >nul 2>&1 && goto docker_ok
    echo  [ERRO] Docker nao iniciou em 60 segundos.
    echo  Abra o Docker Desktop manualmente e tente novamente.
    goto fim
)

:docker_ok
echo  Docker pronto!
echo.
echo  Subindo os containers...
echo.
docker compose up --build -d

if !errorlevel! neq 0 (
    echo.
    echo  [ERRO] Falha ao subir os containers.
    echo  Execute: docker compose logs
    goto fim
)

echo.
echo  Sistema no ar! Acesse: http://localhost:3000
echo.

:fim
endlocal
echo.
pause
