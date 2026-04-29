@if "%SCM_TRACE_LEVEL%" NEQ "4" @echo off

:: ----------------------
:: KUDU Deployment Script
:: ----------------------

:: Prerequisites
:: -------------

:: Verify node.js installed
where node 2>nul >nul
IF %ERRORLEVEL% NEQ 0 (
  echo Missing node.js executable, please install node.js, if already installed make sure it can be reached from current environment.
  goto error
)

:: Verify .NET SDK installed
where dotnet 2>nul >nul
IF %ERRORLEVEL% NEQ 0 (
  echo Missing .NET SDK, please install .NET SDK, if already installed make sure it can be reached from current environment.
  goto error
)

SETLOCAL

:: Setup
:: -----

set ARTIFACTS=%~dp0%..\artifacts

:: Ensure we're in the repo root
IF NOT DEFINED DEPLOYMENT_SOURCE (
  set DEPLOYMENT_SOURCE=%~dp0%.
)

IF NOT DEFINED DEPLOYMENT_TARGET (
  set DEPLOYMENT_TARGET=%ARTIFACTS%\wwwroot
)

:: 1. Build Frontend
:: -----------------

echo Building React frontend...
pushd "%DEPLOYMENT_SOURCE%\clientsphere-web"
call npm install
call npm run build
IF !ERRORLEVEL! NEQ 0 goto error
popd

:: 2. Publish Backend
:: ------------------

echo Publishing .NET backend...
pushd "%DEPLOYMENT_SOURCE%"
call dotnet restore ClientSphere.slnx
IF !ERRORLEVEL! NEQ 0 goto error

call dotnet publish ClientSphere.API\ClientSphere.API.csproj ^
  --no-restore ^
  --output "%DEPLOYMENT_TARGET%" ^
  --configuration Release ^
  --runtime win-x86 ^
  --self-contained false
IF !ERRORLEVEL! NEQ 0 goto error
popd

:: 3. Copy Frontend Build to wwwroot
:: ---------------------------------

echo Copying frontend build to wwwroot...
xcopy /E /Y /I "%DEPLOYMENT_SOURCE%\clientsphere-web\dist\*" "%DEPLOYMENT_TARGET%\wwwroot\"
IF !ERRORLEVEL! NEQ 0 goto error

:: 4. Copy web.config if it exists in repo
:: ---------------------------------------

echo Checking for web.config...
IF EXIST "%DEPLOYMENT_SOURCE%\ClientSphere.API\web.config" (
  copy /Y "%DEPLOYMENT_SOURCE%\ClientSphere.API\web.config" "%DEPLOYMENT_TARGET%\web.config"
)

:: Success
:: -------

echo Deployment successful!
goto end

:error
echo Deployment failed with error level %ERRORLEVEL%
exit /b 1

:end
echo Finished successfully.
exit /b 0
