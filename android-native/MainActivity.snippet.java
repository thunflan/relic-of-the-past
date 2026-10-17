// MESCLAR em apps/mobile/android/app/src/main/java/<pacote>/MainActivity.java
// (mantenha o que já existe lá — ex.: registro de plugins SDL3/Capacitor).
// Objetivo: tela cheia imersiva, tela sempre ligada e WebView sem overscroll/long-press.

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false); // libera env(safe-area-inset-*)
        WebView wv = getBridge().getWebView();
        wv.setOverScrollMode(View.OVER_SCROLL_NEVER);
        wv.setHapticFeedbackEnabled(false);                       // evita vibração do long-press
        wv.setOnLongClickListener(v -> true);                      // sem menu de seleção
        wv.setLongClickable(false);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) return;
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
