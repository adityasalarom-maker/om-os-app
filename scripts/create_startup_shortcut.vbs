' ॐ Om Knowledge OS — Create Startup Shortcut via Windows Shell COM
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
strVbsLauncher = strScriptDir & "\start_om_os_background.vbs"
strStartup = WshShell.SpecialFolders("Startup")
strShortcutPath = strStartup & "\OmKnowledgeOS_Server.lnk"

Set oShortcut = WshShell.CreateShortcut(strShortcutPath)
oShortcut.TargetPath = "wscript.exe"
oShortcut.Arguments = """" & strVbsLauncher & """"
oShortcut.WorkingDirectory = strScriptDir
oShortcut.Description = "Om Knowledge OS Persistent Background Service"
oShortcut.Save

WScript.Echo "SUCCESS: Shortcut created at " & strShortcutPath
