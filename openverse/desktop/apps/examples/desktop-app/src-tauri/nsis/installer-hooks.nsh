; The bundled cline-cli.exe runs the desktop backend and, as a detached
; daemon, the Hub, which outlives the desktop. Stop users of every installed
; executable before replacing any: stopping only the CLI first leaves the
; desktop able to spawn it again. code-sidecar.exe is the backend and Hub
; executable of earlier releases; its Hub may still be running on upgrade.
;
; Use simple ExecWait and built-in NSIS commands - no external includes needed.
!macro StopDesktopProcesses
  Push $0
  Push $1
  Push $2

  ; First try to gracefully close OPEN-VERSE via its protocol handler
  ; (this works if the app is running and registered the protocol)
  ExecWait '"$INSTDIR\OPEN-VERSE.exe" --quit' $0

  ; Also try to stop the CLI if running
  ${If} ${FileExists} "$INSTDIR\cline-cli.exe"
    ExecWait '"$INSTDIR\cline-cli.exe" --quit' $0
  ${EndIf}

  ; Fallback: use System::Call to find and stop processes using our files
  ; Using simple process enumeration via WMI/command line
  ${If} ${FileExists} "$INSTDIR\${MAINBINARYNAME}.exe"
    ExecWait 'cmd /c "taskkill /F /FI \"IMAGENAME eq ${MAINBINARYNAME}.exe\" /T 2>nul"' $0
  ${EndIf}

  ${If} ${FileExists} "$INSTDIR\OPEN-VERSE.exe"
    ExecWait 'cmd /c "taskkill /F /FI \"IMAGENAME eq OPEN-VERSE.exe\" /T 2>nul"' $0
  ${EndIf}

  ${If} ${FileExists} "$INSTDIR\cline-cli.exe"
    ExecWait 'cmd /c "taskkill /F /FI \"IMAGENAME eq cline-cli.exe\" /T 2>nul"' $0
  ${EndIf}

  ${If} ${FileExists} "$INSTDIR\code-sidecar.exe"
    ExecWait 'cmd /c "taskkill /F /FI \"IMAGENAME eq code-sidecar.exe\" /T 2>nul"' $0
  ${EndIf}

  ; Nothing installs the earlier backend executable any more.
  Delete "$INSTDIR\code-sidecar.exe"
  ; Clean up legacy binary so it is not accidentally relaunched
  ${If} ${FileExists} "$INSTDIR\OPEN-VERSE.exe"
    ${If} ${FileExists} "$INSTDIR\cline-app.exe"
      Delete "$INSTDIR\cline-app.exe"
    ${EndIf}
  ${EndIf}

  Pop $2
  Pop $1
  Pop $0
!macroend

!macro NSIS_HOOK_PREINSTALL
  !insertmacro CallArtificialFunction StopDesktopProcesses
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro CallArtificialFunction StopDesktopProcesses
!macroend

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "Software\Classes\openverse" "" "URL:OPEN-VERSE Protocol"
  WriteRegStr HKCU "Software\Classes\openverse" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\openverse\DefaultIcon" "" "$INSTDIR\OPEN-VERSE.exe,0"
  WriteRegStr HKCU "Software\Classes\openverse\shell\open\command" "" '"$INSTDIR\OPEN-VERSE.exe" "%1"'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "Software\Classes\openverse"
!macroend
