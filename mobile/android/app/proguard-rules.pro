# Proguard rules for OPEN-VERSE Mobile
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

