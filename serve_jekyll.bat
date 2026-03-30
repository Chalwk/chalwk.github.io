@echo off
cd /d %~dp0
start cmd /k "bundle exec jekyll serve"
timeout /t 5 /nobreak
start http://127.0.0.1:4000/