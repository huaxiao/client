@echo off
REM 声明采用UTF-8编码
chcp 65001

echo 确保微信发布目录release\wxgame

set wxDir=%cd%\release\wxgame


echo 删除libs目录
if exist %wxDir%\libs (
rd /s /q %wxDir%\libs
)

echo 删除js目录
if exist %wxDir%\js (
rd /s /q %wxDir%\js
)