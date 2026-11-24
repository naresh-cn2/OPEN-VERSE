; The bundled cline-cli.exe runs the desktop backend and, as a detached
; daemon, the Hub, which outlives the desktop. Stop users of every installed
; executable before replacing any: stopping only the CLI first leaves the
; desktop able to spawn it again. code-sidecar.exe is the backend and Hub
; executable of earlier releases; its Hub may still be running on upgrade.
;
; Use FindProcDLL to identify processes holding our files - simpler and
; doesn't require the Win/RestartManager.nsh include which is missing on CI.
!macro StopDesktopProcesses
  Push $0
  Push $1
  Push $2
  Push $3

  ; First try to gracefully close OPEN-VERSE via its protocol handler
  ; (this works if the app is running and registered the protocol)
  ExecWait '"$INSTDIR\OPEN-VERSE.exe" --quit' $0

  ; Also try to stop the CLI if running
  ${If} ${FileExists} "$INSTDIR\cline-cli.exe"
    ExecWait '"$INSTDIR\cline-cli.exe" --quit' $0
  ${EndIf}

  ; Fallback: use FindProcDLL to find and stop processes using our files
  ; Note: FindProcDLL is included with NSIS
  !insertmacro FindProcDLL_Init
  ${If} ${FileExists} "$INSTDIR\${MAINBINARYNAME}.exe"
    FindProcDLL::FindProcDLL "$INSTDIR\${MAINBINARYNAME}.exe" $1
    ${If} $1 != ""
      Loop $1 $2 $3
        DetailPrint "Stopping process $2 (PID $3) using ${MAINBINARYNAME}.exe"
        System::Call 'kernel32::OpenProcess(i 1, i 0, i $3) i .r0'
        ${If} $0 != 0
          System::Call 'kernel32::TerminateProcess(i r0, i 0) i .r1'
          System::Call 'kernel32::CloseHandle(i r0)'
        ${EndIf}
      LoopEnd
    ${EndIf}
  ${EndIf}

  ${If} ${FileExists} "$INSTDIR\OPEN-VERSE.exe"
    FindProcDLL::FindProcDLL "$INSTDIR\OPEN-VERSE.exe" $1
    ${If} $1 != ""
      Loop $1 $2 $3
        DetailPrint "Stopping process $2 (PID $3) using OPEN-VERSE.exe"
        System::Call 'kernel32::OpenProcess(i 1, i 0, i $3) i .r0'
        ${If} $0 != 0
          System::Call 'kernel32::TerminateProcess(i r0, i 0) i .r1'
          System::Call 'kernel32::CloseHandle(i r0)'
        ${EndIf}
      LoopEnd
    ${EndIf}
  ${EndIf}

  ${If} ${FileExists} "$INSTDIR\cline-cli.exe"
    FindProcDLL::FindProcDLL "$INSTDIR\cline-cli.exe" $1
    ${If} $1 != ""
      Loop $1 $2 $3
        DetailPrint "Stopping process $2 (PID $3) using cline-cli.exe"
        System::Call 'kernel32::OpenProcess(i 1, i 0, i $3) i .r0'
        ${If} $0 != 0
          System::Call 'kernel32::TerminateProcess(i r0, i 0) i .r1'
          System::Call 'kernel32::CloseHandle(i r0)'
        ${EndIf}
      LoopEnd
    ${EndIf}
  ${EndIf}

  ${If} ${FileExists} "$INSTDIR\code-sidecar.exe"
    FindProcDLL::FindProcDLL "$INSTDIR\code-sidecar.exe" $1
    ${If} $1 != ""
      Loop $1 $2 $3
        DetailPrint "Stopping process $2 (PID $3) using code-sidecar.exe"
        System::Call 'kernel32::OpenProcess(i 1, i 0, i $3) i .r0'
        ${If} $0 != 0
          System::Call 'kernel32::TerminateProcess(i r0, i 0) i .r1'
          System::Call 'kernel32::CloseHandle(i r0)'
        ${EndIf}
      LoopEnd
    ${EndIf}
  ${EndIf}

  Pop $3
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
