@echo off
REM 声明采用UTF-8编码
chcp 65001

echo 确保微信发布目录release\wxgame

set wxDir=%cd%\release\wxgame
set sdkDir=%cd%\sdk\wx

goto main

:convert_format

set aiDir=%cd%\..\Tools\ai
set jsonDir1=%wxDir%\res\btree
set jsonDir2=%wxDir%\res\cfg
set json_ansi_dir=%aiDir%\json_ansi

echo convert file format
cd %json_ansi_dir%

xcopy %jsonDir1%\* %json_ansi_dir%\* /e /y
call utf82ansi.bat
xcopy %json_ansi_dir%\*.json %jsonDir1%\* /e /y
del /f /s /q /a *.json

xcopy %jsonDir2%\* %json_ansi_dir%\* /e /y
call utf82ansi.bat
xcopy %json_ansi_dir%\*.json %jsonDir2%\* /e /y
del /f /s /q /a *.json
echo convert file format end


:main

echo 删除libs目录
if exist %wxDir%\libs (
rd /s /q %wxDir%\libs
)

echo 删除bin\code.js
del /f /s /q /a %cd%\bin\code.js

echo XMLDom支持和配置
xcopy %sdkDir%\* %wxDir%\* /e /y


echo 微信版本完成

@pause