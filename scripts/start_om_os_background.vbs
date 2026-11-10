' ॐ Om Knowledge OS — Silent Background Launcher (Zero Terminal Pop-Up)
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
strPsScript = strScriptDir & "\start_om_os_service.ps1"

' Run PowerShell completely hidden (style 0)
strCommand = "powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File """ & strPsScript & """"
WshShell.Run strCommand, 0, False
